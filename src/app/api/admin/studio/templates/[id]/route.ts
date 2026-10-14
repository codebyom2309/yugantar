import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTemplateById } from '@/lib/studioService';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

// GET /api/admin/studio/templates/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await context.params;

  try {
    const template = await getTemplateById(id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({ template });
  } catch (err) {
    console.error('Error fetching template:', err);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/admin/studio/templates/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, status, session } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await context.params;

  try {
    const body = await request.json();
    const existing = await getTemplateById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const title = body.title !== undefined ? body.title : existing.title;
    const description = body.description !== undefined ? body.description : existing.description;
    const type = body.type !== undefined ? body.type : existing.type;
    const paper_size = body.paper_size !== undefined ? body.paper_size : existing.paper_size;
    const orientation = body.orientation !== undefined ? body.orientation : existing.orientation;
    const width_pt = body.width_pt !== undefined ? Number(body.width_pt) : existing.width_pt;
    const height_pt = body.height_pt !== undefined ? Number(body.height_pt) : existing.height_pt;
    const background_url = body.background_url !== undefined ? body.background_url : existing.background_url;
    const background_fit = body.background_fit !== undefined ? body.background_fit : existing.background_fit;
    const background_opacity = body.background_opacity !== undefined ? Number(body.background_opacity) : existing.background_opacity;
    const elements = body.elements !== undefined ? body.elements : existing.elements;
    const is_published = body.is_published !== undefined ? (body.is_published ? 1 : 0) : existing.is_published ? 1 : 0;
    const is_global = body.is_global !== undefined ? (body.is_global ? 1 : 0) : existing.is_global ? 1 : 0;
    const nextVersion = (existing.version || 1) + 1;
    const adminName = session?.user?.name || session?.user?.email || 'Admin';

    await db.execute(
      `UPDATE pass_templates 
       SET title = ?, description = ?, type = ?, paper_size = ?, orientation = ?, 
           width_pt = ?, height_pt = ?, background_url = ?, background_fit = ?, 
           background_opacity = ?, elements = ?, is_published = ?, is_global = ?, 
           version = ?, updated_by = ?
       WHERE id = ?`,
      [
        title,
        description,
        type,
        paper_size,
        orientation,
        width_pt,
        height_pt,
        background_url,
        background_fit,
        background_opacity,
        JSON.stringify(elements),
        is_published,
        is_global,
        nextVersion,
        adminName,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      version: nextVersion,
      message: 'Template updated successfully',
    });
  } catch (err: any) {
    console.error('Error updating template:', err);
    return NextResponse.json({ error: err.message || 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/admin/studio/templates/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  const { id } = await context.params;

  try {
    const existing = await getTemplateById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Do not allow deleting seeded global defaults if they are the only ones
    if (id === 'global-registration-pass-default' || id === 'global-participation-cert-default') {
      return NextResponse.json(
        { error: 'System default templates cannot be deleted, but you can unpublish or modify them.' },
        { status: 400 }
      );
    }

    // Remove any assignment pointing to this template
    await db.execute('DELETE FROM competition_template_assignments WHERE template_id = ?', [id]);
    await db.execute('DELETE FROM pass_templates WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting template:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete template' }, { status: 500 });
  }
}
