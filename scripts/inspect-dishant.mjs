import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    const m = env.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (m) dbUrl = m[1];
  }
  const u = new URL(dbUrl);
  const conn = await mysql.createConnection({
    host: u.hostname,
    port: parseInt(u.port || '4000', 10),
    user: u.username,
    password: u.password,
    database: u.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: true },
  });

  const [rows] = await conn.execute(
    'SELECT * FROM registrations WHERE leader_email LIKE "%dishant%" OR competition_slug = "mini-project-competition"'
  );
  console.log('Found rows count:', rows.length);
  for (const r of rows) {
    console.log('ID:', r.id);
    console.log('Competition Slug:', r.competition_slug);
    console.log('Leader:', r.leader_name, r.leader_email, r.leader_phone, r.leader_college, r.leader_branch, r.leader_semester);
    console.log('Team:', r.team_name, 'Size:', r.team_size);
    console.log('Payment:', r.payment_id, r.payment_proof_url, r.payment_status);
    console.log('Google Form ID in row:', r.google_form_id);
    console.log('Submission Status:', r.submission_status);
    console.log('Submission Error:', r.submission_error);
    console.log('Form data:', typeof r.form_data === 'string' ? r.form_data : JSON.stringify(r.form_data));
    console.log('Created At:', r.created_at, 'Submitted At:', r.submitted_at);
    console.log('----------------------------------------------------');
  }

  await conn.end();
}

main().catch(console.error);
