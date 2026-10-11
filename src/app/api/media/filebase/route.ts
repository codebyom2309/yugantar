import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.FILEBASE_ENDPOINT || 'https://s3.filebase.io',
  region: process.env.FILEBASE_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY || '',
    secretAccessKey: process.env.FILEBASE_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
  }

  try {
    const bucket = process.env.FILEBASE_BUCKET || 'teleera';
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: 'Object body empty' }, { status: 404 });
    }

    // Convert AWS SDK stream to Web ReadableStream
    const stream = response.Body.transformToWebStream();

    const headers = new Headers();
    if (response.ContentType) {
      headers.set('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString());
    }
    if (response.ETag) {
      headers.set('ETag', response.ETag);
    }

    // Aggressive caching for media assets (1 year immutable)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error('Filebase media delivery error:', err);
    return NextResponse.json(
      { error: 'Media asset not found or inaccessible' },
      { status: 404 }
    );
  }
}
