import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Shared auth helper
async function requireAdmin(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401, session: null };
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: 'Forbidden', status: 403, session: null };
  }
  return { error: null, status: 200, session };
}

// Audit logger
async function logAudit(adminId: string, adminEmail: string, action: string, entityType: string, entityId: string, details?: Record<string, unknown>, ip?: string) {
  try {
    await db.execute(
      'INSERT INTO audit_log (id, admin_id, admin_email, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), adminId, adminEmail, action, entityType, entityId, details ? JSON.stringify(details) : null, ip || null]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// =========================================================================
// GET /api/admin/dashboard — Dashboard stats
// =========================================================================
export async function GET(request: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const [regStats] = await db.query<{ total: number; submitted: number; pending: number; failed: number }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN submission_status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN submission_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN submission_status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM registrations`
    );

    const compBySlug = await db.query<{ competition_slug: string; count: number }>(
      `SELECT competition_slug, COUNT(*) as count FROM registrations GROUP BY competition_slug ORDER BY count DESC`
    );

    const collegeStats = await db.query<{ leader_college: string; count: number }>(
      `SELECT leader_college, COUNT(*) as count FROM registrations GROUP BY leader_college ORDER BY count DESC LIMIT 10`
    );

    const recentRegs = await db.query<{
      id: string; leader_name: string; leader_email: string; competition_slug: string;
      submission_status: string; created_at: string;
    }>(
      `SELECT id, leader_name, leader_email, competition_slug, submission_status, created_at FROM registrations ORDER BY created_at DESC LIMIT 10`
    );

    const [adminCount] = await db.query<{ count: number }>('SELECT COUNT(*) as count FROM admin_users WHERE is_enabled = 1');

    return NextResponse.json({
      stats: {
        totalRegistrations: regStats?.total || 0,
        submitted: regStats?.submitted || 0,
        pending: regStats?.pending || 0,
        failed: regStats?.failed || 0,
        adminUsers: adminCount?.count || 0,
      },
      registrationsByCompetition: compBySlug,
      collegeBreakdown: collegeStats,
      recentRegistrations: recentRegs,
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
