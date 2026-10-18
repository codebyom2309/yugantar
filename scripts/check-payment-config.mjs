import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val;
  }
});

async function main() {
  console.log('Connecting to DB...');
  const pool = mysql.createPool({
    uri: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 3
  });

  try {
    const [rows] = await pool.execute('SELECT slug, name, registration_fee, payee_name, upi_id, qr_mode, qr_code_url, updated_at FROM competitions ORDER BY slug');
    console.log('\n=== DB COMPETITIONS PAYMENT CONFIGURATION ===');
    for (const r of rows) {
      console.log(`[${r.slug}] (updated: ${r.updated_at})`);
      console.log(`  Name: ${r.name}`);
      console.log(`  Fee: ${r.registration_fee}`);
      console.log(`  Payee Name: "${r.payee_name}"`);
      console.log(`  UPI ID: "${r.upi_id}"`);
      console.log(`  QR Mode: "${r.qr_mode}"`);
      console.log(`  QR Code URL: "${r.qr_code_url}"`);
    }
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
