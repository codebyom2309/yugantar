import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

// GET /api/admin/media — list media assets
export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const assets = await db.query<Record<string, unknown>>(
    'SELECT * FROM media_assets ORDER BY created_at DESC'
  );
  return NextResponse.json({ assets });
}

// POST /api/admin/media — track a new media asset
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const id = randomUUID();

  await db.execute(
    `INSERT INTO media_assets (id, filename, url, public_id, cloudinary_account, mime_type, size_bytes, alt_text, role, entity_type, entity_id, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, body.filename, body.url, body.publicId || null, body.cloudinaryAccount || null,
      body.mimeType || null, body.sizeBytes || null, body.altText || null,
      body.role || null, body.entityType || null, body.entityId || null, session!.user.id,
    ]
  );

  return NextResponse.json({ success: true, id });
}

// DELETE /api/admin/media — delete media asset record
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await request.json();
  await db.execute('DELETE FROM media_assets WHERE id = ?', [id]);

  return NextResponse.json({ success: true });
}
