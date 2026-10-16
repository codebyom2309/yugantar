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

  const [rows] = await conn.execute(
    'SELECT competition_slug, name, role, phone, email, display_order, is_active, is_public FROM competition_coordinators ORDER BY competition_slug, display_order ASC'
  );

  const bySlug = {};
  for (const r of rows) {
    if (!bySlug[r.competition_slug]) bySlug[r.competition_slug] = [];
    bySlug[r.competition_slug].push(r);
  }

  for (const slug of Object.keys(bySlug)) {
    console.log(`\n=== ${slug} (${bySlug[slug].length} coordinators) ===`);
    console.table(bySlug[slug]);
  }

  await conn.end();
}

main().catch(console.error);
