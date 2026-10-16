import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  }
  const url = new URL(dbUrl);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [comps] = await conn.execute('SELECT id, slug, name, display_order, is_published, venue, event_date, allowed_semesters FROM competitions ORDER BY display_order ASC');
  console.log('=== Current Competitions in DB ===');
  console.table(comps);

  const [coords] = await conn.execute('SELECT id, competition_slug, name, role, phone, email, is_active FROM competition_coordinators ORDER BY competition_slug, display_order ASC');
  console.log(`\n=== Current Coordinators in DB (${coords.length}) ===`);
  console.table(coords);

  await conn.end();
}

main().catch(console.error);
