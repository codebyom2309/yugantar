import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { verifyPassToken, PassMemberInfo } from '@/lib/passToken';
import { COMPETITIONS } from '@/data/events';
import { resolveActiveTemplate, extractRegistrationTokenMap } from '@/lib/studioService';
import { renderTemplateToPdfBuffer } from '@/lib/studioPdfRenderer';
import { getAbsoluteUrl } from '@/lib/site-url';
import { isPassGenerationAllowed } from '@/lib/generationPolicy';

interface RegistrationRecord {
  id: string;
  competition_slug: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  leader_college: string;
  leader_branch: string;
  leader_semester: string;
  team_name: string | null;
  team_size: number;
  payment_id: string | null;
  payment_status: string | null;
  submission_status: string;
  created_at: string;
  verification_token: string | null;
  form_data: string | null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // 1. Fetch minimal operational record from database
    const rows = await db.query<RegistrationRecord>(
      `SELECT id, competition_slug, leader_name, leader_email, leader_phone,
              leader_college, leader_branch, leader_semester, team_name, team_size,
              payment_id, payment_status, submission_status, created_at,
              verification_token, form_data
       FROM registrations WHERE id = ? OR verification_token = ? LIMIT 1`,
      [id, id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Registration record not found.' },
        { status: 404 }
      );
    }

    const reg = rows[0];

    // 1b. Enforce Pass Generation Policy
    const passPolicy = await isPassGenerationAllowed(reg.competition_slug);
    if (!passPolicy.allowed) {
      return NextResponse.json(
        { error: passPolicy.reason || 'Pass and certificate generation is currently disabled by the event administrator.' },
        { status: 403 }
      );
    }

    // 2. Resolve team member roster:
    // First priority: verified stateless HMAC token (no full DB storage required)
    // Second priority: parsed from form_data (if full storage mode was on)
    let teamMembers: PassMemberInfo[] = [];

    if (token) {
      const verified = verifyPassToken(token, reg.id);
      if (verified && Array.isArray(verified.members)) {
        teamMembers = verified.members;
      }
    }

    if (teamMembers.length === 0 && reg.form_data) {
      try {
        const parsed = typeof reg.form_data === 'string' ? JSON.parse(reg.form_data) : reg.form_data;
        const count = reg.team_size || 1;
        for (let i = 2; i <= count; i++) {
          const mName = parsed[`member${i}Name`] || parsed[`squadMember${i}Name`];
          if (mName) {
            teamMembers.push({
              name: mName,
              college: parsed[`member${i}College`] || reg.leader_college,
              branch: parsed[`member${i}Branch`] || reg.leader_branch,
              semester: parsed[`member${i}Semester`] || reg.leader_semester,
            });
          }
        }
      } catch (err) {
        console.warn('Could not parse form_data for team members:', err);
      }
    }

    // 3. Resolve competition metadata
    const staticComp = COMPETITIONS.find((c) => c.slug === reg.competition_slug);
    let compName = staticComp?.name || reg.competition_slug.replace(/-/g, ' ').toUpperCase();
    let compCategory: string = staticComp?.category || 'Hardware & Circuits';
    let compVenue = staticComp?.venue || 'PCE Campus, Nagpur';
    let compDate = '21 October 2026';

    try {
      const compRows = await db.query<{
        name: string;
        category: string;
        venue: string;
        event_date: string;
      }>(
        'SELECT name, category, venue, event_date FROM competitions WHERE slug = ? LIMIT 1',
        [reg.competition_slug]
      );
      if (compRows && compRows.length > 0) {
        if (compRows[0].name) compName = compRows[0].name;
        if (compRows[0].category) compCategory = compRows[0].category;
        if (compRows[0].venue) compVenue = compRows[0].venue;
        if (compRows[0].event_date) compDate = compRows[0].event_date;
      }
    } catch {
      // Use fallback
    }

