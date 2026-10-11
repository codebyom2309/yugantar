import mysql from 'mysql2/promise';
import fs from 'fs';
import { randomBytes } from 'crypto';

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

  // 1. Add verification_token to registrations if missing
  try {
    await connection.execute(`ALTER TABLE registrations ADD COLUMN verification_token VARCHAR(64)`);
    console.log('✓ Added verification_token column');
  } catch (err) {
    console.log('verification_token col check:', err.message);
  }

  try {
    await connection.execute(`ALTER TABLE registrations ADD UNIQUE INDEX uq_verification_token (verification_token)`);
    console.log('✓ Added uq_verification_token index');
  } catch (err) {
    console.log('verification_token index check:', err.message);
  }

  // 2. Add pass_issued_at if missing
  try {
    await connection.execute(`ALTER TABLE registrations ADD COLUMN pass_issued_at DATETIME`);
    console.log('✓ Added pass_issued_at column');
  } catch (err) {
    console.log('pass_issued_at check:', err.message);
  }

  // 3. Populate tokens for registrations without one
  const [rows] = await connection.execute('SELECT id, verification_token FROM registrations');
  for (const row of rows) {
    if (!row.verification_token) {
      const token = 'yug_' + randomBytes(16).toString('hex');
      await connection.execute('UPDATE registrations SET verification_token = ? WHERE id = ?', [token, row.id]);
      console.log(`Generated verification_token for registration ${row.id}`);
    }
  }

  // 4. Update media_assets columns
  try {
    await connection.execute(`ALTER TABLE media_assets ADD COLUMN storage_provider VARCHAR(50) DEFAULT 'firebase'`);
    console.log('✓ Added storage_provider to media_assets');
  } catch (err) {
    console.log('storage_provider check:', err.message);
  }

  try {
    await connection.execute(`ALTER TABLE media_assets ADD COLUMN storage_path TEXT`);
    console.log('✓ Added storage_path to media_assets');
  } catch (err) {
    console.log('storage_path check:', err.message);
  }

  console.log('Schema patch complete!');
  await connection.end();
}

main().catch(console.error);
