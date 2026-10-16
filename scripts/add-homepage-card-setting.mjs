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

  const [rows] = await conn.execute(
    'SELECT * FROM site_settings WHERE setting_key = "homepage_hero_card_image"'
  );
  if (rows.length === 0) {
    await conn.execute(
      'INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type) VALUES (?, ?, ?, ?, ?)',
      [
        'homepage_hero_card_image',
        '/images/nexus-city/hero-futuristic-city-clouds.webp',
        'homepage',
        'Innovation Corridors Homepage Card Artwork',
        'image',
      ]
    );
    console.log('Inserted homepage_hero_card_image in site_settings.');
  } else {
    console.log('homepage_hero_card_image already exists:', rows[0].setting_value);
  }
  await conn.end();
}
main().catch(console.error);
