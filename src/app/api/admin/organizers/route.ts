import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { formatDriveUrl } from '@/lib/storage';
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

// GET — list organizers
export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const [organizers, settingRows] = await Promise.all([
    db.query<{
      id: string; name: string; role: string; department: string; description: string;
      badge: string; leadership_note: string; logo_url: string | null; display_order: number; is_published: number;
    }>('SELECT * FROM organizers ORDER BY display_order ASC'),
    db.query<{ setting_value: string }>(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'show_organizer_order' LIMIT 1"
    ),
  ]);

  const seen = new Set<string>();
  const uniqueOrganizers = (organizers || []).filter((o) => {
    if (!o.name || seen.has(o.name)) return false;
    seen.add(o.name);
    return true;
  });

  return NextResponse.json(
    {
      organizers: uniqueOrganizers,
      showOrganizerOrder: settingRows?.[0]?.setting_value === '1',
    },
    {
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    }
  );
}

// PATCH — update site settings such as show_organizer_order
export async function PATCH(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  if (body.showOrganizerOrder !== undefined) {
    const val = body.showOrganizerOrder ? '1' : '0';
    await db.execute(
      `INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type)
       VALUES ('show_organizer_order', ?, 'general', 'Show Organizer Order Numbers on Website', 'boolean')
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [val, val]
    );
    await logAudit(session!.user.id, session!.user.email, 'update_setting', 'site_setting', 'show_organizer_order', {
      showOrganizerOrder: val,
    });
    invalidatePublicCache('organizers');
    return NextResponse.json({ success: true, showOrganizerOrder: val === '1' });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}

// POST — create organizer
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const id = randomUUID();
  const logoUrl = body.logoUrl ? formatDriveUrl(body.logoUrl) : null;

  await db.execute(
    'INSERT INTO organizers (id, name, role, department, description, badge, leadership_note, logo_url, display_order, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
    [id, body.name, body.role || '', body.department || '', body.description || '', body.badge || '', body.leadershipNote || '', logoUrl, body.displayOrder || 0]
  );

  await logAudit(session!.user.id, session!.user.email, 'create_organizer', 'organizer', id);

  invalidatePublicCache('organizers');

  return NextResponse.json({ success: true, id }, {
    headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
  });
}

// PUT — update organizer
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const logoUrl = body.logoUrl !== undefined ? (body.logoUrl ? formatDriveUrl(body.logoUrl) : null) : undefined;

  await db.execute(
    'UPDATE organizers SET name = ?, role = ?, department = ?, description = ?, badge = ?, leadership_note = ?, logo_url = COALESCE(?, logo_url), display_order = ?, is_published = ? WHERE id = ?',
    [body.name, body.role, body.department, body.description, body.badge, body.leadershipNote || '', logoUrl ?? null, body.displayOrder || 0, body.isPublished ?? 1, body.id]
  );

  await logAudit(session!.user.id, session!.user.email, 'update_organizer', 'organizer', body.id);
  invalidatePublicCache('organizers');
  return NextResponse.json({ success: true }, {
    headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
  });
}

// DELETE — delete organizer
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await request.json();
  await db.execute('DELETE FROM organizers WHERE id = ?', [id]);
  await logAudit(session!.user.id, session!.user.email, 'delete_organizer', 'organizer', id);

  invalidatePublicCache('organizers');

  return NextResponse.json({ success: true }, {
    headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
  });
}
