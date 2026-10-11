import mysql from 'mysql2/promise';

import fs from 'fs';

async function main() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  }

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  console.log('Connected to database.');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS registrations (
      id VARCHAR(36) PRIMARY KEY,
      competition_slug VARCHAR(100) NOT NULL,
      idempotency_key VARCHAR(200) UNIQUE,
      leader_name VARCHAR(255) NOT NULL,
      leader_email VARCHAR(255) NOT NULL,
      leader_phone VARCHAR(50) NOT NULL,
      leader_college VARCHAR(255) NOT NULL,
      leader_branch VARCHAR(100) NOT NULL,
      leader_semester VARCHAR(20) NOT NULL,
      team_name VARCHAR(255),
      team_size INT DEFAULT 1,
      form_data JSON,
      payment_id VARCHAR(255),
      payment_proof_url TEXT,
      google_form_id VARCHAR(255),
      submission_status VARCHAR(50) DEFAULT 'pending',
      submission_error TEXT,
      submitted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_competition_slug (competition_slug),
      INDEX idx_leader_email_slug (leader_email, competition_slug),
      INDEX idx_status (submission_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ registrations table created in yugantar database.');

  // Verify
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('Tables:', tables);

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
