import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
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

  // 1. Add columns to competitions table if missing
  const [cols] = await connection.execute('DESCRIBE competitions');
  const existingCols = new Set(cols.map((c) => c.Field));

  if (!existingCols.has('qr_mode')) {
    await connection.execute(`ALTER TABLE competitions ADD COLUMN qr_mode VARCHAR(20) DEFAULT 'generate'`);
    console.log('✓ Added qr_mode column to competitions');
  } else {
    console.log('• qr_mode column already exists');
  }

  if (!existingCols.has('payee_name')) {
    await connection.execute(`ALTER TABLE competitions ADD COLUMN payee_name VARCHAR(255) DEFAULT 'TELE-ERA YUGANTAR 2026'`);
    console.log('✓ Added payee_name column to competitions');
  } else {
    console.log('• payee_name column already exists');
  }

  // 2. Ensure competitions have proper paid and payment configuration
  const compConfigs = [
    {
      slug: 'project-competition',
      fee: '₹300 per team',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Complete UPI fee payment to the official TELE-ERA student forum account. Submit your 12-digit UTR and upload the payment confirmation screenshot.',
    },
    {
      slug: 'ppt-presentation',
      fee: '₹200 per team',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Pay the presentation track registration fee via UPI. Attach your valid transaction UTR and screenshot.',
    },
    {
      slug: 'breadboard-competition',
      fee: '₹100 per person / ₹150 team',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Complete UPI registration fee transfer. Retain transaction screenshot and enter the 12-digit UTR.',
    },
    {
      slug: 'ideathon',
      fee: '₹200 per team',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Pay ideathon arena registration fee to TELE-ERA forum. Provide transaction UTR and proof screenshot.',
    },
    {
      slug: 'poster-competition',
      fee: '₹100 per person / ₹150 team',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Pay poster competition registration fee via UPI. Enter UTR reference and attach payment proof screenshot.',
    },
    {
      slug: 'e-gaming',
      fee: '₹200 per squad',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Squad leader must transfer ₹200 via UPI. Enter squad name in remarks and provide valid transaction UTR.',
    },
    {
      slug: 'open-mic',
      fee: '₹100 per performer',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Pay solo performance entry fee via UPI. Attach transaction screenshot and valid UTR ID.',
    },
    {
      slug: 'mock-placement-drive',
      fee: '₹100 per candidate',
      isPaid: 1,
      upi: 'teleera@oksbi',
      instructions: 'Candidate registration fee ₹100 via UPI. Enter UTR and attach screenshot for fast track entry pass issuance.',
    },
  ];

  for (const c of compConfigs) {
    await connection.execute(
      `UPDATE competitions 
       SET is_paid = ?, registration_fee = ?, upi_id = ?, payment_instructions = ?, 
           require_utr = 1, require_screenshot = 1, qr_mode = 'generate', payee_name = 'TELE-ERA YUGANTAR 2026'
       WHERE slug = ?`,
      [c.isPaid, c.fee, c.upi, c.instructions, c.slug]
    );
    console.log(`✓ Updated payment settings for ${c.slug}`);
  }

  // 3. Ensure site_settings has storage control keys
  const settingsToEnsure = [
    { key: 'registration_global_open', value: '1', group: 'registration', label: 'Global Registration Master Switch' },
    { key: 'registration_storage_mode', value: 'minimal', group: 'registration', label: 'Registration Storage Mode (minimal | full)' },
    { key: 'save_minimal_metadata', value: '1', group: 'registration', label: 'Save Minimal Operational Metadata to TiDB' },
    { key: 'save_full_responses', value: '0', group: 'registration', label: 'Save Full Form Responses to TiDB' },
    { key: 'send_to_spreadsheet', value: '1', group: 'registration', label: 'Send Submissions to Google Sheets' },
    { key: 'global_whatsapp_link', value: 'https://chat.whatsapp.com/C3eGvY2xYugantar2026', group: 'registration', label: 'Global WhatsApp Community Link' },
  ];

  for (const s of settingsToEnsure) {
    const [existing] = await connection.execute('SELECT setting_key FROM site_settings WHERE setting_key = ?', [s.key]);
    if (existing.length === 0) {
      await connection.execute(
        'INSERT INTO site_settings (setting_key, setting_value, setting_group, label) VALUES (?, ?, ?, ?)',
        [s.key, s.value, s.group, s.label]
      );
      console.log(`✓ Inserted setting ${s.key}`);
    } else {
      console.log(`• Setting ${s.key} already present`);
    }
  }

  console.log('Database configuration upgrade complete!');
  await connection.end();
}

main().catch(console.error);
