import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { invalidatePublicCache } from '@/lib/cache-invalidation';

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
      [randomUUID(), adminId, adminEmail, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch {}
}

// GET /api/admin/organizers/members
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let sql = 'SELECT * FROM organizer_members';
    const params: (string | number)[] = [];
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }
    sql += ' ORDER BY display_order ASC, created_at ASC';

    const members = await db.query(sql, params);

    return NextResponse.json(
      { members },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    console.error('Failed to get organizer members:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST /api/admin/organizers/members — Create new member
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    if (!body.name || !body.role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const id = randomUUID();
    const githubUrl = (body.githubUrl || body.github_url || '').trim() || null;
    const linkedinUrl = (body.linkedinUrl || body.linkedin_url || '').trim() || null;
    const forumDesignation = (body.forumDesignation || body.forum_designation || '').trim() || null;
    const cropData = body.cropData ? (typeof body.cropData === 'string' ? body.cropData : JSON.stringify(body.cropData)) : null;
    const isLead = body.isLead !== undefined ? (body.isLead ? 1 : 0) : (body.is_lead !== undefined ? (body.is_lead ? 1 : 0) : 0);

    await db.execute(
      `INSERT INTO organizer_members (id, name, role, category, organization_id, department, bio, avatar_url, github_url, linkedin_url, display_order, is_published, crop_data, forum_designation, is_lead)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.role,
        body.category || 'turbo_bits',
        body.organizationId || null,
        body.department || null,
        body.bio || null,
        body.avatarUrl || null,
        githubUrl,
        linkedinUrl,
        body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
        body.isPublished !== undefined ? (body.isPublished ? 1 : 0) : 1,
        cropData,
        forumDesignation,
        isLead,
      ]
    );

    await logAudit(session!.user.id, session!.user.email, 'create_organizer_member', 'organizer_member', id);

    invalidatePublicCache('organizers');

    return NextResponse.json(
      { success: true, id },
      {
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err: unknown) {
    console.error('Failed to create organizer member:', err);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

// PUT /api/admin/organizers/members — Update existing member
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });
    }

    const githubUrl = body.githubUrl !== undefined
      ? ((body.githubUrl || '').trim() || null)
      : (body.github_url !== undefined ? ((body.github_url || '').trim() || null) : undefined);

    const linkedinUrl = body.linkedinUrl !== undefined
      ? ((body.linkedinUrl || '').trim() || null)
      : (body.linkedin_url !== undefined ? ((body.linkedin_url || '').trim() || null) : undefined);

    const forumDesignation = body.forumDesignation !== undefined
      ? ((body.forumDesignation || '').trim() || null)
      : (body.forum_designation !== undefined ? ((body.forum_designation || '').trim() || null) : undefined);

    const cropData = body.cropData !== undefined
      ? (body.cropData ? (typeof body.cropData === 'string' ? body.cropData : JSON.stringify(body.cropData)) : null)
      : (body.crop_data !== undefined ? (body.crop_data ? (typeof body.crop_data === 'string' ? body.crop_data : JSON.stringify(body.crop_data)) : null) : undefined);

    const isLead = body.isLead !== undefined
      ? (body.isLead ? 1 : 0)
      : (body.is_lead !== undefined ? (body.is_lead ? 1 : 0) : undefined);

    await db.execute(
      `UPDATE organizer_members SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        category = COALESCE(?, category),
        organization_id = ?,
        department = COALESCE(?, department),
        bio = COALESCE(?, bio),
        avatar_url = ?,
        github_url = COALESCE(?, github_url),
        linkedin_url = COALESCE(?, linkedin_url),
        display_order = COALESCE(?, display_order),
        is_published = COALESCE(?, is_published),
        crop_data = COALESCE(?, crop_data),
        forum_designation = COALESCE(?, forum_designation),
        is_lead = COALESCE(?, is_lead)
       WHERE id = ?`,
      [
        body.name ?? null,
        body.role ?? null,
        body.category ?? null,
        body.organizationId ?? null,
        body.department ?? null,
        body.bio ?? null,
        body.avatarUrl ?? null,
        githubUrl !== undefined ? githubUrl : null,
        linkedinUrl !== undefined ? linkedinUrl : null,
        body.displayOrder !== undefined ? Number(body.displayOrder) : null,
        body.isPublished !== undefined ? (body.isPublished ? 1 : 0) : null,
        cropData !== undefined ? cropData : null,
        forumDesignation !== undefined ? forumDesignation : null,
        isLead !== undefined ? isLead : null,
        body.id,
      ]
    );

    await logAudit(session!.user.id, session!.user.email, 'update_organizer_member', 'organizer_member', body.id);

    invalidatePublicCache('organizers');

    return NextResponse.json(
      { success: true },
      {
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err: unknown) {
    console.error('Failed to update organizer member:', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/admin/organizers/members — Delete member
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing member ID' }, { status: 400 });

    await db.execute('DELETE FROM organizer_members WHERE id = ?', [id]);
    await logAudit(session!.user.id, session!.user.email, 'delete_organizer_member', 'organizer_member', id);

    invalidatePublicCache('organizers');

    return NextResponse.json(
      { success: true },
      {
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err: unknown) {
    console.error('Failed to delete organizer member:', err);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
