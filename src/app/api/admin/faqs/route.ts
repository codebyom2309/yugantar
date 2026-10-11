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

// GET /api/admin/faqs
export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const faqs = await db.query<{
    id: string; category: string; question: string; answer: string;
    competition_slug: string | null; display_order: number; is_published: number; created_at: string;
  }>('SELECT * FROM faqs ORDER BY display_order ASC, created_at ASC');

  return NextResponse.json({ faqs });
}

// POST /api/admin/faqs
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { category, question, answer, competitionSlug, displayOrder } = await request.json();
  const id = randomUUID();

  await db.execute(
    'INSERT INTO faqs (id, category, question, answer, competition_slug, display_order, is_published) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [id, category || 'General', question, answer, competitionSlug || null, displayOrder || 0]
  );

  await logAudit(session!.user.id, session!.user.email, 'create_faq', 'faq', id);
  return NextResponse.json({ success: true, id });
}

// PUT /api/admin/faqs
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { id, category, question, answer, competitionSlug, displayOrder, isPublished } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db.execute(
    'UPDATE faqs SET category = ?, question = ?, answer = ?, competition_slug = ?, display_order = ?, is_published = ? WHERE id = ?',
    [category, question, answer, competitionSlug || null, displayOrder || 0, isPublished ?? 1, id]
  );

  await logAudit(session!.user.id, session!.user.email, 'update_faq', 'faq', id);
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/faqs
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await request.json();
  await db.execute('DELETE FROM faqs WHERE id = ?', [id]);
  await logAudit(session!.user.id, session!.user.email, 'delete_faq', 'faq', id);
  return NextResponse.json({ success: true });
}
