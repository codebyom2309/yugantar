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

  await conn.execute("UPDATE competitions SET approved_domains = NULL WHERE slug = 'project-competition'");
  console.log('✓ Cleared approved_domains for project-competition in DB.');

  const [row] = await conn.execute("SELECT slug, approved_domains FROM competitions WHERE slug = 'project-competition'");
  console.log('Current DB row:', row[0]);

  await conn.end();
}

main().catch(console.error);
