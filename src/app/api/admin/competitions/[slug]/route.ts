import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { invalidatePublicCache } from '@/lib/cache-invalidation';

async function requireAdmin(allowedRoles?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return { error: 'Forbidden', status: 403, session: null };
  }
  return { error: null, status: 200, session };
}

async function logAudit(
  adminId: string,
  adminEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  try {
    await db.execute(
      'INSERT INTO audit_log (id, admin_id, admin_email, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), adminId, adminEmail, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

interface ContextProps {
  params: Promise<{ slug: string }>;
}

// GET /api/admin/competitions/[slug] — Get full competition details + coordinators
export async function GET(request: NextRequest, context: ContextProps) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { slug } = await context.params;

  try {
    const rows = await db.query<Record<string, unknown>>(
      'SELECT * FROM competitions WHERE slug = ? OR id = ? LIMIT 1',
      [slug, slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Competition not found.' }, { status: 404 });
    }

    const competition = rows[0];

    // Fetch coordinators and registration count in parallel
    const [coordinators, [regCount]] = await Promise.all([
      db.query(
        'SELECT * FROM competition_coordinators WHERE competition_slug = ? AND is_active = 1 ORDER BY display_order ASC, created_at ASC',
        [competition.slug as string]
      ),
      db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM registrations WHERE competition_slug = ?',
        [competition.slug as string]
      ),
    ]);

    return NextResponse.json(
      {
        competition,
        coordinators,
        registrationCount: regCount?.count || 0,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Get competition error:', err);
    return NextResponse.json({ error: 'Failed to load competition' }, { status: 500 });
  }
}

// PUT /api/admin/competitions/[slug] — Update complete competition workspace
export async function PUT(request: NextRequest, context: ContextProps) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { slug } = await context.params;

  try {
    const body = await request.json();

    const existingRows = await db.query<{ id: string; slug: string }>(
      'SELECT id, slug FROM competitions WHERE slug = ? OR id = ? LIMIT 1',
      [slug, slug]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Competition not found.' }, { status: 404 });
    }

    const current = existingRows[0];

    // Safe stringification helpers
    const serializeJson = (val: unknown, fallback: string = '[]') => {
      if (val === undefined || val === null) return fallback;
      if (typeof val === 'string') return val;
      return JSON.stringify(val);
    };

    // Strict UPI validation whenever upiId is modified/provided
    if (body.upiId !== undefined && body.upiId !== null && String(body.upiId).trim() !== '') {
      const upiId = String(body.upiId).trim();
      if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
        return NextResponse.json(
          { error: 'Invalid UPI ID format. Expected standard handle like username@bank (e.g. teleera@oksbi).' },
          { status: 400 }
        );
      }
    }

    const willBePaid = body.isPaid !== undefined ? Boolean(body.isPaid) : false;
    const willBePublished = body.isPublished !== undefined ? Boolean(body.isPublished) : false;
    if (willBePublished && willBePaid) {
      const fee = body.registrationFee ? String(body.registrationFee).trim() : '';
      const qrMode = body.qrMode || 'generate';
      const upiId = body.upiId ? String(body.upiId).trim() : '';
      const qrCodeUrl = body.qrCodeUrl ? String(body.qrCodeUrl).trim() : '';
      if (!fee || fee.toLowerCase() === 'free') {
        return NextResponse.json(
          { error: 'Cannot publish paid competition without a valid registration fee.' },
          { status: 400 }
        );
      }
      if (qrMode === 'upload' && !qrCodeUrl) {
        return NextResponse.json(
          { error: 'Cannot publish paid competition with QR Upload mode without uploading a QR image.' },
          { status: 400 }
        );
      }
      if (qrMode === 'generate' && !upiId) {
        return NextResponse.json(
          { error: 'Cannot publish paid competition with QR Generate mode without configuring a valid UPI ID.' },
          { status: 400 }
        );
      }
    }

    await db.execute(
      `UPDATE competitions SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        district = COALESCE(?, district),
        district_index = COALESCE(?, district_index),
        district_tagline = COALESCE(?, district_tagline),
        tag = COALESCE(?, tag),
        short_description = COALESCE(?, short_description),
        full_description = COALESCE(?, full_description),
        about = COALESCE(?, about),
        venue = COALESCE(?, venue),
        eligibility = COALESCE(?, eligibility),
        team_size_limit = COALESCE(?, team_size_limit),
        max_team_members = COALESCE(?, max_team_members),
        is_individual_only = COALESCE(?, is_individual_only),
        is_fixed_squad = COALESCE(?, is_fixed_squad),
        theme = COALESCE(?, theme),
        approved_domains = COALESCE(?, approved_domains),
        schedule_flow = COALESCE(?, schedule_flow),
        evaluation_matrix = COALESCE(?, evaluation_matrix),
        rounds_description = COALESCE(?, rounds_description),
        rules = COALESCE(?, rules),
        expectations = COALESCE(?, expectations),
        format_note = COALESCE(?, format_note),
        highlights = COALESCE(?, highlights),
        faqs = COALESCE(?, faqs),
        card_image = COALESCE(?, card_image),
        banner_image = COALESCE(?, banner_image),
        icon_name = COALESCE(?, icon_name),
        display_order = COALESCE(?, display_order),
        is_published = COALESCE(?, is_published),
        registration_open = COALESCE(?, registration_open),
        google_form_id = COALESCE(?, google_form_id),
        google_form_url = COALESCE(?, google_form_url),
        form_response_url = COALESCE(?, form_response_url),
        acknowledgment_entry_id = COALESCE(?, acknowledgment_entry_id),
        acknowledgment_label = COALESCE(?, acknowledgment_label),
        section_visibility = COALESCE(?, section_visibility),
        custom_sections = COALESCE(?, custom_sections),
        is_paid = COALESCE(?, is_paid),
        registration_fee = COALESCE(?, registration_fee),
        qr_mode = CASE WHEN ? = 1 THEN ? ELSE qr_mode END,
        payee_name = CASE WHEN ? = 1 THEN ? ELSE payee_name END,
        qr_code_url = CASE WHEN ? = 1 THEN ? ELSE qr_code_url END,
        upi_id = CASE WHEN ? = 1 THEN ? ELSE upi_id END,
        payment_url = CASE WHEN ? = 1 THEN ? ELSE payment_url END,
        payment_instructions = CASE WHEN ? = 1 THEN ? ELSE payment_instructions END,
        require_utr = COALESCE(?, require_utr),
        require_screenshot = COALESCE(?, require_screenshot),
        is_fee_fixed = COALESCE(?, is_fee_fixed),
        show_payment_qr = COALESCE(?, show_payment_qr),
        whatsapp_link = CASE WHEN ? = 1 THEN ? ELSE whatsapp_link END,
        confirmation_instructions = CASE WHEN ? = 1 THEN ? ELSE confirmation_instructions END,
        event_date = CASE WHEN ? = 1 THEN ? ELSE event_date END,
        venue_directions = CASE WHEN ? = 1 THEN ? ELSE venue_directions END,
        registration_deadline = CASE WHEN ? = 1 THEN ? ELSE registration_deadline END,
        registration_instructions = CASE WHEN ? = 1 THEN ? ELSE registration_instructions END,
        min_team_members = CASE WHEN ? = 1 THEN ? ELSE min_team_members END,
        pass_enabled = CASE WHEN ? = 1 THEN ? ELSE pass_enabled END,
        certificate_enabled = CASE WHEN ? = 1 THEN ? ELSE certificate_enabled END,
        allowed_semesters = CASE WHEN ? = 1 THEN ? ELSE allowed_semesters END,
        published_at = CASE WHEN ? = 1 THEN NOW() ELSE published_at END,
        published_by = CASE WHEN ? = 1 THEN ? ELSE published_by END
      WHERE id = ?`,
      [
        body.name ?? null,
        body.category ?? null,
        body.district ?? null,
        body.districtIndex !== undefined ? Number(body.districtIndex) : null,
        body.districtTagline ?? null,
        body.tag ?? null,
        body.shortDescription ?? null,
        body.fullDescription ?? null,
        body.about ?? null,
        body.venue ?? null,
        body.eligibility ?? null,
        body.teamSizeLimit ?? null,
        body.maxTeamMembers !== undefined ? Number(body.maxTeamMembers) : null,
        body.isIndividualOnly !== undefined ? (body.isIndividualOnly ? 1 : 0) : null,
        body.isFixedSquad !== undefined ? (body.isFixedSquad ? 1 : 0) : null,
        body.theme ?? null,
        body.approvedDomains ? serializeJson(body.approvedDomains) : null,
        body.scheduleFlow ? serializeJson(body.scheduleFlow) : null,
        body.evaluationMatrix ? serializeJson(body.evaluationMatrix, 'null') : null,
        body.roundsDescription ? serializeJson(body.roundsDescription) : null,
        body.rules ? serializeJson(body.rules) : null,
        body.expectations ? serializeJson(body.expectations) : null,
        body.formatNote ?? null,
        body.highlights ? serializeJson(body.highlights) : null,
        body.faqs ? serializeJson(body.faqs) : null,
        body.cardImage ?? null,
        body.bannerImage ?? null,
        body.iconName ?? null,
        body.displayOrder !== undefined ? Number(body.displayOrder) : null,
        body.isPublished !== undefined ? (body.isPublished ? 1 : 0) : null,
        body.registrationOpen !== undefined ? (body.registrationOpen ? 1 : 0) : null,
        body.googleFormId ?? null,
        body.googleFormUrl ?? null,
        body.formResponseUrl ?? null,
        body.acknowledgmentEntryId ?? null,
        body.acknowledgmentLabel ?? null,
        body.sectionVisibility ? serializeJson(body.sectionVisibility, '{}') : null,
        body.customSections ? serializeJson(body.customSections, '[]') : null,
        body.isPaid !== undefined ? (body.isPaid ? 1 : 0) : null,
        body.registrationFee ?? null,
        body.qrMode !== undefined ? 1 : 0,
        body.qrMode || 'generate',
        body.payeeName !== undefined ? 1 : 0,
        body.payeeName || 'TELE-ERA YUGANTAR 2026',
        body.qrCodeUrl !== undefined ? 1 : 0,
        body.qrCodeUrl || null,
        body.upiId !== undefined ? 1 : 0,
        body.upiId || null,
        body.paymentUrl !== undefined ? 1 : 0,
        body.paymentUrl || null,
        body.paymentInstructions !== undefined ? 1 : 0,
        body.paymentInstructions || null,
        body.requireUtr !== undefined ? (body.requireUtr ? 1 : 0) : null,
        body.requireScreenshot !== undefined ? (body.requireScreenshot ? 1 : 0) : null,
        body.isFeeFixed !== undefined ? (body.isFeeFixed ? 1 : 0) : null,
        body.showPaymentQr !== undefined ? (body.showPaymentQr ? 1 : 0) : null,
        body.whatsappLink !== undefined ? 1 : 0,
        body.whatsappLink || null,
        body.confirmationInstructions !== undefined ? 1 : 0,
        body.confirmationInstructions || null,
        body.eventDate !== undefined ? 1 : 0,
        body.eventDate || null,
        body.venueDirections !== undefined ? 1 : 0,
        body.venueDirections || null,
        body.registrationDeadline !== undefined ? 1 : 0,
        body.registrationDeadline || null,
        body.registrationInstructions !== undefined ? 1 : 0,
        body.registrationInstructions || null,
        body.minTeamMembers !== undefined ? 1 : 0,
        body.minTeamMembers !== undefined ? Number(body.minTeamMembers) : null,
        body.passEnabled !== undefined ? 1 : 0,
        body.passEnabled !== undefined ? (body.passEnabled ? 1 : 0) : 1,
        body.certificateEnabled !== undefined ? 1 : 0,
        body.certificateEnabled !== undefined ? (body.certificateEnabled ? 1 : 0) : 1,
        body.allowedSemesters !== undefined ? 1 : 0,
        body.allowedSemesters ? serializeJson(body.allowedSemesters) : null,
        body.isPublished ? 1 : 0,
        body.isPublished ? 1 : 0,
        session!.user.id,
        current.id,
      ]
    );

    // Invalidate Next.js cache so changes immediately propagate to public website
    invalidatePublicCache('competitions', current.slug);

    await logAudit(
      session!.user.id,
      session!.user.email,
      'update_competition',
      'competition',
      current.id,
      { slug: current.slug, changes: Object.keys(body) }
    );

    return NextResponse.json(
      { success: true, slug: current.slug },
      {
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err) {
    console.error('Update competition error:', err);
    return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
  }
}

// DELETE /api/admin/competitions/[slug] — Archive competition (unpublish without destroying registrations)
export async function DELETE(request: NextRequest, context: ContextProps) {
  const { error, status, session } = await requireAdmin(['super_admin']);
  if (error) return NextResponse.json({ error }, { status });

  const { slug } = await context.params;

  try {
    const existing = await db.query<{ id: string }>('SELECT id FROM competitions WHERE slug = ? OR id = ? LIMIT 1', [slug, slug]);
    if (existing.length === 0) return NextResponse.json({ error: 'Competition not found.' }, { status: 404 });

    // Soft-archive by unpublishing
    await db.execute('UPDATE competitions SET is_published = 0, registration_open = 0 WHERE id = ?', [existing[0].id]);

    invalidatePublicCache('competitions', slug);

    await logAudit(
      session!.user.id,
      session!.user.email,
      'archive_competition',
      'competition',
      existing[0].id,
      { slug }
    );

    return NextResponse.json(
      { success: true, archived: true },
      {
        headers: { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to archive competition' }, { status: 500 });
  }
}
