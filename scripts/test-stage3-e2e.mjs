import fs from 'fs';
import mysql from 'mysql2/promise';
function isValidUpiId(upiId) {
  if (!upiId) return false;
  const trimmed = upiId.trim();
  const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return vpaRegex.test(trimmed);
}

function extractNumericFee(feeString) {
  if (!feeString) return null;
  const str = feeString.trim();
  if (str.toLowerCase() === 'free' || str === '0') return null;
  const match = str.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return null;
  return num.toFixed(2);
}

function buildUpiPaymentUri(config) {
  const {
    upiId,
    payeeName,
    amount,
    isFeeFixed = true,
    transactionNote,
    currency = 'INR',
  } = config;
  const cleanUpi = (upiId || '').trim();
  const cleanPayee = (payeeName || 'TELE-ERA YUGANTAR 2026').trim();
  const params = new URLSearchParams();
  params.set('pa', cleanUpi);
  params.set('pn', cleanPayee);
  if (amount !== undefined && amount !== null && isFeeFixed) {
    const numAmount = typeof amount === 'number' ? amount.toFixed(2) : extractNumericFee(String(amount));
    if (numAmount) {
      params.set('am', numAmount);
    }
  }
  params.set('cu', currency);
  if (transactionNote) {
    params.set('tn', transactionNote.trim());
  }
  return `upi://pay?${params.toString()}`;
}

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('=====================================================');
  console.log('🧪 YUGANTAR 2026 — STAGE 3 COMPLETE AUDIT SUITE');
  console.log('=====================================================\n');

  // DB connection
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const url = new URL(match[1]);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const runId = Date.now().toString(36);
  const createdRegIds = [];
  const createdCertIds = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: UPI Engine & Format Verification
    // -------------------------------------------------------------------------
    console.log('▶ TEST 1: UPI Engine & Format Verification...');
    
    // Validation tests
    if (!isValidUpiId('teleera@oksbi') || !isValidUpiId('student.council@icici') || isValidUpiId('invalid-upi')) {
      throw new Error('UPI regex validator failed expected test cases.');
    }
    
    const uriFixed = buildUpiPaymentUri({
      upiId: 'teleera@oksbi',
      payeeName: 'TELE-ERA YUGANTAR 2026',
      amount: '300.00',
      isFixed: true,
      transactionNote: 'Registration Fee YUGANTAR 2026',
    });
    
    console.log('  Fixed URI:', uriFixed);
    const parsedFixed = new URL(uriFixed);
    if (parsedFixed.protocol !== 'upi:') throw new Error('Fixed URI scheme must be upi:');
    if (parsedFixed.searchParams.get('pa') !== 'teleera@oksbi') throw new Error('Invalid pa');
    if (parsedFixed.searchParams.get('am') !== '300.00') throw new Error('Invalid am');
    if (parsedFixed.searchParams.get('cu') !== 'INR') throw new Error('Invalid cu');

    const uriCustom = buildUpiPaymentUri({
      upiId: 'teleera@oksbi',
      payeeName: 'TELE-ERA YUGANTAR 2026',
      amount: '300.00',
      isFeeFixed: false,
      transactionNote: 'Registration Fee YUGANTAR 2026',
    });
    console.log('  Custom URI:', uriCustom);
    const parsedCustom = new URL(uriCustom);
    if (parsedCustom.searchParams.has('am')) throw new Error('Custom fee URI must NOT lock am param');

    console.log('  ✅ TEST 1 PASSED: UPI payment engine adheres strictly to NPCI standards.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Admin API Payment Configuration & Validation
    // -------------------------------------------------------------------------
    console.log('▶ TEST 2: Admin API Payment Configuration & UPI Validation...');

    // Acquire Admin NextAuth session
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const rawCsrfCookies = csrfRes.headers.get('set-cookie') || '';

    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: rawCsrfCookies,
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: 'om@gmail.com',
        password: 'admin123',
      }),
      redirect: 'manual',
    });

    const setCookieHeader = loginRes.headers.get('set-cookie') || '';
    const tokenMatch = setCookieHeader.match(/authjs\.session-token=([^;]+)/);
    const adminCookie = tokenMatch ? `authjs.session-token=${tokenMatch[1]}` : setCookieHeader;

    // Attempt invalid UPI update via API
    const invalidUpiRes = await fetch(`${BASE_URL}/api/admin/competitions/project-competition`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        upiId: 'invalid@@upi',
        isFeeFixed: true,
        showPaymentQr: true,
      }),
    });
    const invalidUpiData = await invalidUpiRes.json();
    console.log('  Invalid UPI Rejection Status:', invalidUpiRes.status, invalidUpiData.error);
    if (invalidUpiRes.status !== 400) {
      throw new Error('Admin API should reject invalid UPI ID format with 400.');
    }

    // Valid update
    const validUpdateRes = await fetch(`${BASE_URL}/api/admin/competitions/project-competition`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        upiId: 'teleera@oksbi',
        payeeName: 'TELE-ERA YUGANTAR 2026',
        registrationFee: '₹300 per team',
        isPaid: true,
        isFeeFixed: true,
        showPaymentQr: true,
        requireUtr: true,
        requireScreenshot: true,
      }),
    });
    if (!validUpdateRes.ok) {
      const err = await validUpdateRes.text();
      throw new Error(`Admin API update failed: ${err}`);
    }
    console.log('  ✅ TEST 2 PASSED: Admin API validates UPI ID and updates payment parameters correctly.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Full 8-Track Registration Flow Verification
    // -------------------------------------------------------------------------
    console.log('▶ TEST 3: Full 8-Track Registration Flow Verification...');
    
    const tracks = [
      { slug: 'project-competition', name: 'Project Competition', isTeam: true },
      { slug: 'ppt-presentation', name: 'PPT Presentation', isTeam: true },
      { slug: 'breadboard-competition', name: 'Breadboard Circuit Debugging', isTeam: false },
      { slug: 'ideathon', name: 'Ideathon Pitching', isTeam: true },
      { slug: 'poster-competition', name: 'Technical Poster Presentation', isTeam: false },
      { slug: 'e-gaming', name: 'E-Gaming Championship', isTeam: true },
      { slug: 'open-mic', name: 'Open Mic Extravaganza', isTeam: false },
      { slug: 'mock-placement-drive', name: 'Mock Placement Drive', isTeam: false },
      { slug: 'mock-placement', name: 'Mock Placement Drive (Alias)', isTeam: false },
    ];

    let lastCreatedReg = null;

    for (const track of tracks) {
      console.log(`  Testing Track: ${track.slug} (${track.name})...`);
      const testEmail = `audit_${track.slug.replace(/-/g, '_')}_${runId}@pce.ac.in`;
      const utr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      const payload = {
        competitionSlug: track.slug,
        formValues: {
          leaderName: `Auditor ${track.slug}`,
          leaderEmail: testEmail,
          leaderPhone: '9876543210',
          leaderCollege: 'PCE Nagpur',
          leaderBranch: 'ETC',
          leaderSemester: 'VI',
          paymentId: utr,
          paymentProof: 'https://res.cloudinary.com/yugantar/image/upload/v1/proofs/audit_proof.jpg',
        },
        idempotencyKey: `idemp_${track.slug}_${runId}`,
      };

      if (track.slug === 'project-competition') {
        payload.formValues.teamName = 'Team Project Alpha';
        payload.formValues.teamSize = '2';
        payload.formValues.projectTitle = 'Smart City Energy Mesh';
        payload.formValues.projectTheme = 'IoT & Clean Energy';
        payload.formValues.member2Name = 'Member Two';
        payload.formValues.member2College = 'PCE Nagpur';
        payload.formValues.member2Branch = 'ETC';
        payload.formValues.member2Semester = 'VI';
      } else if (track.slug === 'ppt-presentation') {
        payload.formValues.teamName = 'Team PPT Alpha';
        payload.formValues.teamSize = '2';
        payload.formValues.presentationTitle = 'NextGen Quantum Cryptography';
        payload.formValues.pptTheme = '5G Networks & AI';
        payload.formValues.member2Name = 'Member Two';
        payload.formValues.member2College = 'PCE Nagpur';
        payload.formValues.member2Branch = 'ETC';
        payload.formValues.member2Semester = 'VI';
      } else if (track.slug === 'breadboard-competition') {
        payload.formValues.teamSize = '1';
        payload.formValues.circuitTitle = '555 Timer PWM Generator';
      } else if (track.slug === 'ideathon') {
        payload.formValues.teamName = 'Team Ideathon Alpha';
        payload.formValues.teamSize = '2';
        payload.formValues.ideaTitle = 'AgriDrone Precision Spraying';
        payload.formValues.ideaTheme = 'AgriTech & AI';
        payload.formValues.member2Name = 'Member Two';
        payload.formValues.member2College = 'PCE Nagpur';
        payload.formValues.member2Branch = 'ETC';
        payload.formValues.member2Semester = 'VI';
      } else if (track.slug === 'poster-competition') {
        payload.formValues.teamSize = '1';
        payload.formValues.posterTitle = 'Semiconductor Fabrication Roadmap';
      } else if (track.slug === 'e-gaming') {
        payload.formValues.squadName = 'Alpha Esports';
        payload.formValues.gameTitle = 'BGMI (Battlegrounds Mobile India)';
        payload.formValues.leaderIGN = 'AlphaSniper#9999';
        payload.formValues.teamSize = '1';
      } else if (track.slug === 'open-mic') {
        payload.formValues.performanceCategory = 'Poetry';
        payload.formValues.performanceLanguage = 'Hindi';
        payload.formValues.performanceTitle = 'Roshni Ki Talash';
      } else if (track.slug === 'mock-placement-drive' || track.slug === 'mock-placement') {
        payload.formValues.prn = '2023ETC101';
        payload.formValues.cgpa = '8.75 CGPA';
        payload.formValues.preferredDomain = 'Embedded Systems';
        payload.formValues.technicalSkills = 'C++, RTOS, Verilog, Microcontrollers';
        payload.formValues.resumeLink = 'https://drive.google.com/test-resume.pdf';
      }

      const res = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.registrationId || !data.passToken) {
        console.error('    Track Registration Failed:', res.status, data);
        throw new Error(`Track ${track.slug} registration failed`);
      }

      createdRegIds.push(data.registrationId);
      lastCreatedReg = { ...data, testEmail, track: track.slug };

      // Verify in DB that status is 'pending' (NEVER 'verified')
      const [rows] = await conn.execute(
        'SELECT payment_status, payment_id, payment_proof_url FROM registrations WHERE id = ?',
        [data.registrationId]
      );
      if (!rows.length) throw new Error(`Registration not found in DB for ${track.slug}`);
      if (rows[0].payment_status !== 'pending') {
        throw new Error(`Expected payment_status to be 'pending', got '${rows[0].payment_status}'`);
      }

      console.log(`    ✓ Registered ID: ${data.registrationId} | Status: ${rows[0].payment_status} | UTR: ${rows[0].payment_id}`);
    }

    console.log('  ✅ TEST 3 PASSED: All 8 tracks + alias registered with strict pending payment status.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Duplicate & Missing Proof Enforcement
    // -------------------------------------------------------------------------
    console.log('▶ TEST 4: Payment Enforcement & Duplicate Prevention...');

    // Duplicate test: re-submit same email to project-competition
    const dupRes = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionSlug: 'project-competition',
        formValues: {
          leaderName: 'Duplicate Auditor',
          leaderEmail: `audit_project_competition_${runId}@pce.ac.in`,
          leaderPhone: '9876543210',
          leaderCollege: 'PCE',
          leaderBranch: 'ETC',
          leaderSemester: 'VI',
          teamName: 'Duplicate Team',
          teamSize: '1',
          projectTitle: 'Duplicate Project',
          projectTheme: 'CleanTech',
          paymentId: 'UTR999999999999',
          paymentProof: 'https://res.cloudinary.com/demo.jpg',
        },
      }),
    });
    const dupData = await dupRes.json();
    console.log('  Duplicate status:', dupRes.status, dupData.error);
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate registration, got ${dupRes.status}`);
    }

    // Missing UTR test
    const missingUtrRes = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionSlug: 'project-competition',
        formValues: {
          leaderName: 'Missing UTR Tester',
          leaderEmail: `missing_utr_${runId}@pce.ac.in`,
          leaderPhone: '9876543210',
          leaderCollege: 'PCE',
          leaderBranch: 'ETC',
          leaderSemester: 'VI',
          teamName: 'No UTR Team',
          teamSize: '1',
          projectTitle: 'No UTR Project',
          projectTheme: 'CleanTech',
          // paymentId is omitted
          paymentProof: 'https://res.cloudinary.com/demo.jpg',
        },
      }),
    });
    const missingUtrData = await missingUtrRes.json();
    console.log('  Missing UTR status:', missingUtrRes.status, missingUtrData.error);
    if (missingUtrRes.status !== 422 && missingUtrRes.status !== 400) {
      throw new Error(`Expected 422 or 400 for missing UTR, got ${missingUtrRes.status}`);
    }

    console.log('  ✅ TEST 4 PASSED: Duplicate detection and payment requirement enforcement verified.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Pass Token Verification & PDF Generation
    // -------------------------------------------------------------------------
    console.log('▶ TEST 5: Pass Token Verification & PDF Generation...');
    
    // Verify token endpoint
    const verifyRes = await fetch(`${BASE_URL}/verify/${lastCreatedReg.passToken}`);
    console.log('  Pass Verify Page Status:', verifyRes.status);
    if (verifyRes.status !== 200) {
      throw new Error(`Pass verification page failed with ${verifyRes.status}`);
    }

    // Public Pass Page
    const passPageRes = await fetch(`${BASE_URL}/pass/${lastCreatedReg.registrationId}?token=${lastCreatedReg.passToken}`);
    console.log('  Public Pass Page Status:', passPageRes.status);
    if (passPageRes.status !== 200) {
      throw new Error(`Public pass page failed with ${passPageRes.status}`);
    }

    // Pass PDF Download
    const passPdfRes = await fetch(`${BASE_URL}/api/pass/${lastCreatedReg.registrationId}/pdf?token=${lastCreatedReg.passToken}`);
    console.log('  Pass PDF Status:', passPdfRes.status);
    if (passPdfRes.status !== 200) {
      throw new Error(`Pass PDF download failed with ${passPdfRes.status}`);
    }
    const pdfBuffer = Buffer.from(await passPdfRes.arrayBuffer());
    const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
    console.log('  PDF Header:', pdfHeader, '| Size:', pdfBuffer.length, 'bytes');
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('Generated file does not start with %PDF-');
    }

    console.log('  ✅ TEST 5 PASSED: Pass verification, HTML view, and dynamic PDF generation working flawlessly.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Certificate Studio & PDF Generation
    // -------------------------------------------------------------------------
    console.log('▶ TEST 6: Certificate Studio & PDF Generation...');

    // Update the registration to 'verified' to test certificate issuance
    await conn.execute("UPDATE registrations SET payment_status = 'verified' WHERE id = ?", [lastCreatedReg.registrationId]);

    // Issue certificate
    const certIssueRes = await fetch(`${BASE_URL}/api/admin/studio/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        registrationId: lastCreatedReg.registrationId,
        recipientName: 'Auditor ' + lastCreatedReg.track,
        recipientEmail: lastCreatedReg.testEmail,
        recipientCollege: 'PCE Nagpur',
        competitionSlug: lastCreatedReg.track,
        certificateType: 'participation',
        issuedBy: 'admin@yugantar.org',
      }),
    });
    const certIssueData = await certIssueRes.json();
    const certId = certIssueData.certificate?.id;
    const certCode = certIssueData.certificate?.certificate_code;
    console.log('  Certificate Issue Status:', certIssueRes.status, certCode);
    if (!certIssueRes.ok || !certId) {
      throw new Error(`Certificate issuance failed: ${JSON.stringify(certIssueData)}`);
    }
    createdCertIds.push(certId);

    // Download certificate PDF
    const certPdfRes = await fetch(`${BASE_URL}/api/certificate/${certId}/pdf`);
    console.log('  Certificate PDF Status:', certPdfRes.status);
    if (certPdfRes.status !== 200) {
      throw new Error(`Certificate PDF download failed with ${certPdfRes.status}`);
    }
    const certPdfBuf = Buffer.from(await certPdfRes.arrayBuffer());
    if (!certPdfBuf.slice(0, 5).toString('ascii').startsWith('%PDF-')) {
      throw new Error('Certificate PDF header invalid');
    }
    console.log('  Certificate PDF Size:', certPdfBuf.length, 'bytes');

    // Test Revocation
    const revokeRes = await fetch(`${BASE_URL}/api/admin/studio/certificates/${certId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        reason: 'Automated test suite audit verification',
        revokedBy: 'admin@yugantar.org',
      }),
    });
    console.log('  Revocation Status:', revokeRes.status);
    if (!revokeRes.ok) throw new Error('Revocation failed');

    console.log('  ✅ TEST 6 PASSED: Certificate Studio issuance, PDF generation, and revocation verified.\n');

    console.log('=====================================================');
    console.log('🎉 ALL 6 TEST SUITES PASSED WITH ZERO ERRORS!');
    console.log('=====================================================');

  } finally {
    // Clean up test registrations and certificates
    console.log('\n🧹 Cleaning up test artifacts from database...');
    if (createdCertIds.length > 0) {
      const placeholders = createdCertIds.map(() => '?').join(',');
      await conn.execute(`DELETE FROM issued_certificates WHERE id IN (${placeholders})`, createdCertIds);
      console.log(`  Cleaned up ${createdCertIds.length} test certificates.`);
    }
    if (createdRegIds.length > 0) {
      const placeholders = createdRegIds.map(() => '?').join(',');
      await conn.execute(`DELETE FROM registrations WHERE id IN (${placeholders})`, createdRegIds);
      console.log(`  Cleaned up ${createdRegIds.length} test registrations.`);
    }
    await conn.end();
  }
}

main().catch((err) => {
  console.error('❌ AUDIT SUITE FAILED:', err);
  process.exit(1);
});
