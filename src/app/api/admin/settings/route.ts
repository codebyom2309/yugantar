import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { invalidatePublicCache } from '@/lib/cache-invalidation';

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
        `INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type, updated_by)
         VALUES (?, ?, 'general', ?, 'text', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
        [s.key, s.value, s.key, session!.user.id]
      );

      if (s.key === 'event_date' && s.value) {
        const months: Record<string, string> = {
          january: '01', february: '02', march: '03', april: '04',
          may: '05', june: '06', july: '07', august: '08',
          september: '09', october: '10', november: '11', december: '12',
          jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
        };
        const parts = s.value.trim().split(/\s+/);
        if (parts.length >= 3) {
          const day = parts[0].padStart(2, '0');
          const mm = months[parts[1].toLowerCase()];
          const year = parts[2];
          if (mm && /^\d{4}$/.test(year) && /^\d{2}$/.test(day)) {
            const iso = `${year}-${mm}-${day}`;
            await db.execute(
              `INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type, updated_by)
               VALUES ('event_iso_date', ?, 'general', 'Event ISO Date', 'date', ?)
               ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
              [iso, session!.user.id]
            );
          }
        }
      }
    }

    await logAudit(session!.user.id, session!.user.email, 'update_settings', 'site_settings', 'bulk', { count: settings.length });
    
    // Invalidate public caches so changes reflect immediately
    invalidatePublicCache('settings');

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

    invalidatePublicCache('settings');

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 });
  }
}
