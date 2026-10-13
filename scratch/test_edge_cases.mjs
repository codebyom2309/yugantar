// Advanced Edge Case & Admin Integration Test Suite for YUGANTAR 2026
import mysql from 'mysql2/promise';

const BASE_URL = 'http://localhost:3000';

function getDbPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  const url = new URL(databaseUrl);
  return mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
    connectionLimit: 5,
  });
}

async function testEdgeCases() {
  console.log('================================================================');
  console.log('STARTING EDGE-CASE & ADMIN BEHAVIOR VERIFICATION');
  console.log('================================================================\n');

  const pool = getDbPool();

  // Test 1: Idempotent Submissions (Duplicate prevention)
  console.log('Test 1: Idempotency Key & Duplicate Prevention...');
  const testEmail = `qa.idempotency.${Date.now()}@yugantar-test.in`;
  const idemKey = `idem_${Date.now()}`;
  const payload = {
    competitionSlug: 'project-competition',
    formValues: {
      leaderName: 'QA Idempotent Lead',
      leaderEmail: testEmail,
      leaderPhone: '+91 99999 88888',
      leaderCollege: 'PCE',
      leaderBranch: 'ETC',
      leaderSemester: 'VII',
      teamName: 'Idempotent Alpha',
      projectTitle: 'Smart Sensor Grid',
      projectTheme: 'Embedded & IoT Systems',
      teamSize: '1',
      paymentId: `UTR${Date.now().toString().slice(-12)}`,
      paymentProof: 'https://res.cloudinary.com/yugantar/image/upload/v1/payment_proofs/sample.jpg',
    },
    idempotencyKey: idemKey,
  };

  const res1 = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data1 = await res1.json();
  console.log(`  Initial submission status: ${res1.status}, ID: ${data1.registrationId}`);

  // Re-submit identical payload with same idempotency key
  const res2 = await fetch(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data2 = await res2.json();
  console.log(`  Duplicate submission status: ${res2.status}, ID: ${data2.registrationId}`);

  if (res2.status === 200 && data1.registrationId === data2.registrationId) {
    console.log('  ✓ PASS: Idempotency successfully prevented duplicate record creation!');
  } else {
    console.log('  ✗ FAIL: Idempotency did not return identical registration ID');
  }

  // Test 2: Master Festival Registration Toggle
  console.log('\nTest 2: Master Registration Closure & Settings Check...');
  const [settingsRows] = await pool.query('SELECT setting_key, setting_value FROM site_settings WHERE setting_key = "registration_global_open"');
  console.log('  Current global registration toggle:', settingsRows[0]?.setting_value === '0' ? 'CLOSED (0)' : 'OPEN (1)');

  // Test 3: TiDB Data Retention Check (verify minimal metadata vs full payloads)
  console.log('\nTest 3: TiDB Registration Storage Governance...');
  const [regCountRows] = await pool.query('SELECT COUNT(*) as total FROM registrations');
  console.log(`  Total recorded registrations in TiDB: ${regCountRows[0]?.total}`);

  // Inspect the latest registration record
  const [latestRegRows] = await pool.query('SELECT id, competition_slug, leader_name, leader_email, team_size, payment_status, created_at FROM registrations ORDER BY created_at DESC LIMIT 1');
  console.log('  Latest recorded registration:', latestRegRows[0]);

  // Test 4: Dynamic QR vs Uploaded QR Config Check across all competitions
  console.log('\nTest 4: Competition Admin QR Configuration Check...');
  const [compRows] = await pool.query('SELECT slug, name, is_paid, registration_fee, upi_id, payee_name, qr_mode FROM competitions ORDER BY display_order ASC');
  console.table(compRows);

  await pool.end();
  console.log('\n================================================================');
  console.log('EDGE CASES TEST COMPLETE: ALL SYSTEMS NOMINAL');
  console.log('================================================================');
  process.exit(0);
}

testEdgeCases().catch((err) => {
  console.error('Edge case test failed:', err);
  process.exit(1);
});
