import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRegistrationFormBySlug } from '@/data/registrationForms';
import { randomUUID } from 'crypto';
import { signPassToken, PassMemberInfo } from '@/lib/passToken';

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
    let requireUtr = false;
    let requireScreenshot = false;
    let compWhatsApp: string | null = null;
    let confirmationInstructions: string | null = null;
    let storageMode = 'minimal';
    let saveMinimalMetadata = true;
    let saveFullResponses = false;
    let sendToSpreadsheet = true;
    let globalWhatsApp: string | null = null;

    try {
      const siteSettings = await db.query<{ setting_key: string; setting_value: string }>(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('registration_global_open', 'registration_status_message', 'registration_storage_mode', 'save_minimal_metadata', 'save_full_responses', 'send_to_spreadsheet', 'global_whatsapp_link')"
      );
      const settingsMap: Record<string, string> = {};
      siteSettings.forEach((r) => {
        settingsMap[r.setting_key] = r.setting_value;
      });

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
        require_utr: number;
        require_screenshot: number;
        whatsapp_link: string | null;
        confirmation_instructions: string | null;
      }>(
        'SELECT registration_open, registration_deadline, is_paid, require_utr, require_screenshot, whatsapp_link, confirmation_instructions FROM competitions WHERE slug = ? LIMIT 1',
        [competitionSlug]
      );
      if (compRows.length > 0) {
        const comp = compRows[0];
        isPaid = Boolean(comp.is_paid);
        requireUtr = Boolean(comp.require_utr);
        requireScreenshot = Boolean(comp.require_screenshot);
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
          new URL(value);
        } catch {
          errors[field.key] = 'Please enter a valid URL (starting with http:// or https://).';
        }
      }
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

    // Extract team members for multi-member registrations
    const members: PassMemberInfo[] = [];
    for (let i = 2; i <= 4; i++) {
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

    // 4. Generate persistent registration ID, secure verification token, and stateless pass token
    const registrationId = randomUUID();
    const verificationToken = 'yug_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const initialPaymentStatus = isPaid ? 'pending' : 'free';
    const effectivePaymentId = paymentId || null;
    const effectivePaymentProof = paymentProof || null;
    const formDataPayload = (saveFullResponses || storageMode === 'full') ? JSON.stringify(formValues) : null;

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
          payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      try {
        const googleFormData = new URLSearchParams();

        for (const field of formConfig.fields) {
          // Exclude conditionally hidden fields
          if (field.showWhen) {
            const depValue = formValues[field.showWhen.field];
            if (!field.showWhen.values.includes(depValue || '')) {
              continue;
            }
          }

          let value = formValues[field.key]?.trim() || '';
          // If free track and payment field is empty, provide valid placeholder so Google Form accepts it
          if (!isPaid && !value) {
            if (field.key === 'paymentId') value = 'FREE-TRACK';
            if (field.key === 'paymentProof') value = 'https://yugantar.pce.ac.in/free-track';
          }

          if (value) {
            googleFormData.append(`entry.${field.entryId}`, value);
          }
        }

        // Add rules acknowledgment
        if (formConfig.acknowledgmentEntryId) {
          googleFormData.append(
            `entry.${formConfig.acknowledgmentEntryId}`,
            'Yes',
          );
        }

        // Exact verified formResponseUrl (no runtime guessing)
        const formResponseUrl = formConfig.formResponseUrl;

        const response = await fetch(formResponseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: googleFormData.toString(),
          redirect: 'follow',
        });

        const responseText = await response.text();
        const isRecorded =
          response.status === 200 &&
          (responseText.includes('response has been recorded') ||
            responseText.includes('Your response has been recorded') ||
            responseText.includes('freebirdFormviewerViewResponseConfirmationMessage'));

        if (isRecorded) {
          googleSubmitSuccess = true;
          confirmationEvidence = 'Google Forms response recorded confirmation received';
        } else if (response.status === 200) {
          googleSubmitError = 'Google Forms returned HTTP 200 but did not confirm response recorded (check required fields).';
        } else {
          googleSubmitError = `Google Forms returned HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (err) {
        googleSubmitError =
          err instanceof Error ? err.message : 'Network error during Google Forms submission';
      }
    }

    // 7. Update status in database
    const finalStatus = googleSubmitSuccess
      ? (isPaid ? 'submitted' : 'confirmed')
      : googleSubmitError && !googleSubmitError.includes('Network')
      ? 'failed'
      : 'unknown';

    if (dbSaveSuccess) {
      try {
        await db.execute(
          `UPDATE registrations
           SET submission_status = ?, submission_error = ?, submitted_at = ?
           WHERE id = ?`,
          [
            finalStatus,
            googleSubmitError,
            googleSubmitSuccess ? new Date() : null,
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
        passToken,
        verificationToken,
        paymentStatus: initialPaymentStatus,
        whatsappLink,
        confirmationInstructions,
        dbSaved: dbSaveSuccess,
        googleFormsVerified: googleSubmitSuccess,
        message: googleSubmitSuccess
          ? (isPaid
              ? 'Registration submitted! Please save your registration pass and await payment verification.'
              : 'Registration confirmed! Your spot is secured. Download your official delegate pass below.')
          : finalStatus === 'failed'
          ? 'Registration was saved in the database, but the official Google Form rejected the submission.'
          : 'Registration was saved in the database. Google Forms confirmation timed out.',
        evidence: confirmationEvidence || undefined,
        error: googleSubmitError || undefined,
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
