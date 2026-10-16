import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const dbUrl = match[1];
  const url = new URL(dbUrl);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [members] = await conn.execute(
    'SELECT id, name, role, category, is_lead, is_published, display_order FROM organizer_members WHERE category = "turbo_bits" ORDER BY display_order ASC'
  );
  console.table(members);
  await conn.end();
}
main().catch(console.error);
