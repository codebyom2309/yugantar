const mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const url = new URL(match[1]);
  const pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [rows] = await pool.query('SELECT id, submission_status, submission_error, created_at FROM registrations ORDER BY created_at DESC LIMIT 2');
  console.log(JSON.stringify(rows, null, 2));

  await pool.end();
}

check().catch(console.error);
