import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { resolveActiveTemplate } from '@/lib/studioService';

export interface IssuedCertificateRecord {
  id: string;
  certificate_code: string;
  registration_id: string | null;
  recipient_name: string;
  recipient_email: string | null;
  recipient_college: string | null;
  competition_slug: string;
  certificate_type: string; // 'participation_cert' | 'winner_cert' | 'custom_cert'
  rank_citation: string;
  template_id: string | null;
  template_version: number;
  issued_by: string;
  issued_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IssueCertificateParams {
  registrationId?: string | null;
  recipientName: string;
  recipientEmail?: string | null;
  recipientCollege?: string | null;
  competitionSlug: string;
  certificateType: 'participation_cert' | 'winner_cert' | 'custom_cert';
  rankCitation?: string;
  templateId?: string | null;
  issuedBy?: string;
}

/**
 * Generates an official unique Certificate Reference Code.
 * Format: CERT-YUG-2026-XXXX
 */
export function generateCertificateCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
  return `CERT-YUG-2026-${rand}${timestamp}`;
}

/**
 * Issues a single certificate, linking it to the active/selected template version.
 * Records the action in audit_log.
 */
export async function issueCertificate(
  params: IssueCertificateParams
): Promise<IssuedCertificateRecord> {
  const id = randomUUID();
  const certificateCode = generateCertificateCode();

  // Resolve template and version
  let templateId = params.templateId || null;
  let templateVersion = 1;

  if (!templateId) {
    const active = await resolveActiveTemplate(params.competitionSlug, 'participation_cert');
    if (active) {
      templateId = active.id;
      templateVersion = active.version || 1;
    }
  } else {
    const tRows = await db.query<{ version: number }>(
      'SELECT version FROM pass_templates WHERE id = ? LIMIT 1',
      [templateId]
    );
    if (tRows.length > 0) {
      templateVersion = tRows[0].version || 1;
    }
  }

  const rankCitation =
    params.rankCitation?.trim() ||
    (params.certificateType === 'winner_cert'
      ? 'Winner Podium Achievement'
      : params.certificateType === 'custom_cert'
      ? 'Special Recognition'
      : 'Certificate of Participation');

  const issuedBy = params.issuedBy || 'Festival Administration';

  await db.execute(
    `INSERT INTO issued_certificates (
      id, certificate_code, registration_id, recipient_name,
      recipient_email, recipient_college, competition_slug,
      certificate_type, rank_citation, template_id, template_version,
      issued_by, issued_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      certificateCode,
      params.registrationId || null,
      params.recipientName.trim(),
      params.recipientEmail?.trim() || null,
      params.recipientCollege?.trim() || 'PCE Nagpur',
      params.competitionSlug,
      params.certificateType,
      rankCitation,
      templateId,
      templateVersion,
      issuedBy,
    ]
  );

  // Safe Audit Log
  try {
    await db.execute(
      `INSERT INTO audit_log (id, action, admin_email, entity_type, entity_id, details)
       VALUES (?, 'ISSUE_CERTIFICATE', ?, 'certificate', ?, ?)`,
      [
        randomUUID(),
        issuedBy,
        id,
        JSON.stringify({
          certificateCode,
          competitionSlug: params.competitionSlug,
          certificateType: params.certificateType,
          templateId,
          templateVersion,
        }),
      ]
    );
  } catch (auditErr) {
    console.warn('Could not record certificate issuance in audit_log:', auditErr);
  }

  const cert = await getCertificateByCodeOrId(id);
  if (!cert) {
    throw new Error('Certificate was created but could not be reloaded.');
  }
  return cert;
}

/**
 * Issues certificates in batch for multiple registrations.
 * Validates each recipient, checks for duplicate issuance of the same certificate type,
 * and reports individual successes and failures without silently skipping.
 */
export async function issueBatchCertificates(params: {
  competitionSlug: string;
  certificateType: 'participation_cert' | 'winner_cert' | 'custom_cert';
  rankCitation?: string;
  templateId?: string | null;
  issuedBy?: string;
  items: Array<{
    registrationId?: string;
    recipientName: string;
    recipientEmail?: string;
    recipientCollege?: string;
    rankCitation?: string;
  }>;
}): Promise<{
  total: number;
  issuedCount: number;
  duplicateCount: number;
  failedCount: number;
  results: Array<{
    recipientName: string;
    registrationId?: string;
    certificateCode?: string;
    status: 'issued' | 'duplicate_skipped' | 'failed';
    error?: string;
  }>;
}> {
  const results: Array<{
    recipientName: string;
    registrationId?: string;
    certificateCode?: string;
    status: 'issued' | 'duplicate_skipped' | 'failed';
    error?: string;
  }> = [];

  let issuedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  for (const item of params.items) {
    const cleanName = item.recipientName?.trim();
    if (!cleanName) {
      results.push({
        recipientName: 'Unknown',
        registrationId: item.registrationId,
        status: 'failed',
        error: 'Recipient name is required.',
      });
      failedCount++;
      continue;
    }

    // Check duplicate issuance for same recipient, registration & certificate type
    if (item.registrationId) {
      const existing = await db.query<{ id: string; certificate_code: string }>(
        `SELECT id, certificate_code FROM issued_certificates 
         WHERE registration_id = ? AND LOWER(TRIM(recipient_name)) = LOWER(TRIM(?)) AND certificate_type = ? AND revoked_at IS NULL LIMIT 1`,
        [item.registrationId, cleanName, params.certificateType]
      );
      if (existing.length > 0) {
        results.push({
          recipientName: cleanName,
          registrationId: item.registrationId,
          certificateCode: existing[0].certificate_code,
          status: 'duplicate_skipped',
          error: `Already issued certificate ${existing[0].certificate_code} to ${cleanName}`,
        });
        duplicateCount++;
        continue;
      }
    }

    try {
      const issued = await issueCertificate({
        registrationId: item.registrationId,
        recipientName: cleanName,
        recipientEmail: item.recipientEmail,
        recipientCollege: item.recipientCollege,
        competitionSlug: params.competitionSlug,
        certificateType: params.certificateType,
        rankCitation: item.rankCitation || params.rankCitation,
        templateId: params.templateId,
        issuedBy: params.issuedBy,
      });

      results.push({
        recipientName: cleanName,
        registrationId: item.registrationId,
        certificateCode: issued.certificate_code,
        status: 'issued',
      });
      issuedCount++;
    } catch (err: any) {
      results.push({
        recipientName: cleanName,
        registrationId: item.registrationId,
        status: 'failed',
        error: err.message || 'Issuance failed',
      });
      failedCount++;
    }
  }

  return {
    total: params.items.length,
    issuedCount,
    duplicateCount,
    failedCount,
    results,
  };
}

/**
 * Look up a certificate by ID or by certificate code.
 */
export async function getCertificateByCodeOrId(
  codeOrId: string
): Promise<IssuedCertificateRecord | null> {
  const rows = await db.query<IssuedCertificateRecord>(
    `SELECT id, certificate_code, registration_id, recipient_name,
            recipient_email, recipient_college, competition_slug,
            certificate_type, rank_citation, template_id, template_version,
            issued_by, issued_at, revoked_at, revocation_reason, created_at, updated_at
     FROM issued_certificates
     WHERE id = ? OR certificate_code = ?
     LIMIT 1`,
    [codeOrId, codeOrId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * List issued certificates with optional competition and type filters.
 */
export async function listIssuedCertificates(filters?: {
  competitionSlug?: string;
  certificateType?: string;
  status?: 'active' | 'revoked';
  limit?: number;
}): Promise<IssuedCertificateRecord[]> {
  let sql = `
    SELECT id, certificate_code, registration_id, recipient_name,
           recipient_email, recipient_college, competition_slug,
           certificate_type, rank_citation, template_id, template_version,
           issued_by, issued_at, revoked_at, revocation_reason, created_at
    FROM issued_certificates
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.competitionSlug && filters.competitionSlug !== 'all') {
    sql += ' AND competition_slug = ?';
    params.push(filters.competitionSlug);
  }
  if (filters?.certificateType && filters.certificateType !== 'all') {
    sql += ' AND certificate_type = ?';
    params.push(filters.certificateType);
  }
  if (filters?.status === 'active') {
    sql += ' AND revoked_at IS NULL';
  } else if (filters?.status === 'revoked') {
    sql += ' AND revoked_at IS NOT NULL';
  }

  const safeLimit = Math.max(1, Math.min(500, Math.floor(Number(filters?.limit) || 100)));
  sql += ` ORDER BY issued_at DESC LIMIT ${safeLimit}`;

  return db.query<IssuedCertificateRecord>(sql, params);
}

/**
 * Revokes an issued certificate.
 */
export async function revokeCertificate(
  id: string,
  reason: string,
  revokedBy: string
): Promise<boolean> {
  await db.execute(
    `UPDATE issued_certificates
     SET revoked_at = NOW(), revocation_reason = ?
     WHERE id = ?`,
    [reason.trim() || 'Revoked by administrator', id]
  );

  try {
    await db.execute(
      `INSERT INTO audit_log (id, action, admin_email, entity_type, entity_id, details)
       VALUES (?, 'REVOKE_CERTIFICATE', ?, 'certificate', ?, ?)`,
      [
        randomUUID(),
        revokedBy,
        id,
        JSON.stringify({ reason: reason.trim() }),
      ]
    );
  } catch {}

  return true;
}
