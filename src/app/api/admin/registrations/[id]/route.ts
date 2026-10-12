import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/registrations/[id] — Get single registration detail
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const rows = await db.query<Record<string, unknown>>(
      'SELECT * FROM registrations WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const reg = rows[0];
    // Parse form_data JSON
    if (reg.form_data && typeof reg.form_data === 'string') {
      try { reg.form_data = JSON.parse(reg.form_data as string); } catch {}
    }

    return NextResponse.json(
      { registration: reg },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load registration' }, { status: 500 });
  }
}
