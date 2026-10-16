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

  const [cols] = await conn.execute("DESCRIBE `competitions`");
  console.log('Columns in competitions table:');
  cols.forEach(c => console.log(`- ${c.Field} (${c.Type})`));

  await conn.end();
}

main().catch(console.error);
