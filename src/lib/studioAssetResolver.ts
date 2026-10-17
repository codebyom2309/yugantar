import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getFilebaseClient } from '@/lib/storage';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface ResolvedAsset {
  buffer: Buffer;
  mimeType: string;
  source: 'data-url' | 'filebase' | 'database-fallback' | 'local-filesystem' | 'remote-http';
}

// In-memory LRU-like cache for server runtime performance
const memoryAssetCache = new Map<string, { buffer: Buffer; mimeType: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Extracts canonical Filebase key from proxy URL, S3 URL, or direct key.
 */
export function extractFilebaseKey(urlOrKey: string): string | null {
  if (!urlOrKey) return null;
  const str = urlOrKey.trim();

  // 1. Direct query param proxy: /api/media/filebase?key=... or https://.../api/media/filebase?key=...
  if (str.includes('/api/media/filebase')) {
    const match = str.match(/key=([^&]+)/);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  // 2. Direct S3 key starting with yugantar/
  if (str.startsWith('yugantar/')) {
    return str;
  }

  // 3. filebase:// custom protocol
  if (str.startsWith('filebase://')) {
    return str.slice('filebase://'.length);
  }

  return null;
}

/**
 * Persists an asset binary into the database fallback table (Requirement 5).
 */
export async function saveAssetFallback(params: {
  templateId?: string;
  assetKey: string;
  buffer: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
}): Promise<void> {
  try {
    const checksum = crypto.createHash('sha256').update(params.buffer).digest('hex');
    const id = crypto.randomUUID();

    await db.query(
      `INSERT INTO studio_asset_fallbacks 
       (id, template_id, asset_key, mime_type, size_bytes, width, height, checksum, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         data = VALUES(data), 
         size_bytes = VALUES(size_bytes), 
         template_id = COALESCE(VALUES(template_id), template_id),
         updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        params.templateId || null,
        params.assetKey,
        params.mimeType,
        params.buffer.length,
        params.width || null,
        params.height || null,
        checksum,
        params.buffer,
      ]
    );
  } catch (err) {
    console.warn('Failed to save asset into studio_asset_fallbacks:', err);
  }
}

/**
 * Reliably resolves any studio image (background, logo, signature) into a Buffer.
 * Checks Memory Cache -> Data URL -> Filebase S3 -> DB Fallback -> Local Disk -> Remote HTTP.
 */
export async function resolveStudioAsset(
  urlOrPath: string,
  templateId?: string
): Promise<ResolvedAsset | null> {
  if (!urlOrPath || !urlOrPath.trim()) return null;
  const target = urlOrPath.trim();

  // Check memory cache
  const cached = memoryAssetCache.get(target);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { buffer: cached.buffer, mimeType: cached.mimeType, source: 'filebase' };
  }

  // 1. Base64 Data URL
  if (target.startsWith('data:image/')) {
    try {
      const parts = target.split(';base64,');
      if (parts.length === 2) {
        const mimeType = parts[0].replace('data:', '') || 'image/png';
        const buffer = Buffer.from(parts[1], 'base64');
        return { buffer, mimeType, source: 'data-url' };
      }
    } catch (e) {
      console.warn('Failed to parse base64 data URL:', e);
    }
  }

  // 2. Filebase Object Storage Resolution
  const filebaseKey = extractFilebaseKey(target);
  if (filebaseKey) {
    // 2a. Try Direct Filebase S3
    if (process.env.FILEBASE_ACCESS_KEY && process.env.FILEBASE_SECRET_KEY) {
      try {
        const s3 = getFilebaseClient();
        const bucket = process.env.FILEBASE_BUCKET || 'teleera';
        const cmd = new GetObjectCommand({
          Bucket: bucket,
          Key: filebaseKey,
        });
        const res = await s3.send(cmd);
        if (res.Body) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of res.Body as any) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          const mimeType = res.ContentType || (target.endsWith('.png') ? 'image/png' : 'image/jpeg');

          // Store in memory cache
          memoryAssetCache.set(target, { buffer, mimeType, timestamp: Date.now() });

          // Also asynchronously ensure fallback is cached in DB
          saveAssetFallback({
            templateId,
            assetKey: filebaseKey,
            buffer,
            mimeType,
          }).catch(() => {});

          return { buffer, mimeType, source: 'filebase' };
        }
      } catch (s3Err: any) {
        console.warn(`Filebase S3 GetObject failed for key [${filebaseKey}], checking database fallback:`, s3Err.message);
      }
    }

    // 2b. Database Fallback (studio_asset_fallbacks)
    try {
      const rows = await db.query<any>(
        'SELECT data, mime_type FROM studio_asset_fallbacks WHERE asset_key = ? OR template_id = ? LIMIT 1',
        [filebaseKey, templateId || '']
      );
      if (rows && rows.length > 0 && rows[0].data) {
        const buf = Buffer.isBuffer(rows[0].data) ? rows[0].data : Buffer.from(rows[0].data);
        const mimeType = rows[0].mime_type || 'image/png';
        memoryAssetCache.set(target, { buffer: buf, mimeType, timestamp: Date.now() });
        return { buffer: buf, mimeType, source: 'database-fallback' };
      }
    } catch (dbErr) {
      console.warn('Error querying studio_asset_fallbacks:', dbErr);
    }
  }

  // 3. Local Filesystem (public/ directory)
  if (target.startsWith('/') && !target.startsWith('/api/')) {
    try {
      const cleanPath = target.replace(/^\//, '');
      const localFilePath = path.join(process.cwd(), 'public', cleanPath);
      const buffer = await fs.readFile(localFilePath);
      const ext = path.extname(cleanPath).toLowerCase();
      const mimeType =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
          ? 'image/webp'
          : ext === '.svg'
          ? 'image/svg+xml'
          : 'image/jpeg';

      memoryAssetCache.set(target, { buffer, mimeType, timestamp: Date.now() });
      return { buffer, mimeType, source: 'local-filesystem' };
    } catch {
      // Not on local filesystem, continue
    }
  }

  // 4. Remote HTTP/HTTPS fetch
  if (target.startsWith('http://') || target.startsWith('https://')) {
    try {
      const res = await fetch(target, {
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mimeType = res.headers.get('content-type') || 'image/png';
        memoryAssetCache.set(target, { buffer, mimeType, timestamp: Date.now() });
        return { buffer, mimeType, source: 'remote-http' };
      }
    } catch (httpErr: any) {
      console.warn(`Remote fetch failed for [${target}]:`, httpErr.message);
    }
  }

  // 5. Final attempt from database fallback using templateId
  if (templateId) {
    try {
      const rows = await db.query<any>(
        'SELECT data, mime_type FROM studio_asset_fallbacks WHERE template_id = ? LIMIT 1',
        [templateId]
      );
      if (rows && rows.length > 0 && rows[0].data) {
        const buf = Buffer.isBuffer(rows[0].data) ? rows[0].data : Buffer.from(rows[0].data);
        const mimeType = rows[0].mime_type || 'image/png';
        return { buffer: buf, mimeType, source: 'database-fallback' };
      }
    } catch {}
  }

  return null;
}
