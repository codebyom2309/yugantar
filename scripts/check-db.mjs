import mysql from 'mysql2/promise';
import fs from 'fs';

async function run() {
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
  const [tables] = await conn.query('SHOW TABLES');
  console.log('Tables:', tables);
  const [columns] = await conn.query('DESCRIBE registrations');
  console.log('Registrations columns:', columns.map(c => c.Field));
  await conn.end();
}

run().catch(console.error);
