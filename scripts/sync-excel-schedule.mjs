import fs from 'fs';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

const SCHEDULE_DATA = [
  {
    slug: 'ppt-presentation',
    name: 'PPT Presentation Competition',
    display_order: 0,
    timing: '10:30 AM',
    raw_timing: '0.4375 (10:30 AM)',
    venue: '2nd Floor Meeting Room',
    category: 'Research & Ideas',
    district: 'Vision District',
    district_index: 0,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Dr. A. K. Kondelwar', role: 'Faculty Coordinator' },
      { name: 'Mrs. S. S. Mankar', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Pooja Konge', phone: '+91 95793 28823', role: 'Student Coordinator' },
      { name: 'Dishant Chokhande', phone: '+91 96895 87991', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'project-competition',
    name: 'Project Competition',
    display_order: 1,
    timing: '10:30 AM',
    raw_timing: '10.30 AM',
    venue: '2nd Floor DSD,WSN.ES,DSP,MWR LAB',
    category: 'Hardware & Circuits',
    district: 'Innovation District',
    district_index: 1,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Dr. (Mrs) J. M. Bhattad', role: 'Faculty Coordinator' },
      { name: 'Mr. D. G. Gahane', role: 'Faculty Coordinator' },
      { name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator' },
      { name: 'Ms. P. B. Pendke', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Khushi Pardhi', phone: '+91 95524 58818', role: 'Student Coordinator' },
      { name: 'Samsher Kode', phone: '+91 93593 83375', role: 'Student Coordinator' },
      { name: 'Om Wadaskar', phone: '+91 70581 36648', role: 'Student Coordinator' },
      { name: 'Gaurav Rajurkar', phone: '+91 96579 51153', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'mock-placement-drive',
    name: 'Mock Placement Drive',
    display_order: 2,
    timing: '2:00 PM',
    raw_timing: '2:00:pm',
    venue: '3rd Floor Room 303+GD Meeting Room+Interview in Meeting RoomHall',
    category: 'Career & Strategy',
    district: 'Leadership District',
    district_index: 2,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Mrs. P. J. Suryawanshi', role: 'Faculty Coordinator' },
      { name: 'Gomati Deshmukh', role: 'Faculty Coordinator' },
      { name: 'Mrs. R. R. Zalke', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Vedant Gaikwad', phone: '+91 96998 64120', role: 'Student Coordinator' },
      { name: 'Student Coordinator', phone: '+91 89991 89509', role: 'Student Coordinator' },
      { name: 'Aachal Dhapekar', phone: '+91 93733 85732', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'breadboard-competition',
    name: 'Bread Board Competition',
    display_order: 3,
    timing: '2:00 PM',
    raw_timing: '2:00 Pm',
    venue: '2nd Floor EW LAB',
    category: 'Hardware & Circuits',
    district: 'Circuit Arena',
    district_index: 3,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Dr. S. P. Washimkar', role: 'Faculty Coordinator' },
      { name: 'Dr. V. V. Panchbhai', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Ujjwal Barange', phone: '+91 79874 94482', role: 'Student Coordinator' },
      { name: 'Rizam Ramteke', phone: '+91 88057 94318', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'ideathon',
    name: 'Ideathon',
    display_order: 4,
    timing: '2:00 PM',
    raw_timing: '2.00AM',
    timing_flagged: 'Spreadsheet has clerical typo "2.00AM". Normalized to 2:00 PM to align with afternoon parallel track in Aeronautical Seminar Hall.',
    venue: '1st Floor Aeronautical Seminar Hall',
    category: 'Research & Ideas',
    district: 'Venture District',
    district_index: 4,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Dr. N. S. Ambatkar', role: 'Faculty Coordinator' },
      { name: 'Mr. P. R. Lakhe', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Prathemesh Pawar', phone: '+91 72767 85069', role: 'Student Coordinator' },
      { name: 'Yatharth Kathane', phone: '+91 79727 23911', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'poster-competition',
    name: 'Poster Competition',
    display_order: 5,
    timing: '11:00 AM',
    raw_timing: '11.00Am',
    venue: '3rd Floor Room No. 304',
    category: 'Research & Ideas',
    district: 'Design District',
    district_index: 5,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Dr. P. P. Ashtankar', role: 'Faculty Coordinator' },
      { name: 'Dr. A. S. Khobragade', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Aryan Dehankar', phone: '+91 73856 35401', role: 'Student Coordinator' },
      { name: 'Anshool Harinkhede', phone: '+91 92845 51472', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'e-gaming',
    name: 'E-Gaming (Free Fire & BGMI)',
    display_order: 6,
    timing: '10:30 AM',
    raw_timing: '10.30 AM',
    venue: '3rd Floor Room No. 302 and 307',
    category: 'Esports & Creative',
    district: 'Cyber Arena',
    district_index: 6,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Dr. P. U. Chati', role: 'Faculty Coordinator' },
      { name: 'Dr. C. N. Bhoyar', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Shivam Tatole', phone: '+91 78210 87589', role: 'Student Coordinator' },
      { name: 'Tejas Dhanorkar', phone: '+91 81809 32693', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'open-mic',
    name: 'Open Mic Competition',
    display_order: 7,
    timing: '11:00 AM',
    raw_timing: '11.00AM',
    venue: '1st Floor Aeronautical Seminar Hall',
    category: 'Esports & Creative',
    district: 'Culture Concourse',
    district_index: 7,
    event_date: '21 October 2026',
    faculty: [
      { name: 'Ms. A. K. Parmar', role: 'Faculty Coordinator' },
      { name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Vedant Gawande', phone: '+91 84218 41958', role: 'Student Coordinator' },
      { name: 'Mohit Kawale', phone: '+91 95799 30801', role: 'Student Coordinator' },
    ],
  },
  {
    slug: 'mini-project-competition',
    name: 'Mini Project Competition',
    display_order: 8,
    timing: '1:00 PM',
    raw_timing: '1:00:pm',
    venue: '3rd Floor Room No. 305',
    category: 'Hardware & Circuits',
    district: 'Circuit Arena',
    district_index: 8,
    event_date: '21 October 2026',
    allowed_semesters: ['III', 'VI'],
    faculty: [
      { name: 'Dr. P. P. Ashtankar', role: 'Faculty Coordinator' },
      { name: 'Dr(Ms). J. C. Kolte', role: 'Faculty Coordinator' },
    ],
    students: [
      { name: 'Summit Bhagat', phone: '+91 89992 60789', role: 'Student Coordinator' },
      { name: 'Aditya Sumatkar', phone: '+91 90494 62518', role: 'Student Coordinator' },
    ],
  },
];

async function main() {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  }
  const url = new URL(dbUrl);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  console.log('Connected to TiDB database. Starting Excel schedule synchronization...\n');

  const importSummary = {
    competitions: { created: 0, updated: 0, archived: 0 },
    coordinators: { inserted: 0, updated: 0, cleared_old: 0 },
    flagged: [],
  };

  // 1. Archive vandhe-bhararat if present
  const [vandheRows] = await conn.execute(
    'SELECT id, slug FROM competitions WHERE slug = "vandhe-bhararat"'
  );
  if (vandheRows.length > 0) {
    await conn.execute(
      'UPDATE competitions SET is_published = 0, display_order = 99 WHERE slug = "vandhe-bhararat"'
    );
    importSummary.competitions.archived++;
    console.log('Archived "vandhe-bhararat" draft (is_published = 0, display_order = 99).');
  }

  // 2. Synchronize each of the 9 competitions
  for (const item of SCHEDULE_DATA) {
    if (item.timing_flagged) {
      importSummary.flagged.push({
        slug: item.slug,
        name: item.name,
        raw_timing: item.raw_timing,
        normalized_timing: item.timing,
        note: item.timing_flagged,
      });
    }

    const [existing] = await conn.execute(
      'SELECT id, slug FROM competitions WHERE slug = ?',
      [item.slug]
    );

    const scheduleFlowJson = JSON.stringify([
      { time: item.timing, activity: `Official Arena Commencement: Reporting & Setup at ${item.venue}` },
      { time: 'Post-Setup', activity: 'Live Demonstration & Faculty Jury Evaluation Window' },
      { time: 'Post-Evaluation', activity: 'Score Compilation & Track Podium Announcement' },
    ]);

    if (existing.length === 0) {
      // Create new competition (e.g. mini-project-competition)
      const newId = item.slug;
      const allowedSemestersJson = item.allowed_semesters ? JSON.stringify(item.allowed_semesters) : '[]';

      await conn.execute(
        `INSERT INTO competitions (
          id, slug, name, category, district, district_index, district_tagline,
          tag, short_description, full_description, about, venue, eligibility,
          team_size_limit, max_team_members, min_team_members, is_individual_only, is_fixed_squad,
          display_order, is_published, registration_open, is_paid, registration_fee,
          event_date, allowed_semesters, schedule_flow,
          icon_name, banner_image, card_image, accent_color, accent_secondary, accent_bg, theme_vibe,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          NOW(), NOW()
        )`,
        [
          newId,
          item.slug,
          item.name,
          item.category,
          item.district,
          item.district_index,
          'The proving ground for early engineering prototypes, embedded circuits, and hands-on hardware innovation.',
          'Applied Hardware Exhibition',
          'Demonstrate operational mini projects, embedded electronics, and prototype circuits designed by III & VI semester students.',
          'A specialized engineering showcase for III and VI semester students to demonstrate operational mini-project models, sensor interfaces, and circuit implementations before an academic evaluation panel.',
          'The Mini Project Competition provides 3rd and 6th semester engineers an authentic exhibition stage to demonstrate practical circuit design, microcontroller integration, and engineering problem-solving.',
          item.venue,
          'III & VI Semester Students Only',
          'Maximum 4 members per team',
          4,
          1,
          0,
          0,
          item.display_order,
          1,
          1,
          1,
          '₹200 per team',
          item.event_date,
          allowedSemestersJson,
          scheduleFlowJson,
          'Cpu',
          '/images/competitions/project-competition.webp',
          '/images/competitions/project-competition.webp',
          '#3978F6',
          '#60A5FA',
          'rgba(57, 120, 246, 0.08)',
          'circuit',
        ]
      );
      importSummary.competitions.created++;
      console.log(`Created new competition: ${item.name} (${item.slug})`);
    } else {
      // Update existing competition
      const updates = [
        'display_order = ?',
        'venue = ?',
        'event_date = ?',
        'schedule_flow = ?',
        'is_published = 1',
      ];
      const params = [
        item.display_order,
        item.venue,
        item.event_date,
        scheduleFlowJson,
      ];

      if (item.allowed_semesters) {
        updates.push('allowed_semesters = ?');
        params.push(JSON.stringify(item.allowed_semesters));
      }

      params.push(item.slug);
      await conn.execute(
        `UPDATE competitions SET ${updates.join(', ')} WHERE slug = ?`,
        params
      );
      importSummary.competitions.updated++;
      console.log(`Updated competition: ${item.name} (${item.slug})`);
    }

    // 3. Clear placeholder coordinators for this competition and insert clean spreadsheet coordinators
    await conn.execute(
      'DELETE FROM competition_coordinators WHERE competition_slug = ?',
      [item.slug]
    );

    let coordOrder = 0;
    // Insert Faculty Coordinators
    for (const f of item.faculty) {
      await conn.execute(
        `INSERT INTO competition_coordinators (
          id, competition_slug, name, role, phone, email, display_order, is_public, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [
          randomUUID(),
          item.slug,
          f.name,
          f.role,
          null, // Faculty phones are omitted for privacy unless supplied
          null,
          coordOrder++,
        ]
      );
      importSummary.coordinators.inserted++;
    }

    // Insert Student Coordinators with verified phone numbers
    for (const s of item.students) {
      await conn.execute(
        `INSERT INTO competition_coordinators (
          id, competition_slug, name, role, phone, email, display_order, is_public, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [
          randomUUID(),
          item.slug,
          s.name,
          s.role,
          s.phone,
          null,
          coordOrder++,
        ]
      );
      importSummary.coordinators.inserted++;
    }
  }

  // Update site_settings event_date to 21 October 2026
  await conn.execute(
    'UPDATE site_settings SET setting_value = "21 October 2026" WHERE setting_key = "event_date"'
  );
  await conn.execute(
    'UPDATE site_settings SET setting_value = "2026-10-21" WHERE setting_key = "event_iso_date"'
  );

  console.log('\n=== SYNCHRONIZATION COMPLETE ===');
  console.log('Import Summary:');
  console.log(`  Competitions Created: ${importSummary.competitions.created}`);
  console.log(`  Competitions Updated: ${importSummary.competitions.updated}`);
  console.log(`  Competitions Archived: ${importSummary.competitions.archived}`);
  console.log(`  Coordinators Inserted: ${importSummary.coordinators.inserted}`);
  console.log('Flagged Schedule Entries:');
  console.table(importSummary.flagged);

  await conn.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
