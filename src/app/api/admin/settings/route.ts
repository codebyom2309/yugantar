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

// GET /api/admin/settings — List all settings
export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const settings = await db.query<{ setting_key: string; setting_value: string; setting_group: string; label: string; field_type: string; updated_at: string }>(
      'SELECT * FROM site_settings ORDER BY setting_group, setting_key'
    );
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings — Update settings
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { settings } = await request.json() as { settings: { key: string; value: string }[] };

    for (const s of settings) {
      await db.execute(
        'UPDATE site_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
        [s.value, session!.user.id, s.key]
      );
    }

    await logAudit(session!.user.id, session!.user.email, 'update_settings', 'site_settings', 'bulk', { count: settings.length });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// POST /api/admin/settings — Create new setting
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { key, value, group, label, fieldType } = await request.json();
    await db.execute(
      'INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
      [key, value, group || 'general', label || key, fieldType || 'text', session!.user.id]
    );
    await logAudit(session!.user.id, session!.user.email, 'create_setting', 'site_settings', key);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 });
  }
}
