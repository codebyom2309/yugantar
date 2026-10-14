import fs from 'fs';
import mysql from 'mysql2/promise';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('Testing free track registration flow...');

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
  const testEmail = `free_test_${runId}@pce.ac.in`;

  // Temporarily toggle a competition (e.g. poster-competition) to free
  await conn.execute("UPDATE competitions SET is_paid = 0, registration_fee = 'Free' WHERE slug = 'poster-competition'");

  try {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitionSlug: 'poster-competition',
        formValues: {
          leaderName: 'Free Track Tester',
          leaderEmail: testEmail,
          leaderPhone: '9876543210',
          leaderCollege: 'PCE',
          leaderBranch: 'ETC',
          leaderSemester: 'VI',
          posterTitle: 'Green Energy Systems',
          teamSize: '1',
          // OMIT paymentId and paymentProof!
        },
        idempotencyKey: `free_idemp_${runId}`,
      }),
    });

    const data = await res.json();
    console.log('Registration HTTP Status:', res.status, data.status);
    if (!res.ok || !data.registrationId) {
      throw new Error(`Free track registration failed: ${JSON.stringify(data)}`);
    }

    const [rows] = await conn.execute(
      'SELECT payment_status, payment_id, payment_proof_url FROM registrations WHERE id = ?',
      [data.registrationId]
    );

    console.log('DB Record payment_status:', rows[0].payment_status);
    if (rows[0].payment_status !== 'free') {
      throw new Error(`Expected payment_status to be 'free', got '${rows[0].payment_status}'`);
    }

    console.log('✅ Free track registration passed with zero payment fields required and payment_status = free!');

    // Clean up
    await conn.execute('DELETE FROM registrations WHERE id = ?', [data.registrationId]);
  } finally {
    // Restore competition payment status
    await conn.execute("UPDATE competitions SET is_paid = 1, registration_fee = '₹150 per team' WHERE slug = 'poster-competition'");
    await conn.end();
  }
}

main().catch((err) => {
  console.error('❌ Free track test failed:', err);
  process.exit(1);
});
