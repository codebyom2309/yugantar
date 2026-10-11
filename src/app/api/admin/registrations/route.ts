import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

async function requireAdmin(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  if (allowedRoles && !allowedRoles.includes(session.user.role)) return { error: 'Forbidden', status: 403, session: null };
  return { error: null, status: 200, session };
}

async function logAudit(adminId: string, adminEmail: string, action: string, entityType: string, entityId: string, details?: Record<string, unknown>) {
  try {
    await db.execute('INSERT INTO audit_log (id, admin_id, admin_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), adminId, adminEmail, action, entityType, entityId, details ? JSON.stringify(details) : null]);
  } catch {}
}

// GET /api/admin/registrations — List registrations with filters
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const competition = searchParams.get('competition') || '';
  const statusFilter = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const dateFilter = searchParams.get('date') || '';
  const isAll = searchParams.get('all') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = isAll ? 5000 : Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
  const offset = isAll ? 0 : (page - 1) * limit;

  try {
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (competition) { where += ' AND competition_slug = ?'; params.push(competition); }
    if (statusFilter) { where += ' AND submission_status = ?'; params.push(statusFilter); }
    if (dateFilter) { where += ' AND DATE(created_at) = ?'; params.push(dateFilter); }
    if (search) {
      where += ' AND (leader_name LIKE ? OR leader_email LIKE ? OR team_name LIKE ? OR payment_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const [countRow] = await db.query<{ total: number }>(`SELECT COUNT(*) as total FROM registrations ${where}`, params);
    const total = countRow?.total || 0;

    const safeLimit = Math.max(1, limit);
    const safeOffset = Math.max(0, offset);

    const rows = await db.query<{
      id: string; competition_slug: string; leader_name: string; leader_email: string;
      leader_phone: string; leader_college: string; leader_branch: string; leader_semester: string;
      team_name: string | null; team_size: number; payment_id: string | null;
      payment_proof_url: string | null; submission_status: string; submission_error: string | null;
      submitted_at: string | null; created_at: string; verification_token: string | null;
    }>(
      `SELECT id, competition_slug, leader_name, leader_email, leader_phone, leader_college,
              leader_branch, leader_semester, team_name, team_size, payment_id, payment_proof_url,
              submission_status, submission_error, submitted_at, created_at, verification_token
       FROM registrations ${where} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    return NextResponse.json({
      registrations: rows,
      total,
      page: isAll ? 1 : page,
      limit: safeLimit,
      totalPages: isAll ? 1 : Math.ceil(total / safeLimit),
    });
  } catch (err) {
    console.error('Registrations API error:', err);
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 });
  }
}

// PUT /api/admin/registrations — Update registration status (single or bulk)
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'registration_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { id, ids, submissionStatus } = body;
    if (!submissionStatus) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

    if (Array.isArray(ids) && ids.length > 0) {
      // Bulk update
      const placeholders = ids.map(() => '?').join(',');
      await db.execute(`UPDATE registrations SET submission_status = ? WHERE id IN (${placeholders})`, [submissionStatus, ...ids]);
      await logAudit(session!.user.id, session!.user.email, 'bulk_update_registration_status', 'registration', 'bulk', { count: ids.length, newStatus: submissionStatus });
      return NextResponse.json({ success: true, updatedCount: ids.length });
    }

    if (!id) return NextResponse.json({ error: 'Missing id or ids' }, { status: 400 });

    await db.execute('UPDATE registrations SET submission_status = ? WHERE id = ?', [submissionStatus, id]);
    await logAudit(session!.user.id, session!.user.email, 'update_registration_status', 'registration', id, { newStatus: submissionStatus });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}

// DELETE /api/admin/registrations — Delete registration
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await db.execute('DELETE FROM registrations WHERE id = ?', [id]);
    await logAudit(session!.user.id, session!.user.email, 'delete_registration', 'registration', id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}
