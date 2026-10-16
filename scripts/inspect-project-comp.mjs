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

  const [rows] = await conn.execute("SELECT id, slug, name, short_description, full_description, about, rules, expectations, faqs, highlights FROM competitions WHERE slug = 'project-competition'");
  console.log(JSON.stringify(rows[0], null, 2));
  await conn.end();
}
main().catch(console.error);
