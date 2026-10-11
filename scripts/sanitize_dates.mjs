import mysql from 'mysql2/promise';
import fs from 'fs';

async function sanitize() {
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

  const [res] = await conn.execute(
    "UPDATE competitions SET event_date = NULL WHERE event_date = 'null' OR event_date = '' OR TRIM(event_date) = ''"
  );
  console.log('Sanitized competitions event_date to NULL, affected rows:', res.affectedRows);

  const [comps] = await conn.execute('SELECT slug, event_date FROM competitions');
  comps.forEach(c => console.log(`${c.slug}: event_date = ${c.event_date === null ? 'NULL' : `"${c.event_date}"`}`));

  await conn.end();
}

sanitize().catch(console.error);
