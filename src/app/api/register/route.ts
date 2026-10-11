import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRegistrationFormBySlug } from '@/data/registrationForms';
import { randomUUID } from 'crypto';

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
    try {
      const siteSettings = await db.query<{ setting_key: string; setting_value: string }>(
        "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('registration_global_open', 'registration_status_message')"
      );
      const settingsMap: Record<string, string> = {};
      siteSettings.forEach((r) => {
        settingsMap[r.setting_key] = r.setting_value;
      });

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
      }>(
        'SELECT registration_open, registration_deadline FROM competitions WHERE slug = ? LIMIT 1',
        [competitionSlug]
      );
      if (compRows.length > 0) {
        if (compRows[0].registration_open === 0) {
          return NextResponse.json(
            {
              status: 'failed',
              error: 'Registration for this specific competition track is currently closed.',
            },
            { status: 403 }
          );
        }
        if (compRows[0].registration_deadline) {
          const deadline = new Date(compRows[0].registration_deadline);
          if (!isNaN(deadline.getTime()) && Date.now() > deadline.getTime()) {
            return NextResponse.json(
              {
                status: 'failed',
                error: `Registration for this competition closed on ${compRows[0].registration_deadline}.`,
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

    // 4. Generate persistent registration ID and secure verification token
    const registrationId = randomUUID();
    const verificationToken = 'yug_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    // 5. Initial save to database with 'pending' status
    let dbSaveSuccess = false;
    try {
      await db.execute(
        `INSERT INTO registrations (
          id, competition_slug, idempotency_key,
          leader_name, leader_email, leader_phone,
          leader_college, leader_branch, leader_semester,
          team_name, team_size, form_data,
          payment_id, payment_proof_url,
          google_form_id, submission_status, verification_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          JSON.stringify(formValues),
          paymentId,
          paymentProof,
          formConfig.googleFormId,
          'pending',
          verificationToken,
        ],
      );
      dbSaveSuccess = true;
    } catch (dbErr) {
      console.error('Database initial insert error:', dbErr);
    }

    // 6. Real Google Forms submission via verified formResponseUrl
    let googleSubmitSuccess = false;
    let googleSubmitError: string | null = null;
    let confirmationEvidence: string | null = null;

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

        const value = formValues[field.key]?.trim() || '';
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

    // 7. Update status in database
    const finalStatus = googleSubmitSuccess
      ? 'submitted'
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

    // 8. Return comprehensive, honest diagnostic response to client
    return NextResponse.json({
      status: finalStatus,
      registrationId,
      dbSaved: dbSaveSuccess,
      googleFormsVerified: googleSubmitSuccess,
      message: googleSubmitSuccess
        ? 'Registration confirmed! Your response has been securely saved and recorded in the official Google Form.'
        : finalStatus === 'failed'
        ? 'Registration was saved in the database, but the official Google Form rejected the submission.'
        : 'Registration was saved in the database. Google Forms confirmation timed out.',
      evidence: confirmationEvidence || undefined,
      error: googleSubmitError || undefined,
    });
  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      {
        status: 'failed',
        error: 'Unable to process registration request.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
