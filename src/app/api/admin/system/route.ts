import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = performance.now();
  try {
    const [row] = await db.query<{ ping: number; count: number }>(
      'SELECT 1 as ping, (SELECT COUNT(*) FROM registrations) as count'
    );
    const latencyMs = Math.round(performance.now() - start);

    return NextResponse.json(
      {
        status: 'ok',
        latencyMs,
        registrationsCount: row?.count ?? 0,
        serverTime: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return NextResponse.json(
      {
        status: 'error',
        latencyMs,
        error: err instanceof Error ? err.message : 'Database ping failed',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
