import { PassTemplate, ValidationReport, ValidationCheckItem, ReusableDesignBlock, StudioElement } from '@/types/studio';

/**
 * Validates a Pass / Certificate template against the pre-publish checklist rules.
 */
export function validateTemplate(template: PassTemplate): ValidationReport {
  const items: ValidationCheckItem[] = [];

  // 1. Document Dimension Checks
  if (template.width_pt >= 100 && template.height_pt >= 100) {
    items.push({
      id: 'doc_dimensions',
      category: 'document',
      title: 'Document Dimensions',
      status: 'pass',
      message: `Standard page sizing valid (${template.paper_size} ${template.orientation}: ${Math.round(template.width_pt)} × ${Math.round(template.height_pt)} pt).`,
    });
  } else {
    items.push({
      id: 'doc_dimensions',
      category: 'document',
      title: 'Document Dimensions',
      status: 'error',
      message: 'Page dimensions must be at least 100 × 100 pt.',
    });
  }

  // 2. Page Boundary Constraints
  const elements = template.elements || [];
  const outOfBounds = elements.filter(
    (el) => el.x < -5 || el.y < -5 || el.x + el.width > template.width_pt + 5 || el.y + el.height > template.height_pt + 5
  );

  if (outOfBounds.length === 0) {
    items.push({
      id: 'page_boundaries',
      category: 'document',
      title: 'Page Boundary Constraints',
      status: 'pass',
      message: `All ${elements.length} elements are contained safely inside the printable page boundaries.`,
    });
  } else {
    items.push({
      id: 'page_boundaries',
      category: 'document',
      title: 'Page Boundary Constraints',
      status: 'warning',
      message: `${outOfBounds.length} element(s) extend partially or fully outside the printable page area.`,
    });
  }

  // 3. Dynamic Fields & Identity
  const isCertificate = template.type.includes('cert');
  const fieldTokens = elements
    .filter((el) => el.type === 'field')
    .map((el) => (el as any).token);
  const textContents = elements
    .filter((el) => el.type === 'text')
    .map((el) => (el as any).content);
  const allText = [...fieldTokens, ...textContents].join(' ');

  const hasParticipant = allText.includes('participant.name') || allText.includes('certificate.recipient');
  const hasRegOrCertId = allText.includes('registration.id') || allText.includes('certificate.id');

  if (hasParticipant) {
    items.push({
      id: 'required_participant',
      category: 'text',
      title: 'Dynamic Participant Binding',
      status: 'pass',
      message: 'Dynamic participant or recipient identity token mapped correctly.',
    });
  } else {
    items.push({
      id: 'required_participant',
      category: 'text',
      title: 'Dynamic Participant Binding',
      status: isCertificate ? 'error' : 'warning',
      message: 'No {{participant.name}} or {{certificate.recipient}} token detected. Pass/Cert will have no recipient name.',
    });
  }

  if (hasRegOrCertId) {
    items.push({
      id: 'required_identifier',
      category: 'text',
      title: 'Audit & Tracking Identifier',
      status: 'pass',
      message: 'Audit tracking reference token present (Registration/Certificate ID).',
    });
  } else {
    items.push({
      id: 'required_identifier',
      category: 'text',
      title: 'Audit & Tracking Identifier',
      status: 'warning',
      message: 'Consider adding {{registration.id}} or {{certificate.id}} for print auditability.',
    });
  }

  // 4. Security Verification QR
  const qrElements = elements.filter((el) => el.type === 'qr');
  if (qrElements.length > 0) {
    const smallQrs = qrElements.filter((el) => el.width < 70 || el.height < 70);
    if (smallQrs.length > 0) {
      items.push({
        id: 'qr_size',
        category: 'qr',
        title: 'Security QR Code Dimensions',
        status: 'warning',
        message: 'QR code size is under 70pt. Laser and mobile scanners may experience latency on physical prints.',
      });
    } else {
      items.push({
        id: 'qr_size',
        category: 'qr',
        title: 'Security QR Code Dimensions',
        status: 'pass',
        message: `High-resolution cryptographic QR code configured (${Math.round(qrElements[0].width)} × ${Math.round(qrElements[0].height)} pt).`,
      });
    }
  } else {
    items.push({
      id: 'qr_size',
      category: 'qr',
      title: 'Security Verification QR',
      status: isCertificate ? 'warning' : 'error',
      message: isCertificate
        ? 'No tamper-proof verification QR detected. Online validation will not be instant.'
        : 'Passes require a verification QR code for venue entrance check-in.',
    });
  }

  // 5. Typography Legibility Checks
  const textElements = elements.filter((el) => el.type === 'text' || el.type === 'field');
  const tinyFonts = textElements.filter((el) => (el as any).fontSize < 7);

  if (tinyFonts.length > 0) {
    items.push({
      id: 'font_legibility',
      category: 'text',
      title: 'Typography Print Legibility',
      status: 'warning',
      message: `${tinyFonts.length} text element(s) have font size < 7pt, which may be difficult to read in physical printouts.`,
    });
  } else {
    items.push({
      id: 'font_legibility',
      category: 'text',
      title: 'Typography Print Legibility',
      status: 'pass',
      message: 'All typography sizes satisfy high-clarity print thresholds (>= 7pt).',
    });
  }

  // 6. Background Quality Check
  if (template.background_url) {
    items.push({
      id: 'bg_asset',
      category: 'document',
      title: 'Background Artwork Asset',
      status: 'pass',
      message: `Custom artwork linked (${template.background_fit} fitting, ${Math.round(template.background_opacity * 100)}% opacity).`,
    });
  } else {
    items.push({
      id: 'bg_asset',
      category: 'document',
      title: 'Background Artwork Asset',
      status: 'pass',
      message: 'Clean vector canvas layout (white paper surface).',
    });
  }

  // 7. Assignment & Scope Check
  items.push({
    id: 'assignment_scope',
    category: 'assignment',
    title: 'Assignment & Template Scope',
    status: 'pass',
    message: template.is_global
      ? 'Global Default Template (available to all YUGANTAR 2026 events).'
      : 'Competition-Specific Override Template.',
  });

  const hasBlockingError = items.some((item) => item.status === 'error');
  const hasWarnings = items.some((item) => item.status === 'warning');

  return {
    isValid: !hasBlockingError,
    canPublish: !hasBlockingError,
    items,
  };
}

