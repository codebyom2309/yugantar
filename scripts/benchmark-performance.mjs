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

async function measureQuery(name, sql, params = []) {
  const start = performance.now();
  const [rows] = await pool.execute(sql, params);
  const duration = performance.now() - start;
  return { name, duration: Math.round(duration), rowCount: Array.isArray(rows) ? rows.length : 1 };
}

async function measureFetch(url) {
  const start = performance.now();
  const res = await fetch(url);
  await res.text();
  const duration = performance.now() - start;
  return { url, status: res.status, duration: Math.round(duration) };
}

async function run() {
  console.log('=== BENCHMARK: DATABASE DIRECT QUERY LATENCY (TiDB Cloud) ===');
  const q1 = await measureQuery('SELECT * FROM competitions WHERE is_published = 1', 'SELECT * FROM competitions WHERE is_published = 1 ORDER BY display_order ASC');
  const q2 = await measureQuery('SELECT setting_key, setting_value FROM site_settings', 'SELECT setting_key, setting_value FROM site_settings');
  const q3 = await measureQuery('SELECT * FROM organizers WHERE is_published = 1', 'SELECT * FROM organizers WHERE is_published = 1');
  const q4 = await measureQuery('SELECT * FROM organizer_members WHERE is_published = 1', 'SELECT * FROM organizer_members WHERE is_published = 1');
  const q5 = await measureQuery('SELECT * FROM faqs WHERE is_published = 1', 'SELECT * FROM faqs WHERE is_published = 1');
  console.log(JSON.stringify([q1, q2, q3, q4, q5], null, 2));

  console.log('\n=== BENCHMARK: HTTP SINGLE ENDPOINT LATENCY ===');
  const endpoints = [
    'http://localhost:3000/api/competitions',
    'http://localhost:3000/',
    'http://localhost:3000/about',
    'http://localhost:3000/competitions',
    'http://localhost:3000/competitions/roborace',
    'http://localhost:3000/journey',
    'http://localhost:3000/districts',
  ];

  const results = [];
  for (const ep of endpoints) {
    const r1 = await measureFetch(ep);
    const r2 = await measureFetch(ep);
    results.push({ endpoint: ep.replace('http://localhost:3000', ''), first: r1.duration, second: r2.duration });
  }
  console.log(JSON.stringify(results, null, 2));

  console.log('\n=== BENCHMARK: CONCURRENT REQUESTS TO /api/competitions (6 parallel - single page mount) ===');
  const start6 = performance.now();
  const res6 = await Promise.all(
    Array.from({ length: 6 }).map((_, i) => measureFetch('http://localhost:3000/api/competitions'))
  );
  const total6 = Math.round(performance.now() - start6);
  console.log(`6 Parallel Requests Finished in: ${total6}ms. Individual durations: ${res6.map(r => r.duration + 'ms').join(', ')}`);

  console.log('\n=== BENCHMARK: CONCURRENT REQUESTS TO /api/competitions (12 parallel - connection saturation) ===');
  const start12 = performance.now();
  const res12 = await Promise.all(
    Array.from({ length: 12 }).map((_, i) => measureFetch('http://localhost:3000/api/competitions'))
  );
  const total12 = Math.round(performance.now() - start12);
  console.log(`12 Parallel Requests Finished in: ${total12}ms. Individual durations: ${res12.map(r => r.duration + 'ms').join(', ')}`);

  await pool.end();
}

run().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
