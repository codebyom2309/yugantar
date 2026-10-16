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

    // Read file buffer once so both Cloudinary and Filebase fallback can utilize it
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

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

    let cloudinarySuccess = false;
    let cResult: any = null;
    let cloudinaryErrMsg: string | null = null;

    // -------------------------------------------------------------------------
    // 1. Primary Attempt: Cloudinary Signed Upload
    // -------------------------------------------------------------------------
    const simulateFailure = request.headers.get('x-simulate-cloudinary-failure') === 'true';
    if (simulateFailure) {
      cloudinaryErrMsg = 'Simulated Cloudinary API timeout/failure for failover audit';
      console.warn(`[Upload] Simulated Cloudinary failure triggered via header. Activating Filebase fallback...`);
    } else if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = `yugantar-2026/${competitionSlug || 'general'}`;
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

        const cloudinaryFormData = new FormData();
        const blob = new Blob([fileBuffer], { type: file.type });
        cloudinaryFormData.append('file', blob, file.name);
        cloudinaryFormData.append('api_key', apiKey);
        cloudinaryFormData.append('timestamp', timestamp.toString());
        cloudinaryFormData.append('folder', folder);
        cloudinaryFormData.append('signature', signature);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s bounded timeout

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: 'POST',
            body: cloudinaryFormData,
            signal: controller.signal,
          },
        );
        clearTimeout(timeoutId);

        if (uploadResponse.ok) {
          cResult = await uploadResponse.json();
          cloudinarySuccess = true;
        } else {
          const errorData = await uploadResponse.json().catch(() => null);
          cloudinaryErrMsg = errorData?.error?.message || `HTTP ${uploadResponse.status} from Cloudinary`;
          console.warn(`[Upload] Cloudinary Account ${assignedAccount} upload failed (${cloudinaryErrMsg}). Activating Filebase fallback...`);
        }
      } catch (cErr: any) {
        cloudinaryErrMsg = cErr?.name === 'AbortError' ? 'Cloudinary upload timed out after 10s' : (cErr?.message || 'Network error');
        console.warn(`[Upload] Cloudinary failed with exception (${cloudinaryErrMsg}). Activating Filebase fallback...`);
      }
    } else {
      cloudinaryErrMsg = `Cloudinary Account ${assignedAccount} credentials not configured on server`;
      console.warn(`[Upload] ${cloudinaryErrMsg}. Activating Filebase fallback...`);
    }

    if (cloudinarySuccess && cResult) {
      return NextResponse.json({
        success: true,
        url: cResult.secure_url || cResult.url,
        publicId: cResult.public_id,
        storageProvider: 'cloudinary',
        account: assignedAccount,
        format: cResult.format,
        bytes: cResult.bytes || file.size,
        fallbackUsed: false,
      });
    }

    // -------------------------------------------------------------------------
    // 2. Fallback Attempt: Filebase S3 Object Storage
    // -------------------------------------------------------------------------
    console.log('[Upload] Attempting Filebase fallback storage for payment screenshot...');
    try {
      const { uploadToFilebase } = await import('@/lib/storage');
      const fbResult = await uploadToFilebase(fileBuffer, file.name, {
        folder: `payment-proofs/${competitionSlug || 'general'}`,
        mimeType: file.type,
      });

      console.log(`[Upload] Filebase fallback succeeded: key=${fbResult.publicId}`);
      return NextResponse.json({
        success: true,
        url: fbResult.url,
        publicId: fbResult.publicId,
        storageProvider: 'filebase',
        account: 'Filebase-S3-Vault',
        format: file.type.split('/')[1] || 'image',
        bytes: fbResult.sizeBytes,
        fallbackUsed: true,
        primaryFailureReason: cloudinaryErrMsg,
      });
    } catch (fbErr: any) {
      console.error('[Upload] Both Cloudinary and Filebase storage failed:', {
        cloudinaryError: cloudinaryErrMsg,
        filebaseError: fbErr?.message,
      });
      return NextResponse.json(
        {
          error: 'Upload failed: Both primary Cloudinary and fallback Filebase storage providers failed to store the payment screenshot. Please check your network and retry your upload.',
          primaryError: cloudinaryErrMsg,
          fallbackError: fbErr?.message || 'Filebase S3 failure',
        },
        { status: 502 },
      );
    }
  } catch (err: any) {
    console.error('[Upload] Route exception:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error processing file upload.' },
      { status: 500 },
    );
  }
}
