import fs from 'fs';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

const BASE_URL = 'http://localhost:3000';

function getDbConfig() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (!match) throw new Error('DATABASE_URL not found in .env.local');
  const url = new URL(match[1]);
  return {
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  };
}

const COMPS_TO_TEST = [
  {
    slug: 'breadboard-competition',
    name: 'Bread Board Competition',
    validSemester: 'III',
    ineligibleSemester: 'IV',
    samplePayload: {
      leaderName: 'Test Auditor Breadboard',
      leaderPhone: '9876543210',
      leaderEmail: 'audit.breadboard@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'ETC',
      leaderSemester: 'III',
      teamSize: '1',
      paymentId: 'UTR_TEST_BB_001',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
  {
    slug: 'e-gaming',
    name: 'E-Gaming (Free Fire & BGMI)',
    validSemester: 'VI',
    ineligibleSemester: null,
    samplePayload: {
      squadName: 'Test Alpha Squad',
      gameTitle: 'BGMI',
      leaderName: 'Test Auditor Gamer',
      leaderIGN: 'AuditSniper',
      leaderPhone: '9876543211',
      leaderEmail: 'audit.gaming@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'CSE',
      leaderSemester: 'VI',
      teamSize: '4',
      member2Name: 'Gamer Two',
      member2IGN: 'Gamer2_IGN',
      member3Name: 'Gamer Three',
      member3IGN: 'Gamer3_IGN',
      member4Name: 'Gamer Four',
      member4IGN: 'Gamer4_IGN',
      paymentId: 'UTR_TEST_EG_002',
      paymentProof: '/api/media/filebase?key=yugantar%2Ftest.png',
    },
  },
  {
    slug: 'ideathon',
    name: 'Ideathon',
    validSemester: 'IV',
    ineligibleSemester: null,
    samplePayload: {
      leaderName: 'Test Auditor Ideathon',
      leaderPhone: '9876543212',
      leaderEmail: 'audit.ideathon@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'AI & DS',
      leaderSemester: 'IV',
      teamName: 'EcoTech Innovators',
      ideaTitle: 'Autonomous Solar Microgrid',
      ideaTheme: 'Sustainability & Smart Energy',
      teamSize: '1',
      paymentId: 'UTR_TEST_ID_003',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
  {
    slug: 'mini-project-competition',
    name: 'Mini Project Competition',
    validSemester: 'III',
    ineligibleSemester: 'VII', // restricted to III & VI
    samplePayload: {
      leaderName: 'Test Auditor MiniProj',
      leaderPhone: '9876543213',
      leaderEmail: 'audit.miniproj@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'ETC',
      leaderSemester: 'III',
      teamName: 'Circuit Crafters',
      projectTitle: 'Smart IoT Moisture Monitor',
      projectTheme: 'Embedded Circuits & Sensors',
      teamSize: '1',
      paymentId: 'UTR_TEST_MP_004',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
  {
    slug: 'mock-placement-drive',
    name: 'Mock Placement Drive',
    validSemester: 'VI',
    ineligibleSemester: null,
    samplePayload: {
      leaderName: 'Test Auditor Placement',
      leaderPhone: '9876543214',
      leaderEmail: 'audit.placement@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'IT',
      leaderSemester: 'VI',
      prn: 'PRN20260901',
      cgpa: '8.85',
      preferredDomain: 'Software Engineering & Core VLSI',
      technicalSkills: 'Python, C++, SystemVerilog, React',
      resumeLink: 'https://drive.google.com/file/d/test-audit-resume/view',
      paymentId: 'UTR_TEST_PL_005',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
  {
    slug: 'open-mic',
    name: 'Open Mic Competition',
    validSemester: 'II',
    ineligibleSemester: null,
    samplePayload: {
      leaderName: 'Test Auditor OpenMic',
      leaderPhone: '9876543215',
      leaderEmail: 'audit.openmic@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'ETC',
      leaderSemester: 'II',
      performanceCategory: 'Poetry & Spoken Word',
      performanceLanguage: 'Hindi / English',
      performanceTitle: 'Echoes of Innovation',
      paymentId: 'UTR_TEST_OM_006',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
  {
    slug: 'poster-competition',
    name: 'Poster Competition',
    validSemester: 'IV',
    ineligibleSemester: null,
    samplePayload: {
      leaderName: 'Test Auditor Poster',
      leaderPhone: '9876543216',
      leaderEmail: 'audit.poster@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'ECE',
      leaderSemester: 'IV',
      posterTitle: '6G Telecom & Quantum Antennas',
      teamSize: '1',
      paymentId: 'UTR_TEST_PO_007',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
  {
    slug: 'ppt-presentation',
    name: 'PPT Presentation Competition',
    validSemester: 'VII',
    ineligibleSemester: 'V',
    samplePayload: {
      leaderName: 'Test Auditor PPT',
      leaderPhone: '9876543217',
      leaderEmail: 'audit.ppt@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'ETC',
      leaderSemester: 'VII',
      teamName: 'Research Wizards',
      presentationTitle: 'Terahertz Wireless Body Area Networks',
      pptTheme: 'Advanced Telecommunications',
      teamSize: '1',
      paymentId: 'UTR_TEST_PP_008',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
  {
    slug: 'project-competition',
    name: 'Project Competition',
    validSemester: 'VII',
    ineligibleSemester: null,
    samplePayload: {
      leaderName: 'Test Auditor Project',
      leaderPhone: '9876543218',
      leaderEmail: 'audit.project@test.pce.edu.in',
      leaderCollege: 'PCE',
      leaderBranch: 'ETC',
      leaderSemester: 'VII',
      teamName: 'RoboVision PCE',
      projectTitle: 'FPGA Accelerated LiDAR SLAM',
      projectTheme: 'Embedded Systems & Robotics',
      teamSize: '1',
      paymentId: 'UTR_TEST_PR_009',
      paymentProof: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    },
  },
];

async function main() {
  console.log('================================================================');
  console.log('YUGANTAR 2026 — PHASE 4: ALL 9 REGISTRATION FORMS END-TO-END QA');
  console.log('================================================================\n');

  const connection = await mysql.createConnection(getDbConfig());
  const createdIds = [];
  const matrix = [];

  try {
    for (const comp of COMPS_TO_TEST) {
      console.log(`\n----------------------------------------------------------------`);
      console.log(`TESTING ARENA: ${comp.name} (${comp.slug})`);
      console.log(`----------------------------------------------------------------`);

      const arenaResults = {
        name: comp.name,
        slug: comp.slug,
        missingFieldsValidation: false,
        invalidEmailValidation: false,
        invalidPhoneValidation: false,
        semesterEligibilityCheck: comp.ineligibleSemester ? false : 'N/A',
        successfulSubmission: false,
        databasePersistence: false,
        registrationModeTest: false,
        paymentStatusPending: false,
        idempotencyEnforced: false,
        passViewRendered: false,
        overallStatus: 'PASS',
      };

      // 1. Validation test: Missing required fields (empty object)
      const emptyRes = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionSlug: comp.slug, formValues: {} }),
      });
      const emptyJson = await emptyRes.json();
      if ((emptyRes.status === 422 || emptyRes.status === 400) && emptyJson.status === 'failed' && emptyJson.errors) {
        arenaResults.missingFieldsValidation = true;
        console.log(`  ✅ Empty required fields properly rejected (HTTP ${emptyRes.status})`);
      } else {
        arenaResults.missingFieldsValidation = false;
        arenaResults.overallStatus = 'FAIL';
        console.error(`  ❌ Empty submission not rejected as expected:`, emptyRes.status, emptyJson);
      }

      // 2. Validation test: Invalid email format
      const badEmailPayload = { ...comp.samplePayload, leaderEmail: 'invalid-email-address' };
      const badEmailRes = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionSlug: comp.slug, formValues: badEmailPayload }),
      });
      const badEmailJson = await badEmailRes.json();
      if ((badEmailRes.status === 422 || badEmailRes.status === 400) && badEmailJson.errors?.leaderEmail) {
        arenaResults.invalidEmailValidation = true;
        console.log(`  ✅ Invalid email format properly rejected (HTTP ${badEmailRes.status})`);
      } else {
        arenaResults.invalidEmailValidation = false;
        arenaResults.overallStatus = 'FAIL';
        console.error(`  ❌ Invalid email not caught:`, badEmailRes.status, badEmailJson);
      }

      // 3. Validation test: Invalid phone format
      const badPhonePayload = { ...comp.samplePayload, leaderPhone: '123' };
      const badPhoneRes = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionSlug: comp.slug, formValues: badPhonePayload }),
      });
      const badPhoneJson = await badPhoneRes.json();
      if ((badPhoneRes.status === 422 || badPhoneRes.status === 400) && badPhoneJson.errors?.leaderPhone) {
        arenaResults.invalidPhoneValidation = true;
        console.log(`  ✅ Invalid phone format properly rejected (HTTP ${badPhoneRes.status})`);
      } else {
        arenaResults.invalidPhoneValidation = false;
        arenaResults.overallStatus = 'FAIL';
        console.error(`  ❌ Invalid phone not caught:`, badPhoneRes.status, badPhoneJson);
      }

      // 4. Ineligible semester test (if competition has restriction)
      if (comp.ineligibleSemester) {
        const ineligPayload = { ...comp.samplePayload, leaderSemester: comp.ineligibleSemester };
        const ineligRes = await fetch(`${BASE_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitionSlug: comp.slug, formValues: ineligPayload }),
        });
        const ineligJson = await ineligRes.json();
        if (ineligRes.status === 400 && ineligJson.error?.includes('not eligible')) {
          arenaResults.semesterEligibilityCheck = true;
          console.log(`  ✅ Ineligible semester (${comp.ineligibleSemester}) rejected: ${ineligJson.error}`);
        } else {
          arenaResults.semesterEligibilityCheck = false;
          arenaResults.overallStatus = 'FAIL';
          console.error(`  ❌ Ineligible semester allowed or wrong error:`, ineligRes.status, ineligJson);
        }
      }

      // 5. Successful submission with valid test payload
      const idempotencyKey = `audit-${comp.slug}-${Date.now()}-${randomUUID()}`;
      const validRes = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionSlug: comp.slug,
          formValues: comp.samplePayload,
          idempotencyKey,
        }),
      });
      const validJson = await validRes.json();

      if (validRes.status === 200 && validJson.status === 'submitted' && validJson.registrationId) {
        arenaResults.successfulSubmission = true;
        createdIds.push(validJson.registrationId);
        console.log(`  ✅ Valid registration accepted: ID ${validJson.registrationId} (mode: ${validJson.mode})`);

        // Check database persistence
        const [rows] = await connection.query(
          'SELECT id, competition_slug, leader_name, leader_email, leader_phone, registration_mode, payment_status, verification_token FROM registrations WHERE id = ?',
          [validJson.registrationId]
        );

        if (rows.length > 0) {
          const rec = rows[0];
          arenaResults.databasePersistence = true;
          arenaResults.registrationModeTest = rec.registration_mode === 'TEST';
          arenaResults.paymentStatusPending = rec.payment_status === 'pending';

          console.log(`  ✅ DB Verified: ID=${rec.id}, mode=${rec.registration_mode}, payment=${rec.payment_status}, token=${rec.verification_token ? 'Present' : 'Missing'}`);

          if (!arenaResults.registrationModeTest || !arenaResults.paymentStatusPending) {
            arenaResults.overallStatus = 'FAIL';
          }

          // Test Pass Page render
          const passRes = await fetch(`${BASE_URL}/pass/${rec.id}`);
          if (passRes.status === 200) {
            const passHtml = await passRes.text();
            if (passHtml.includes(comp.samplePayload.leaderName)) {
              arenaResults.passViewRendered = true;
              console.log(`  ✅ Pass Page rendered successfully with participant credentials.`);
            } else {
              console.warn(`  ⚠️ Pass page loaded but participant name missing in text.`);
            }
          } else {
            console.error(`  ❌ Pass page returned status ${passRes.status}`);
            arenaResults.overallStatus = 'FAIL';
          }
        } else {
          arenaResults.databasePersistence = false;
          arenaResults.overallStatus = 'FAIL';
          console.error(`  ❌ Registration record not found in TiDB Cloud!`);
        }

        // Test Idempotency: Submit again with same key
        const dupRes = await fetch(`${BASE_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitionSlug: comp.slug,
            formValues: comp.samplePayload,
            idempotencyKey,
          }),
        });
        const dupJson = await dupRes.json();
        if (dupRes.status === 200 && dupJson.duplicate === true) {
          arenaResults.idempotencyEnforced = true;
          console.log(`  ✅ Idempotency enforced: duplicate submission safely caught and deduplicated.`);
        } else {
          arenaResults.idempotencyEnforced = false;
          arenaResults.overallStatus = 'FAIL';
          console.error(`  ❌ Duplicate submission not handled idempotently:`, dupJson);
        }
      } else {
        arenaResults.successfulSubmission = false;
        arenaResults.overallStatus = 'FAIL';
        console.error(`  ❌ Registration submission failed:`, validRes.status, validJson);
      }

      matrix.push(arenaResults);
    }

    console.log(`\n================================================================`);
    console.log(`CLEANING UP AUDIT TEST RECORDS`);
    console.log(`================================================================`);
    for (const id of createdIds) {
      await connection.query('DELETE FROM registrations WHERE id = ?', [id]);
      console.log(`  [CLEANUP] Deleted test registration record ${id}`);
    }

    console.log(`\n================================================================`);
    console.log(`PHASE 4 REGISTRATION FORM QA MATRIX`);
    console.log(`================================================================`);
    console.table(
      matrix.map((m) => ({
        Arena: m.name,
        Slug: m.slug,
        'Empty Form Block': m.missingFieldsValidation ? 'PASS' : 'FAIL',
        'Email Valid': m.invalidEmailValidation ? 'PASS' : 'FAIL',
        'Phone Valid': m.invalidPhoneValidation ? 'PASS' : 'FAIL',
        'Sem Gate': m.semesterEligibilityCheck === 'N/A' ? 'N/A' : m.semesterEligibilityCheck ? 'PASS' : 'FAIL',
        Submission: m.successfulSubmission ? 'PASS' : 'FAIL',
        'DB Persist': m.databasePersistence ? 'PASS' : 'FAIL',
        'Mode=TEST': m.registrationModeTest ? 'PASS' : 'FAIL',
        'Pay=Pending': m.paymentStatusPending ? 'PASS' : 'FAIL',
        Idempotent: m.idempotencyEnforced ? 'PASS' : 'FAIL',
        PassRender: m.passViewRendered ? 'PASS' : 'FAIL',
        STATUS: m.overallStatus,
      }))
    );

    const allPassed = matrix.every((m) => m.overallStatus === 'PASS');
    console.log(`\nOVERALL PHASE 4 RESULT: ${allPassed ? '✅ ALL 9 FORMS PASSED' : '❌ SOME FORMS FAILED'}`);

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Fatal Phase 4 error:', err);
  process.exit(1);
});
