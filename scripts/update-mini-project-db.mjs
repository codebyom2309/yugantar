import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  console.log('--- Updating Mini Project Competition Database Records ---');
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

  // 1. Update competitions row
  const [updateResult] = await connection.execute(
    `UPDATE competitions SET
      name = 'Inter-Collegiate Mini Project Competition',
      is_published = 1,
      registration_open = 1,
      cloudinary_account = 'B',
      allowed_semesters = ?,
      eligibility = 'Semester I & V Students Only',
      require_utr = 1,
      require_screenshot = 1,
      upi_id = 'teleera@oksbi',
      payee_name = 'TELE-ERA YUGANTAR 2026',
      qr_mode = 'generate',
      is_paid = 1,
      registration_fee = '₹200 per team',
      google_form_id = '1FAIpQLScUlBGNuJhGt26oYhRCr6kIhGUdBNRIjV_GV3pE6JrRDcpHMg',
      google_form_url = 'https://docs.google.com/forms/d/e/1FAIpQLScUlBGNuJhGt26oYhRCr6kIhGUdBNRIjV_GV3pE6JrRDcpHMg/viewform',
      form_response_url = 'https://docs.google.com/forms/d/e/1FAIpQLScUlBGNuJhGt26oYhRCr6kIhGUdBNRIjV_GV3pE6JrRDcpHMg/formResponse',
      acknowledgment_entry_id = '1885141004',
      acknowledgment_label = 'I confirm that all team members are currently in Semester I or Semester V and that the project is self-developed.',
      short_description = 'Exhibit operational mini projects, embedded electronics, and prototype circuits designed by Semester I & V students.',
      full_description = 'A specialized inter-collegiate engineering showcase for Semester I and Semester V students to demonstrate operational mini-project models, sensor interfaces, and circuit implementations before an academic evaluation panel.',
      about = 'The Inter-Collegiate Mini Project Competition provides 1st and 5th semester engineers an authentic exhibition stage to demonstrate practical circuit design, microcontroller integration, and engineering problem-solving. Teams present operational hardware models in 3rd Floor Room No. 305.',
      pass_enabled = 1,
      certificate_enabled = 1,
      updated_at = NOW()
     WHERE slug = 'mini-project-competition'`,
    [JSON.stringify(['I', 'V'])]
  );
  console.log(`✓ Updated competitions table row (affectedRows: ${updateResult.affectedRows})`);

  // 2. Insert or update coordinators in competition_coordinators
  const coordinators = [
    { id: 'coord-mini-1', name: 'Dr. P. P. Ashtankar', role: 'Faculty Coordinator', phone: null, email: null, order: 0 },
    { id: 'coord-mini-2', name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator', phone: null, email: null, order: 1 },
    { id: 'coord-mini-3', name: 'Summit Bhagat', role: 'Student Coordinator', phone: '+91 89992 60789', email: null, order: 2 },
    { id: 'coord-mini-4', name: 'Aditya Sumatkar', role: 'Student Coordinator', phone: '+91 90494 62518', email: null, order: 3 },
  ];

  for (const c of coordinators) {
    const [existing] = await connection.execute(
      'SELECT id FROM competition_coordinators WHERE id = ? OR (competition_slug = ? AND name = ?)',
      [c.id, 'mini-project-competition', c.name]
    );
    if (existing.length === 0) {
      await connection.execute(
        `INSERT INTO competition_coordinators (
          id, competition_slug, name, role, phone, email, display_order, is_active, is_public, created_at, updated_at
        ) VALUES (?, 'mini-project-competition', ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [c.id, c.name, c.role, c.phone, c.email, c.order]
      );
      console.log(`✓ Added coordinator: ${c.name}`);
    } else {
      await connection.execute(
        `UPDATE competition_coordinators SET
          role = ?, phone = ?, email = ?, display_order = ?, is_active = 1, is_public = 1, updated_at = NOW()
         WHERE id = ?`,
        [c.role, c.phone, c.email, c.order, existing[0].id]
      );
      console.log(`• Updated coordinator: ${c.name}`);
    }
  }

  // 3. Verify
  const [rows] = await connection.execute(
    `SELECT slug, name, is_published, cloudinary_account, allowed_semesters, registration_fee, upi_id, require_utr, require_screenshot FROM competitions WHERE slug = 'mini-project-competition'`
  );
  console.log('\n--- Verified Database State ---');
  console.log(rows[0]);

  await connection.end();
  console.log('✓ Migration script finished successfully.');
}

main().catch(console.error);
