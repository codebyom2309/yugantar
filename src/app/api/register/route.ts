import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRegistrationFormBySlug } from '@/data/registrationForms';
import { COMPETITIONS } from '@/data/events';
import { randomUUID } from 'crypto';
import { signPassToken, PassMemberInfo } from '@/lib/passToken';
import { getDepartmentDiscountRule } from '@/lib/competitions';
import { extractNumericFee } from '@/lib/upiPayment';
import { syncRegistrationToGoogleForm } from '@/lib/sheetsSync';

// ---------------------------------------------------------------------------
// Helpers & Semester Normalization
// ---------------------------------------------------------------------------

function normalizeSemester(sem: string): string {
  if (!sem) return '';
  const clean = String(sem).trim().toUpperCase().replace(/^(SEMESTER|SEM)\s*/i, '');
  const map: Record<string, string> = {
    '1': 'I', '1ST': 'I', 'I': 'I',
    '2': 'II', '2ND': 'II', 'II': 'II',
    '3': 'III', '3RD': 'III', 'III': 'III',
    '4': 'IV', '4TH': 'IV', 'IV': 'IV',
    '5': 'V', '5TH': 'V', 'V': 'V',
    '6': 'VI', '6TH': 'VI', 'VI': 'VI',
    '7': 'VII', '7TH': 'VII', 'VII': 'VII',
    '8': 'VIII', '8TH': 'VIII', 'VIII': 'VIII',
  };
  return map[clean] || clean;
}

