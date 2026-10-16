import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { syncRegistrationToGoogleForm, RegistrationSyncRecord } from '@/lib/sheetsSync';

async function requireAdmin(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: 'Forbidden', status: 403, session: null };
  }
  return { error: null, status: 200, session };
}

async function logAudit(
  adminId: string,
  adminEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  try {
    await db.execute(
      'INSERT INTO audit_log (id, admin_id, admin_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        randomUUID(),
        adminId,
        adminEmail,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null,
      ]
    );
  } catch {}
}

export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'registration_admin']);
  if (error || !session) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { registrationId, registrationIds, competitionSlug, allPending } = body as {
      registrationId?: string;
      registrationIds?: string[];
      competitionSlug?: string;
      allPending?: boolean;
    };

    const targetIds: string[] = [];
    if (registrationId) {
      targetIds.push(registrationId);
    } else if (Array.isArray(registrationIds) && registrationIds.length > 0) {
      targetIds.push(...registrationIds.slice(0, 100));
    } else if (competitionSlug && allPending) {
      const pendingRows = await db.query<{ id: string }>(
        `SELECT id FROM registrations 
         WHERE competition_slug = ? AND (submission_error IS NOT NULL OR submission_status = 'pending')
         LIMIT 100`,
        [competitionSlug]
      );
      targetIds.push(...pendingRows.map((r) => r.id));
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: 'No registrations specified to synchronize.' },
        { status: 400 }
      );
    }

    let succeeded = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const id of targetIds) {
      const rows = await db.query<RegistrationSyncRecord>(
        `SELECT id, competition_slug, leader_name, leader_email, leader_phone, leader_college,
                leader_branch, leader_semester, team_name, team_size, payment_id, payment_proof_url,
                payment_status, form_data, submission_status, submission_error
         FROM registrations WHERE id = ? LIMIT 1`,
        [id]
      );

      if (rows.length === 0) {
        failed++;
        errors.push({ id, error: 'Registration not found' });
        continue;
      }

      const reg = rows[0];
      const result = await syncRegistrationToGoogleForm(reg);

      if (result.success) {
        if (result.alreadySynced) {
          skipped++;
        } else {
          succeeded++;
        }
        await db.execute(
          `UPDATE registrations 
           SET submission_error = NULL, submitted_at = COALESCE(submitted_at, NOW()) 
           WHERE id = ?`,
          [id]
        );
      } else {
        failed++;
        const errMsg = result.error || 'Sync failed';
        errors.push({ id, error: errMsg });
        await db.execute(
          `UPDATE registrations 
           SET submission_error = ? 
           WHERE id = ?`,
          [errMsg, id]
        );
      }
    }

    await logAudit(
      session.user.id,
      session.user.email || 'admin',
      'sheets_sync_retry',
      'registrations',
      targetIds[0] || 'bulk',
      {
        total: targetIds.length,
        succeeded,
        skipped,
        failed,
      }
    );

    return NextResponse.json({
      success: failed === 0,
      total: targetIds.length,
      succeeded,
      skipped,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Spreadsheet sync API error:', err);
    return NextResponse.json(
      {
        error: 'Failed to process spreadsheet synchronization request.',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
