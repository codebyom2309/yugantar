import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  listIssuedCertificates,
  issueCertificate,
  issueBatchCertificates,
} from '@/lib/certificateService';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

// GET /api/admin/studio/certificates - List issued certificates
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const competitionSlug = searchParams.get('competitionSlug') || undefined;
  const certificateType = searchParams.get('certificateType') || undefined;
  const statusParam = (searchParams.get('status') as 'active' | 'revoked') || undefined;
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  try {
    const certificates = await listIssuedCertificates({
      competitionSlug,
      certificateType,
      status: statusParam,
      limit,
    });
    return NextResponse.json({ certificates });
  } catch (err: any) {
    console.error('Failed to list issued certificates:', err);
    return NextResponse.json(
      { error: 'Failed to list issued certificates.', details: err.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/studio/certificates - Issue single or batch certificates
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const adminEmail = session?.user?.email || 'admin@yugantar2026.pce.ac.in';

    // Batch issuance mode
    if (Array.isArray(body.items)) {
      const {
        competitionSlug,
        certificateType = 'participation_cert',
        rankCitation,
        templateId,
        items,
      } = body;

      if (!competitionSlug) {
        return NextResponse.json(
          { error: 'competitionSlug is required for batch issuance.' },
          { status: 400 }
        );
      }

      const batchSummary = await issueBatchCertificates({
        competitionSlug,
        certificateType,
        rankCitation,
        templateId,
        issuedBy: adminEmail,
        items,
      });

      return NextResponse.json({
        success: true,
        summary: batchSummary,
      });
    }

    // Single issuance mode
    const {
      registrationId,
      recipientName,
      recipientEmail,
      recipientCollege,
      competitionSlug,
      certificateType = 'participation_cert',
      rankCitation,
      templateId,
    } = body;

    if (!recipientName || !competitionSlug) {
      return NextResponse.json(
        { error: 'recipientName and competitionSlug are required.' },
        { status: 400 }
      );
    }

    const issued = await issueCertificate({
      registrationId,
      recipientName,
      recipientEmail,
      recipientCollege,
      competitionSlug,
      certificateType,
      rankCitation,
      templateId,
      issuedBy: adminEmail,
    });

    return NextResponse.json({
      success: true,
      certificate: issued,
    });
  } catch (err: any) {
    console.error('Failed to issue certificate:', err);
    return NextResponse.json(
      { error: 'Failed to issue certificate.', details: err.message },
      { status: 500 }
    );
  }
}
