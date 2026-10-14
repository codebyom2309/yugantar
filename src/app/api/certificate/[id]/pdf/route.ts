import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCertificateByCodeOrId } from '@/lib/certificateService';
import { resolveActiveTemplate, getTemplateById } from '@/lib/studioService';
import { renderTemplateToPdfBuffer } from '@/lib/studioPdfRenderer';
import { COMPETITIONS } from '@/data/events';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);

    // 1. Fetch certificate record from issued_certificates
    const cert = await getCertificateByCodeOrId(id);
    if (!cert) {
      return NextResponse.json(
        { error: 'Certificate record not found.' },
        { status: 404 }
      );
    }

    // 2. Fetch competition metadata
    const staticComp = COMPETITIONS.find((c) => c.slug === cert.competition_slug);
    let compName = staticComp?.name || cert.competition_slug.replace(/-/g, ' ').toUpperCase();
    let compCategory = staticComp?.category || 'Technical Arena';
    let compVenue = staticComp?.venue || 'PCE Campus, Nagpur';
    let compDate = '19 October 2026';

    try {
      const compRows = await db.query<{
        name: string;
        category: string;
        venue: string;
        event_date: string;
      }>(
        'SELECT name, category, venue, event_date FROM competitions WHERE slug = ? LIMIT 1',
        [cert.competition_slug]
      );
      if (compRows.length > 0) {
        if (compRows[0].name) compName = compRows[0].name;
        if (compRows[0].category) compCategory = compRows[0].category;
        if (compRows[0].venue) compVenue = compRows[0].venue;
        if (compRows[0].event_date) compDate = compRows[0].event_date;
      }
    } catch {}

    // 3. Resolve template: preserve assigned template version or resolve active
    let template = null;
    if (cert.template_id) {
      template = await getTemplateById(cert.template_id);
    }
    if (!template) {
      template = await resolveActiveTemplate(cert.competition_slug, 'participation_cert');
    }
    if (!template) {
      template = await getTemplateById('global-participation-cert-default');
    }

    if (!template || !template.elements || template.elements.length === 0) {
      return NextResponse.json(
        { error: 'No certificate template found to render this certificate.' },
        { status: 500 }
      );
    }

    // 4. Format issue date
    const formattedIssueDate = cert.issued_at
      ? new Date(cert.issued_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '19 October 2026';

    // 5. Build dynamic token dictionary for certificate
    const tokenMap: Record<string, string> = {
      '{{certificate.id}}': cert.certificate_code,
      '{{certificate.recipient}}': cert.recipient_name,
      '{{certificate.rank}}': cert.rank_citation,
      '{{certificate.issueDate}}': formattedIssueDate,
      '{{certificate.issuer}}': 'Tele-Era Student Forum & Dept. of ETC',
      '{{participant.name}}': cert.recipient_name,
      '{{participant.college}}': cert.recipient_college || 'Priyadarshini College of Engineering, Nagpur',
      '{{participant.email}}': cert.recipient_email || '',
      '{{participant.phone}}': '',
      '{{participant.branch}}': 'Engineering',
      '{{participant.semester}}': '',
      '{{competition.name}}': compName,
      '{{competition.category}}': compCategory,
      '{{competition.venue}}': compVenue,
      '{{competition.date}}': compDate,
      '{{registration.id}}': cert.registration_id
        ? `YUG-26-${cert.registration_id.slice(0, 8).toUpperCase()}`
        : cert.certificate_code,
      '{{team.name}}': cert.recipient_name,
      '{{team.size}}': '1',
      '{{team.membersList}}': cert.recipient_name,
      '{{payment.status}}': 'Verified',
    };

    // 6. Render high-fidelity vector PDF
    const pdfBytes = await renderTemplateToPdfBuffer(template, tokenMap, {
      certToken: cert.certificate_code,
      passToken: cert.certificate_code,
    });

    const isInline = url.searchParams.get('inline') === '1';
    const filename = `YUGANTAR-2026-CERTIFICATE-${cert.certificate_code}.pdf`;
    const disposition = isInline
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Certificate PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate certificate PDF.', details: err.message },
      { status: 500 }
    );
  }
}
