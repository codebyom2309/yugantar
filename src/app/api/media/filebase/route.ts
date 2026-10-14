import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

function getS3Client(): S3Client {
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

function resolveCanonicalKey(rawKey: string): string {
  let key = rawKey.trim();
  // Decode if double-encoded or URI-encoded
  if (key.includes('%')) {
    try {
      key = decodeURIComponent(key);
    } catch {
      // Keep original on error
    }
  }
  return key;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawKey = searchParams.get('key');

  if (!rawKey) {
    return NextResponse.json({ error: 'Missing object key parameter' }, { status: 400 });
  }

  const key = resolveCanonicalKey(rawKey);

  try {
    const s3 = getS3Client();
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
    } else {
      headers.set('Content-Type', 'image/jpeg');
    }
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString());
    }
    if (response.ETag) {
      headers.set('ETag', response.ETag);
    }

    // Aggressive caching for media assets (1 year immutable)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Accept-Ranges', 'bytes');

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error('Filebase media delivery error for key:', key, err);
    return NextResponse.json(
      { error: 'Media asset not found or inaccessible', key },
      { status: 404 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawKey = searchParams.get('key');

  if (!rawKey) {
    return new NextResponse(null, { status: 400 });
  }

  const key = resolveCanonicalKey(rawKey);

  try {
    const s3 = getS3Client();
    const bucket = process.env.FILEBASE_BUCKET || 'teleera';
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3.send(command);

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
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(null, {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    return new NextResponse(null, { status: 404 });
  }
}

