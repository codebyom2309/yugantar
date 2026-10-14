import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
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

  const [rows] = await conn.query('SELECT id, title, type, paper_size, orientation, is_published, is_global, version FROM pass_templates');
  console.log('--- ALL PASS TEMPLATES IN DATABASE ---');
  console.table(rows);

  const [assignments] = await conn.query('SELECT * FROM competition_template_assignments');
  console.log('\n--- TEMPLATE ASSIGNMENTS ---');
  console.table(assignments);

  await conn.end();
}

main().catch(console.error);
