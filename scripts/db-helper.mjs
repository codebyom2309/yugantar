import fs from 'fs';
import mysql from 'mysql2/promise';

export async function getDbConnection() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split(/\r?\n/);
  let dbUrl = '';
  for (const l of lines) {
    if (l.startsWith('DATABASE_URL=')) {
      dbUrl = l.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '');
      break;
    }
  }
  const url = new URL(dbUrl);
  return await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });
}

async function main() {
  const query = process.argv[2] || 'SHOW TABLES';
  const conn = await getDbConnection();
  const [rows] = await conn.query(query);
  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}

if (process.argv[1]?.endsWith('db-helper.mjs')) {
  main().catch(console.error);
}
