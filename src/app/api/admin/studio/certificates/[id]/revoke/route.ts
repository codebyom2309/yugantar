import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revokeCertificate } from '@/lib/certificateService';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Revoked by administrator';
    const adminEmail = session?.user?.email || 'admin@teleera.turbobits.in';

    await revokeCertificate(id, reason, adminEmail);

    return NextResponse.json({ success: true, message: 'Certificate revoked successfully.' });
  } catch (err: any) {
    console.error('Failed to revoke certificate:', err);
    return NextResponse.json(
      { error: 'Failed to revoke certificate.', details: err.message },
      { status: 500 }
    );
  }
}
