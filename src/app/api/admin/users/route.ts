import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

async function requireAdmin(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  if (allowedRoles && !allowedRoles.includes(session.user.role)) return { error: 'Forbidden', status: 403, session: null };
  return { error: null, status: 200, session };
}

async function logAudit(adminId: string, adminEmail: string, action: string, entityType: string, entityId: string, details?: Record<string, unknown>) {
  try {
    await db.execute('INSERT INTO audit_log (id, admin_id, admin_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), adminId, adminEmail, action, entityType, entityId, details ? JSON.stringify(details) : null]);
  } catch {}
}

// GET /api/admin/users
export async function GET() {
  const { error, status } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const users = await db.query<{
    id: string; email: string; name: string; role: string; auth_provider: string;
    is_enabled: number; avatar_url: string | null; last_login_at: string | null; created_at: string;
  }>('SELECT id, email, name, role, auth_provider, is_enabled, avatar_url, last_login_at, created_at FROM admin_users ORDER BY created_at ASC');

  return NextResponse.json({ users });
}

// POST /api/admin/users — Create user
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { email, name, role, password, authProvider } = await request.json();
  if (!email || !name || !role) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const existing = await db.query<{ id: string }>('SELECT id FROM admin_users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing.length > 0) return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });

  const id = randomUUID();
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 12);
  }

  await db.execute(
    'INSERT INTO admin_users (id, email, name, password_hash, role, auth_provider, is_enabled) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [id, email.toLowerCase().trim(), name, passwordHash, role, authProvider || (password ? 'credentials' : 'google')]
  );

  await logAudit(session!.user.id, session!.user.email, 'create_admin_user', 'admin_user', id, { email, role });
  return NextResponse.json({ success: true, id });
}

// PUT /api/admin/users — Update user
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { id, name, role, isEnabled, password } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

  // Prevent editing own role down
  if (id === session!.user.id && role && role !== 'super_admin') {
    return NextResponse.json({ error: 'Cannot demote your own account' }, { status: 400 });
  }

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (role) { updates.push('role = ?'); params.push(role); }
  if (typeof isEnabled === 'number' || typeof isEnabled === 'boolean') {
    updates.push('is_enabled = ?'); params.push(isEnabled ? 1 : 0);
  }
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    updates.push('password_hash = ?'); params.push(hash);
    updates.push("auth_provider = 'both'");
  }

  if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  params.push(id);
  await db.execute(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`, params);
  await logAudit(session!.user.id, session!.user.email, 'update_admin_user', 'admin_user', id, { role, isEnabled });

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users — Delete user
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await request.json();
  if (id === session!.user.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });

  await db.execute('DELETE FROM admin_users WHERE id = ?', [id]);
  await logAudit(session!.user.id, session!.user.email, 'delete_admin_user', 'admin_user', id);
  return NextResponse.json({ success: true });
}
