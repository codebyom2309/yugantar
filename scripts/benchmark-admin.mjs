import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local for DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  try {
    const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) databaseUrl = match[1];
  } catch {}
}
if (!databaseUrl) {
  try {
    const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) databaseUrl = match[1];
  } catch {}
}

const url = new URL(databaseUrl);
const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port || '4000', 10),
  user: url.username,
  password: url.password,
  database: url.pathname.replace('/', '') || 'yugantar',
  ssl: { rejectUnauthorized: true },
  connectionLimit: 5,
  waitForConnections: true,
});

async function measure(name, fn) {
  const start = performance.now();
  const res = await fn();
  const duration = performance.now() - start;
  return { name, duration: Math.round(duration), res };
}

async function run() {
  console.log('====================================================');
  console.log('   ADMIN PERFORMANCE AUDIT & BASELINE BENCHMARK    ');
  console.log('====================================================\n');

  // 1. Inspect existing table indexes
  console.log('--- 1. TABLE INDEXES AUDIT ---');
  const [regIndexes] = await pool.execute('SHOW INDEX FROM registrations');
  console.log('registrations table indexes:');
  const regIdxMap = {};
  for (const row of regIndexes) {
    if (!regIdxMap[row.Key_name]) regIdxMap[row.Key_name] = [];
    regIdxMap[row.Key_name].push(row.Column_name);
  }
  console.log(JSON.stringify(regIdxMap, null, 2));

  // 2. Measure Dashboard Queries: Sequential (Current implementation in GET /api/admin/dashboard)
  console.log('\n--- 2. DASHBOARD QUERIES: SEQUENTIAL (CURRENT BASELINE) ---');
  const seqStart = performance.now();
  const [d1] = await pool.execute(`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN submission_status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN submission_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN submission_status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM registrations`);
  const [d2] = await pool.execute(`SELECT competition_slug, COUNT(*) as count FROM registrations GROUP BY competition_slug ORDER BY count DESC`);
  const [d3] = await pool.execute(`SELECT leader_college, COUNT(*) as count FROM registrations GROUP BY leader_college ORDER BY count DESC LIMIT 10`);
  const [d4] = await pool.execute(`SELECT id, leader_name, leader_email, competition_slug, submission_status, created_at FROM registrations ORDER BY created_at DESC LIMIT 10`);
  const [d5] = await pool.execute('SELECT COUNT(*) as count FROM admin_users WHERE is_enabled = 1');
  const [d6] = await pool.execute('SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ?', ['event_date']);
  const seqDuration = Math.round(performance.now() - seqStart);
  console.log(`Current Sequential Dashboard Execution Time: ${seqDuration} ms`);

  // 3. Measure Dashboard Queries: Parallel (Promise.all within connection limit)
  console.log('\n--- 3. DASHBOARD QUERIES: PARALLELIZED TEST ---');
  const parStart = performance.now();
  const [p1, p2, p3, p4, p5, p6] = await Promise.all([
    pool.execute(`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN submission_status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN submission_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN submission_status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM registrations`),
    pool.execute(`SELECT competition_slug, COUNT(*) as count FROM registrations GROUP BY competition_slug ORDER BY count DESC`),
    pool.execute(`SELECT leader_college, COUNT(*) as count FROM registrations GROUP BY leader_college ORDER BY count DESC LIMIT 10`),
    pool.execute(`SELECT id, leader_name, leader_email, competition_slug, submission_status, created_at FROM registrations ORDER BY created_at DESC LIMIT 10`),
    pool.execute('SELECT COUNT(*) as count FROM admin_users WHERE is_enabled = 1'),
    pool.execute('SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ?', ['event_date']),
  ]);
  const parDuration = Math.round(performance.now() - parStart);
  console.log(`Parallelized Dashboard Execution Time: ${parDuration} ms (${Math.round((1 - parDuration / seqDuration) * 100)}% faster)`);

  // 4. Measure Competitions List Query: SELECT c.* vs Selected Fields
  console.log('\n--- 4. COMPETITIONS LIST QUERY: FULL (SELECT c.*) VS MINIMAL ---');
  const compFullStart = performance.now();
  const [compFull] = await pool.execute(`SELECT c.*,
              COALESCE(r.reg_count, 0) as registration_count,
              COALESCE(coord.coord_count, 0) as coordinator_count
       FROM competitions c
       LEFT JOIN (
         SELECT competition_slug, COUNT(*) as reg_count
         FROM registrations
         GROUP BY competition_slug
       ) r ON c.slug = r.competition_slug
       LEFT JOIN (
         SELECT competition_slug, COUNT(*) as coord_count
         FROM competition_coordinators
         WHERE is_active = 1
         GROUP BY competition_slug
       ) coord ON c.slug = coord.competition_slug
       ORDER BY c.display_order ASC, c.created_at ASC`);
  const compFullDuration = Math.round(performance.now() - compFullStart);
  const fullPayloadSize = Buffer.byteLength(JSON.stringify(compFull), 'utf8');

  const compMinStart = performance.now();
  const [compMin] = await pool.execute(`SELECT c.id, c.slug, c.name, c.category, c.district, c.venue,
              c.eligibility, c.team_size_limit, c.is_published, c.registration_open,
              c.display_order, c.card_image,
              COALESCE(r.reg_count, 0) as registration_count,
              COALESCE(coord.coord_count, 0) as coordinator_count
       FROM competitions c
       LEFT JOIN (
         SELECT competition_slug, COUNT(*) as reg_count
         FROM registrations
         GROUP BY competition_slug
       ) r ON c.slug = r.competition_slug
       LEFT JOIN (
         SELECT competition_slug, COUNT(*) as coord_count
         FROM competition_coordinators
         WHERE is_active = 1
         GROUP BY competition_slug
       ) coord ON c.slug = coord.competition_slug
       ORDER BY c.display_order ASC, c.created_at ASC`);
  const compMinDuration = Math.round(performance.now() - compMinStart);
  const minPayloadSize = Buffer.byteLength(JSON.stringify(compMin), 'utf8');

  console.log(`Competitions Full SELECT c.*: ${compFullDuration} ms, Payload: ${fullPayloadSize} bytes`);
  console.log(`Competitions Selected Fields: ${compMinDuration} ms, Payload: ${minPayloadSize} bytes (${Math.round((1 - minPayloadSize / fullPayloadSize) * 100)}% smaller)`);

  // 5. Measure Registrations Pagination Query
  console.log('\n--- 5. REGISTRATIONS LIST QUERY: COUNT + FETCH ---');
  const regStart = performance.now();
  const [countRow] = await pool.execute('SELECT COUNT(*) as total FROM registrations');
  const [regRows] = await pool.execute(`SELECT id, competition_slug, leader_name, leader_email, leader_phone, leader_college,
              leader_branch, leader_semester, team_name, team_size, payment_id, payment_proof_url,
              submission_status, submission_error, submitted_at, created_at, verification_token
       FROM registrations ORDER BY created_at DESC LIMIT 25 OFFSET 0`);
  const regDuration = Math.round(performance.now() - regStart);
  console.log(`Registrations Sequential (Count + Page 1): ${regDuration} ms`);

  const regParStart = performance.now();
  const [[cRow], [rRows]] = await Promise.all([
    pool.execute('SELECT COUNT(*) as total FROM registrations'),
    pool.execute(`SELECT id, competition_slug, leader_name, leader_email, leader_phone, leader_college,
              leader_branch, leader_semester, team_name, team_size, payment_id, payment_proof_url,
              submission_status, submission_error, submitted_at, created_at, verification_token
       FROM registrations ORDER BY created_at DESC LIMIT 25 OFFSET 0`),
  ]);
  const regParDuration = Math.round(performance.now() - regParStart);
  console.log(`Registrations Parallel (Count + Page 1): ${regParDuration} ms (${Math.round((1 - regParDuration / regDuration) * 100)}% faster)`);

  await pool.end();
}

run().catch((err) => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