    // 4. Check for active Pass Studio Template (Phase 7 resolution order)
    try {
      const activeTemplate = await resolveActiveTemplate(reg.competition_slug, 'registration_pass');
      if (activeTemplate && activeTemplate.elements && activeTemplate.elements.length > 0) {
        const tokenMap = extractRegistrationTokenMap(
          reg,
          {
            name: compName,
            category: compCategory,
            venue: compVenue,
            event_date: compDate,
          },
          teamMembers
        );
        const verifyToken = reg.verification_token || reg.id;
        const pdfBytes = await renderTemplateToPdfBuffer(activeTemplate, tokenMap, {
          passToken: verifyToken,
        });

        const isInline = url.searchParams.get('inline') === '1';
        const filename = `YUGANTAR-2026-PASS-${reg.id.slice(0, 8).toUpperCase()}.pdf`;
        const disposition = isInline ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`;

        return new NextResponse(pdfBytes as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': disposition,
            'Content-Length': String(pdfBytes.byteLength),
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      }
    } catch (templateErr) {
      console.warn('Could not render pass via active studio template, using hardcoded fallback:', templateErr);
    }

    // 5. Generate verification QR Code PNG buffer (Hardcoded Fallback)
    const verifyToken = reg.verification_token || reg.id;
    const verifyUrl = getAbsoluteUrl(`/verify/${verifyToken}`);

    const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      width: 280,
      margin: 1,
      color: {
        dark: '#172B49',
        light: '#FFFFFF',
      },
    });

    // 5. Build high-fidelity vector PDF Document using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const qrImage = await pdfDoc.embedPng(qrPngBuffer);

    // Approved YUGANTAR 2026 Brand Color Palette
    const navyDark = rgb(16 / 255, 38 / 255, 74 / 255); // #10264A
    const electricBlue = rgb(57 / 255, 120 / 255, 246 / 255); // #3978F6
    const paleBlue = rgb(233 / 255, 242 / 255, 255 / 255); // #E9F2FF
    const cloudWhite = rgb(248 / 255, 250 / 255, 252 / 255); // #F8FAFC
    const pureWhite = rgb(1, 1, 1);
    const restrainedOrange = rgb(255 / 255, 120 / 255, 62 / 255); // #FF783E
    const mutedSlate = rgb(83 / 255, 103 / 255, 129 / 255); // #536781
    const subtleSlate = rgb(126 / 255, 147 / 255, 172 / 255); // #7E93AC
    const borderGray = rgb(220 / 255, 229 / 255, 242 / 255); // #DCE5F2
    const successGreen = rgb(16 / 255, 185 / 255, 129 / 255); // #10B981
    const lightSuccess = rgb(236 / 255, 253 / 255, 245 / 255); // #ECFDF5
    const pendingAmber = rgb(217 / 255, 119 / 255, 6 / 255); // #D97706
    const lightPending = rgb(255 / 255, 251 / 255, 235 / 255); // #FFFBEB

    const safeText = (text: string | null | undefined): string => {
      if (!text) return '';
      return String(text)
        .replace(/₹/g, 'INR ')
        .replace(/•/g, '|')
        .replace(/·/g, '|')
        .replace(/—/g, '-')
        .replace(/–/g, '-')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
    };

    const truncate = (text: string | null | undefined, maxChars: number): string => {
      const clean = safeText(text);
      if (!clean) return '-';
      const trimmed = clean.trim();
      return trimmed.length > maxChars ? `${trimmed.substring(0, maxChars - 2)}...` : trimmed;
    };

    const origDrawText = page.drawText.bind(page);
    (page as any).drawText = (text: string, options?: any) => {
      origDrawText(safeText(text), options);
    };

    // Background fill (Cloud White)
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: cloudWhite,
    });

    // Outer Credential Card Frame
    const cardMargin = 28;
    const cardWidth = width - cardMargin * 2;
    const cardHeight = height - cardMargin * 2;
    const cardX = cardMargin;
    const cardY = cardMargin;

    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      color: pureWhite,
      borderColor: borderGray,
      borderWidth: 1.5,
    });

    // =========================================================================
    // SECTION 1: TOP BRANDING & INSTITUTIONAL HEADER
    // =========================================================================
    const headerHeight = 98;
    const headerY = cardY + cardHeight - headerHeight;

    page.drawRectangle({
      x: cardX,
      y: headerY,
      width: cardWidth,
      height: headerHeight,
      color: cloudWhite,
      borderColor: borderGray,
      borderWidth: 1,
    });

    // Electric-blue top illuminated accent line
    page.drawRectangle({
      x: cardX,
      y: headerY + headerHeight - 4,
      width: cardWidth,
      height: 4,
      color: electricBlue,
    });

    // Restrained orange accent pip
    page.drawRectangle({
      x: cardX + cardWidth - 28,
      y: headerY + headerHeight - 4,
      width: 28,
      height: 4,
      color: restrainedOrange,
    });

    // Institution & Department Identifiers
    page.drawText('PRIYADARSHINI COLLEGE OF ENGINEERING • NAGPUR', {
      x: cardX + 22,
      y: headerY + 76,
      size: 8.5,
      font: fontBold,
      color: electricBlue,
    });

    page.drawText('Department of Electronics & Telecommunication Engineering • TELE-ERA Forum', {
      x: cardX + 22,
      y: headerY + 62,
      size: 8.5,
      font: fontRegular,
      color: mutedSlate,
    });

    // Title: YUGANTAR 2026 DELEGATE PASS
    page.drawText('YUGANTAR 2026 DELEGATE PASS', {
      x: cardX + 22,
      y: headerY + 36,
      size: 19,
      font: fontBold,
      color: navyDark,
    });

    page.drawText('National Technical Symposium • Futuristic NEXUS CITY Arena Credential', {
      x: cardX + 22,
      y: headerY + 20,
      size: 8.5,
      font: fontRegular,
      color: subtleSlate,
    });

    // Pass Reference Badge on Top Right
    const passRef = `YUG-26-${reg.id.substring(0, 8).toUpperCase()}`;
    const badgeWidth = 150;
    const badgeHeight = 52;
    const badgeX = cardX + cardWidth - badgeWidth - 20;
    const badgeY = headerY + 22;

    page.drawRectangle({
      x: badgeX,
      y: badgeY,
      width: badgeWidth,
      height: badgeHeight,
      color: paleBlue,
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText('OFFICIAL CREDENTIAL ID', {
      x: badgeX + 12,
      y: badgeY + 36,
      size: 7.5,
      font: fontBold,
      color: electricBlue,
    });

    page.drawText(passRef, {
      x: badgeX + 12,
      y: badgeY + 20,
      size: 10,
      font: fontBold,
      color: navyDark,
    });

    const issueDateStr = new Date(reg.created_at || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    page.drawText(`Issued: ${issueDateStr}`, {
      x: badgeX + 12,
      y: badgeY + 7,
      size: 7.5,
      font: fontRegular,
      color: mutedSlate,
    });

    // =========================================================================
    // SECTION 2: STATUS ACCREDITATION RIBBON
    // =========================================================================
    const ribbonHeight = 26;
    const ribbonY = headerY - ribbonHeight;
    const isFree = reg.payment_status === 'free';
    const isConfirmed = isFree || reg.payment_status === 'confirmed' || reg.payment_status === 'verified';

    page.drawRectangle({
      x: cardX,
      y: ribbonY,
      width: cardWidth,
      height: ribbonHeight,
      color: isConfirmed ? lightSuccess : lightPending,
      borderColor: isConfirmed ? rgb(167 / 255, 243 / 255, 208 / 255) : rgb(254 / 255, 215 / 255, 170 / 255),
      borderWidth: 1,
    });

    const statusText = isConfirmed
      ? (isFree ? 'ENTRY AUTHORIZED • 100% FREE PARTICIPATION TRACK' : 'ENTRY AUTHORIZED • PAYMENT VERIFIED')
      : 'REGISTRATION SUBMITTED • AWAITING UTR AUDIT';

    page.drawText(statusText, {
      x: cardX + 22,
      y: ribbonY + 8,
      size: 8.5,
      font: fontBold,
      color: isConfirmed ? successGreen : pendingAmber,
    });

    page.drawText('VALIDATED SYSTEM CREDENTIAL', {
      x: cardX + cardWidth - 165,
      y: ribbonY + 8,
      size: 8,
      font: fontBold,
      color: mutedSlate,
    });

    // =========================================================================
    // SECTION 3: COMPETITION ARENA CARD
    // =========================================================================
    let cursorY = ribbonY - 14;
    const compBoxHeight = 60;
    cursorY -= compBoxHeight;

    page.drawRectangle({
      x: cardX + 20,
      y: cursorY,
      width: cardWidth - 40,
      height: compBoxHeight,
      color: pureWhite,
      borderColor: borderGray,
      borderWidth: 1,
    });

    // Subtle left electric-blue vertical accent
    page.drawRectangle({
      x: cardX + 20,
      y: cursorY,
      width: 4,
      height: compBoxHeight,
      color: electricBlue,
    });

    const arenaIdx = staticComp?.districtIndex !== undefined ? `ARENA 0${staticComp.districtIndex + 1}` : 'ARENA';
    page.drawText(`${arenaIdx} • ${compCategory.toUpperCase()}`, {
      x: cardX + 34,
      y: cursorY + compBoxHeight - 16,
      size: 7.5,
      font: fontBold,
      color: electricBlue,
    });

    page.drawText(truncate(compName, 42), {
      x: cardX + 34,
      y: cursorY + compBoxHeight - 34,
      size: 13.5,
      font: fontBold,
      color: navyDark,
    });

    page.drawText(`Date: ${compDate}   |   Venue: ${compVenue}`, {
      x: cardX + 34,
      y: cursorY + 10,
      size: 8.5,
      font: fontRegular,
      color: mutedSlate,
    });

    // Right-hand fee badge
    const feeBadgeText = isFree
      ? '100% FREE ENTRY'
      : `FEE: ${staticComp?.registrationFee || '₹300'}`;
    const feeBadgeWidth = 130;
    const feeBadgeX = cardX + cardWidth - 40 - feeBadgeWidth - 10;
    const feeBadgeY = cursorY + 12;

    page.drawRectangle({
      x: feeBadgeX,
      y: feeBadgeY,
      width: feeBadgeWidth,
      height: 36,
      color: cloudWhite,
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText(feeBadgeText, {
      x: feeBadgeX + 10,
      y: feeBadgeY + 21,
      size: 8.5,
      font: fontBold,
      color: isFree ? successGreen : electricBlue,
    });

    page.drawText(
      reg.payment_id && reg.payment_id !== 'FREE-TRACK'
        ? `UTR: ${truncate(reg.payment_id, 14)}`
        : 'NO FEE REQUIRED',
      {
        x: feeBadgeX + 10,
        y: feeBadgeY + 8,
        size: 7.5,
        font: fontRegular,
        color: subtleSlate,
      }
    );

    // =========================================================================
    // SECTION 4: PARTICIPANT / TEAM ROSTER LAYOUT (CRITICAL)
    // =========================================================================
    cursorY -= 16;

    if (reg.team_size > 1) {
      // -----------------------------------------------------------------------
      // CASE A: TEAM COMPETITION — Structured Roster Table
      // -----------------------------------------------------------------------
      const allRoster = [
        {
          role: 'Team Lead',
          name: reg.leader_name || 'Team Leader',
          college: reg.leader_college || 'PCE Nagpur',
          branch: reg.leader_branch || 'ETC',
          semester: reg.leader_semester || '—',
        },
        ...teamMembers.map((m, idx) => ({
          role: `Member ${idx + 2}`,
          name: m.name,
          college: m.college || reg.leader_college || 'PCE Nagpur',
          branch: m.branch || reg.leader_branch || 'ETC',
          semester: m.semester || reg.leader_semester || '—',
        })),
      ];

      // Ensure at least placeholders if team_size > members parsed
      while (allRoster.length < reg.team_size && allRoster.length < 4) {
        const nextIdx = allRoster.length + 1;
        allRoster.push({
          role: `Member ${nextIdx}`,
          name: `Registered Member ${nextIdx}`,
          college: reg.leader_college || 'PCE Nagpur',
          branch: reg.leader_branch || 'ETC',
          semester: reg.leader_semester || '—',
        });
      }

      // Section Header
      page.drawText('OFFICIAL TEAM ROSTER & ACCREDITED MEMBERS', {
        x: cardX + 22,
        y: cursorY,
        size: 9,
        font: fontBold,
        color: navyDark,
      });

      const teamNameDisplay = reg.team_name ? `Team: "${reg.team_name}"` : 'Team Delegation';
      page.drawText(`${teamNameDisplay} • ${allRoster.length} Registered Delegates`, {
        x: cardX + cardWidth - 260,
        y: cursorY,
        size: 8.5,
        font: fontRegular,
        color: mutedSlate,
      });

      cursorY -= 10;

      // Table Sizing
      const rowHeight = 32;
      const tableHeaderHeight = 22;
      const tableTotalHeight = tableHeaderHeight + allRoster.length * rowHeight;
      cursorY -= tableTotalHeight;

      // Table Container
      page.drawRectangle({
        x: cardX + 20,
        y: cursorY,
        width: cardWidth - 40,
        height: tableTotalHeight,
        color: pureWhite,
        borderColor: borderGray,
        borderWidth: 1,
      });

      // Table Header Row
      const tableHeaderY = cursorY + tableTotalHeight - tableHeaderHeight;
      page.drawRectangle({
        x: cardX + 20,
        y: tableHeaderY,
        width: cardWidth - 40,
        height: tableHeaderHeight,
        color: paleBlue,
        borderColor: borderGray,
        borderWidth: 0.5,
      });

      // Table Column Positions
      const colRoleX = cardX + 32;
      const colNameX = cardX + 115;
      const colCollegeX = cardX + 265;
      const colBranchX = cardX + 440;

      page.drawText('ROLE', {
        x: colRoleX,
        y: tableHeaderY + 7,
        size: 7.5,
        font: fontBold,
        color: electricBlue,
      });
      page.drawText('DELEGATE NAME', {
        x: colNameX,
        y: tableHeaderY + 7,
        size: 7.5,
        font: fontBold,
        color: navyDark,
      });
      page.drawText('COLLEGE / INSTITUTION', {
        x: colCollegeX,
        y: tableHeaderY + 7,
        size: 7.5,
        font: fontBold,
        color: navyDark,
      });
      page.drawText('BRANCH & SEM', {
        x: colBranchX,
        y: tableHeaderY + 7,
        size: 7.5,
        font: fontBold,
        color: navyDark,
      });

      // Table Data Rows
      allRoster.forEach((member, idx) => {
        const rowY = tableHeaderY - (idx + 1) * rowHeight;

        // Alternate subtle background row
        if (idx % 2 === 1) {
          page.drawRectangle({
            x: cardX + 21,
            y: rowY + 1,
            width: cardWidth - 42,
            height: rowHeight - 2,
            color: cloudWhite,
          });
        }

        // Row Divider
        if (idx > 0) {
          page.drawLine({
            start: { x: cardX + 20, y: rowY + rowHeight },
            end: { x: cardX + cardWidth - 20, y: rowY + rowHeight },
            color: borderGray,
            thickness: 0.5,
          });
        }

        // Member Details
        const isLead = idx === 0;
        page.drawText(member.role, {
          x: colRoleX,
          y: rowY + 12,
          size: 8,
          font: fontBold,
          color: isLead ? restrainedOrange : electricBlue,
        });

        page.drawText(truncate(member.name, 22), {
          x: colNameX,
          y: rowY + 12,
          size: 9,
          font: fontBold,
          color: navyDark,
        });

        page.drawText(truncate(member.college, 26), {
          x: colCollegeX,
          y: rowY + 12,
          size: 8.5,
          font: fontRegular,
          color: mutedSlate,
        });

        const branchSemStr = `${truncate(member.branch, 10)} · Sem ${member.semester || '—'}`;
        page.drawText(branchSemStr, {
          x: colBranchX,
          y: rowY + 12,
          size: 8,
          font: fontRegular,
          color: subtleSlate,
        });
      });

      // Team Lead Contact Strip beneath table
      cursorY -= 8;
      const contactStripHeight = 24;
      cursorY -= contactStripHeight;

      page.drawRectangle({
        x: cardX + 20,
        y: cursorY,
        width: cardWidth - 40,
        height: contactStripHeight,
        color: cloudWhite,
        borderColor: borderGray,
        borderWidth: 0.5,
      });

      page.drawText(`Team Representative: ${truncate(reg.leader_email, 28)}   |   Contact: ${reg.leader_phone || '—'}`, {
        x: cardX + 32,
        y: cursorY + 8,
        size: 7.5,
        font: fontRegular,
        color: mutedSlate,
      });
    } else {
      // -----------------------------------------------------------------------
      // CASE B: SOLO REGISTRATION — Clean Single-Participant Dossier
      // -----------------------------------------------------------------------
      page.drawText('REGISTERED DELEGATE DOSSIER', {
        x: cardX + 22,
        y: cursorY,
        size: 9,
        font: fontBold,
        color: navyDark,
      });

      cursorY -= 10;
      const soloCardHeight = 150;
      cursorY -= soloCardHeight;

      page.drawRectangle({
        x: cardX + 20,
        y: cursorY,
        width: cardWidth - 40,
        height: soloCardHeight,
        color: pureWhite,
        borderColor: borderGray,
        borderWidth: 1,
      });

      const col1X = cardX + 36;
      const col2X = cardX + 280;

      // Col 1: Candidate Identity
      page.drawText('PARTICIPANT NAME', {
        x: col1X,
        y: cursorY + soloCardHeight - 24,
        size: 7.5,
        font: fontBold,
        color: electricBlue,
      });
      page.drawText(truncate(reg.leader_name || 'Participant', 28), {
        x: col1X,
        y: cursorY + soloCardHeight - 42,
        size: 13,
        font: fontBold,
        color: navyDark,
      });

      page.drawText('COLLEGE / INSTITUTION', {
        x: col1X,
        y: cursorY + soloCardHeight - 64,
        size: 7.5,
        font: fontBold,
        color: subtleSlate,
      });
      page.drawText(truncate(reg.leader_college || 'PCE Nagpur', 34), {
        x: col1X,
        y: cursorY + soloCardHeight - 80,
        size: 9.5,
        font: fontRegular,
        color: navyDark,
      });

      page.drawText('ACADEMIC DEPARTMENT & SEMESTER', {
        x: col1X,
        y: cursorY + soloCardHeight - 102,
        size: 7.5,
        font: fontBold,
        color: subtleSlate,
      });
      page.drawText(`${reg.leader_branch || 'ETC'} · Semester ${reg.leader_semester || 'VII'}`, {
        x: col1X,
        y: cursorY + soloCardHeight - 118,
        size: 9,
        font: fontRegular,
        color: navyDark,
      });

      page.drawText('PARTICIPATION STATUS', {
        x: col1X,
        y: cursorY + soloCardHeight - 138,
        size: 7.5,
        font: fontBold,
        color: subtleSlate,
      });
      page.drawText('Individual Contestant · Solo Track Delegate', {
        x: col1X,
        y: cursorY + 12,
        size: 8.5,
        font: fontBold,
        color: electricBlue,
      });

      // Vertical divider in solo card
      page.drawLine({
        start: { x: col2X - 20, y: cursorY + 16 },
        end: { x: col2X - 20, y: cursorY + soloCardHeight - 16 },
        color: borderGray,
        thickness: 1,
      });

      // Col 2: Contact & Authentication
      page.drawText('REGISTERED CONTACT EMAIL', {
        x: col2X,
        y: cursorY + soloCardHeight - 24,
        size: 7.5,
        font: fontBold,
        color: subtleSlate,
      });
      page.drawText(truncate(reg.leader_email, 32), {
        x: col2X,
        y: cursorY + soloCardHeight - 40,
        size: 9.5,
        font: fontRegular,
        color: navyDark,
      });

      page.drawText('CONTACT PHONE NUMBER', {
        x: col2X,
        y: cursorY + soloCardHeight - 64,
        size: 7.5,
        font: fontBold,
        color: subtleSlate,
      });
      page.drawText(reg.leader_phone || '—', {
        x: col2X,
        y: cursorY + soloCardHeight - 80,
        size: 9.5,
        font: fontRegular,
        color: navyDark,
      });

      page.drawText('REGISTRATION CREDENTIAL ID', {
        x: col2X,
        y: cursorY + soloCardHeight - 102,
        size: 7.5,
        font: fontBold,
        color: subtleSlate,
      });
      page.drawText(truncate(reg.id, 28), {
        x: col2X,
        y: cursorY + soloCardHeight - 118,
        size: 8.5,
        font: fontBold,
        color: electricBlue,
      });

      page.drawText('TRANSACTION / PAYMENT RECORD', {
        x: col2X,
        y: cursorY + soloCardHeight - 138,
        size: 7.5,
        font: fontBold,
        color: subtleSlate,
      });
      page.drawText(
        reg.payment_id && reg.payment_id !== 'FREE-TRACK'
          ? `UTR: ${reg.payment_id}`
          : '100% Free Participation — No Fee Required',
        {
          x: col2X,
          y: cursorY + 12,
          size: 8.5,
          font: fontBold,
          color: isFree ? successGreen : navyDark,
        }
      );
    }

    // =========================================================================
    // SECTION 5: QR VERIFICATION & ADMISSION CARD (BOTTOM)
    // =========================================================================
    const qrSectionHeight = 110;
    const qrSectionY = cardY + 36;

    page.drawRectangle({
      x: cardX + 20,
      y: qrSectionY,
      width: cardWidth - 40,
      height: qrSectionHeight,
      color: cloudWhite,
      borderColor: borderGray,
      borderWidth: 1,
    });

    // Embed QR Graphic with white boundary card
    const qrDim = 90;
    const qrX = cardX + cardWidth - 40 - qrDim - 10;
    const qrY = qrSectionY + 10;

    page.drawRectangle({
      x: qrX - 4,
      y: qrY - 4,
      width: qrDim + 8,
      height: qrDim + 8,
      color: pureWhite,
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrDim,
      height: qrDim,
    });

    // Security Instructions text on left of QR
    const infoX = cardX + 34;
    page.drawText('DIGITAL ENTRY & ADMISSION VERIFICATION', {
      x: infoX,
      y: qrSectionY + 90,
      size: 8,
      font: fontBold,
      color: electricBlue,
    });

    page.drawText(passRef, {
      x: infoX,
      y: qrSectionY + 74,
      size: 11,
      font: fontBold,
      color: navyDark,
    });

    const instructions = [
      'Present this pass along with your collegiate photo identity card at the campus gate.',
      'The QR code provides real-time cryptographic verification on the festival database.',
      'All registered delegates must report at the ETC Central Concourse for badge issuance.',
      'Inquiries: TELE-ERA Student Forum, Department of ETC, Priyadarshini College of Engineering.',
    ];

    instructions.forEach((line, i) => {
      page.drawText(`• ${line}`, {
        x: infoX,
        y: qrSectionY + 54 - i * 13,
        size: 7.5,
        font: fontRegular,
        color: mutedSlate,
      });
    });

    // Bottom Footer Security Stamp
    const footerY = cardY + 14;
    page.drawText('YUGANTAR 2026 • TELE-ERA FORUM • DEPARTMENT OF ETC • PCE NAGPUR', {
      x: cardX + 20,
      y: footerY,
      size: 7.5,
      font: fontBold,
      color: subtleSlate,
    });

    page.drawText('OFFICIAL AUTONOMOUS CREDENTIAL #PCE-ETC-2026', {
      x: cardX + cardWidth - 215,
      y: footerY,
      size: 7.5,
      font: fontBold,
      color: electricBlue,
    });

    // 6. Serialize PDF document
    const pdfBytes = await pdfDoc.save();

    // 7. Return with proper download headers
    const filename = `YUGANTAR-2026-Registration-Pass-${reg.id.substring(0, 8).toUpperCase()}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('PDF Generation Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF registration pass.', details: String(err) },
      { status: 500 }
    );
  }
}
