import mysql from 'mysql2/promise';
import fs from 'fs';

async function updateSettings() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const match = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const dbUrl = match[1];
  const url = new URL(dbUrl);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true }
  });

  const updates = [
    { key: 'hero_artwork', value: '/images/nexus-city/dreamy-sunrise.webp' },
    { key: 'hero_artwork_mobile', value: '/images/nexus-city/dreamy-sunrise.webp' },
    { key: 'event_organizers_text', value: 'Tele-Era Department Student Forum' }
  ];

  for (const u of updates) {
    await conn.execute(
      'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?',
      [u.value, u.key]
    );
    console.log(`Updated setting ${u.key} -> "${u.value}"`);
  }

  const [rows] = await conn.execute(
    'SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ("hero_artwork", "hero_artwork_mobile", "event_tagline", "event_subheading", "event_date", "event_iso_date", "event_organizers_text")'
  );
  console.log('\nVerified settings in DB:');
  rows.forEach(r => console.log(`${r.setting_key}: "${r.setting_value}"`));

  await conn.end();
}

updateSettings().catch(console.error);
