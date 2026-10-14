import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { getAllTemplates } from '@/lib/studioService';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

// GET /api/admin/studio/templates - List all templates
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const search = searchParams.get('search') || undefined;
  const isPublished = searchParams.has('isPublished')
    ? searchParams.get('isPublished') === 'true'
    : undefined;

  try {
    const templates = await getAllTemplates({ type, search, isPublished });
    return NextResponse.json({ templates });
  } catch (err) {
    console.error('Failed to list templates:', err);
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
  }
}

// POST /api/admin/studio/templates - Create new template or duplicate existing
export async function POST(request: NextRequest) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const {
      duplicateFromId,
      title,
      description,
      type,
      paper_size = 'A4',
      orientation = 'portrait',
      width_pt = 595.28,
      height_pt = 841.89,
      background_url = null,
      background_fit = 'cover',
      background_opacity = 1.0,
      elements = [],
      is_published = 1,
      is_global = 0,
    } = body;

    let newElements = elements;
    let templateTitle = title || 'Untitled Template';
    let templateType = type || 'registration_pass';
    let templatePaperSize = paper_size;
    let templateOrientation = orientation;
    let templateWidth = width_pt;
    let templateHeight = height_pt;
    let templateBgUrl = background_url;
    let templateBgFit = background_fit;
    let templateBgOpacity = background_opacity;

    // Handle duplication
    if (duplicateFromId) {
      const sourceRows = await db.query<any>('SELECT * FROM pass_templates WHERE id = ? LIMIT 1', [duplicateFromId]);
      if (sourceRows && sourceRows.length > 0) {
        const src = sourceRows[0];
        templateTitle = title || `${src.title} (Copy)`;
        templateType = src.type;
        templatePaperSize = src.paper_size;
        templateOrientation = src.orientation;
        templateWidth = Number(src.width_pt);
        templateHeight = Number(src.height_pt);
        templateBgUrl = src.background_url;
        templateBgFit = src.background_fit;
        templateBgOpacity = Number(src.background_opacity);
        newElements = typeof src.elements === 'string' ? JSON.parse(src.elements) : src.elements;
      }
    }

    const id = randomUUID();
    const adminName = session?.user?.name || session?.user?.email || 'Admin';

    await db.execute(
      `INSERT INTO pass_templates 
       (id, title, description, type, paper_size, orientation, width_pt, height_pt, background_url, background_fit, background_opacity, elements, is_published, is_global, version, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        templateTitle,
        description || null,
        templateType,
        templatePaperSize,
        templateOrientation,
        templateWidth,
        templateHeight,
        templateBgUrl,
        templateBgFit,
        templateBgOpacity,
        JSON.stringify(newElements),
        is_published ? 1 : 0,
        is_global ? 1 : 0,
        adminName,
      ]
    );

    return NextResponse.json({
      success: true,
      id,
      message: 'Template created successfully',
    });
  } catch (err: any) {
    console.error('Error creating template:', err);
    return NextResponse.json({ error: err.message || 'Failed to create template' }, { status: 500 });
  }
}
