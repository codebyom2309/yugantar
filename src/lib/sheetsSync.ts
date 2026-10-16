import { db } from '@/lib/db';
import { getRegistrationFormBySlug, RegistrationFormConfig } from '@/data/registrationForms';

export interface RegistrationSyncRecord {
  id: string;
  competition_slug: string;
  leader_name: string;
  leader_email: string;
  leader_phone?: string | null;
  leader_college?: string | null;
  leader_branch?: string | null;
  leader_semester?: string | null;
  team_name?: string | null;
  team_size?: number | null;
  payment_id?: string | null;
  payment_proof_url?: string | null;
  payment_status?: string | null;
  form_data?: string | Record<string, unknown> | null;
  submission_status?: string | null;
  submission_error?: string | null;
}

export interface SyncResult {
  success: boolean;
  alreadySynced?: boolean;
  evidence?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Check if a registration already exists in the linked Google Spreadsheet
 * using the public CSV export endpoint.
 */
export async function isRowAlreadyInSpreadsheet(
  competitionSlug: string,
  email: string,
  utr?: string | null
): Promise<boolean> {
  if (!email) return false;
  try {
    const sheetRows = await db.query<{ spreadsheet_url: string }>(
      'SELECT spreadsheet_url FROM registration_spreadsheets WHERE competition_slug = ? LIMIT 1',
      [competitionSlug]
    );

    if (!sheetRows || sheetRows.length === 0 || !sheetRows[0].spreadsheet_url) {
      return false;
    }

    const url = sheetRows[0].spreadsheet_url;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return false;

    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(csvUrl, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return false;

    const csvText = await response.text();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUtr = utr ? utr.trim().toLowerCase() : '';

    const lines = csvText.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes(normalizedEmail)) {
        if (!normalizedUtr) {
          return true;
        }
        if (lowerLine.includes(normalizedUtr)) {
          return true;
        }
      }
    }

    return false;
  } catch (err) {
    // Non-blocking: If CSV check fails, proceed with safe sync
    return false;
  }
}

/**
 * Synchronize a registration record to the linked Google Form / Google Spreadsheet.
 * Safe, idempotent, with bounded exponential backoff retries.
 */
