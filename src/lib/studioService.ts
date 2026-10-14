import { db } from '@/lib/db';
import { PassTemplate, DocumentType, CompetitionAssignment } from '@/types/studio';
import { COMPETITIONS } from '@/data/events';
import { getSampleTokenValues } from '@/lib/studioTokens';

export async function getAllTemplates(options?: {
  type?: string;
  isPublished?: boolean;
  search?: string;
}): Promise<PassTemplate[]> {
  try {
    let query = 'SELECT * FROM pass_templates WHERE 1=1';
    const params: (string | number)[] = [];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }
    if (options?.isPublished !== undefined) {
      query += ' AND is_published = ?';
      params.push(options.isPublished ? 1 : 0);
    }
    if (options?.search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    query += ' ORDER BY is_global DESC, updated_at DESC';

    const rows = await db.query<any>(query, params);
    return rows.map((r) => ({
      ...r,
      width_pt: Number(r.width_pt),
      height_pt: Number(r.height_pt),
      background_opacity: Number(r.background_opacity),
      is_published: Boolean(r.is_published),
      is_global: Boolean(r.is_global),
      elements: typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements || [],
    }));
  } catch (err) {
    console.error('Error fetching pass templates:', err);
    return [];
  }
}

export async function getTemplateById(id: string): Promise<PassTemplate | null> {
  try {
    const rows = await db.query<any>('SELECT * FROM pass_templates WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r,
      width_pt: Number(r.width_pt),
      height_pt: Number(r.height_pt),
      background_opacity: Number(r.background_opacity),
      is_published: Boolean(r.is_published),
      is_global: Boolean(r.is_global),
      elements: typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements || [],
    };
  } catch (err) {
    console.error('Error fetching template by id:', err);
    return null;
  }
}

export async function getAllAssignments(): Promise<CompetitionAssignment[]> {
  try {
    const rows = await db.query<any>(
      `SELECT a.*, t.title as template_title 
       FROM competition_template_assignments a
       LEFT JOIN pass_templates t ON a.template_id = t.id
       ORDER BY a.competition_slug, a.document_type`
    );
    return rows || [];
  } catch (err) {
    console.error('Error fetching competition assignments:', err);
    return [];
  }
}

/**
 * Resolves the active template for a given competition and document type
 * Following strict resolution order:
 * 1. Competition-specific active template
 * 2. Global active template for document type
 * 3. Seeded global fallback
 */
export async function resolveActiveTemplate(
  competitionSlug: string,
  documentType: DocumentType
): Promise<PassTemplate | null> {
  try {
    // 1. Check competition-specific assignment
    if (competitionSlug && competitionSlug !== '__global__') {
      const compAssign = await db.query<any>(
        `SELECT a.template_id, t.* 
         FROM competition_template_assignments a
         JOIN pass_templates t ON a.template_id = t.id
         WHERE a.competition_slug = ? AND a.document_type = ? AND t.is_published = 1
         LIMIT 1`,
        [competitionSlug, documentType]
      );
      if (compAssign && compAssign.length > 0) {
        const r = compAssign[0];
        return {
          ...r,
          width_pt: Number(r.width_pt),
          height_pt: Number(r.height_pt),
          background_opacity: Number(r.background_opacity),
          is_published: Boolean(r.is_published),
          is_global: Boolean(r.is_global),
          elements: typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements || [],
        };
      }
    }

    // 2. Check global assignment
    const globalAssign = await db.query<any>(
      `SELECT a.template_id, t.* 
       FROM competition_template_assignments a
       JOIN pass_templates t ON a.template_id = t.id
       WHERE a.competition_slug = '__global__' AND a.document_type = ? AND t.is_published = 1
       LIMIT 1`,
      [documentType]
    );
    if (globalAssign && globalAssign.length > 0) {
      const r = globalAssign[0];
      return {
        ...r,
        width_pt: Number(r.width_pt),
        height_pt: Number(r.height_pt),
        background_opacity: Number(r.background_opacity),
        is_published: Boolean(r.is_published),
        is_global: Boolean(r.is_global),
        elements: typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements || [],
      };
    }

    // 3. Fallback: Any published template matching the type
    const fallback = await db.query<any>(
      `SELECT * FROM pass_templates WHERE type = ? AND is_published = 1 ORDER BY is_global DESC LIMIT 1`,
      [documentType]
    );
    if (fallback && fallback.length > 0) {
      const r = fallback[0];
      return {
        ...r,
        width_pt: Number(r.width_pt),
        height_pt: Number(r.height_pt),
        background_opacity: Number(r.background_opacity),
        is_published: Boolean(r.is_published),
        is_global: Boolean(r.is_global),
        elements: typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements || [],
      };
    }

    return null;
  } catch (err) {
    console.error('Error resolving active template:', err);
    return null;
  }
}

