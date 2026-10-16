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

  const [settings] = await conn.execute('SELECT setting_key, setting_value FROM site_settings');
  for (const s of settings) {
    if (s.setting_value && (s.setting_value.includes('http') || s.setting_value.includes('.in') || s.setting_value.includes('.app') || s.setting_value.includes('vercel'))) {
      console.log(`Setting [${s.setting_key}]: ${s.setting_value}`);
    }
  }

  // Also search ALL tables in DB for 'vercel'
  const [tables] = await conn.execute("SHOW TABLES");
  const dbName = url.pathname.replace('/', '') || 'yugantar';
  const tableKey = `Tables_in_${dbName}`;
  
  console.log('\nSearching for "vercel" across all tables...');
  for (const t of tables) {
    const tableName = t[tableKey];
    try {
      const [cols] = await conn.execute(`DESCRIBE \`${tableName}\``);
      for (const col of cols) {
        if (col.Type.includes('varchar') || col.Type.includes('text')) {
          const [matches] = await conn.execute(
            `SELECT * FROM \`${tableName}\` WHERE \`${col.Field}\` LIKE '%vercel%' LIMIT 5`
          );
          if (matches.length > 0) {
            console.log(`!!! MATCH in table ${tableName}, column ${col.Field}:`, matches);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  console.log('Search finished.');
  await conn.end();
}

main().catch(console.error);
