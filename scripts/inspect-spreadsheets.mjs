import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    const m = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (m) dbUrl = m[1];
  }
  const u = new URL(dbUrl);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: parseInt(u.port || '4000', 10),
    user: u.username,
    password: u.password,
    database: u.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: true },
  });

  console.log('=== REGISTRATION SPREADSHEETS TABLE ===');
  const [rows] = await conn.execute('SELECT * FROM registration_spreadsheets');
  console.log('Count:', rows.length);
  for (const r of rows) {
    console.log(r);
  }

  console.log('\n=== SITE SETTINGS (SPREADSHEET / GOOGLE / SYNC) ===');
  const [siteSettings] = await conn.execute(
    'SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE "%sheet%" OR setting_key LIKE "%google%" OR setting_key LIKE "%sync%" OR setting_key LIKE "%spread%"'
  );
  console.log(siteSettings);

  console.log('\n=== ALL SITE SETTINGS ===');
  const [allSettings] = await conn.execute('SELECT setting_key, setting_value FROM site_settings');
  console.log(allSettings);

  console.log('\n=== RECENT MINI PROJECT REGISTRATIONS ===');
  const [recentRegs] = await conn.execute(
    'SELECT id, competition_slug, leader_name, leader_email, submission_status, submission_error, submitted_at, created_at FROM registrations WHERE competition_slug LIKE "%mini%" ORDER BY created_at DESC LIMIT 10'
  );
  console.log(recentRegs);

  console.log('\n=== COMPETITIONS (GOOGLE / FORM / SHEET COLUMNS) ===');
  const [comps] = await conn.execute(
    'SELECT slug, google_form_id, google_form_url, form_response_url, acknowledgment_entry_id FROM competitions'
  );
  console.log(comps);

  await conn.end();
}

main().catch(console.error);
