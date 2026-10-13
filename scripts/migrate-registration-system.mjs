import mysql from 'mysql2/promise';
import fs from 'fs';

async function migrate() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const url = new URL(match[1]);
  const pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  console.log('--- 1. Creating registration_spreadsheets table ---');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registration_spreadsheets (
      id VARCHAR(36) PRIMARY KEY,
      display_name VARCHAR(255) NOT NULL,
      competition_slug VARCHAR(100) NULL,
      spreadsheet_url TEXT NOT NULL,
      description TEXT NULL,
      category VARCHAR(100) DEFAULT 'Main Responses',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_comp_slug (competition_slug)
    )
  `);
  console.log('✓ registration_spreadsheets table ready.');

  console.log('--- 2. Checking & adding payment/whatsapp columns to competitions ---');
  const [compCols] = await pool.query('DESCRIBE competitions');
  const existingCompCols = new Set(compCols.map(c => c.Field));

  const compColsToAdd = [
    { name: 'is_paid', def: 'TINYINT(1) DEFAULT 0' },
    { name: 'registration_fee', def: "VARCHAR(50) DEFAULT 'Free'" },
    { name: 'qr_code_url', def: 'TEXT NULL' },
    { name: 'upi_id', def: 'VARCHAR(100) NULL' },
    { name: 'payment_url', def: 'TEXT NULL' },
    { name: 'payment_instructions', def: 'TEXT NULL' },
    { name: 'require_utr', def: 'TINYINT(1) DEFAULT 0' },
    { name: 'require_screenshot', def: 'TINYINT(1) DEFAULT 0' },
    { name: 'whatsapp_link', def: 'TEXT NULL' },
    { name: 'confirmation_instructions', def: 'TEXT NULL' },
  ];

  for (const col of compColsToAdd) {
    if (!existingCompCols.has(col.name)) {
      console.log(`Adding column competitions.${col.name}...`);
      await pool.query(`ALTER TABLE competitions ADD COLUMN ${col.name} ${col.def}`);
    } else {
      console.log(`Column competitions.${col.name} already exists.`);
    }
  }

  console.log('--- 3. Checking & adding columns to registrations ---');
  const [regCols] = await pool.query('DESCRIBE registrations');
  const existingRegCols = new Set(regCols.map(c => c.Field));

  const regColsToAdd = [
    { name: 'payment_status', def: "VARCHAR(50) DEFAULT 'pending'" },
    { name: 'verified_by', def: 'VARCHAR(255) NULL' },
    { name: 'verified_at', def: 'DATETIME NULL' },
  ];

  for (const col of regColsToAdd) {
    if (!existingRegCols.has(col.name)) {
      console.log(`Adding column registrations.${col.name}...`);
      await pool.query(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.def}`);
    } else {
      console.log(`Column registrations.${col.name} already exists.`);
    }
  }

  console.log('--- 4. Checking & adding site_settings ---');
  const settingsToEnsure = [
    {
      key: 'registration_storage_mode',
      value: 'minimal',
      category: 'registration',
      label: 'Registration Data Retention Mode (minimal | spreadsheet_only | full)',
      type: 'text',
    },
    {
      key: 'global_whatsapp_link',
      value: 'https://chat.whatsapp.com/C3eGvY2xYugantar2026',
      category: 'registration',
      label: 'Global Official WhatsApp Community / Group Link',
      type: 'text',
    },
  ];

  for (const s of settingsToEnsure) {
    const [exists] = await pool.query('SELECT setting_key FROM site_settings WHERE setting_key = ?', [s.key]);
    if (exists.length === 0) {
      console.log(`Inserting site_setting: ${s.key}...`);
      await pool.query(
        'INSERT INTO site_settings (setting_key, setting_value, setting_group, label, field_type) VALUES (?, ?, ?, ?, ?)',
        [s.key, s.value, s.category, s.label, s.type]
      );
    } else {
      console.log(`Setting ${s.key} already exists.`);
    }
  }

  console.log('--- 5. Initial Seed for Spreadsheet Links (if empty) ---');
  const [existingLinks] = await pool.query('SELECT count(*) as count FROM registration_spreadsheets');
  if (existingLinks[0].count === 0) {
    console.log('Seeding initial spreadsheet records for 8 competitions...');
    const initialSpreadsheets = [
      {
        id: 'sheet-project-competition',
        name: 'Project Competition — Official Response Sheet',
        slug: 'project-competition',
        url: 'https://docs.google.com/spreadsheets/d/1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form 1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8',
      },
      {
        id: 'sheet-ppt-presentation',
        name: 'PPT Presentation — Official Response Sheet',
        slug: 'ppt-presentation',
        url: 'https://docs.google.com/spreadsheets/d/1nXblcJviqnUx-B4KZAtV755eaJN4Vw6MxjOPaSpwh5g-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form 1nXblcJviqnUx-B4KZAtV755eaJN4Vw6MxjOPaSpwh5g',
      },
      {
        id: 'sheet-breadboard-competition',
        name: 'Bread Board Competition — Official Response Sheet',
        slug: 'breadboard-competition',
        url: 'https://docs.google.com/spreadsheets/d/13bSoKK8N4isK3oyEJE2-xP145_ugSq5mEfLaPEHsj_o-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form 13bSoKK8N4isK3oyEJE2-xP145_ugSq5mEfLaPEHsj_o',
      },
      {
        id: 'sheet-ideathon',
        name: 'Ideathon — Official Response Sheet',
        slug: 'ideathon',
        url: 'https://docs.google.com/spreadsheets/d/1sxNwzdhO7vRkMV_ADtPPVG5ddPlNXvWYk6mKW9kmkXA-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form 1sxNwzdhO7vRkMV_ADtPPVG5ddPlNXvWYk6mKW9kmkXA',
      },
      {
        id: 'sheet-poster-competition',
        name: 'Poster Competition — Official Response Sheet',
        slug: 'poster-competition',
        url: 'https://docs.google.com/spreadsheets/d/1W5_1yyh0C8V00Z7FHAO1g-z2i1iAWznGbjHM7JB-UHs-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form 1W5_1yyh0C8V00Z7FHAO1g-z2i1iAWznGbjHM7JB-UHs',
      },
      {
        id: 'sheet-e-gaming',
        name: 'E-Gaming (Free Fire & BGMI) — Official Response Sheet',
        slug: 'e-gaming',
        url: 'https://docs.google.com/spreadsheets/d/1BL5B2b55wmMCcvjFYkbKUitOKn_-CBxFmNKlk8o8J2k-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form 1BL5B2b55wmMCcvjFYkbKUitOKn_-CBxFmNKlk8o8J2k',
      },
      {
        id: 'sheet-open-mic',
        name: 'Open Mic Competition — Official Response Sheet',
        slug: 'open-mic',
        url: 'https://docs.google.com/spreadsheets/d/1AxN0p0LChkcSoqMApeZ0Elyd2fPW2x49Z4IiBcKZlBI-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form 1AxN0p0LChkcSoqMApeZ0Elyd2fPW2x49Z4IiBcKZlBI',
      },
      {
        id: 'sheet-mock-placement-drive',
        name: 'Mock Placement Drive — Official Response Sheet',
        slug: 'mock-placement-drive',
        url: 'https://docs.google.com/spreadsheets/d/1FAIpQLScjOWajk7h8k4f-DIMNsXmev0FwTv376PBK5QG2KU48ZvyMsA-responses/edit',
        desc: 'Responses spreadsheet linked to Google Form e/1FAIpQLScjOWajk7h8k4f-DIMNsXmev0FwTv376PBK5QG2KU48ZvyMsA',
      },
    ];

    for (const s of initialSpreadsheets) {
      await pool.query(
        `INSERT INTO registration_spreadsheets (id, display_name, competition_slug, spreadsheet_url, description, category)
         VALUES (?, ?, ?, ?, ?, 'Main Responses')`,
        [s.id, s.name, s.slug, s.url, s.desc]
      );
    }
    console.log('✓ Seeded 8 initial spreadsheet records.');
  } else {
    console.log(`Spreadsheets table already contains ${existingLinks[0].count} records.`);
  }

  await pool.end();
  console.log('\n✅ All registration system migrations completed successfully.');
}

migrate().catch(console.error);
