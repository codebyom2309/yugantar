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

  const [cols] = await conn.execute('DESCRIBE competitions');
  console.log('competitions columns:', cols.map(c => c.Field));

  const [settings] = await conn.execute('SELECT setting_key, setting_value FROM site_settings');
  console.log('site_settings count:', settings.length);
  for (const s of settings) {
    console.log(`  ${s.setting_key} = ${s.setting_value?.substring(0, 80)}`);
  }

  const [coordCols] = await conn.execute('DESCRIBE competition_coordinators');
  console.log('competition_coordinators columns:', coordCols.map(c => c.Field));

  await conn.end();
}
main().catch(console.error);