/**
 * Extracts real registration row fields into the Data Token dictionary.
 */
export function extractRegistrationTokenMap(
  reg: any,
  compOverride?: any,
  teamMembersOverride?: { name: string; college?: string; branch?: string; semester?: string }[]
): Record<string, string> {
  const baseMap = getSampleTokenValues(reg.competition_slug);
  const comp =
    compOverride ||
    COMPETITIONS.find((c) => c.slug === reg.competition_slug) ||
    COMPETITIONS[0];

  let parsedFormData: Record<string, any> = {};
  if (reg.form_data) {
    try {
      parsedFormData =
        typeof reg.form_data === 'string' ? JSON.parse(reg.form_data) : reg.form_data;
    } catch {}
  }

  // Parse team members (prefer teamMembersOverride from decrypted stateless token, then form_data)
  const memberNames: string[] = [reg.leader_name || 'Leader'];
  if (teamMembersOverride && teamMembersOverride.length > 0) {
    for (const m of teamMembersOverride) {
      if (m?.name) memberNames.push(m.name);
    }
  } else {
    const count = Number(reg.team_size) || 1;
    for (let i = 2; i <= count; i++) {
      const m = parsedFormData[`member${i}Name`] || parsedFormData[`squadMember${i}Name`];
      if (m) memberNames.push(m);
    }
  }

  const teamRoster =
    memberNames.length > 1
      ? `${reg.leader_name} (Lead), ` + memberNames.slice(1).join(', ')
      : `${reg.leader_name} (Solo Participant)`;

  const regDate = reg.created_at
    ? new Date(reg.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '19 Oct 2026';

  const isFree = reg.payment_status === 'free';
  const isVerifiedPayment =
    reg.payment_status === 'verified' ||
    reg.payment_status === 'confirmed' ||
    reg.payment_status === 'settled';

  const displayPaymentStatus = isFree
    ? 'Free Entry (Confirmed)'
    : isVerifiedPayment
    ? 'Verified & Approved'
    : 'Payment Under Audit';

  return {
    ...baseMap,
    '{{registration.id}}': `YUG-${(reg.competition_slug || 'EVT').slice(0, 4).toUpperCase()}-${(reg.id || '0000').slice(0, 6).toUpperCase()}`,
    '{{registration.date}}': regDate,
    '{{registration.submissionStatus}}': reg.submission_status || 'Confirmed',
    '{{registration.verifyToken}}': reg.verification_token || reg.id,
    '{{participant.name}}': reg.leader_name || 'Participant Name',
    '{{participant.email}}': reg.leader_email || '',
    '{{participant.phone}}': reg.leader_phone || '',
    '{{participant.college}}': reg.leader_college || 'PCE Nagpur',
    '{{participant.branch}}': reg.leader_branch || 'Engineering',
    '{{participant.semester}}': reg.leader_semester || '',
    '{{academic.prn}}': parsedFormData['prn'] || 'N/A',
    '{{academic.cgpa}}': parsedFormData['cgpa'] || 'N/A',
    '{{team.name}}': reg.team_name || reg.leader_name || 'Team',
    '{{team.size}}': String(reg.team_size || 1),
    '{{team.membersList}}': teamRoster,
    '{{team.member2}}': memberNames[1] || '',
    '{{team.member3}}': memberNames[2] || '',
    '{{team.member4}}': memberNames[3] || '',
    '{{squad.game}}': parsedFormData['gameTitle'] || 'BGMI',
    '{{squad.leaderIGN}}': parsedFormData['leaderIGN'] || '',
    '{{competition.name}}': comp?.name || reg.competition_slug,
    '{{competition.category}}': comp?.category || 'Hardware & Circuits',
    '{{competition.venue}}': comp?.venue || 'PCE Campus, Nagpur',
    '{{competition.date}}': '19 October 2026',
    '{{competition.reportingTime}}': '08:30 AM IST',
    '{{competition.titleSpecific}}':
      parsedFormData['projectTitle'] ||
      parsedFormData['presentationTitle'] ||
      parsedFormData['circuitTitle'] ||
      parsedFormData['ideaTitle'] ||
      parsedFormData['posterTitle'] ||
      parsedFormData['performanceTitle'] ||
      'Technical Entry',
    '{{payment.status}}': displayPaymentStatus,
    '{{payment.fee}}': isFree ? 'Free' : (comp?.registrationFee || 'Free'),
    '{{payment.id}}': reg.payment_id || 'N/A',
    '{{certificate.id}}': `CERT-YUG-2026-${(reg.id || '0000').slice(0, 6).toUpperCase()}`,
    '{{certificate.recipient}}': reg.leader_name || 'Participant Name',
    '{{certificate.rank}}': 'Participant',
    '{{certificate.issueDate}}': '19 October 2026',
    '{{certificate.issuer}}': 'Tele-Era Student Forum & Dept. of ETC',
  };
}
