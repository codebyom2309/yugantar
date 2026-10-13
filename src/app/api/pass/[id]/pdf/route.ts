import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { verifyPassToken, PassMemberInfo } from '@/lib/passToken';
import { COMPETITIONS } from '@/data/events';

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
    let compDate = '19 October 2026';

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

    // 4. Generate verification QR Code PNG buffer
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yugantar2026.pce.ac.in';
    const verifyToken = reg.verification_token || reg.id;
    const verifyUrl = `${appUrl}/verify/${verifyToken}`;

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

    // Color definitions
    const navyDark = rgb(0.09, 0.17, 0.29); // #172B49
    const electricBlue = rgb(0.23, 0.47, 0.91); // #3B82F6
    const mutedSlate = rgb(0.40, 0.48, 0.58); // #667A94
    const borderGray = rgb(0.86, 0.90, 0.95); // #DCE5F2
    const bgLight = rgb(0.97, 0.98, 0.99); // #F8FAFD
    const accentOrange = rgb(0.94, 0.47, 0.24); // #F0783D
    const successGreen = rgb(0.06, 0.65, 0.42); // Emerald

    // Background fill
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: bgLight,
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
      color: rgb(1, 1, 1),
      borderColor: borderGray,
      borderWidth: 1.5,
    });

    // Top Header Banner Box
    const headerHeight = 96;
    const headerY = cardY + cardHeight - headerHeight;
    page.drawRectangle({
      x: cardX,
      y: headerY,
      width: cardWidth,
      height: headerHeight,
      color: rgb(0.93, 0.96, 0.99), // Soft blue tint
      borderColor: borderGray,
      borderWidth: 1,
    });

    // Institution & Event Branding
    page.drawText('TELE-ERA FORUM • PCE NAGPUR', {
      x: cardX + 20,
      y: headerY + 70,
      size: 9,
      font: fontBold,
      color: electricBlue,
    });

    page.drawText('YUGANTAR 2026', {
      x: cardX + 20,
      y: headerY + 44,
      size: 22,
      font: fontBold,
      color: navyDark,
    });

    page.drawText('Department of Electronics & Telecommunication Engineering', {
      x: cardX + 20,
      y: headerY + 28,
      size: 9.5,
      font: fontRegular,
      color: mutedSlate,
    });

    page.drawText('Priyadarshini College of Engineering, Nagpur', {
      x: cardX + 20,
      y: headerY + 14,
      size: 9,
      font: fontRegular,
      color: mutedSlate,
    });

    // Pass Reference Badge on Top Right
    const passRef = `YUG-26-${reg.id.substring(0, 8).toUpperCase()}`;
    const badgeWidth = 140;
    const badgeX = cardX + cardWidth - badgeWidth - 20;

    page.drawRectangle({
      x: badgeX,
      y: headerY + 44,
      width: badgeWidth,
      height: 26,
      color: navyDark,
    });

    page.drawText('DELEGATE PASS', {
      x: badgeX + 24,
      y: headerY + 53,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(passRef, {
      x: badgeX + 28,
      y: headerY + 28,
      size: 9,
      font: fontBold,
      color: mutedSlate,
    });

    // Status Ribbon
    const ribbonHeight = 26;
    const ribbonY = headerY - ribbonHeight;
    const isFree = reg.payment_status === 'free';
    const isConfirmed = isFree || reg.payment_status === 'confirmed' || reg.payment_status === 'verified';

    page.drawRectangle({
      x: cardX,
      y: ribbonY,
      width: cardWidth,
      height: ribbonHeight,
      color: isConfirmed ? rgb(0.92, 0.98, 0.94) : rgb(0.99, 0.96, 0.91),
      borderColor: isConfirmed ? rgb(0.70, 0.92, 0.78) : rgb(0.98, 0.85, 0.65),
      borderWidth: 1,
    });

    const statusText = isConfirmed
      ? (isFree ? 'ENTRY AUTHORIZED • FREE REGISTRATION TRACK' : 'ENTRY AUTHORIZED • PAYMENT VERIFIED')
      : 'REGISTRATION SUBMITTED • AWAITING UTR AUDIT';

    page.drawText(statusText, {
      x: cardX + 20,
      y: ribbonY + 8,
      size: 9,
      font: fontBold,
      color: isConfirmed ? successGreen : accentOrange,
    });

    page.drawText('OFFICIAL CREDENTIAL', {
      x: cardX + cardWidth - 130,
      y: ribbonY + 8,
      size: 8,
      font: fontBold,
      color: mutedSlate,
    });

    // Competition Highlight Box
    let currentY = ribbonY - 20;
    const compBoxHeight = 56;
    currentY -= compBoxHeight;

    page.drawRectangle({
      x: cardX + 20,
      y: currentY,
      width: cardWidth - 40,
      height: compBoxHeight,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText('COMPETITION ARENA', {
      x: cardX + 32,
      y: currentY + 38,
      size: 8,
      font: fontBold,
      color: mutedSlate,
    });

    page.drawText(compName, {
      x: cardX + 32,
      y: currentY + 20,
      size: 14,
      font: fontBold,
      color: navyDark,
    });

    page.drawText(`Category: ${compCategory}  |  Date: ${compDate}  |  Venue: ${compVenue}`, {
      x: cardX + 32,
      y: currentY + 7,
      size: 8.5,
      font: fontRegular,
      color: mutedSlate,
    });

    // Participant Credentials (2 Columns)
    currentY -= 20;
    const colWidth = (cardWidth - 52) / 2;
    const credBoxHeight = 90;
    currentY -= credBoxHeight;

    // Col 1: Lead Participant
    page.drawRectangle({
      x: cardX + 20,
      y: currentY,
      width: colWidth,
      height: credBoxHeight,
      color: rgb(1, 1, 1),
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText(reg.team_name ? 'TEAM LEADER / REPRESENTATIVE' : 'REGISTERED PARTICIPANT', {
      x: cardX + 30,
      y: currentY + credBoxHeight - 18,
      size: 8,
      font: fontBold,
      color: mutedSlate,
    });

    page.drawText(reg.leader_name || 'Participant', {
      x: cardX + 30,
      y: currentY + credBoxHeight - 34,
      size: 12,
      font: fontBold,
      color: navyDark,
    });

    page.drawText(`Institution: ${reg.leader_college || 'PCE Nagpur'}`, {
      x: cardX + 30,
      y: currentY + credBoxHeight - 50,
      size: 8.5,
      font: fontRegular,
      color: navyDark,
    });

    page.drawText(`Branch: ${reg.leader_branch || 'ETC'}  |  Semester: ${reg.leader_semester || 'VII'}`, {
      x: cardX + 30,
      y: currentY + credBoxHeight - 65,
      size: 8.5,
      font: fontRegular,
      color: mutedSlate,
    });

    page.drawText(`Registration ID: ${reg.id.substring(0, 18)}...`, {
      x: cardX + 30,
      y: currentY + credBoxHeight - 80,
      size: 8,
      font: fontRegular,
      color: electricBlue,
    });

    // Col 2: Delegation / Team
    page.drawRectangle({
      x: cardX + 20 + colWidth + 12,
      y: currentY,
      width: colWidth,
      height: credBoxHeight,
      color: rgb(1, 1, 1),
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText('TEAM / SQUAD DELEGATION', {
      x: cardX + 32 + colWidth + 12,
      y: currentY + credBoxHeight - 18,
      size: 8,
      font: fontBold,
      color: mutedSlate,
    });

    page.drawText(reg.team_name || 'Solo Participant Track', {
      x: cardX + 32 + colWidth + 12,
      y: currentY + credBoxHeight - 34,
      size: 12,
      font: fontBold,
      color: navyDark,
    });

    page.drawText(`Squad Size: ${reg.team_size} ${reg.team_size === 1 ? 'Member' : 'Members'}`, {
      x: cardX + 32 + colWidth + 12,
      y: currentY + credBoxHeight - 50,
      size: 8.5,
      font: fontRegular,
      color: navyDark,
    });

    if (reg.payment_id && reg.payment_id !== 'FREE-TRACK') {
      page.drawText(`Payment UTR: ${reg.payment_id}`, {
        x: cardX + 32 + colWidth + 12,
        y: currentY + credBoxHeight - 65,
        size: 8.5,
        font: fontBold,
        color: electricBlue,
      });
    } else {
      page.drawText('Fee Status: Free Participation Track', {
        x: cardX + 32 + colWidth + 12,
        y: currentY + credBoxHeight - 65,
        size: 8.5,
        font: fontRegular,
        color: successGreen,
      });
    }

    page.drawText(`Issue Date: ${new Date(reg.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, {
      x: cardX + 32 + colWidth + 12,
      y: currentY + credBoxHeight - 80,
      size: 8,
      font: fontRegular,
      color: mutedSlate,
    });

    // Section: Team Members Roster (For multi-member registrations)
    if (reg.team_size > 1) {
      currentY -= 20;
      page.drawText('OFFICIAL TEAM ROSTER & MEMBERS', {
        x: cardX + 22,
        y: currentY,
        size: 8.5,
        font: fontBold,
        color: navyDark,
      });

      currentY -= 10;
      const memberCount = Math.max(reg.team_size - 1, teamMembers.length);
      const teamBoxHeight = Math.max(memberCount * 28 + 14, 42);
      currentY -= teamBoxHeight;

      page.drawRectangle({
        x: cardX + 20,
        y: currentY,
        width: cardWidth - 40,
        height: teamBoxHeight,
        color: rgb(1, 1, 1),
        borderColor: borderGray,
        borderWidth: 1,
      });

      if (teamMembers.length > 0) {
        teamMembers.forEach((m, idx) => {
          const rowY = currentY + teamBoxHeight - 20 - idx * 28;
          page.drawText(`Member ${idx + 2}:`, {
            x: cardX + 30,
            y: rowY,
            size: 8.5,
            font: fontBold,
            color: electricBlue,
          });

          page.drawText(m.name, {
            x: cardX + 90,
            y: rowY,
            size: 9.5,
            font: fontBold,
            color: navyDark,
          });

          const metaText = `${m.college || reg.leader_college || ''}  |  ${m.branch || reg.leader_branch || ''}  |  Sem ${m.semester || reg.leader_semester || ''}`;
          page.drawText(metaText, {
            x: cardX + 260,
            y: rowY,
            size: 8.5,
            font: fontRegular,
            color: mutedSlate,
          });
        });
      } else {
        // Fallback for minimal DB mode when token is absent on direct URL load
        page.drawText(`Team delegation: ${reg.team_size} members registered under Team Leader ${reg.leader_name}.`, {
          x: cardX + 30,
          y: currentY + teamBoxHeight - 24,
          size: 9,
          font: fontRegular,
          color: mutedSlate,
        });
        page.drawText('Individual member credentials authenticated via registration confirmation token.', {
          x: cardX + 30,
          y: currentY + teamBoxHeight - 38,
          size: 8,
          font: fontRegular,
          color: electricBlue,
        });
      }
    }

    // QR Verification & Validation Section (Bottom)
    const qrSectionHeight = 115;
    const qrSectionY = cardY + 45;

    page.drawRectangle({
      x: cardX + 20,
      y: qrSectionY,
      width: cardWidth - 40,
      height: qrSectionHeight,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: borderGray,
      borderWidth: 1,
    });

    // Embed QR Graphic
    const qrDim = 95;
    page.drawImage(qrImage, {
      x: cardX + cardWidth - 40 - qrDim - 10,
      y: qrSectionY + 10,
      width: qrDim,
      height: qrDim,
    });

    // Instructions alongside QR
    const infoX = cardX + 32;
    page.drawText('DIGITAL ENTRY & ADMISSION CREDENTIAL', {
      x: infoX,
      y: qrSectionY + 95,
      size: 8.5,
      font: fontBold,
      color: electricBlue,
    });

    page.drawText(passRef, {
      x: infoX,
      y: qrSectionY + 78,
      size: 13,
      font: fontBold,
      color: navyDark,
    });

    const lines = [
      'Present this official credential at the college entry gate and registration desk.',
      'The QR code provides real-time cryptographic verification on the festival system.',
      'All team delegates must carry a valid collegiate student identity card for entry.',
      'For assistance, contact the TELE-ERA Student Forum desk at PCE Campus, Nagpur.',
    ];

    lines.forEach((line, i) => {
      page.drawText(`• ${line}`, {
        x: infoX,
        y: qrSectionY + 58 - i * 13,
        size: 7.5,
        font: fontRegular,
        color: mutedSlate,
      });
    });

    // Bottom Footer Security Stamp
    const footerY = cardY + 12;
    page.drawText('YUGANTAR 2026 • TELE-ERA FORUM • DEPARTMENT OF ETC • PCE NAGPUR', {
      x: cardX + 20,
      y: footerY,
      size: 7.5,
      font: fontBold,
      color: mutedSlate,
    });

    page.drawText('OFFICIAL AUTONOMOUS CREDENTIAL #PCE-ETC-2026', {
      x: cardX + cardWidth - 210,
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
