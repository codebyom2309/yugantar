import mysql from 'mysql2/promise';
import fs from 'fs';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// YUGANTAR 2026 — Admin Panel Database Migration
// Creates all tables needed for the admin panel, seeds initial data
// from existing hardcoded TypeScript constants.
// Safe to run multiple times (IF NOT EXISTS / INSERT IGNORE).
// ---------------------------------------------------------------------------

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
    multipleStatements: true,
  });

  console.log('✅ Connected to database.');

  // =========================================================================
  // 1. Admin Users
  // =========================================================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255),
      role ENUM('super_admin','content_admin','registration_admin','readonly_admin') NOT NULL DEFAULT 'readonly_admin',
      auth_provider ENUM('google','credentials','both') NOT NULL DEFAULT 'credentials',
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      avatar_url TEXT,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ admin_users table');

  // =========================================================================
  // 2. Site Settings
  // =========================================================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
      label VARCHAR(255),
      field_type VARCHAR(30) DEFAULT 'text',
      updated_by VARCHAR(36),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ site_settings table');

  // =========================================================================
  // 3. Competitions
  // =========================================================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS competitions (
      id VARCHAR(36) PRIMARY KEY,
      slug VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      district VARCHAR(100),
      district_index INT DEFAULT 0,
      district_tagline TEXT,
      tag VARCHAR(100),
      short_description TEXT,
      full_description TEXT,
      about TEXT,
      venue VARCHAR(255),
      eligibility VARCHAR(255),
      team_size_limit VARCHAR(100),
      max_team_members INT DEFAULT 1,
      is_individual_only TINYINT(1) DEFAULT 0,
      is_fixed_squad TINYINT(1) DEFAULT 0,
      theme VARCHAR(255),
      approved_domains JSON,
      schedule_flow JSON,
      evaluation_matrix JSON,
      rounds_description JSON,
      rules JSON,
      expectations JSON,
      format_note TEXT,
      highlights JSON,
      faqs JSON,
      icon_name VARCHAR(50),
      banner_image TEXT,
      card_image TEXT,
      map_coords JSON,
      accent_color VARCHAR(20),
      accent_secondary VARCHAR(20),
      accent_bg VARCHAR(50),
      theme_vibe VARCHAR(30),
      display_order INT DEFAULT 0,
      is_published TINYINT(1) DEFAULT 1,
      registration_open TINYINT(1) DEFAULT 1,
      cloudinary_account ENUM('A','B') NOT NULL DEFAULT 'A',
      google_form_id VARCHAR(255),
      google_form_url TEXT,
      form_response_url TEXT,
      acknowledgment_entry_id VARCHAR(50),
      acknowledgment_label TEXT,
      form_fields JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      published_at DATETIME,
      published_by VARCHAR(36)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ competitions table');

  // =========================================================================
  // 4. Organizers
  // =========================================================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS organizers (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255),
      department VARCHAR(255),
      description TEXT,
      badge VARCHAR(100),
      leadership_note TEXT,
      logo_url TEXT,
      display_order INT DEFAULT 0,
      is_published TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ organizers table');

  // =========================================================================
  // 5. FAQs
  // =========================================================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS faqs (
      id VARCHAR(36) PRIMARY KEY,
      category VARCHAR(100),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      competition_slug VARCHAR(100),
      display_order INT DEFAULT 0,
      is_published TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ faqs table');

  // =========================================================================
  // 6. Media Assets
  // =========================================================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id VARCHAR(36) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      public_id VARCHAR(255),
      cloudinary_account ENUM('A','B'),
      mime_type VARCHAR(50),
      size_bytes INT,
      width INT,
      height INT,
      alt_text TEXT,
      role VARCHAR(50),
      entity_type VARCHAR(50),
      entity_id VARCHAR(36),
      uploaded_by VARCHAR(36),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ media_assets table');

  // =========================================================================
  // 7. Audit Log
  // =========================================================================
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id VARCHAR(36) PRIMARY KEY,
      admin_id VARCHAR(36),
      admin_email VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(36),
      details JSON,
      ip_address VARCHAR(45),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_admin (admin_id),
      INDEX idx_audit_entity (entity_type, entity_id),
      INDEX idx_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ audit_log table');

  // =========================================================================
  // 8. Extend registrations table with verification_token
  // =========================================================================
  try {
    await connection.execute(`ALTER TABLE registrations ADD COLUMN verification_token VARCHAR(64) UNIQUE`);
    console.log('  ✓ registrations.verification_token added');
  } catch { console.log('  → registrations.verification_token already exists'); }

  try {
    await connection.execute(`ALTER TABLE registrations ADD COLUMN pass_issued_at DATETIME`);
    console.log('  ✓ registrations.pass_issued_at added');
  } catch { console.log('  → registrations.pass_issued_at already exists'); }

  // =========================================================================
  // SEED: Site Settings from FESTIVAL_INFO
  // =========================================================================
  const settings = [
    ['event_name', 'YUGANTAR', 'general', 'Event Name', 'text'],
    ['event_edition', '2026', 'general', 'Edition/Year', 'text'],
    ['event_concept', 'NEXUS CITY', 'general', 'Event Concept', 'text'],
    ['event_tagline', 'Enter the city. Engineer the future.', 'general', 'Tagline', 'text'],
    ['event_subheading', 'An intercollegiate technical festival celebrating engineering ideas, hands-on experimentation, and collaborative discovery at Priyadarshini College of Engineering, Nagpur.', 'general', 'Subheading', 'textarea'],
    ['event_date', '22 October 2026', 'general', 'Event Date', 'text'],
    ['event_iso_date', '2026-10-22T09:00:00+05:30', 'general', 'ISO Date', 'text'],
    ['event_venue', 'Priyadarshini College of Engineering, Nagpur', 'venue', 'Venue', 'text'],
    ['event_location_short', 'PCE Campus, Nagpur', 'venue', 'Short Location', 'text'],
    ['event_address', 'CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur, Maharashtra 440019', 'venue', 'Full Address', 'textarea'],
    ['event_department', 'Department of Electronics and Telecommunication Engineering', 'general', 'Department', 'text'],
    ['event_organizers_text', 'Tele-Era Department Student Forum, IETE Student Forum, and IIC Cell', 'general', 'Organizers Text', 'text'],
    ['event_college', 'Priyadarshini College of Engineering, Nagpur', 'general', 'College', 'text'],
    ['hero_artwork', '/images/nexus-city/hero-futuristic-city-clouds.webp', 'assets', 'Hero Artwork (Desktop)', 'text'],
    ['hero_artwork_mobile', '/nexus-city-mobile.png', 'assets', 'Hero Artwork (Mobile)', 'text'],
    ['districts_map', '/images/nexus-city/city-districts-map.webp', 'assets', 'Districts Map Image', 'text'],
    ['logo_emblem', '/images/nexus-city/yugantar-logo-isolated.webp', 'assets', 'Logo Emblem', 'text'],
    ['registration_global_open', '1', 'registration', 'Global Registration Open', 'boolean'],
    ['registration_status_message', 'Registration is now open for all competitions!', 'registration', 'Registration Status Message', 'text'],
  ];

  for (const [key, value, group, label, type] of settings) {
    await connection.execute(
      `INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_group, label, field_type) VALUES (?, ?, ?, ?, ?)`,
      [key, value, group, label, type]
    );
  }
  console.log('  ✓ site_settings seeded');

  // =========================================================================
  // SEED: Organizers
  // =========================================================================
  const organizers = [
    { name: 'TELE-ERA Department Student Forum', role: 'Departmental Student Body', department: 'Department of Electronics & Telecommunication Engineering', description: 'The premier student forum driving tech culture, technical symposia, laboratory workshops, and peer mentoring inside the department. TELE-ERA spearheads the execution of YUGANTAR 2026.', badge: 'Host Department Forum', leadershipNote: 'Student leadership body coordinating registrations, venue logistics, jury coordination, and technical challenge tracks.' },
    { name: 'IETE Student Forum', role: 'Professional Body Chapter', department: 'Institution of Electronics & Telecommunication Engineers', description: "Affiliated with India's preeminent professional society for electronics and telecommunication engineers, advancing technical standards, paper conferences, and academic excellence.", badge: 'Professional Chapter', leadershipNote: 'Oversees academic standards, symposium tracks, paper presentation rubrics, and technical judging.' },
    { name: 'IIC Cell', role: "Institution's Innovation Council", department: 'Priyadarshini College of Engineering, Nagpur', description: 'Promoting innovation, entrepreneurship, and intellectual ideation across engineering disciplines.', badge: 'Innovation Council', leadershipNote: 'Guides hackathon, ideathon, and prototype development standards.' },
  ];

  for (let i = 0; i < organizers.length; i++) {
    const o = organizers[i];
    await connection.execute(
      `INSERT IGNORE INTO organizers (id, name, role, department, description, badge, leadership_note, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), o.name, o.role, o.department, o.description, o.badge, o.leadershipNote, i]
    );
  }
  console.log('  ✓ organizers seeded');

  // =========================================================================
  // SEED: FAQs
  // =========================================================================
  const faqs = [
    { category: 'General & Venue', question: 'When and where is YUGANTAR 2026 taking place?', answer: 'YUGANTAR 2026 will be held on 22 October 2026 at Priyadarshini College of Engineering, located at CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur, Maharashtra 440019.' },
    { category: 'Eligibility', question: 'Who can participate in YUGANTAR competitions?', answer: 'Eligibility varies by competition according to official academic rules: Project Competition & PPT Presentation are for VII Semester students; Bread Board & Mock Placement Drive are for V Semester students; Ideathon, Poster, E-Gaming, and Open Mic are open to all semesters.' },
    { category: 'Registration Architecture', question: 'How does registration work for each competition?', answer: 'Each competition has its dedicated registration form on this website. When submitted, the details are permanently saved in our database and forwarded directly to the official Google Form and Google Sheets with live confirmation.' },
    { category: 'Participation', question: 'Can I participate in multiple competitions?', answer: 'Yes, provided the scheduled time slots and semester eligibility requirements permit it.' },
    { category: 'Payment Proof', question: 'How do I upload payment proof screenshot?', answer: 'You can directly upload your payment screenshot image (PNG, JPG, WebP) in the registration form. It is automatically stored in our dedicated Cloudinary infrastructure and the secure URL is mapped into your registration.' },
  ];

  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    await connection.execute(
      `INSERT IGNORE INTO faqs (id, category, question, answer, display_order) VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), f.category, f.question, f.answer, i]
    );
  }
  console.log('  ✓ faqs seeded');

  // =========================================================================
  // SEED: Initial Super Admin (owner's email — from Google OAuth)
  // =========================================================================
  await connection.execute(
    `INSERT IGNORE INTO admin_users (id, email, name, role, auth_provider, is_enabled) VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), 'omsatange5788@gmail.com', 'Om Satange', 'super_admin', 'google', 1]
  );
  console.log('  ✓ initial super_admin seeded (omsatange5788@gmail.com)');

  // Verify
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('\n📋 All tables:');
  for (const t of tables) {
    console.log('  •', Object.values(t)[0]);
  }

  await connection.end();
  console.log('\n✅ Migration complete!');
}

main().catch((err) => {
  console.error('❌ Migration error:', err.message);
  process.exit(1);
});
