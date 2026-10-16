import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const m = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const u = new URL(m[1]);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: parseInt(u.port || '4000', 10),
    user: u.username,
    password: u.password,
    database: u.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: true },
  });

  const [sheets] = await conn.execute('SELECT competition_slug, spreadsheet_url FROM registration_spreadsheets');
  for (const s of sheets) {
    const url = s.spreadsheet_url;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const sheetId = match[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      try {
        const res = await fetch(csvUrl, { method: 'HEAD' });
        console.log(`- ${s.competition_slug}: HTTP ${res.status} (${sheetId.substring(0, 10)}...)`);
      } catch (e) {
        console.log(`- ${s.competition_slug}: ERROR ${e.message}`);
      }
    }
  }

  await conn.end();
}
main().catch(console.error);
