import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const m = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const u = new URL(m[1]);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: parseInt(u.port || '4000', 10),
    user: u.username,
    password: u.password,
    database: u.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: true },
  });

  const [rows] = await conn.execute(
    'SELECT slug, allowed_semesters, eligibility FROM competitions WHERE slug = "mini-project-competition"'
  );
  console.log(rows);
  await conn.end();
}
main().catch(console.error);
