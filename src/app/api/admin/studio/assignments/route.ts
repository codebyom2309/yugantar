import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { getAllAssignments } from '@/lib/studioService';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401, session: null };
  return { error: null, status: 200, session };
}

// GET /api/admin/studio/assignments - List all competition template assignments
export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const assignments = await getAllAssignments();
    return NextResponse.json({ assignments });
  } catch (err) {
    console.error('Error fetching assignments:', err);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

// PUT /api/admin/studio/assignments - Set or remove assignment
export async function PUT(request: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { competition_slug, document_type, template_id, action = 'assign' } = body;

    if (!competition_slug || !document_type) {
      return NextResponse.json(
        { error: 'competition_slug and document_type are required' },
        { status: 400 }
      );
    }

    if (action === 'remove') {
      // Remove specific assignment (falls back to global)
      await db.execute(
        'DELETE FROM competition_template_assignments WHERE competition_slug = ? AND document_type = ?',
        [competition_slug, document_type]
      );
      return NextResponse.json({
        success: true,
        message: `Reset ${competition_slug} to global template for ${document_type}`,
      });
    }

    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
    }

    // Check template exists
    const tRows = await db.query<any>('SELECT id FROM pass_templates WHERE id = ? LIMIT 1', [template_id]);
    if (!tRows || tRows.length === 0) {
      return NextResponse.json({ error: 'Referenced template not found' }, { status: 404 });
    }

    const id = randomUUID();
    await db.execute(
      `INSERT INTO competition_template_assignments (id, competition_slug, document_type, template_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE template_id = VALUES(template_id), updated_at = CURRENT_TIMESTAMP`,
      [id, competition_slug, document_type, template_id]
    );

    return NextResponse.json({
      success: true,
      message: `Assigned template to ${competition_slug} for ${document_type}`,
    });
  } catch (err: any) {
    console.error('Error updating assignment:', err);
    return NextResponse.json({ error: err.message || 'Failed to update assignment' }, { status: 500 });
  }
}
