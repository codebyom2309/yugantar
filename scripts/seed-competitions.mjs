import mysql from 'mysql2/promise';
import fs from 'fs';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// YUGANTAR 2026 — Database Seed for Competitions & Coordinators
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
  });

  console.log('✅ Connected to TiDB database.');

  // 1. Create competition_coordinators table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS competition_coordinators (
      id VARCHAR(36) PRIMARY KEY,
      competition_slug VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL DEFAULT 'Student Coordinator',
      email VARCHAR(255),
      phone VARCHAR(50),
      avatar_url TEXT,
      display_order INT DEFAULT 0,
      is_public TINYINT(1) DEFAULT 1,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_coord_comp (competition_slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ competition_coordinators table verified');

  // Load competitions from events.ts
  const { COMPETITIONS } = await import('../src/data/events.ts');
  const { getRegistrationFormBySlug } = await import('../src/data/registrationForms.ts');

  console.log(`  Found ${COMPETITIONS.length} competitions in events.ts to seed.`);

  for (const c of COMPETITIONS) {
    const formConfig = getRegistrationFormBySlug(c.slug);
    const isAccountA = ['project-competition', 'ppt-presentation', 'breadboard-competition', 'ideathon'].includes(c.slug);

    const values = [
      c.id,
      c.slug,
      c.name,
      c.category,
      c.district,
      c.districtIndex || 0,
      c.districtTagline,
      c.tag,
      c.shortDescription,
      c.fullDescription,
      c.about,
      c.venue,
      c.eligibility,
      c.teamSizeLimit,
      c.maxTeamMembers || 1,
      c.isIndividualOnly ? 1 : 0,
      c.isFixedSquad ? 1 : 0,
      c.theme || null,
      JSON.stringify(c.approvedDomains || []),
      JSON.stringify(c.scheduleFlow || []),
      JSON.stringify(c.evaluationMatrix || null),
      JSON.stringify(c.roundsDescription || []),
      JSON.stringify(c.rules || []),
      JSON.stringify(c.expectations || []),
      c.formatNote || null,
      JSON.stringify(c.highlights || []),
      JSON.stringify(c.faqs || []),
      c.iconName,
      c.bannerImage,
      c.cardImage,
      JSON.stringify(c.mapCoords || { x: 0, y: 0 }),
      c.accentColor,
      c.accentSecondary,
      c.accentBg,
      c.themeVibe,
      c.districtIndex || 0,
      1, // is_published
      1, // registration_open
      isAccountA ? 'A' : 'B',
      formConfig?.googleFormId || null,
      formConfig?.googleFormUrl || null,
      formConfig?.formResponseUrl || null,
      formConfig?.acknowledgmentEntryId || null,
      formConfig?.acknowledgmentLabel || null,
      JSON.stringify(formConfig?.fields || []),
    ];

    await connection.execute(`
      INSERT INTO competitions (
        id, slug, name, category, district, district_index, district_tagline, tag,
        short_description, full_description, about, venue, eligibility, team_size_limit,
        max_team_members, is_individual_only, is_fixed_squad, theme, approved_domains,
        schedule_flow, evaluation_matrix, rounds_description, rules, expectations,
        format_note, highlights, faqs, icon_name, banner_image, card_image, map_coords,
        accent_color, accent_secondary, accent_bg, theme_vibe, display_order,
        is_published, registration_open, cloudinary_account, google_form_id,
        google_form_url, form_response_url, acknowledgment_entry_id, acknowledgment_label,
        form_fields
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        category = VALUES(category),
        district = VALUES(district),
        district_index = VALUES(district_index),
        district_tagline = VALUES(district_tagline),
        tag = VALUES(tag),
        short_description = VALUES(short_description),
        full_description = VALUES(full_description),
        about = VALUES(about),
        venue = VALUES(venue),
        eligibility = VALUES(eligibility),
        team_size_limit = VALUES(team_size_limit),
        max_team_members = VALUES(max_team_members),
        is_individual_only = VALUES(is_individual_only),
        is_fixed_squad = VALUES(is_fixed_squad),
        theme = VALUES(theme),
        approved_domains = VALUES(approved_domains),
        schedule_flow = VALUES(schedule_flow),
        evaluation_matrix = VALUES(evaluation_matrix),
        rounds_description = VALUES(rounds_description),
        rules = VALUES(rules),
        expectations = VALUES(expectations),
        format_note = VALUES(format_note),
        highlights = VALUES(highlights),
        faqs = VALUES(faqs),
        icon_name = VALUES(icon_name),
        banner_image = VALUES(banner_image),
        card_image = VALUES(card_image),
        map_coords = VALUES(map_coords),
        accent_color = VALUES(accent_color),
        accent_secondary = VALUES(accent_secondary),
        accent_bg = VALUES(accent_bg),
        theme_vibe = VALUES(theme_vibe),
        display_order = VALUES(display_order),
        cloudinary_account = VALUES(cloudinary_account),
        google_form_id = VALUES(google_form_id),
        google_form_url = VALUES(google_form_url),
        form_response_url = VALUES(form_response_url),
        acknowledgment_entry_id = VALUES(acknowledgment_entry_id),
        acknowledgment_label = VALUES(acknowledgment_label),
        form_fields = VALUES(form_fields)
    `, values);

    console.log(`  ✓ Seeded competition: ${c.name} (${c.slug})`);

    // Add initial documented coordinators for each competition if none exist
    const [existingCoords] = await connection.execute(
      'SELECT id FROM competition_coordinators WHERE competition_slug = ? LIMIT 1',
      [c.slug]
    );

    if (existingCoords.length === 0) {
      const defaultCoords = [
        { name: 'Lead Student Coordinator', role: 'Student Coordinator', email: `teleera.${c.slug}@pce.edu.in`, phone: '+91 98765 43210' },
        { name: 'Faculty Advisor', role: 'Faculty Coordinator', email: `faculty.${c.slug}@pce.edu.in`, phone: '+91 712 281 0000' },
      ];

      for (let i = 0; i < defaultCoords.length; i++) {
        const coord = defaultCoords[i];
        await connection.execute(`
          INSERT INTO competition_coordinators (id, competition_slug, name, role, email, phone, display_order, is_public, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
        `, [randomUUID(), c.slug, coord.name, coord.role, coord.email, coord.phone, i]);
      }
      console.log(`    → Seeded initial coordinators for ${c.slug}`);
    }
  }

  const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM competitions');
  console.log(`\n🎉 Total competitions in database: ${countResult[0].count}`);

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Error seeding competitions:', err);
  process.exit(1);
});
