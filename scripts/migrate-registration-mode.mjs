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

  console.log('--- Step 1: Checking columns in `registrations` ---');
  const [cols] = await conn.execute("DESCRIBE `registrations`");
  const colNames = cols.map(c => c.Field);
  
  if (!colNames.includes('registration_mode')) {
    console.log('Adding `registration_mode` column to `registrations` table...');
    await conn.execute(
      "ALTER TABLE `registrations` ADD COLUMN `registration_mode` VARCHAR(20) NOT NULL DEFAULT 'TEST' AFTER `submission_status`"
    );
    console.log('Column `registration_mode` successfully added.');
    try {
      await conn.execute("CREATE INDEX idx_registration_mode ON `registrations` (registration_mode)");
      console.log('Index `idx_registration_mode` created.');
    } catch (e) {
      console.log('Index may already exist:', e.message);
    }
  } else {
    console.log('Column `registration_mode` already exists.');
  }

  console.log('--- Step 2: Classifying all existing registrations as TEST ---');
  const [updateResult] = await conn.execute(
    "UPDATE `registrations` SET `registration_mode` = 'TEST' WHERE `registration_mode` IS NULL OR `registration_mode` = '' OR `registration_mode` = 'TEST'"
  );
  console.log(`Updated registrations to 'TEST': ${updateResult.affectedRows} rows.`);

  console.log('--- Step 3: Verifying/Inserting site_settings keys ---');
  // 1. registration_environment_mode ('TESTING' | 'LIVE')
  await conn.execute(`
    INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type, updated_by)
    VALUES ('registration_environment_mode', 'TESTING', 'registration', 'Registration Environment Mode', 'select', 'system')
    ON DUPLICATE KEY UPDATE setting_value = setting_value
  `);

  // 2. pass_certificate_generation_global_open ('1' | '0')
  await conn.execute(`
    INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type, updated_by)
    VALUES ('pass_certificate_generation_global_open', '1', 'registration', 'Pass & Certificate Generation Master Switch', 'boolean', 'system')
    ON DUPLICATE KEY UPDATE setting_value = setting_value
  `);

  // 3. pass_generation_global_open ('1' | '0')
  await conn.execute(`
    INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type, updated_by)
    VALUES ('pass_generation_global_open', '1', 'registration', 'Pass Generation Switch', 'boolean', 'system')
    ON DUPLICATE KEY UPDATE setting_value = setting_value
  `);

  // 4. certificate_generation_global_open ('1' | '0')
  await conn.execute(`
    INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type, updated_by)
    VALUES ('certificate_generation_global_open', '1', 'registration', 'Certificate Generation Switch', 'boolean', 'system')
    ON DUPLICATE KEY UPDATE setting_value = setting_value
  `);

  const [modeRows] = await conn.execute("SELECT registration_mode, COUNT(*) as count FROM registrations GROUP BY registration_mode");
  console.log('Current distribution of registrations by mode:');
  modeRows.forEach(r => console.log(`- ${r.registration_mode}: ${r.count}`));

  const [settings] = await conn.execute(
    "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('registration_environment_mode', 'pass_certificate_generation_global_open', 'pass_generation_global_open', 'certificate_generation_global_open')"
  );
  console.log('Settings verified:');
  settings.forEach(s => console.log(`- ${s.setting_key} = ${s.setting_value}`));

  await conn.end();
  console.log('--- Migration completed successfully ---');
}

main().catch(console.error);