/**
 * Curated reusable design blocks for rapid drag-and-drop / 1-click addition.
 */
export const REUSABLE_DESIGN_BLOCKS: ReusableDesignBlock[] = [
  {
    id: 'block_festival_header',
    name: 'Festival Header Banner',
    description: 'YUGANTAR 2026 official banner, tagline, and divider line',
    category: 'header',
    elements: [
      {
        id: 'block_el_hdr_title',
        type: 'text',
        name: 'Header Title',
        content: 'YUGANTAR 2026',
        fontFamily: 'Helvetica-Bold',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#10264A',
        textAlign: 'center',
        x: 50,
        y: 40,
        width: 495,
        height: 28,
      },
      {
        id: 'block_el_hdr_sub',
        type: 'text',
        name: 'Header Subtitle',
        content: 'National Level Technical Symposium • Department of ETC, PCE Nagpur',
        fontFamily: 'Helvetica',
        fontSize: 10,
        fontWeight: 'normal',
        color: '#64748B',
        textAlign: 'center',
        x: 50,
        y: 70,
        width: 495,
        height: 16,
      },
      {
        id: 'block_el_hdr_line',
        type: 'shape',
        name: 'Header Divider',
        shapeType: 'line',
        fillColor: 'transparent',
        borderColor: '#2563EB',
        borderWidth: 2,
        x: 50,
        y: 92,
        width: 495,
        height: 2,
      },
    ],
  },
  {
    id: 'block_participant_info',
    name: 'Participant Information Card',
    description: 'Candidate name, college affiliation, branch, and registration ID pill',
    category: 'participant_info',
    elements: [
      {
        id: 'block_el_card_bg',
        type: 'shape',
        name: 'Participant Card BG',
        shapeType: 'rounded_rectangle',
        fillColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 8,
        x: 50,
        y: 120,
        width: 495,
        height: 105,
      },
      {
        id: 'block_el_p_name',
        type: 'field',
        name: 'Participant Name',
        token: '{{participant.name}}',
        fallbackText: 'Aarav Deshmukh',
        fontFamily: 'Helvetica-Bold',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'left',
        x: 70,
        y: 135,
        width: 350,
        height: 24,
        textFitting: 'shrink',
        minFontSize: 12,
      },
      {
        id: 'block_el_p_college',
        type: 'field',
        name: 'College Name',
        token: '{{participant.college}}',
        fallbackText: 'Priyadarshini College of Engineering, Nagpur',
        fontFamily: 'Helvetica',
        fontSize: 11,
        fontWeight: 'normal',
        color: '#475569',
        textAlign: 'left',
        x: 70,
        y: 162,
        width: 350,
        height: 18,
        textFitting: 'wrap',
      },
      {
        id: 'block_el_p_regid',
        type: 'field',
        name: 'Registration Badge ID',
        token: '{{registration.id}}',
        fallbackText: 'YUG-2026-REG-8421',
        fontFamily: 'Courier-Bold',
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2563EB',
        textAlign: 'left',
        x: 70,
        y: 185,
        width: 250,
        height: 18,
      },
    ],
  },
  {
    id: 'block_qr_security',
    name: 'Tamper-Proof Verification Box',
    description: 'Security QR code with scan instruction caption and verification token',
    category: 'qr_badge',
    elements: [
      {
        id: 'block_el_qr_box',
        type: 'shape',
        name: 'QR Frame Box',
        shapeType: 'rounded_rectangle',
        fillColor: '#FFFFFF',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        borderRadius: 8,
        x: 390,
        y: 125,
        width: 140,
        height: 140,
      },
      {
        id: 'block_el_qr_code',
        type: 'qr',
        name: 'Verification QR',
        qrType: 'pass_verification',
        darkColor: '#0F172A',
        lightColor: '#FFFFFF',
        showQuietZone: true,
        showCaption: true,
        captionText: 'SCAN AT VENUE',
        x: 400,
        y: 135,
        width: 120,
        height: 120,
      },
    ],
  },
  {
    id: 'block_team_roster',
    name: 'Team Squad Roster Box',
    description: 'Squad name, category badge, and complete team member lineup',
    category: 'participant_info',
    elements: [
      {
        id: 'block_el_team_bg',
        type: 'shape',
        name: 'Team Roster BG',
        shapeType: 'rounded_rectangle',
        fillColor: '#F1F5F9',
        borderColor: '#CBD5E1',
        borderWidth: 1,
        borderRadius: 6,
        x: 50,
        y: 240,
        width: 495,
        height: 70,
      },
      {
        id: 'block_el_team_title',
        type: 'text',
        name: 'Team Label',
        content: 'TEAM / SQUAD ROSTER',
        fontFamily: 'Helvetica-Bold',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
        textAlign: 'left',
        x: 65,
        y: 248,
        width: 200,
        height: 14,
      },
      {
        id: 'block_el_team_name',
        type: 'field',
        name: 'Team Name',
        token: '{{team.name}}',
        fallbackText: 'Nexus Innovators',
        fontFamily: 'Helvetica-Bold',
        fontSize: 13,
        fontWeight: 'bold',
        color: '#10264A',
        textAlign: 'left',
        x: 65,
        y: 264,
        width: 250,
        height: 18,
      },
      {
        id: 'block_el_team_roster',
        type: 'field',
        name: 'Team Members Lineup',
        token: '{{team.membersList}}',
        fallbackText: 'Aarav Deshmukh (Lead), Tanvi Sharma, Rohan Verma',
        fontFamily: 'Helvetica',
        fontSize: 10,
        fontWeight: 'normal',
        color: '#334155',
        textAlign: 'left',
        x: 65,
        y: 284,
        width: 460,
        height: 16,
        textFitting: 'wrap',
      },
    ],
  },
  {
    id: 'block_certificate_citation',
    name: 'Certificate Award Citation',
    description: 'Formal award citation text with distinction rank and signatory block',
    category: 'footer',
    elements: [
      {
        id: 'block_el_cert_citation',
        type: 'text',
        name: 'Citation Body',
        content: 'for active and exemplary performance in the National Level Technical Symposium organized at Priyadarshini College of Engineering, Nagpur.',
        fontFamily: 'Helvetica',
        fontSize: 12,
        fontWeight: 'normal',
        color: '#334155',
        textAlign: 'center',
        x: 70,
        y: 280,
        width: 455,
        height: 36,
      },
      {
        id: 'block_el_cert_rank',
        type: 'field',
        name: 'Award Rank Distinction',
        token: '{{certificate.rank}}',
        fallbackText: '1st Place Winner',
        fontFamily: 'Helvetica-Bold',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
        textAlign: 'center',
        x: 70,
        y: 250,
        width: 455,
        height: 24,
      },
    ],
  },
  {
    id: 'block_sponsor_footer',
    name: 'Sponsor & Department Footer',
    description: 'Institutional credits, venue address, and technical partner row',
    category: 'footer',
    elements: [
      {
        id: 'block_el_foot_line',
        type: 'shape',
        name: 'Footer Divider',
        shapeType: 'line',
        fillColor: 'transparent',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        x: 50,
        y: 770,
        width: 495,
        height: 2,
      },
      {
        id: 'block_el_foot_text',
        type: 'text',
        name: 'Footer Credits',
        content: 'Priyadarshini College of Engineering, Digdoh Hills, Hingna Road, Nagpur - 440019 • teleera.turbobits.in',
        fontFamily: 'Helvetica',
        fontSize: 9,
        fontWeight: 'normal',
        color: '#94A3B8',
        textAlign: 'center',
        x: 50,
        y: 780,
        width: 495,
        height: 15,
      },
    ],
  },
];
