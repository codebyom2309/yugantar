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

function isValidSpreadsheetUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== 'https:') return false;
    // Allow Google Sheets, Airtable, Microsoft Excel/Office, or generic secure spreadsheet links
    const hostname = parsed.hostname.toLowerCase();
    const isGoogle = hostname.endsWith('google.com') || hostname === 'docs.google.com';
    const isMicrosoft = hostname.endsWith('sharepoint.com') || hostname.endsWith('office.com') || hostname.endsWith('live.com');
    const isAirtable = hostname.endsWith('airtable.com');
    return isGoogle || isMicrosoft || isAirtable || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface SpreadsheetRecord {
  id: string;
  display_name: string;
  competition_slug: string | null;
  spreadsheet_url: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/spreadsheets — List all saved spreadsheet links
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const competition = searchParams.get('competition') || '';
  const search = searchParams.get('search') || '';

  try {
    let where = 'WHERE 1=1';
    const params: string[] = [];

    if (competition) {
      where += ' AND competition_slug = ?';
      params.push(competition);
    }

    if (search) {
      where += ' AND (display_name LIKE ? OR description LIKE ? OR spreadsheet_url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const spreadsheets = await db.query<SpreadsheetRecord>(
      `SELECT id, display_name, competition_slug, spreadsheet_url, description, category, created_at, updated_at
       FROM registration_spreadsheets
       ${where}
       ORDER BY created_at ASC`,
      params
    );

    return NextResponse.json(
      { spreadsheets },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Get spreadsheets error:', err);
    return NextResponse.json({ error: 'Failed to fetch spreadsheet links' }, { status: 500 });
  }
}

// POST /api/admin/spreadsheets — Add a new spreadsheet link
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin', 'registration_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { displayName, competitionSlug, spreadsheetUrl, description, category } = body;

    if (!displayName?.trim()) {
      return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
    }

    if (!spreadsheetUrl?.trim()) {
      return NextResponse.json({ error: 'Spreadsheet URL is required.' }, { status: 400 });
    }

    if (!isValidSpreadsheetUrl(spreadsheetUrl)) {
      return NextResponse.json(
        { error: 'Please enter a valid secure HTTPS spreadsheet URL (e.g., https://docs.google.com/spreadsheets/d/...).' },
        { status: 422 }
      );
    }

    const id = randomUUID();
    const cleanUrl = spreadsheetUrl.trim();
    const cleanName = displayName.trim();
    const cleanSlug = competitionSlug?.trim() || null;
    const cleanDesc = description?.trim() || null;
    const cleanCat = category?.trim() || 'Main Responses';

    await db.execute(
      `INSERT INTO registration_spreadsheets (id, display_name, competition_slug, spreadsheet_url, description, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, cleanName, cleanSlug, cleanUrl, cleanDesc, cleanCat]
    );

    await logAudit(
      session!.user.id,
      session!.user.email,
      'create_spreadsheet_link',
      'spreadsheet_link',
      id,
      { displayName: cleanName, competitionSlug: cleanSlug, spreadsheetUrl: cleanUrl }
    );

    return NextResponse.json(
      {
        success: true,
        spreadsheet: {
          id,
          display_name: cleanName,
          competition_slug: cleanSlug,
          spreadsheet_url: cleanUrl,
          description: cleanDesc,
          category: cleanCat,
        },
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Create spreadsheet error:', err);
    return NextResponse.json({ error: 'Failed to save spreadsheet link' }, { status: 500 });
  }
}

// PUT /api/admin/spreadsheets — Update a spreadsheet link
export async function PUT(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin', 'registration_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { id, displayName, competitionSlug, spreadsheetUrl, description, category } = body;

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Spreadsheet ID is required.' }, { status: 400 });
    }

    if (!displayName?.trim()) {
      return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
    }

    if (!spreadsheetUrl?.trim()) {
      return NextResponse.json({ error: 'Spreadsheet URL is required.' }, { status: 400 });
    }

    if (!isValidSpreadsheetUrl(spreadsheetUrl)) {
      return NextResponse.json(
        { error: 'Please enter a valid secure HTTPS spreadsheet URL.' },
        { status: 422 }
      );
    }

    const cleanUrl = spreadsheetUrl.trim();
    const cleanName = displayName.trim();
    const cleanSlug = competitionSlug?.trim() || null;
    const cleanDesc = description?.trim() || null;
    const cleanCat = category?.trim() || 'Main Responses';

    await db.execute(
      `UPDATE registration_spreadsheets
       SET display_name = ?, competition_slug = ?, spreadsheet_url = ?, description = ?, category = ?
       WHERE id = ?`,
      [cleanName, cleanSlug, cleanUrl, cleanDesc, cleanCat, id]
    );

    await logAudit(
      session!.user.id,
      session!.user.email,
      'update_spreadsheet_link',
      'spreadsheet_link',
      id,
      { displayName: cleanName, competitionSlug: cleanSlug, spreadsheetUrl: cleanUrl }
    );

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Update spreadsheet error:', err);
    return NextResponse.json({ error: 'Failed to update spreadsheet link' }, { status: 500 });
  }
}

// DELETE /api/admin/spreadsheets — Delete a spreadsheet link
export async function DELETE(request: NextRequest) {
  const { error, status, session } = await requireAdmin(['super_admin', 'content_admin']);
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Spreadsheet ID is required.' }, { status: 400 });
    }

    await db.execute('DELETE FROM registration_spreadsheets WHERE id = ?', [id]);

    await logAudit(
      session!.user.id,
      session!.user.email,
      'delete_spreadsheet_link',
      'spreadsheet_link',
      id
    );

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('Delete spreadsheet error:', err);
    return NextResponse.json({ error: 'Failed to delete spreadsheet link' }, { status: 500 });
  }
}
