import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/audit-log — Paginated audit log
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['super_admin', 'content_admin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;
  const entityType = searchParams.get('entityType') || '';
  const adminEmail = searchParams.get('adminEmail') || '';

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (entityType) { where += ' AND entity_type = ?'; params.push(entityType); }
  if (adminEmail) { where += ' AND admin_email = ?'; params.push(adminEmail); }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const [countRows, logs] = await Promise.all([
    db.query<{ total: number }>(`SELECT COUNT(*) as total FROM audit_log ${where}`, params),
    db.query<{
      id: string; admin_id: string; admin_email: string; action: string;
      entity_type: string; entity_id: string; details: string | null;
      ip_address: string | null; created_at: string;
    }>(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    ),
  ]);
  const total = countRows?.[0]?.total || 0;

  return NextResponse.json(
    { logs, total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    {
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    }
  );
}
