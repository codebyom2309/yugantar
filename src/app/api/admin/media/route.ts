import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { uploadMediaFile, formatDriveUrl } from '@/lib/storage';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

async function logAudit(adminId: string, adminEmail: string, action: string, entityType: string, entityId: string, details?: Record<string, unknown>) {
  try {
    await db.execute(
      'INSERT INTO audit_log (id, admin_id, admin_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), adminId, adminEmail, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch {}
}

// GET /api/admin/media — list media assets with search & role filter
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';

  try {
    let where = 'WHERE 1=1';
    const params: string[] = [];

    if (search) {
      where += ' AND (filename LIKE ? OR alt_text LIKE ? OR role LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    const assets = await db.query<Record<string, unknown>>(
      `SELECT * FROM media_assets ${where} ORDER BY created_at DESC`,
      params
    );

    return NextResponse.json(
      { assets: assets || [] },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Media fetch error:', err);
    return NextResponse.json({ error: 'Failed to load media assets' }, { status: 500 });
  }
}

// POST /api/admin/media — upload or register a new media asset
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const contentType = request.headers.get('content-type') || '';

  try {
    const id = randomUUID();

    // 1. Multipart form file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const role = (formData.get('role') as string) || 'artwork';
      const entityType = (formData.get('entityType') as string) || 'competition';
      const entityId = (formData.get('entityId') as string) || null;
      const altText = (formData.get('altText') as string) || '';

      if (!file) {
        return NextResponse.json({ error: 'No file supplied' }, { status: 400 });
      }

      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Invalid file format. Only image formats (JPEG, PNG, WebP, SVG) are supported for artwork.' },
          { status: 400 }
        );
      }

      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds 10MB limit (received ${(file.size / (1024 * 1024)).toFixed(1)}MB). Please compress before uploading.` },
          { status: 400 }
        );
      }

      // Upload via storage provider
      const uploadResult = await uploadMediaFile(file, {
        competitionSlug: entityId || 'general',
        role,
        altText,
      });

      await db.execute(
        `INSERT INTO media_assets (
          id, filename, url, public_id, storage_provider, storage_path,
          mime_type, size_bytes, alt_text, role, entity_type, entity_id, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          file.name,
          uploadResult.url,
          uploadResult.publicId || null,
          uploadResult.storageProvider,
          uploadResult.storagePath || null,
          uploadResult.mimeType,
          uploadResult.sizeBytes,
          altText || file.name,
          role,
          entityType,
          entityId,
          session!.user.id,
        ]
      );

      await logAudit(session!.user.id, session!.user.email, 'upload_media_asset', 'media', id, {
        filename: file.name,
        url: uploadResult.url,
        provider: uploadResult.storageProvider,
      });

      return NextResponse.json({
        success: true,
        asset: {
          id,
          filename: file.name,
          url: uploadResult.url,
          storage_provider: uploadResult.storageProvider,
          mime_type: uploadResult.mimeType,
          size_bytes: uploadResult.sizeBytes,
        },
      });
    }

    // 2. Direct JSON asset metadata registration
    const body = await request.json();
    if (!body.url || !body.filename) {
      return NextResponse.json({ error: 'url and filename are required' }, { status: 400 });
    }

    const finalUrl = formatDriveUrl(body.url);
    const isDrive = finalUrl.includes('googleusercontent.com') || body.url.includes('drive.google.com');
    const provider = body.storageProvider || (isDrive ? 'drive' : 'external');

    await db.execute(
      `INSERT INTO media_assets (
        id, filename, url, public_id, storage_provider, storage_path,
        mime_type, size_bytes, alt_text, role, entity_type, entity_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.filename,
        finalUrl,
        body.publicId || null,
        provider,
        body.storagePath || null,
        body.mimeType || 'image/webp',
        body.sizeBytes || null,
        body.altText || null,
        body.role || 'artwork',
        body.entityType || null,
        body.entityId || null,
        session!.user.id,
      ]
    );

    await logAudit(session!.user.id, session!.user.email, 'register_media_asset', 'media', id, {
      filename: body.filename,
      url: finalUrl,
      provider,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    console.error('Media upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Media upload failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media — delete media asset record
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });

    await db.execute('DELETE FROM media_assets WHERE id = ?', [id]);
    await logAudit(session!.user.id, session!.user.email, 'delete_media_asset', 'media', id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete media asset' }, { status: 500 });
  }
}
