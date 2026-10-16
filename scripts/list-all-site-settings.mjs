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

  const [rows] = await conn.execute('SELECT setting_key, setting_value, updated_at FROM site_settings ORDER BY setting_key ASC');
  console.log(`Found ${rows.length} settings:`);
  rows.forEach(r => {
    console.log(`- ${r.setting_key}: ${r.setting_value}`);
  });

  await conn.end();
}

main().catch(console.error);
