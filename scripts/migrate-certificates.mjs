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

  console.log('✅ Connected to database.');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS issued_certificates (
      id VARCHAR(36) PRIMARY KEY,
      certificate_code VARCHAR(50) UNIQUE NOT NULL,
      registration_id VARCHAR(36) NULL,
      recipient_name VARCHAR(255) NOT NULL,
      recipient_email VARCHAR(255) NULL,
      recipient_college VARCHAR(255) NULL,
      competition_slug VARCHAR(100) NOT NULL,
      certificate_type VARCHAR(50) NOT NULL DEFAULT 'participation_cert',
      rank_citation VARCHAR(100) NOT NULL DEFAULT 'Certificate of Participation',
      template_id VARCHAR(36) NULL,
      template_version INT NOT NULL DEFAULT 1,
      issued_by VARCHAR(255) NOT NULL DEFAULT 'admin',
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      revoked_at DATETIME NULL,
      revocation_reason VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_comp_type (competition_slug, certificate_type),
      INDEX idx_reg_id (registration_id),
      INDEX idx_code (certificate_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ issued_certificates table created successfully.');
  await connection.end();
}

main().catch(console.error);
