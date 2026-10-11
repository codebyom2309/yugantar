 mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (!match) {
    console.error('No DATABASE_URL found');
    return;
  }
  const url = new URL(match[1]);
  const pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [cols] = await pool.query('DESCRIBE registrations');
  console.log('Columns in registrations table:');
  console.table(cols);

  const [rows] = await pool.query('SELECT id, competition_slug, leader_name, submission_status, created_at FROM registrations ORDER BY created_at DESC LIMIT 5');
  console.log('\nLatest registrations:');
  console.table(rows);

  await pool.end();
}

check().catch(console.error);
