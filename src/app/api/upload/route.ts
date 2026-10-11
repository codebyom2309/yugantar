import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// POST /api/upload — Dual-Account Cloudinary Upload Handler
// ---------------------------------------------------------------------------
// Assignment:
// - Account A (nwlkjsp9): project-competition, ppt-presentation, breadboard-competition, ideathon
// - Account B (djczmdeog): mock-placement-drive, poster-competition, e-gaming, open-mic
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
];

const ACCOUNT_A_SLUGS = new Set([
  'project-competition',
  'ppt-presentation',
  'breadboard-competition',
  'ideathon',
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const competitionSlug = (formData.get('competitionSlug') as string) || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided for upload.' },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: JPEG, PNG, WebP, PDF.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 8MB limit. Please compress or select a smaller image.' },
        { status: 400 },
      );
    }

    // Determine deterministic Cloudinary Account assignment
    const isAccountA = ACCOUNT_A_SLUGS.has(competitionSlug);
    const assignedAccount = isAccountA ? 'A' : 'B';

    const cloudName = isAccountA
      ? process.env.CLOUDINARY_A_CLOUD_NAME
      : process.env.CLOUDINARY_B_CLOUD_NAME;

    const apiKey = isAccountA
      ? process.env.CLOUDINARY_A_API_KEY
      : process.env.CLOUDINARY_B_API_KEY;

    const apiSecret = isAccountA
      ? process.env.CLOUDINARY_A_API_SECRET
      : process.env.CLOUDINARY_B_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error: `Cloudinary Account ${assignedAccount} credentials are not configured on the server. Please paste a direct Google Drive link instead.`,
          requiresExternalLink: true,
        },
        { status: 503 },
      );
    }

    // Server-Side Signed Upload
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `yugantar-2026/${competitionSlug || 'general'}`;
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('signature', signature);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      },
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => null);
      console.error(`[Upload] Cloudinary Account ${assignedAccount} error:`, errorData);
      return NextResponse.json(
        {
          error:
            errorData?.error?.message ||
            `Upload failed on Cloudinary Account ${assignedAccount}. You may paste a Google Drive link instead.`,
        },
        { status: 502 },
      );
    }

    const cResult = await uploadResponse.json();

    return NextResponse.json({
      success: true,
      url: cResult.secure_url,
      publicId: cResult.public_id,
      account: assignedAccount,
      format: cResult.format,
      bytes: cResult.bytes,
    });
  } catch (err: any) {
    console.error('[Upload] Route exception:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error processing file upload.' },
      { status: 500 },
    );
  }
}
