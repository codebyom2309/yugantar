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

  const [cols] = await conn.execute("DESCRIBE `registrations`");
  console.log('Columns in registrations table:');
  cols.forEach(c => console.log(`- ${c.Field} (${c.Type}) Nullable: ${c.Null} Default: ${c.Default}`));

  const [count] = await conn.execute("SELECT COUNT(*) as total FROM registrations");
  console.log('\nTotal existing registrations:', count[0].total);

  // Check sample registration
  const [samples] = await conn.execute("SELECT * FROM registrations LIMIT 3");
  console.log('\nSample registrations (keys):', samples.length > 0 ? Object.keys(samples[0]) : 'None');

  await conn.end();
}

main().catch(console.error);
