import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadMediaFile } from '@/lib/storage';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

// Allowed MIME types for studio background and logo elements
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export async function POST(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const role = (formData.get('role') as string) || 'studio_background';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed formats: PNG, JPEG, WebP, SVG.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum permitted limit of 10MB.' },
        { status: 400 }
      );
    }

    // Try primary project storage handler (Filebase S3 / Cloudinary)
    try {
      const storageResult = await uploadMediaFile(file, {
        competitionSlug: 'studio',
        role,
        altText: file.name,
      });

      return NextResponse.json({
        success: true,
        url: storageResult.url,
        mimeType: storageResult.mimeType,
        sizeBytes: storageResult.sizeBytes,
        storageProvider: storageResult.storageProvider,
      });
    } catch (storageErr) {
      console.warn('Remote storage upload failed, saving to public uploads directory:', storageErr);

      // Local public fallback so administrators can test locally without cloud credentials
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || (file.type === 'image/png' ? '.png' : '.webp');
      const filename = `studio-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'studio');

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);

      const localUrl = `/uploads/studio/${filename}`;

      return NextResponse.json({
        success: true,
        url: localUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        storageProvider: 'local',
      });
    }
  } catch (err: any) {
    console.error('Studio upload error:', err);
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 500 });
  }
}
