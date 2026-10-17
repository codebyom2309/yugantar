import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getDbConnection } from './db-helper.mjs';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (k) => {
    const l = envContent.split(/\r?\n/).find((x) => x.startsWith(k + '='));
    return l ? l.slice(k.length + 1).replace(/^["']|["']$/g, '') : '';
  };

  const s3 = new S3Client({
    endpoint: getEnv('FILEBASE_ENDPOINT') || 'https://s3.filebase.io',
    region: getEnv('FILEBASE_REGION') || 'auto',
    credentials: {
      accessKeyId: getEnv('FILEBASE_ACCESS_KEY'),
      secretAccessKey: getEnv('FILEBASE_SECRET_KEY'),
    },
    forcePathStyle: true,
  });

  const conn = await getDbConnection();
  const [templates] = await conn.query('SELECT id, title, background_url FROM pass_templates WHERE background_url IS NOT NULL');

  for (const t of templates) {
    if (!t.background_url || !t.background_url.includes('key=')) continue;
    const match = t.background_url.match(/key=([^&]+)/);
    if (!match) continue;
    const key = decodeURIComponent(match[1]);
    console.log(`Backfilling background for template: ${t.title} (${t.id}), key: ${key}`);

    try {
      const res = await s3.send(new GetObjectCommand({
        Bucket: getEnv('FILEBASE_BUCKET') || 'teleera',
        Key: key,
      }));
      const chunks = [];
      for await (const c of res.Body) chunks.push(c);
      const buf = Buffer.concat(chunks);
      const meta = await sharp(buf).metadata();
      const checksum = crypto.createHash('sha256').update(buf).digest('hex');

      await conn.query(
        `INSERT INTO studio_asset_fallbacks (id, template_id, asset_key, mime_type, size_bytes, width, height, checksum, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE data = VALUES(data), size_bytes = VALUES(size_bytes), updated_at = CURRENT_TIMESTAMP`,
        [
          crypto.randomUUID(),
          t.id,
          key,
          meta.format ? `image/${meta.format}` : (res.ContentType || 'image/png'),
          buf.length,
          meta.width || null,
          meta.height || null,
          checksum,
          buf,
        ]
      );
      console.log(`Saved ${buf.length} bytes into studio_asset_fallbacks for key: ${key}`);
    } catch (err) {
      console.warn(`Could not backfill for ${key}:`, err.message);
    }
  }

  const [count] = await conn.query('SELECT COUNT(*) as cnt FROM studio_asset_fallbacks');
  console.log('Total fallback assets in database:', count[0].cnt);
  await conn.end();
}

main().catch(console.error);
