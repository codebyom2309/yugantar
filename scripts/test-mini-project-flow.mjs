import fs from 'fs';
import mysql from 'mysql2/promise';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('================================================================');
  console.log('   RUNNING MINI PROJECT COMPETITION VERIFICATION TEST SUITE     ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Public Competition Details & Registration Pages
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: Public Competition Details & Registration Pages ---');
  try {
    const res = await fetch(`${BASE_URL}/competitions/mini-project-competition`);
    assert(res.status === 200, 'Mini project details page returns HTTP 200');
    const html = await res.text();
    assert(html.includes('Inter-Collegiate Mini Project Competition'), 'Contains correct competition name');
    assert(html.includes('Semester I') && (html.includes('&amp; V') || html.includes('& V') || html.includes('Semester V')), 'Eligibility displays Semester I & V');
    assert(html.includes('Dr. P. P. Ashtankar'), 'Includes coordinator Dr. P. P. Ashtankar');
    assert(html.includes('Summit Bhagat'), 'Includes student coordinator Summit Bhagat');

    // Also check registration page
    const regRes = await fetch(`${BASE_URL}/competitions/mini-project-competition/register`);
    assert(regRes.status === 200, 'Mini project registration page returns HTTP 200');
    const regHtml = await regRes.text();
    assert(regHtml.includes('₹200') || regHtml.includes('200'), 'Registration page displays saved ₹200 fee');
    assert(regHtml.includes('Semester I') && regHtml.includes('Semester V'), 'Registration page contains Semester I and Semester V instructions');
    assert(regHtml.includes('Inter-Collegiate Mini Project'), 'Registration page includes competition title');
  } catch (err) {
    assert(false, `Public page fetch error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Registration Form Field Specification & Options
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: Registration Form Specification & Dropdowns ---');
  try {
    const { getRegistrationFormBySlug, MINI_PROJECT_SEMESTER_OPTIONS, MINI_PROJECT_DOMAIN_OPTIONS } =
      await import('../src/data/registrationForms.ts');

    const form = getRegistrationFormBySlug('mini-project-competition');
    assert(!!form, 'Registration form config found for mini-project-competition');
    assert(form.googleFormId === '1FAIpQLScUlBGNuJhGt26oYhRCr6kIhGUdBNRIjV_GV3pE6JrRDcpHMg', 'Google Form ID matches');
    assert(form.acknowledgmentEntryId === '1885141004', 'Acknowledgment entry ID is 1885141004');
    assert(form.acknowledgmentLabel.includes('Semester I or Semester V'), 'Acknowledgment text contains Sem I or V and self-developed');

    // Check semester options are ONLY I and V
    assert(
      JSON.stringify(MINI_PROJECT_SEMESTER_OPTIONS) === JSON.stringify(['I', 'V']),
      'Mini project semester options are strictly ["I", "V"]'
    );

    // Check fields and entry IDs
    const fieldMap = Object.fromEntries(form.fields.map((f) => [f.key, f.entryId]));
    assert(fieldMap.leaderName === '1116015235', 'Leader Name entry ID = 1116015235');
    assert(fieldMap.leaderPhone === '476978279', 'Leader Phone entry ID = 476978279');
    assert(fieldMap.leaderEmail === '864910214', 'Leader Email entry ID = 864910214');
    assert(fieldMap.leaderCollege === '1617866879', 'Leader College entry ID = 1617866879');
    assert(fieldMap.leaderBranch === '632692128', 'Leader Branch entry ID = 632692128');
    assert(fieldMap.leaderSemester === '1466926962', 'Leader Semester entry ID = 1466926962');
    assert(fieldMap.teamName === '150563047', 'Team Name entry ID = 150563047');
    assert(fieldMap.projectTitle === '326353744', 'Project Title entry ID = 326353744');
    assert(fieldMap.projectDomain === '653625041', 'Project Domain entry ID = 653625041');
    assert(fieldMap.projectSynopsis === '1539019677', 'Project Synopsis Link entry ID = 1539019677');
    assert(fieldMap.teamSize === '1157156063', 'Team Size entry ID = 1157156063');

    // Member 2..4
    assert(fieldMap.member2Name === '1883140116', 'Member 2 Name entry ID = 1883140116');
    assert(fieldMap.member2College === '402210770', 'Member 2 College entry ID = 402210770');
    assert(fieldMap.member2Branch === '394794936', 'Member 2 Branch entry ID = 394794936');
    assert(fieldMap.member2Semester === '1829821730', 'Member 2 Semester entry ID = 1829821730');

    assert(fieldMap.member3Name === '1819364421', 'Member 3 Name entry ID = 1819364421');
    assert(fieldMap.member3College === '1734512471', 'Member 3 College entry ID = 1734512471');
    assert(fieldMap.member3Branch === '521047862', 'Member 3 Branch entry ID = 521047862');
    assert(fieldMap.member3Semester === '636671435', 'Member 3 Semester entry ID = 636671435');

    assert(fieldMap.member4Name === '5539947', 'Member 4 Name entry ID = 5539947');
    assert(fieldMap.member4College === '263292814', 'Member 4 College entry ID = 263292814');
    assert(fieldMap.member4Branch === '217244848', 'Member 4 Branch entry ID = 217244848');
    assert(fieldMap.member4Semester === '718000777', 'Member 4 Semester entry ID = 718000777');

    assert(fieldMap.paymentId === '858299247', 'Payment UTR entry ID = 858299247');
    assert(fieldMap.paymentProof === '217832625', 'Payment Proof entry ID = 217832625');
  } catch (err) {
    assert(false, `Form specification check error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Cloudinary Account B Routing & Failover
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: Cloudinary Account B Routing & Filebase Failover ---');
  try {
    // 3a. Primary upload test with dummy image
    const formData = new FormData();
    const dummyBlob = new Blob(['sample-payment-screenshot-content-data'], { type: 'image/png' });
    formData.append('file', dummyBlob, 'test-proof.png');
    formData.append('competitionSlug', 'mini-project-competition');

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 200, 'Upload endpoint returns HTTP 200');
    assert(
      uploadData.account === 'B' || uploadData.account === 'Filebase-S3-Vault',
      `Upload routed to Account B or Filebase fallback (result: ${uploadData.account})`
    );
    assert(!!uploadData.url, `Upload returned a valid URL: ${uploadData.url}`);

    // 3b. Failure failover test (header x-simulate-cloudinary-failure)
    const failoverFormData = new FormData();
    failoverFormData.append('file', dummyBlob, 'test-failover-proof.png');
    failoverFormData.append('competitionSlug', 'mini-project-competition');

    const failoverRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'x-simulate-cloudinary-failure': 'true' },
      body: failoverFormData,
    });
    const failoverData = await failoverRes.json();
    assert(failoverRes.status === 200, 'Cloudinary failure simulation returns HTTP 200 via fallback');
    assert(failoverData.storageProvider === 'filebase', 'Fallback activates Filebase object storage');
    assert(failoverData.fallbackUsed === true, 'fallbackUsed flag is true');
  } catch (err) {
    assert(false, `Upload testing error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Registration API Validation Tests
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 4: Registration Validation & Eligibility ---');

  const baseValidPayload = {
    competitionSlug: 'mini-project-competition',
    formValues: {
      leaderName: 'Test Leader',
      leaderPhone: '9876543210',
      leaderEmail: `test-mini-valid1-${Date.now()}@example.com`,
      leaderCollege: 'PCE',
      leaderBranch: 'ITC',
      leaderSemester: 'I',
      teamName: 'Smart Circuits',
      projectTitle: 'Automated Microcontroller Sentry',
      projectDomain: 'Embedded Systems / IoT',
      projectSynopsis: 'https://drive.google.com/file/d/12345/view',
      teamSize: '2',
      member2Name: 'Partner One',
      member2College: 'VNIT',
      member2Branch: 'ECE',
      member2Semester: 'V',
      paymentId: '123456789012',
      paymentProof: 'https://res.cloudinary.com/test/image/upload/v1/proof.png',
      acknowledged: 'true',
      confirmation: 'true',
    },
    acknowledged: true,
  };

  // 4a. Semester I + V valid inter-college team
  try {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseValidPayload),
    });
    const data = await res.json();
    assert(res.status === 200, `Valid Sem I + V inter-college team accepted (status: ${data.status})`);
    assert(data.finalFee === 100, `50% ITC discount correctly applied (normal: ${data.normalFee}, final: ${data.finalFee})`);
  } catch (err) {
    assert(false, `Valid team registration error: ${err.message}`);
  }

  // 4b. Semester V leader + Sem I member (all from other colleges)
  try {
    const nonPcePayload = {
      ...baseValidPayload,
      formValues: {
        ...baseValidPayload.formValues,
        leaderEmail: `test-mini-valid2-${Date.now()}@example.com`,
        leaderCollege: 'RCOEM',
        leaderBranch: 'CSE',
        leaderSemester: 'V',
        teamSize: '3',
        member2Name: 'Member Two',
        member2College: 'GHRCE',
        member2Branch: 'IoT',
        member2Semester: 'I',
        member3Name: 'Member Three',
        member3College: 'PIET',
        member3Branch: 'AI & DS',
        member3Semester: 'V',
      },
    };
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nonPcePayload),
    });
    const data = await res.json();
    assert(res.status === 200, `Multi-college team without PCE accepted (status: ${data.status})`);
    assert(data.finalFee === 200, `General fee ₹200 applied when no discount (finalFee: ${data.finalFee})`);
  } catch (err) {
    assert(false, `Non-PCE team registration error: ${err.message}`);
  }

  // 4c. Ineligible semester rejection: Test semesters II, III, IV, VI, VII, VIII
  const ineligibleSems = ['II', 'III', 'IV', 'VI', 'VII', 'VIII'];
  for (const sem of ineligibleSems) {
    try {
      const badPayload = {
        ...baseValidPayload,
        formValues: {
          ...baseValidPayload.formValues,
          leaderEmail: `test-mini-bad-${sem}-${Date.now()}@example.com`,
          leaderSemester: sem,
        },
      };
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badPayload),
      });
      assert(res.status === 400, `Leader with ineligible Semester ${sem} rejected with HTTP 400`);
    } catch (err) {
      assert(false, `Ineligible semester test error: ${err.message}`);
    }
  }

  // 4d. Member with ineligible semester
  try {
    const badMemberPayload = {
      ...baseValidPayload,
      formValues: {
        ...baseValidPayload.formValues,
        leaderEmail: `test-mini-badmember-${Date.now()}@example.com`,
        leaderSemester: 'I',
        member2Semester: 'III',
      },
    };
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badMemberPayload),
    });
    assert(res.status === 400, 'Member 2 with ineligible Semester III rejected with HTTP 400');
  } catch (err) {
    assert(false, `Ineligible member test error: ${err.message}`);
  }

  // 4e. Hidden member fields do not block 1-member or 2-member teams
  try {
    const hiddenFieldsPayload = {
      ...baseValidPayload,
      formValues: {
        ...baseValidPayload.formValues,
        leaderEmail: `test-mini-hidden1-${Date.now()}@example.com`,
        teamSize: '1',
        // Inactive member fields with invalid sem or empty names should be ignored
        member2Name: '',
        member2Semester: 'VII', // would be invalid if active
        member3Semester: 'IV',
      },
    };
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hiddenFieldsPayload),
    });
    const data = await res.json();
    assert(res.status === 200, `Team size 1 succeeds even if inactive member fields have data (status: ${data.status})`);
  } catch (err) {
    assert(false, `Hidden fields test error: ${err.message}`);
  }

  // 4f. Missing originality confirmation is rejected
  try {
    const noConfirmPayload = {
      ...baseValidPayload,
      formValues: {
        ...baseValidPayload.formValues,
        leaderEmail: `test-mini-noconfirm-${Date.now()}@example.com`,
        acknowledged: '',
        confirmation: '',
      },
      acknowledged: false,
    };
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noConfirmPayload),
    });
    assert(res.status === 400, 'Missing originality confirmation is rejected with HTTP 400');
  } catch (err) {
    assert(false, `No confirmation test error: ${err.message}`);
  }

  // 4g. Invalid synopsis link is rejected
  try {
    const badUrlPayload = {
      ...baseValidPayload,
      formValues: {
        ...baseValidPayload.formValues,
        leaderEmail: `test-mini-badurl-${Date.now()}@example.com`,
        projectSynopsis: 'not-a-valid-url',
      },
    };
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badUrlPayload),
    });
    assert(res.status === 422, 'Invalid synopsis link is rejected with HTTP 422');
  } catch (err) {
    assert(false, `Bad URL test error: ${err.message}`);
  }

  // 4h. Missing required active member details
  try {
    const missingMemberPayload = {
      ...baseValidPayload,
      formValues: {
        ...baseValidPayload.formValues,
        leaderEmail: `test-mini-missing-${Date.now()}@example.com`,
        teamSize: '3',
        // Member 3 details missing
        member3Name: '',
        member3College: '',
        member3Branch: '',
        member3Semester: '',
      },
    };
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missingMemberPayload),
    });
    assert(res.status === 422, 'Missing required active member details rejected with HTTP 422');
  } catch (err) {
    assert(false, `Missing member test error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Database Persistence & Admin Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 5: Database Persistence & Clean Roster Data ---');
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    const m = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (m) dbUrl = m[1];
  }

  if (dbUrl) {
    const u = new URL(dbUrl);
    const conn = await mysql.createConnection({
      host: u.hostname,
      port: parseInt(u.port || '4000', 10),
      user: u.username,
      password: u.password,
      database: u.pathname.replace('/', ''),
      ssl: { rejectUnauthorized: true },
    });

    const [testRows] = await conn.execute(
      `SELECT id, competition_slug, leader_name, leader_college, leader_branch, leader_semester,
              team_size, form_data, payment_id, payment_proof_url, final_fee
       FROM registrations
       WHERE leader_email LIKE 'test-mini-valid%' ORDER BY created_at DESC LIMIT 5`
    );

    assert(testRows.length > 0, `Database verified: ${testRows.length} test registrations saved`);
    if (testRows.length > 0) {
      const reg = testRows[0];
      assert(reg.competition_slug === 'mini-project-competition', 'Saved competition_slug = mini-project-competition');
      assert(!!reg.form_data, 'form_data column is populated with complete payload');

      const parsed = typeof reg.form_data === 'string' ? JSON.parse(reg.form_data) : reg.form_data;
      assert(parsed.projectTitle === 'Automated Microcontroller Sentry', 'Project title preserved in form_data');
      assert(parsed.projectDomain === 'Embedded Systems / IoT', 'Project domain preserved in form_data');
      assert(!!parsed.projectSynopsis, 'Project synopsis link preserved in form_data');
      assert(parsed.member2Name === 'Partner One' || parsed.member2Name === 'Member Two', 'Active member details preserved');
    }

    // Clean up our synthetic test registrations
    const [delResult] = await conn.execute("DELETE FROM registrations WHERE leader_email LIKE 'test-mini-%'");
    console.log(`  • Cleaned up ${delResult.affectedRows} synthetic test registration records from DB.`);

    await conn.end();
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Regression Check for All Other 8 Competitions
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 6: Regression Check Across All Other 8 Competitions ---');
  const { REGISTRATION_FORMS } = await import('../src/data/registrationForms.ts');
  const expectedSlugs = [
    'project-competition',
    'ppt-presentation',
    'breadboard-competition',
    'ideathon',
    'poster-competition',
    'e-gaming',
    'open-mic',
    'mock-placement-drive',
    'mini-project-competition',
  ];

  assert(REGISTRATION_FORMS.length === 9, `All 9 competition forms registered (found: ${REGISTRATION_FORMS.length})`);
  for (const slug of expectedSlugs) {
    const f = REGISTRATION_FORMS.find((x) => x.competitionSlug === slug);
    assert(!!f, `Competition track [${slug}] form config intact`);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
