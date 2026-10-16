import fs from 'fs';
import mysql from 'mysql2/promise';

const BASE_URL = 'http://localhost:3000';

function getDbConfig() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (!match) throw new Error('DATABASE_URL not found in .env.local');
  const url = new URL(match[1]);
  return {
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  };
}

const ADMIN_ENDPOINTS = [
  '/api/admin/dashboard',
  '/api/admin/settings',
  '/api/admin/registrations',
  '/api/admin/competitions',
  '/api/admin/faqs',
  '/api/admin/media',
  '/api/admin/organizers',
  '/api/admin/spreadsheets',
  '/api/admin/system',
  '/api/admin/users',
  '/api/admin/audit-log',
];

async function main() {
  console.log('================================================================');
  console.log('YUGANTAR 2026 — PHASE 5: COMPLETE ADMIN PANEL SECURITY & AUDIT');
  console.log('================================================================\n');

  let allPassed = true;

  // 1. Test unauthenticated API route protection
  console.log('--- TEST 1: Unauthenticated Admin API Protection (Must Return HTTP 401) ---');
  for (const ep of ADMIN_ENDPOINTS) {
    try {
      const res = await fetch(`${BASE_URL}${ep}`);
      if (res.status === 401) {
        console.log(`✅ [401 Unauthorized] ${ep} is strictly guarded.`);
      } else {
        console.error(`❌ [${res.status} != 401] ${ep} is NOT returning 401 Unauthorized!`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`💥 Fetch error on ${ep}:`, err.message);
      allPassed = false;
    }
  }

  // 2. Test Admin Login Page
  console.log('\n--- TEST 2: Admin Login Page Accessibility ---');
  try {
    const loginRes = await fetch(`${BASE_URL}/admin/login`);
    const loginHtml = await loginRes.text();
    const hasEmailField = loginHtml.includes('name="email"') || loginHtml.includes('type="email"');
    const hasPasswordField = loginHtml.includes('name="password"') || loginHtml.includes('type="password"');

    if (loginRes.status === 200 && (hasEmailField || hasPasswordField)) {
      console.log(`✅ [200 OK] /admin/login renders with proper authentication form fields.`);
    } else {
      console.error(`❌ /admin/login failed or missing credentials form: status ${loginRes.status}`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`💥 Error testing login page:`, err.message);
    allPassed = false;
  }

  // 3. Database admin_users & password hashing check
  console.log('\n--- TEST 3: Admin Users Table & Password Hashing Standard ---');
  const conn = await mysql.createConnection(getDbConfig());
  try {
    const [users] = await conn.query('SELECT id, email, name, role, is_enabled, password_hash FROM admin_users');
    console.log(`Found ${users.length} admin user(s) in TiDB Cloud.`);

    for (const u of users) {
      const isBcrypt = typeof u.password_hash === 'string' && u.password_hash.startsWith('$2');
      if (isBcrypt) {
        console.log(`✅ Admin [${u.email}] role="${u.role}" has secure bcrypt password hash.`);
      } else if (!u.password_hash) {
        console.log(`ℹ️ Admin [${u.email}] role="${u.role}" uses OAuth (no password hash).`);
      } else {
        console.error(`❌ Admin [${u.email}] has insecure non-bcrypt password hash!`);
        allPassed = false;
      }
    }

    // 4. Test Audit Log Table Integrity
    console.log('\n--- TEST 4: Audit Log Table Schema & Integrity ---');
    const [auditLogDesc] = await conn.query('DESCRIBE audit_log');
    const columnNames = auditLogDesc.map((c) => c.Field);
    const expectedCols = ['id', 'admin_id', 'admin_email', 'action', 'entity_type', 'entity_id', 'created_at'];
    const hasAllExpected = expectedCols.every((col) => columnNames.includes(col));

    if (hasAllExpected) {
      console.log(`✅ audit_log table has all required audit tracking fields: ${expectedCols.join(', ')}`);
    } else {
      console.error(`❌ audit_log table is missing required columns:`, columnNames);
      allPassed = false;
    }
  } finally {
    await conn.end();
  }

  console.log('\n================================================================');
  console.log(`PHASE 5 ADMIN AUDIT RESULT: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
  console.log('================================================================');

  if (!allPassed) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal admin test error:', err);
  process.exit(1);
});
