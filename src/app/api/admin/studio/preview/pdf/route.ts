import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { renderTemplateToPdfBuffer } from '@/lib/studioPdfRenderer';
import { extractRegistrationTokenMap } from '@/lib/studioService';
import { getSampleTokenValues } from '@/lib/studioTokens';
import { PassTemplate } from '@/types/studio';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

// POST /api/admin/studio/preview/pdf - Generate live PDF from current template definition
export async function POST(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { template, competitionSlug, registrationId } = body as {
      template: PassTemplate;
      competitionSlug?: string;
      registrationId?: string;
    };

    if (!template || !template.elements) {
      return NextResponse.json({ error: 'Invalid template payload' }, { status: 400 });
    }

    let tokenMap: Record<string, string>;

    if (registrationId) {
      // Fetch real registration record
      const regRows = await db.query<any>(
        'SELECT * FROM registrations WHERE id = ? OR verification_token = ? LIMIT 1',
        [registrationId, registrationId]
      );
      if (regRows && regRows.length > 0) {
        tokenMap = extractRegistrationTokenMap(regRows[0]);
      } else {
        tokenMap = getSampleTokenValues(competitionSlug);
      }
    } else {
      // Sample token values for selected competition
      tokenMap = getSampleTokenValues(competitionSlug);
    }

    const pdfBuffer = await renderTemplateToPdfBuffer(template, tokenMap);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="yugantar-studio-preview.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error rendering preview PDF:', err);
    return NextResponse.json({ error: err.message || 'Failed to render PDF preview' }, { status: 500 });
  }
}
