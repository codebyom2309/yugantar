import mysql from 'mysql2/promise';
import fs from 'fs';

async function run() {
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
  const [rows] = await conn.query(
    'SELECT slug, name, is_paid, registration_fee, qr_mode, upi_id, payee_name, require_utr, require_screenshot, registration_open FROM competitions ORDER BY slug'
  );
  console.table(rows);
  await conn.end();
}

run().catch(console.error);
