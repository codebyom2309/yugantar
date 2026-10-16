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

  const [tables] = await conn.execute('SHOW TABLES');
  console.log('Tables in database:', tables.map((t) => Object.values(t)[0]));

  try {
    const [audit] = await conn.execute(
      'SELECT * FROM audit_log WHERE details LIKE "%dishant%" OR details LIKE "%83e58879%" OR details LIKE "%74c5dc63%"'
    );
    console.log('Audit log matches count:', audit.length);
    for (const a of audit) {
      console.log(a);
    }
  } catch (e) {
    console.log('Audit error:', e.message);
  }

  await conn.end();
}
main().catch(console.error);
