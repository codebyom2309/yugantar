import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

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

// GET /api/admin/competitions — List all competitions with live registration & coordinator counts
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const competitions = await db.query<Record<string, unknown>>(
      `SELECT c.*,
              COALESCE(r.reg_count, 0) as registration_count,
              COALESCE(coord.coord_count, 0) as coordinator_count
       FROM competitions c
       LEFT JOIN (
         SELECT competition_slug, COUNT(*) as reg_count
         FROM registrations
         GROUP BY competition_slug
       ) r ON c.slug = r.competition_slug
       LEFT JOIN (
         SELECT competition_slug, COUNT(*) as coord_count
         FROM competition_coordinators
         WHERE is_active = 1
         GROUP BY competition_slug
       ) coord ON c.slug = coord.competition_slug
       ORDER BY c.display_order ASC, c.created_at ASC`
    );

    return NextResponse.json({ competitions });
  } catch (err) {
    console.error('Competitions API error:', err);
    return NextResponse.json({ error: 'Failed to load competitions' }, { status: 500 });
  }
}

// POST /api/admin/competitions — Create new competition
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { name, category, venue, eligibility, teamSizeLimit, district } = body;

    if (!name) {
      return NextResponse.json({ error: 'Competition name is required.' }, { status: 400 });
    }

    // Generate slug
    const rawSlug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = rawSlug.trim();

    // Check slug uniqueness
    const existing = await db.query<{ id: string }>('SELECT id FROM competitions WHERE slug = ? LIMIT 1', [slug]);
    if (existing.length > 0) {
      return NextResponse.json({ error: `A competition with slug "${slug}" already exists.` }, { status: 409 });
    }

    const id = randomUUID();
    const isAccountA = ['Hardware & Circuits', 'Research & Ideas'].includes(category || '');

    await db.execute(
      `INSERT INTO competitions (
        id, slug, name, category, district, venue, eligibility, team_size_limit,
        max_team_members, is_published, registration_open, cloudinary_account,
        short_description, full_description, about, display_order, rules, schedule_flow,
        highlights, faqs, form_fields
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )`,
      [
        id,
        slug,
        name,
        category || 'Engineering Challenge',
        district || 'District A',
        venue || 'PCE Campus, Nagpur',
        eligibility || 'All Semesters',
        teamSizeLimit || 'Max 4 Members',
        parseInt(body.maxTeamMembers || '4', 10),
        0, // draft by default
        1, // registration open
        isAccountA ? 'A' : 'B',
        body.shortDescription || `Participate in ${name} at YUGANTAR 2026.`,
        body.fullDescription || `Comprehensive challenge details for ${name}.`,
        body.about || `${name} offers a competitive platform for engineering students.`,
        parseInt(body.displayOrder || '99', 10),
        JSON.stringify(body.rules || ['Standard festival rules apply.']),
        JSON.stringify(body.scheduleFlow || [{ time: '10:00 AM', activity: 'Reporting & Verification' }]),
        JSON.stringify(body.highlights || ['Certificate of Participation']),
        JSON.stringify([]),
        JSON.stringify([]),
      ]
    );

    await logAudit(
      session!.user.id,
      session!.user.email,
      'create_competition',
      'competition',
      id,
      { slug, name }
    );

    return NextResponse.json({ success: true, id, slug });
  } catch (err) {
    console.error('Create competition error:', err);
    return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
  }
}
