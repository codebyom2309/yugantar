import mysql from 'mysql2/promise';
import fs from 'fs';

async function patch() {
  console.log('--- Checking & patching payment columns in competitions table ---');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (!match) throw new Error('No DATABASE_URL found');
  const url = new URL(match[1]);

  const pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [cols] = await pool.query('DESCRIBE competitions');
  const existingCols = new Set(cols.map(c => c.Field));

  const colsToAdd = [
    { name: 'is_fee_fixed', def: 'TINYINT(1) DEFAULT 1' },
    { name: 'show_payment_qr', def: 'TINYINT(1) DEFAULT 1' },
  ];

  for (const col of colsToAdd) {
    if (!existingCols.has(col.name)) {
      console.log(`Adding column competitions.${col.name}...`);
      await pool.query(`ALTER TABLE competitions ADD COLUMN ${col.name} ${col.def}`);
      console.log(`✓ Added column competitions.${col.name}`);
    } else {
      console.log(`✓ Column competitions.${col.name} already exists.`);
    }
  }

  await pool.end();
  console.log('--- Payment schema check complete! ---');
}

patch().catch(err => {
  console.error('Patch error:', err);
  process.exit(1);
});
