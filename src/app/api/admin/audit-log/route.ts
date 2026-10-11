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

  const [countRow] = await db.query<{ total: number }>(`SELECT COUNT(*) as total FROM audit_log ${where}`, params);
  const total = countRow?.total || 0;

  const logs = await db.query<{
    id: string; admin_id: string; admin_email: string; action: string;
    entity_type: string; entity_id: string; details: string | null;
    ip_address: string | null; created_at: string;
  }>(
    `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
}
