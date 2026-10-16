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
  const paymentStatusFilter = searchParams.get('paymentStatus') || '';
  const search = searchParams.get('search') || '';
  const dateFilter = searchParams.get('date') || '';
  const isAll = searchParams.get('all') === 'true';
  const modeParam = searchParams.get('mode') || 'LIVE'; // Default to LIVE participant view
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = isAll ? 5000 : Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
  const offset = isAll ? 0 : (page - 1) * limit;

  try {
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (modeParam === 'LIVE') {
      where += " AND (registration_mode = 'LIVE')";
    } else if (modeParam === 'TEST') {
      where += " AND (registration_mode = 'TEST' OR registration_mode IS NULL)";
    }

    if (competition) { where += ' AND competition_slug = ?'; params.push(competition); }
    if (statusFilter) { where += ' AND submission_status = ?'; params.push(statusFilter); }
    if (paymentStatusFilter) {
      if (paymentStatusFilter === 'confirmed') {
        where += " AND (payment_status IN ('confirmed', 'verified'))";
      } else if (paymentStatusFilter === 'free') {
        where += " AND (payment_status = 'free' OR (payment_status IS NULL AND payment_id IS NULL))";
      } else if (paymentStatusFilter === 'pending') {
        where += " AND (payment_status = 'pending' OR (payment_status IS NULL AND payment_id IS NOT NULL))";
      } else if (paymentStatusFilter === 'rejected') {
        where += " AND payment_status = 'rejected'";
      } else {
        where += ' AND payment_status = ?';
        params.push(paymentStatusFilter);
      }
    }
    if (dateFilter) {
      where += ' AND created_at >= ? AND created_at < ?';
      const startOfDay = `${dateFilter} 00:00:00`;
      const nextDate = new Date(dateFilter);
      nextDate.setDate(nextDate.getDate() + 1);
      const endOfDay = `${nextDate.toISOString().split('T')[0]} 00:00:00`;
      params.push(startOfDay, endOfDay);
    }
    if (search) {
      where += ' AND (leader_name LIKE ? OR leader_email LIKE ? OR team_name LIKE ? OR payment_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const safeLimit = Math.max(1, limit);
    const safeOffset = Math.max(0, offset);

    // Run count, page data, mode stats, and settings concurrently in parallel
    const [countRows, rows, settingRows, modeStatRows] = await Promise.all([
      db.query<{ total: number }>(`SELECT COUNT(*) as total FROM registrations ${where}`, params),
      db.query<{
        id: string; competition_slug: string; leader_name: string; leader_email: string;
        leader_phone: string; leader_college: string; leader_branch: string; leader_semester: string;
        team_name: string | null; team_size: number; payment_id: string | null;
        payment_proof_url: string | null; submission_status: string; submission_error: string | null;
        submitted_at: string | null; created_at: string; verification_token: string | null;
        payment_status: string | null; verified_by: string | null; verified_at: string | null;
        form_data: string | null; registration_mode: string;
        normal_fee: number | null; discount_amount: number | null; discount_rule: string | null; final_fee: number | null;
      }>(
        `SELECT id, competition_slug, leader_name, leader_email, leader_phone, leader_college,
                leader_branch, leader_semester, team_name, team_size, payment_id, payment_proof_url,
                submission_status, submission_error, submitted_at, created_at, verification_token,
                payment_status, verified_by, verified_at, form_data, registration_mode,
                normal_fee, discount_amount, discount_rule, final_fee
         FROM registrations ${where} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        params
      ),
      db.query<{ setting_value: string }>(
        "SELECT setting_value FROM site_settings WHERE setting_key = 'registration_storage_mode' LIMIT 1"
      ),
      db.query<{ registration_mode: string; count: number }>(
        "SELECT COALESCE(registration_mode, 'TEST') as registration_mode, COUNT(*) as count FROM registrations GROUP BY registration_mode"
      ),
    ]);
    const total = countRows?.[0]?.total || 0;
    const storageMode = settingRows?.[0]?.setting_value || 'minimal';

    let liveCount = 0;
    let testCount = 0;
    (modeStatRows || []).forEach(r => {
      if (r.registration_mode === 'LIVE') liveCount += Number(r.count);
      else testCount += Number(r.count);
    });

    return NextResponse.json(
      {
        registrations: rows,
        total,
        page: isAll ? 1 : page,
        limit: safeLimit,
        totalPages: isAll ? 1 : Math.ceil(total / safeLimit),
        storageMode,
        activeMode: modeParam,
        countsByMode: {
          live: liveCount,
          test: testCount,
          all: liveCount + testCount,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Registrations API error:', err);
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 });
  }
}

// PUT /api/admin/registrations — Update registration status or payment status (single or bulk)
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'registration_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { id, ids, submissionStatus, paymentStatus } = body;

    // 1. Update Payment Status (with audit verification timestamp and admin identity)
    if (paymentStatus) {
      const isConfirm = paymentStatus === 'confirmed';
      if (Array.isArray(ids) && ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        await db.execute(
          `UPDATE registrations 
           SET payment_status = ?, 
               submission_status = CASE WHEN ? = 1 THEN 'confirmed' ELSE submission_status END,
               verified_by = ?, 
               verified_at = NOW() 
           WHERE id IN (${placeholders})`,
          [paymentStatus, isConfirm ? 1 : 0, session!.user.email, ...ids]
        );
        await logAudit(session!.user.id, session!.user.email, 'bulk_update_payment_status', 'registration', 'bulk', { count: ids.length, newPaymentStatus: paymentStatus });
        return NextResponse.json({ success: true, updatedCount: ids.length }, {
          headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
        });
      }

      if (id) {
        await db.execute(
          `UPDATE registrations 
           SET payment_status = ?, 
               submission_status = CASE WHEN ? = 1 THEN 'confirmed' ELSE submission_status END,
               verified_by = ?, 
               verified_at = NOW() 
           WHERE id = ?`,
          [paymentStatus, isConfirm ? 1 : 0, session!.user.email, id]
        );
        await logAudit(session!.user.id, session!.user.email, 'update_payment_status', 'registration', id, { newPaymentStatus: paymentStatus });
        return NextResponse.json({ success: true }, {
          headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
        });
      }
    }

    // 2. Update Submission Status
    if (!submissionStatus) return NextResponse.json({ error: 'Missing status or paymentStatus' }, { status: 400 });

    if (Array.isArray(ids) && ids.length > 0) {
      // Bulk update
      const placeholders = ids.map(() => '?').join(',');
      await db.execute(`UPDATE registrations SET submission_status = ? WHERE id IN (${placeholders})`, [submissionStatus, ...ids]);
      await logAudit(session!.user.id, session!.user.email, 'bulk_update_registration_status', 'registration', 'bulk', { count: ids.length, newStatus: submissionStatus });
      return NextResponse.json({ success: true, updatedCount: ids.length }, {
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      });
    }

    if (!id) return NextResponse.json({ error: 'Missing id or ids' }, { status: 400 });

    await db.execute('UPDATE registrations SET submission_status = ? WHERE id = ?', [submissionStatus, id]);
    await logAudit(session!.user.id, session!.user.email, 'update_registration_status', 'registration', id, { newStatus: submissionStatus });

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });
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

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}
