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
    const [
      [regStats],
      compBySlug,
      collegeStats,
      recentRegs,
      [adminCount],
      settings,
    ] = await Promise.all([
      db.query<{
        totalLive: number;
        submittedLive: number;
        pendingLive: number;
        failedLive: number;
        totalTest: number;
      }>(
        `SELECT 
          SUM(CASE WHEN registration_mode = 'LIVE' THEN 1 ELSE 0 END) as totalLive,
          SUM(CASE WHEN registration_mode = 'LIVE' AND submission_status = 'submitted' THEN 1 ELSE 0 END) as submittedLive,
          SUM(CASE WHEN registration_mode = 'LIVE' AND submission_status = 'pending' THEN 1 ELSE 0 END) as pendingLive,
          SUM(CASE WHEN registration_mode = 'LIVE' AND submission_status = 'failed' THEN 1 ELSE 0 END) as failedLive,
          SUM(CASE WHEN registration_mode = 'TEST' OR registration_mode IS NULL THEN 1 ELSE 0 END) as totalTest
        FROM registrations`
      ),
      db.query<{ competition_slug: string; count: number }>(
        `SELECT competition_slug, COUNT(*) as count FROM registrations WHERE registration_mode = 'LIVE' GROUP BY competition_slug ORDER BY count DESC`
      ),
      db.query<{ leader_college: string; count: number }>(
        `SELECT leader_college, COUNT(*) as count FROM registrations WHERE registration_mode = 'LIVE' GROUP BY leader_college ORDER BY count DESC LIMIT 10`
      ),
      db.query<{
        id: string; leader_name: string; leader_email: string; competition_slug: string;
        submission_status: string; created_at: string; registration_mode: string;
      }>(
        `SELECT id, leader_name, leader_email, competition_slug, submission_status, created_at, registration_mode FROM registrations ORDER BY created_at DESC LIMIT 10`
      ),
      db.query<{ count: number }>('SELECT COUNT(*) as count FROM admin_users WHERE is_enabled = 1'),
      db.query<{ setting_key: string; setting_value: string }>(
        'SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ?',
        ['event_date']
      ),
    ]);

    return NextResponse.json(
      {
        stats: {
          totalRegistrations: Number(regStats?.totalLive || 0),
          submitted: Number(regStats?.submittedLive || 0),
          pending: Number(regStats?.pendingLive || 0),
          failed: Number(regStats?.failedLive || 0),
          testRegistrations: Number(regStats?.totalTest || 0),
          adminUsers: adminCount?.count || 0,
        },
        festivalDate: settings?.[0]?.setting_value || '21 October 2026',
        registrationsByCompetition: compBySlug,
        collegeBreakdown: collegeStats,
        recentRegistrations: recentRegs,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