// ---------------------------------------------------------------------------
// POST /api/register — Submit registration for a competition
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      competitionSlug,
      formValues,
      idempotencyKey,
    } = body as {
      competitionSlug: string;
      formValues: Record<string, string>;
      idempotencyKey?: string;
    };

    // 1. Validate competition exists
    const formConfig = getRegistrationFormBySlug(competitionSlug);
    if (!formConfig) {
      return NextResponse.json(
        { status: 'failed', error: 'Unknown competition track.' },
        { status: 400 },
      );
    }
    const canonicalSlug = formConfig.competitionSlug;

    // 2. Idempotency check — prevent duplicate submissions
    if (idempotencyKey) {
      try {
        const existing = await db.query<{
          id: string;
          submission_status: string;
        }>(
          'SELECT id, submission_status FROM registrations WHERE idempotency_key = ? LIMIT 1',
          [idempotencyKey],
        );

        if (existing.length > 0) {
          return NextResponse.json({
            status: existing[0].submission_status,
            registrationId: existing[0].id,
            message: 'This registration attempt has already been processed.',
            duplicate: true,
          });
        }
      } catch (idempErr) {
        console.warn('Idempotency check warning:', idempErr);
      }
    }

    // 2b. Authoritative server-side registration gating (Global & Track)
    let isPaid = false;
    let configuredFeeRaw = '';
    let requireUtr = false;
    let requireScreenshot = false;
    let compWhatsApp: string | null = null;
    let confirmationInstructions: string | null = null;
    let storageMode = 'minimal';
    let saveMinimalMetadata = true;
    let saveFullResponses = false;
    let sendToSpreadsheet = true;
    let globalWhatsApp: string | null = null;
    let allowedSemesters: string[] = [];

    let registrationMode: 'TEST' | 'LIVE' = 'TEST';

    try {
      const siteSettings = await db.query<{ setting_key: string; setting_value: string }>(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('registration_global_open', 'registration_status_message', 'registration_storage_mode', 'save_minimal_metadata', 'save_full_responses', 'send_to_spreadsheet', 'global_whatsapp_link', 'registration_environment_mode')"
      );
      const settingsMap: Record<string, string> = {};
      siteSettings.forEach((r) => {
        settingsMap[r.setting_key] = r.setting_value;
      });

      if (settingsMap.registration_environment_mode === 'LIVE') {
        registrationMode = 'LIVE';
      }

      if (settingsMap.registration_storage_mode) {
        storageMode = settingsMap.registration_storage_mode;
      }
      if (settingsMap.save_minimal_metadata !== undefined) {
        saveMinimalMetadata = settingsMap.save_minimal_metadata !== '0';
      }
      if (settingsMap.save_full_responses !== undefined) {
        saveFullResponses = settingsMap.save_full_responses === '1';
      }
      if (settingsMap.send_to_spreadsheet !== undefined) {
        sendToSpreadsheet = settingsMap.send_to_spreadsheet !== '0';
      }
      if (settingsMap.global_whatsapp_link) {
        globalWhatsApp = settingsMap.global_whatsapp_link;
      }

      if (settingsMap.registration_global_open === '0') {
        return NextResponse.json(
          {
            status: 'failed',
            error:
              settingsMap.registration_status_message ||
              'Official registrations are currently closed by festival administration.',
          },
          { status: 403 }
        );
      }

      const compRows = await db.query<{
        registration_open: number;
        registration_deadline: string | null;
        is_paid: number;
        registration_fee: string | null;
        require_utr: number;
        require_screenshot: number;
        whatsapp_link: string | null;
        confirmation_instructions: string | null;
        allowed_semesters: unknown;
      }>(
        'SELECT registration_open, registration_deadline, is_paid, registration_fee, require_utr, require_screenshot, whatsapp_link, confirmation_instructions, allowed_semesters FROM competitions WHERE slug = ? OR slug = ? LIMIT 1',
        [canonicalSlug, competitionSlug]
      );
      if (compRows.length > 0) {
        const comp = compRows[0];
        if (comp.allowed_semesters) {
          try {
            const raw = comp.allowed_semesters;
            allowedSemesters = Array.isArray(raw) ? raw : JSON.parse(raw as string);
          } catch {
            allowedSemesters = [];
          }
        }
        if (canonicalSlug === 'mini-project-competition' || competitionSlug === 'mini-project-competition') {
          allowedSemesters = ['I', 'V'];
        }
        configuredFeeRaw = comp.registration_fee || '';
        const feeStr = (comp.registration_fee || '').trim().toLowerCase();
        const hasFee = feeStr !== '' && feeStr !== 'free' && feeStr !== '₹0' && feeStr !== '0';
        // A paid competition must NOT silently become free if its payment configuration is missing
        isPaid = comp.is_paid === 1 || hasFee;
        requireUtr = isPaid ? Boolean(comp.require_utr) : false;
        requireScreenshot = isPaid ? Boolean(comp.require_screenshot) : false;
        compWhatsApp = comp.whatsapp_link;
        confirmationInstructions = comp.confirmation_instructions;

        if (comp.registration_open === 0) {
          return NextResponse.json(
            {
              status: 'failed',
              error: 'Registration for this specific competition track is currently closed.',
            },
            { status: 403 }
          );
        }
        if (comp.registration_deadline) {
          const deadline = new Date(comp.registration_deadline);
          if (!isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
            return NextResponse.json(
              {
                status: 'failed',
                error: `Registration for this competition closed on ${comp.registration_deadline}.`,
              },
              { status: 403 }
            );
          }
        }
      } else {
        // Fallback to static COMPETITIONS configuration to prevent accidental free status
        const staticComp = COMPETITIONS.find((c) => c.slug === canonicalSlug || c.slug === competitionSlug);
        if (staticComp) {
          if (staticComp.slug === 'mini-project-competition' || canonicalSlug === 'mini-project-competition') {
            allowedSemesters = ['I', 'V'];
          }
          configuredFeeRaw = staticComp.registrationFee || '';
          isPaid = Boolean(staticComp.isPaid || (staticComp.registrationFee && staticComp.registrationFee.toLowerCase() !== 'free'));
          requireUtr = isPaid ? (staticComp.requireUtr !== false) : false;
          requireScreenshot = isPaid ? (staticComp.requireScreenshot !== false) : false;
          compWhatsApp = staticComp.whatsappLink || null;
        }
      }
    } catch (gateErr) {
      console.warn('Registration gating check warning:', gateErr);
    }

    // 3. Server-side validation of required fields
    const safeFormValues = formValues || {};
    const errors: Record<string, string> = {};
    for (const field of formConfig.fields) {
      // If competition is free, bypass payment fields requirement
      if (!isPaid && (field.key === 'paymentId' || field.key === 'paymentProof' || field.group === 'Payment')) {
        continue;
      }

      // If competition is paid, check specific toggles
      if (isPaid) {
        if (field.key === 'paymentId' && !requireUtr) {
          continue;
        }
        if (field.key === 'paymentProof' && !requireScreenshot) {
          continue;
        }
      }
      // Check conditional visibility (e.g. member 2/3/4 based on teamSize)
      if (field.showWhen) {
        const depValue = safeFormValues[field.showWhen.field];
        if (!field.showWhen.values.includes(depValue || '')) {
          continue;
        }
      }

      const value = safeFormValues[field.key]?.trim() || '';

      if (field.required && !value) {
        errors[field.key] = `${field.label} is required.`;
        continue;
      }

      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field.key] = 'Please enter a valid email address.';
        }
      }

      if (value && field.type === 'tel' && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          errors[field.key] = 'Please enter a valid phone number (10-15 digits).';
        }
      }

      if (value && field.type === 'url') {
        try {
          if (value.startsWith('/')) {
            // Internal relative media proxy URL (e.g. Filebase S3 vault /api/media/filebase?key=...)
            new URL(value, 'https://yugantar.pce.edu.in');
          } else {
            new URL(value);
          }
        } catch {
          errors[field.key] = 'Please enter a valid URL (starting with http:// or https://).';
        }
      }
    }

    // 3b. Authoritative Server-Side Semester Eligibility Validation
    if (allowedSemesters && allowedSemesters.length > 0) {
      const normAllowed = allowedSemesters.map((s) => normalizeSemester(s));
      const parsedTeamSize = Math.max(1, parseInt(safeFormValues.teamSize || '1', 10));
      const semesterKeys = Object.keys(safeFormValues).filter((k) =>
        k.toLowerCase().includes('semester')
      );
      for (const k of semesterKeys) {
        // Skip semester validation for hidden members beyond selected team size
        const memberMatch = k.match(/^member(\d+)semester$/i);
        if (memberMatch) {
          const memberIndex = parseInt(memberMatch[1], 10);
          if (memberIndex > parsedTeamSize) {
            continue;
          }
        }
        const semVal = safeFormValues[k];
        if (semVal && typeof semVal === 'string' && semVal.trim() !== '') {
          const normSem = normalizeSemester(semVal);
          if (!normAllowed.includes(normSem)) {
            return NextResponse.json(
              {
                status: 'failed',
                error: `Semester "${semVal}" is not eligible for ${formConfig.competitionName}. Permitted semesters: ${allowedSemesters.join(', ')}.`,
                errors: {
                  [k]: `Semester not permitted. Eligible semesters: ${allowedSemesters.join(', ')}`,
                },
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // 3c. Explicit Eligibility & Originality Confirmation Validation
    const isAcknowledged = Boolean(
      (body as Record<string, unknown>).acknowledged === true ||
      safeFormValues.acknowledged === 'true' ||
      safeFormValues.confirmation === 'true' ||
      (formConfig.acknowledgmentEntryId && (
        safeFormValues[`entry.${formConfig.acknowledgmentEntryId}`] ||
        safeFormValues[formConfig.acknowledgmentEntryId]
      ))
    );
    if (formConfig.acknowledgmentEntryId && !isAcknowledged) {
      return NextResponse.json(
        {
          status: 'failed',
          error: 'You must confirm the eligibility and originality undertaking before submitting.',
          errors: {
            _acknowledgment: 'You must confirm the eligibility and originality undertaking before submitting.',
          },
        },
        { status: 400 }
      );
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { status: 'failed', errors, error: 'Please correct the highlighted fields.' },
        { status: 422 },
      );
    }

    // Standardize lead participant info across different competition schemas
    const leaderName =
      formValues.leaderName ||
      formValues.participantName ||
      formValues.candidateName ||
      formValues.squadLeaderName ||
      formValues.performerName ||
      '';
    const leaderEmail =
      formValues.leaderEmail ||
      formValues.email ||
      formValues.candidateEmail ||
      formValues.squadLeaderEmail ||
      '';
    const leaderPhone =
      formValues.leaderPhone ||
      formValues.contactNumber ||
      formValues.candidatePhone ||
      formValues.squadLeaderPhone ||
      '';
    const leaderCollege =
      formValues.leaderCollege ||
      formValues.collegeName ||
      formValues.candidateCollege ||
      formValues.squadLeaderCollege ||
      '';
    const leaderBranch =
      formValues.leaderBranch ||
      formValues.branch ||
      formValues.candidateBranch ||
      formValues.squadLeaderBranch ||
      '';
    const leaderSemester =
      formValues.leaderSemester ||
      formValues.semester ||
      formValues.candidateSemester ||
      formValues.squadLeaderSemester ||
      '';
    const teamName =
      formValues.teamName ||
      formValues.squadName ||
      null;
    const teamSize = parseInt(formValues.teamSize || '1', 10);
    const paymentId = formValues.paymentId || null;
    const paymentProof = formValues.paymentProof || null;

    // 2.5 Duplicate check — normalized email within the same competition
    if (leaderEmail) {
      try {
        const normalizedEmail = leaderEmail.trim().toLowerCase();
        const existing = await db.query<{ id: string; submission_status: string }>(
          `SELECT id, submission_status FROM registrations 
           WHERE LOWER(TRIM(leader_email)) = ? AND competition_slug = ? AND submission_status != 'failed' 
           LIMIT 1`,
          [normalizedEmail, formConfig.competitionSlug]
        );
        if (existing.length > 0) {
          return NextResponse.json(
            {
              status: existing[0].submission_status,
              registrationId: existing[0].id,
              duplicate: true,
              error: `A registration for ${formConfig.competitionSlug} already exists for ${normalizedEmail}.`,
            },
            { status: 409 }
          );
        }
      } catch (dupErr) {
        console.warn('Duplicate registration check warning:', dupErr);
      }
    }

    // Extract team members for multi-member registrations (only up to selected teamSize)
    const members: PassMemberInfo[] = [];
    for (let i = 2; i <= teamSize; i++) {
      const mName = safeFormValues[`member${i}Name`]?.trim();
      if (mName) {
        members.push({
          name: mName,
          college: safeFormValues[`member${i}College`]?.trim() || leaderCollege || undefined,
          branch: safeFormValues[`member${i}Branch`]?.trim() || leaderBranch || undefined,
          semester: safeFormValues[`member${i}Semester`]?.trim() || leaderSemester || undefined,
        });
      }
    }

    // Pricing & Department Concession Calculation (authoritative server-side evaluation)
    let normalFee = 0;
    let discountAmount = 0;
    let discountRuleName: string | null = null;
    let finalFee = 0;

    if (isPaid) {
      normalFee = parseFloat(extractNumericFee(configuredFeeRaw) || '0') || 0;
      finalFee = normalFee;

      try {
        const discountRule = await getDepartmentDiscountRule();
        const normCol = leaderCollege.trim().toUpperCase();
        const normDept = leaderBranch.trim().toUpperCase();
        const ruleInst = (discountRule?.institution || '').trim().toUpperCase();
        const ruleDept = (discountRule?.department || '').trim().toUpperCase();

        const matchesInst = normCol === ruleInst || (ruleInst === 'PCE' && normCol.includes('PRIYADARSHINI'));
        const matchesDept =
          normDept === ruleDept ||
          (ruleDept === 'ITC' && normDept === 'ETC') ||
          (ruleDept === 'ETC' && normDept === 'ITC');

        if (
          discountRule &&
          discountRule.enabled &&
          normalFee > 0 &&
          matchesInst &&
          matchesDept
        ) {
          const isApplicable =
            discountRule.applicableCompetitions.includes('all') ||
            discountRule.applicableCompetitions.includes(canonicalSlug) ||
            discountRule.applicableCompetitions.includes(competitionSlug);

          if (isApplicable) {
            const pct = discountRule.discountPercentage || 50;
            discountAmount = Math.round((normalFee * pct) / 100);
            finalFee = Math.max(0, normalFee - discountAmount);
            discountRuleName = `${discountRule.institution} ${discountRule.department} ${pct}% Concession`;
          }
        }
      } catch (discErr) {
        console.error('Error applying department discount rule on server:', discErr);
      }
    }

    // 4. Generate persistent registration ID, secure verification token, and stateless pass token
    const registrationId = randomUUID();
    const verificationToken = 'yug_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const initialPaymentStatus = isPaid ? 'pending' : 'free';
    const effectivePaymentId = paymentId || null;
    const effectivePaymentProof = paymentProof || null;

    // Build sanitized form data preserving complete active roster and project details
    const sanitizedFormValues: Record<string, string> = {};
    for (const [k, v] of Object.entries(safeFormValues)) {
      const memberMatch = k.match(/^member(\d+)/i);
      if (memberMatch) {
        const mIdx = parseInt(memberMatch[1], 10);
        if (mIdx > teamSize) {
          continue; // Strip inactive member fields beyond teamSize
        }
      }
      sanitizedFormValues[k] = v;
    }
    const formDataPayload = JSON.stringify(sanitizedFormValues);

    const passToken = signPassToken({
      id: registrationId,
      slug: formConfig.competitionSlug,
      leaderName,
      teamName: teamName || null,
      teamSize,
      members,
    });

    // 5. Initial save to database (stores minimal metadata or full form data as configured)
    let dbSaveSuccess = false;
    try {
      await db.execute(
        `INSERT INTO registrations (
          id, competition_slug, idempotency_key,
          leader_name, leader_email, leader_phone,
          leader_college, leader_branch, leader_semester,
          team_name, team_size, form_data,
          payment_id, payment_proof_url,
          google_form_id, submission_status, verification_token,
          payment_status,
          normal_fee, discount_amount, discount_rule, final_fee,
          registration_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          registrationId,
          formConfig.competitionSlug,
          idempotencyKey || null,
          leaderName,
          leaderEmail,
          leaderPhone,
          leaderCollege,
          leaderBranch,
          leaderSemester,
          teamName,
          teamSize,
          formDataPayload,
          effectivePaymentId,
          effectivePaymentProof,
          formConfig.googleFormId,
          isPaid ? 'pending' : 'confirmed',
          verificationToken,
          initialPaymentStatus,
          normalFee,
          discountAmount,
          discountRuleName,
          finalFee,
          registrationMode,
        ],
      );
      dbSaveSuccess = true;
    } catch (dbErr) {
      console.error('Database initial insert error:', dbErr);
    }

    if (!dbSaveSuccess) {
      return NextResponse.json(
        {
          status: 'failed',
          error: 'Unable to record registration in festival database. Please verify your connection and try again.',
        },
        { status: 500 }
      );
    }

    // 6. Google Forms submission via verified formResponseUrl (if spreadsheet sync enabled)
    let googleSubmitSuccess = false;
    let googleSubmitError: string | null = null;
    let confirmationEvidence: string | null = null;

    if (!sendToSpreadsheet) {
      googleSubmitSuccess = true;
      confirmationEvidence = 'Spreadsheet workflow bypassed by administrator setting (direct festival registration)';
    } else {
      const syncResult = await syncRegistrationToGoogleForm(
        {
          id: registrationId,
          competition_slug: formConfig.competitionSlug,
          leader_name: leaderName,
          leader_email: leaderEmail,
          leader_phone: leaderPhone,
          leader_college: leaderCollege,
          leader_branch: leaderBranch,
          leader_semester: leaderSemester,
          team_name: teamName,
          team_size: teamSize,
          payment_id: effectivePaymentId,
          payment_proof_url: effectivePaymentProof,
          payment_status: initialPaymentStatus,
          form_data: formDataPayload,
        },
        sanitizedFormValues,
        true // Skip duplicate check during brand new registration insert to avoid extra roundtrip latency
      );

      if (syncResult.success) {
        googleSubmitSuccess = true;
        confirmationEvidence = syncResult.evidence || 'Google Forms response recorded confirmation received';
      } else {
        googleSubmitError = syncResult.error || 'Google Forms synchronization failed';
      }
    }

    // 7. Update status in database
    // Primary authoritative persistence is TiDB Cloud.
    // If database persistence succeeded, registration is active ('submitted' or 'confirmed').
    // Google Forms sync issues are recorded in submission_error without invalidating the delegate registration.
    const finalStatus = dbSaveSuccess
      ? (isPaid ? 'submitted' : 'confirmed')
      : googleSubmitSuccess
      ? (isPaid ? 'submitted' : 'confirmed')
      : 'failed';

    if (dbSaveSuccess) {
      try {
        await db.execute(
          `UPDATE registrations
           SET submission_status = ?, submission_error = ?, submitted_at = ?
           WHERE id = ?`,
          [
            finalStatus,
            googleSubmitSuccess ? null : (googleSubmitError || 'Google Forms sync pending'),
            new Date(),
            registrationId,
          ],
        );
      } catch (updateErr) {
        console.error('Database status update failed:', updateErr);
      }
    }

    // 8. Return comprehensive response to client
    const whatsappLink = compWhatsApp || globalWhatsApp || null;

    return NextResponse.json(
      {
        status: finalStatus,
        registrationId,
        registrationMode,
        passToken,
        verificationToken,
        paymentStatus: initialPaymentStatus,
        normalFee,
        discountAmount,
        discountRule: discountRuleName,
        finalFee,
        whatsappLink,
        confirmationInstructions,
        dbSaved: dbSaveSuccess,
        googleFormsVerified: googleSubmitSuccess,
        message: isPaid
          ? 'Registration submitted! Please save your registration pass and await payment verification.'
          : 'Registration confirmed! Your spot is secured. Download your official delegate pass below.',
        evidence: confirmationEvidence || undefined,
        error: googleSubmitSuccess ? undefined : (googleSubmitError || undefined),
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      {
        status: 'failed',
        error: 'Unable to process registration request.',
        details: err instanceof Error ? err.message : String(err),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
