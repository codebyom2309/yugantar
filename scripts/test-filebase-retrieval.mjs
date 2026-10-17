import fs from 'fs';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const getEnv = (k) => {
    const lines = envContent.split(/\r?\n/);
    for (const l of lines) {
      if (l.startsWith(k + '=')) {
        return l.slice(k.length + 1).replace(/^["']|["']$/g, '');
      }
    }
    return '';
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

  const bucket = getEnv('FILEBASE_BUCKET') || 'teleera';
  const key1 = 'yugantar/studio/1792177959652-tt2.png';
  const key2 = 'yugantar/studio/1792178931784-WhatsApp_Image_2026-10-17_at_00.57.36.jpeg';

  for (const key of [key1, key2]) {
    console.log('Testing Filebase retrieval for key:', key);
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const chunks = [];
      for await (const chunk of res.Body) chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      console.log('SUCCESS! Buffer size:', buf.length, 'bytes, contentType:', res.ContentType);
    } catch (err) {
      console.error('Filebase GetObject error:', err.message);
    }
  }
}
main().catch(console.error);
