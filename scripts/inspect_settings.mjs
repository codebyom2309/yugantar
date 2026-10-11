import mysql from 'mysql2/promise';
import fs from 'fs';

async function check() {
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
  const [rows] = await conn.execute('SELECT setting_key, setting_value FROM site_settings');
  console.log('Site settings count:', rows.length);
  rows.forEach(r => console.log(`${r.setting_key}: "${r.setting_value}"`));

  const [comps] = await conn.execute('SELECT slug, banner_image, card_image FROM competitions LIMIT 5');
  console.log('\nCompetitions sample:');
  comps.forEach(c => console.log(c.slug, 'banner:', c.banner_image, 'card:', c.card_image));
  
  await conn.end();
}
check().catch(console.error);