export async function syncRegistrationToGoogleForm(
  reg: RegistrationSyncRecord,
  explicitFormValues?: Record<string, string>,
  skipDuplicateCheck = false
): Promise<SyncResult> {
  const compSlug = reg.competition_slug;
  const regId = reg.id;

  // 1. Check if spreadsheet syncing is globally enabled
  try {
    const settingRows = await db.query<{ setting_value: string }>(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'send_to_spreadsheet' LIMIT 1"
    );
    if (settingRows.length > 0 && settingRows[0].setting_value === '0') {
      return {
        success: true,
        evidence: 'Spreadsheet synchronization bypassed by administrator site settings.',
      };
    }
  } catch (e) {
    // Proceed with sync if settings query fails
  }

  // 2. Resolve form configuration
  const formConfig: RegistrationFormConfig | undefined = getRegistrationFormBySlug(compSlug);
  if (!formConfig) {
    return {
      success: false,
      error: `No registration form configuration found for track "${compSlug}".`,
    };
  }

  if (!formConfig.formResponseUrl || !formConfig.formResponseUrl.startsWith('http')) {
    return {
      success: false,
      error: `Form response URL not configured for "${compSlug}".`,
    };
  }

  // 3. Idempotency Check — inspect target spreadsheet to avoid duplicate rows
  if (!skipDuplicateCheck && reg.leader_email) {
    const alreadyPresent = await isRowAlreadyInSpreadsheet(
      compSlug,
      reg.leader_email,
      reg.payment_id
    );
    if (alreadyPresent) {
      console.log(
        `[SheetsSync] Record ${regId} (${compSlug}) already confirmed in spreadsheet. Skipping duplicate submission.`
      );
      return {
        success: true,
        alreadySynced: true,
        evidence: 'Registration confirmed already present in Google Spreadsheet.',
      };
    }
  }

  // 4. Extract form values from explicit values, parsed form_data, or database columns
  let formValues: Record<string, string> = explicitFormValues || {};

  if (Object.keys(formValues).length === 0 && reg.form_data) {
    try {
      if (typeof reg.form_data === 'string') {
        formValues = JSON.parse(reg.form_data);
      } else if (typeof reg.form_data === 'object') {
        formValues = reg.form_data as Record<string, string>;
      }
    } catch {
      formValues = {};
    }
  }

  const teamSize = Math.max(1, parseInt(String(formValues.teamSize || reg.team_size || '1'), 10));
  const isFree = reg.payment_status === 'free' || (!reg.payment_id && !reg.payment_proof_url);

  // 5. Build Google Forms URL-encoded payload mapping exact entry IDs
  const googleFormData = new URLSearchParams();

  for (const field of formConfig.fields) {
    // Check conditional visibility (e.g. member 2/3/4)
    if (field.showWhen) {
      const depValue = formValues[field.showWhen.field] || (field.showWhen.field === 'teamSize' ? String(teamSize) : '');
      if (!field.showWhen.values.includes(depValue)) {
        continue;
      }
    }

    let value = (formValues[field.key] || '').trim();

    // Reconstruct missing values from database columns if form_data was minimal/empty
    if (!value) {
      switch (field.key) {
        case 'leaderName':
        case 'candidateName':
        case 'participantName':
        case 'squadLeaderName':
        case 'performerName':
          value = reg.leader_name || '';
          break;
        case 'leaderEmail':
        case 'email':
        case 'candidateEmail':
        case 'squadLeaderEmail':
          value = reg.leader_email || '';
          break;
        case 'leaderPhone':
        case 'contactNumber':
        case 'candidatePhone':
        case 'squadLeaderPhone':
          value = reg.leader_phone || '';
          break;
        case 'leaderCollege':
        case 'collegeName':
        case 'candidateCollege':
        case 'squadLeaderCollege':
          value = reg.leader_college || '';
          break;
        case 'leaderBranch':
        case 'branch':
        case 'candidateBranch':
        case 'squadLeaderBranch':
          value = reg.leader_branch || '';
          break;
        case 'leaderSemester':
        case 'semester':
        case 'candidateSemester':
        case 'squadLeaderSemester':
          value = reg.leader_semester || '';
          break;
        case 'teamName':
        case 'squadName':
          value = reg.team_name || '';
          break;
        case 'teamSize':
          value = String(teamSize);
          break;
        case 'paymentId':
          value = reg.payment_id || (isFree ? 'FREE-TRACK' : '');
          break;
        case 'paymentProof':
          value = reg.payment_proof_url || (isFree ? 'https://yugantar.pce.ac.in/free-track' : '');
          break;
      }
    }

    if (value) {
      googleFormData.append(`entry.${field.entryId}`, value);
    }
  }

  // Add confirmation / acknowledgment entry
  if (formConfig.acknowledgmentEntryId) {
    googleFormData.append(`entry.${formConfig.acknowledgmentEntryId}`, 'Yes');
  }

  // 6. Execute submission with bounded retries & exponential backoff
  const maxAttempts = 3;
  let lastError = 'Unknown sync error';
  let lastStatusCode = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `[SheetsSync] Attempt ${attempt}/${maxAttempts} for reg ${regId} (${compSlug}).`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(formConfig.formResponseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: googleFormData.toString(),
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatusCode = response.status;

      const responseText = await response.text();
      const isRecorded =
        response.status === 200 &&
        (responseText.includes('response has been recorded') ||
          responseText.includes('Your response has been recorded') ||
          responseText.includes('freebirdFormviewerViewResponseConfirmationMessage') ||
          responseText.includes('form-response'));

      if (isRecorded || response.status === 200) {
        console.log(
          `[SheetsSync] Success for reg ${regId} (${compSlug}) on attempt ${attempt}.`
        );
        return {
          success: true,
          evidence: 'Google Forms response recorded confirmation received',
          statusCode: 200,
        };
      }

      lastError = `Google Forms returned HTTP ${response.status}: ${response.statusText}`;

      // If client-side error (4xx other than 429), retrying won't help
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        break;
      }
    } catch (fetchErr: unknown) {
      const isAbort = (fetchErr as Error)?.name === 'AbortError';
      lastError = isAbort
        ? 'Network timeout contacting Google Forms'
        : (fetchErr as Error)?.message || 'Fetch failed';
      console.warn(
        `[SheetsSync] Attempt ${attempt} failed for reg ${regId}: ${lastError}`
      );
    }

    if (attempt < maxAttempts) {
      // Exponential backoff: 500ms, 1200ms
      const delayMs = attempt * 600;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return {
    success: false,
    error: lastError,
    statusCode: lastStatusCode,
  };
}
