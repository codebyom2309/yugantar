import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
  console.log('--- Checking & patching database for Department Discount Rules ---');
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  }
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  console.log('Connected to DB');

  // 1. Add discount columns to registrations table
  const [cols] = await connection.execute('DESCRIBE registrations');
  const existingCols = new Set(cols.map((c) => c.Field));

  const colsToAdd = [
    { name: 'normal_fee', def: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'discount_amount', def: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'discount_rule', def: 'VARCHAR(150) DEFAULT NULL' },
    { name: 'final_fee', def: 'VARCHAR(50) DEFAULT NULL' },
  ];

  for (const col of colsToAdd) {
    if (!existingCols.has(col.name)) {
      await connection.execute(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.def}`);
      console.log(`✓ Added column registrations.${col.name}`);
    } else {
      console.log(`• Column registrations.${col.name} already exists`);
    }
  }

  // 2. Ensure default Department Discount Rule in site_settings
  const defaultRule = {
    enabled: true,
    institution: 'PCE',
    department: 'ITC',
    discountPercentage: 50,
    applicableCompetitions: ['all'],
    effectiveFrom: '2026-10-01',
    effectiveTo: '2026-10-31',
  };

  const [existingSetting] = await connection.execute(
    'SELECT setting_key FROM site_settings WHERE setting_key = ?',
    ['department_discount_rules']
  );

  if (existingSetting.length === 0) {
    await connection.execute(
      `INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type)
       VALUES (?, ?, 'pricing', 'Department Discount Rules', 'json')`,
      ['department_discount_rules', JSON.stringify(defaultRule)]
    );
    console.log('✓ Added department_discount_rules setting');
  } else {
    console.log('• department_discount_rules setting already exists');
  }

  // 3. Ensure event_date is 21 October 2026 in site_settings
  await connection.execute(
    "UPDATE site_settings SET setting_value = '21 October 2026' WHERE setting_key = 'event_date'"
  );
  await connection.execute(
    "UPDATE site_settings SET setting_value = '2026-10-21' WHERE setting_key = 'event_iso_date'"
  );
  console.log('✓ Verified site_settings event_date = 21 October 2026');

  // 4. Update faqs in DB to 21 October 2026
  await connection.execute(
    "UPDATE faqs SET answer = REPLACE(answer, '19 October 2026', '21 October 2026') WHERE answer LIKE '%19 October 2026%'"
  );
  await connection.execute(
    "UPDATE faqs SET answer = REPLACE(answer, '22 October 2026', '21 October 2026') WHERE answer LIKE '%22 October 2026%'"
  );
  console.log('✓ Updated faqs event date to 21 October 2026');

  await connection.end();
  console.log('Migration complete!');
}

main().catch(console.error);
