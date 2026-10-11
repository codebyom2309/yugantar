import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export interface StorageUploadResult {
  url: string;
  publicId?: string;
  storageProvider: 'filebase' | 'drive' | 'firebase' | 'cloudinary' | 'local';
  storagePath?: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Converts Google Drive sharing links into direct CDN embed links.
 * Works seamlessly with Next.js <Image> and standard <img> tags.
 * e.g. https://drive.google.com/file/d/1XyZ.../view?usp=sharing
 *   -> https://lh3.googleusercontent.com/d/1XyZ...
 */
export { formatDriveUrl, isDriveUrl } from './drive';

/**
 * Filebase S3 client singleton
 */
function getFilebaseClient(): S3Client {
  return new S3Client({
    endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
    region: process.env.FILEBASE_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
      secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
    },
    forcePathStyle: true,
  });
}

/**
 * Upload a local buffer/file to Filebase IPFS/S3 bucket
 */
export async function uploadToFilebase(
  buffer: Buffer | Uint8Array,
  filename: string,
  options?: {
    folder?: string;
    mimeType?: string;
  }
): Promise<StorageUploadResult> {
  const s3 = getFilebaseClient();
  const bucket = process.env.FILEBASE_BUCKET || 'teleera';
  const folder = options?.folder || 'general';
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `yugantar/${folder}/${Date.now()}-${cleanName}`;
  const mimeType = options?.mimeType || 'image/webp';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3.send(command);

  // Return local proxy URL for instant cached rendering
  const url = `/api/media/filebase?key=${encodeURIComponent(key)}`;

  return {
    url,
    publicId: key,
    storageProvider: 'filebase',
    storagePath: key,
    sizeBytes: buffer.byteLength,
    mimeType,
  };
}

/**
 * Primary media upload handler.
 * Priority:
 * 1. Filebase Object Storage (configured in .env.local)
 * 2. Cloudinary fallback (if Filebase not available)
 */
export async function uploadMediaFile(
  file: File,
  options?: {
    competitionSlug?: string;
    role?: string;
    altText?: string;
  }
): Promise<StorageUploadResult> {
  const mimeType = file.type || 'image/webp';
  const folder = options?.competitionSlug || 'general';

  // 1. Primary: Upload to Filebase
  if (process.env.FILEBASE_ACCESS_KEY && process.env.FILEBASE_SECRET_KEY) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return await uploadToFilebase(buffer, file.name, {
        folder,
        mimeType,
      });
    } catch (fbErr) {
      console.error('Filebase upload failed, falling back:', fbErr);
    }
  }

  // 2. Secondary: Cloudinary Signed Upload
  const isAccountA = ['project-competition', 'ppt-presentation', 'breadboard-competition', 'ideathon'].includes(folder);
  const cloudName = isAccountA ? process.env.CLOUDINARY_A_CLOUD_NAME : process.env.CLOUDINARY_B_CLOUD_NAME;
  const apiKey = isAccountA ? process.env.CLOUDINARY_A_API_KEY : process.env.CLOUDINARY_B_API_KEY;
  const apiSecret = isAccountA ? process.env.CLOUDINARY_A_API_SECRET : process.env.CLOUDINARY_B_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const cFolder = `yugantar-2026/${folder}`;
    const crypto = await import('crypto');
    const stringToSign = `folder=${cFolder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', cFolder);
    formData.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url: data.secure_url || data.url,
        publicId: data.public_id,
        storageProvider: 'cloudinary',
        storagePath: cFolder,
        sizeBytes: data.bytes || file.size,
        mimeType: data.format ? `image/${data.format}` : mimeType,
      };
    }
  }

  throw new Error('No active storage provider successfully handled the upload.');
}
