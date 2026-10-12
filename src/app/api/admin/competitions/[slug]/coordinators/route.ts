import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { formatDriveUrl } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { invalidatePublicCache } from '@/lib/cache-invalidation';

async function requireAdmin(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: 'Forbidden', status: 403, session: null };
  }
  return { error: null, status: 200, session };
}

interface ContextProps {
  params: Promise<{ slug: string }>;
}

// POST /api/admin/competitions/[slug]/coordinators — Add coordinator
export async function POST(request: NextRequest, context: ContextProps) {
  const { error, status } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { slug } = await context.params;

  try {
    const body = await request.json();
    const { name, role, email, phone, displayOrder, isPublic } = body;
    const rawAvatar = body.avatarUrl || body.avatar_url;
    const avatarUrl = rawAvatar ? formatDriveUrl(rawAvatar) : null;

    if (!name) return NextResponse.json({ error: 'Coordinator name is required.' }, { status: 400 });

    const id = randomUUID();

    await db.execute(
      `INSERT INTO competition_coordinators (
        id, competition_slug, name, role, email, phone, avatar_url, display_order, is_public, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        slug,
        name,
        role || 'Student Coordinator',
        email || null,
        phone || null,
        avatarUrl,
        Number(displayOrder || 0),
        isPublic !== undefined ? (isPublic ? 1 : 0) : 1,
      ]
    );

    invalidatePublicCache('competitions', slug);

    return NextResponse.json({ success: true, id }, {
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    console.error('Add coordinator error:', err);
    return NextResponse.json({ error: 'Failed to add coordinator' }, { status: 500 });
  }
}

// PUT /api/admin/competitions/[slug]/coordinators — Update coordinator
export async function PUT(request: NextRequest, context: ContextProps) {
  const { error, status } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { slug } = await context.params;

  try {
    const body = await request.json();
    const { id, name, role, email, phone, displayOrder, isPublic, isActive } = body;
    if (!id) return NextResponse.json({ error: 'Coordinator ID is required.' }, { status: 400 });

    const rawAvatar = body.avatarUrl !== undefined ? body.avatarUrl : body.avatar_url;
    const avatarUrl = rawAvatar !== undefined ? (rawAvatar ? formatDriveUrl(rawAvatar) : null) : undefined;

    await db.execute(
      `UPDATE competition_coordinators SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        avatar_url = COALESCE(?, avatar_url),
        display_order = COALESCE(?, display_order),
        is_public = COALESCE(?, is_public),
        is_active = COALESCE(?, is_active)
      WHERE id = ?`,
      [
        name ?? null,
        role ?? null,
        email ?? null,
        phone ?? null,
        avatarUrl ?? null,
        displayOrder !== undefined ? Number(displayOrder) : null,
        isPublic !== undefined ? (isPublic ? 1 : 0) : null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        id,
      ]
    );

    invalidatePublicCache('competitions', slug);

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    console.error('Update coordinator error:', err);
    return NextResponse.json({ error: 'Failed to update coordinator' }, { status: 500 });
  }
}

// DELETE /api/admin/competitions/[slug]/coordinators — Delete coordinator
export async function DELETE(request: NextRequest, context: ContextProps) {
  const { error, status } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { slug } = await context.params;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Coordinator ID is required.' }, { status: 400 });

    await db.execute('DELETE FROM competition_coordinators WHERE id = ?', [id]);

    invalidatePublicCache('competitions', slug);

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    console.error('Delete coordinator error:', err);
    return NextResponse.json({ error: 'Failed to delete coordinator' }, { status: 500 });
  }
}
