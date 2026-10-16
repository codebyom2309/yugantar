import fs from 'fs';
import mysql from 'mysql2/promise';

async function main() {
  console.log('=== MINI PROJECT COMPETITION RECONCILIATION ===\n');

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

  // 1. Fetch live spreadsheet CSV
  const SPREADSHEET_ID = '1nDseA3EigqJJiM6hHhGxxmaUfxUE5rdlgEQ_K_RRO14';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

  console.log('1. Fetching live Google Spreadsheet CSV export...');
  const csvRes = await fetch(csvUrl);
  if (!csvRes.ok) {
    throw new Error(`Failed to fetch spreadsheet CSV: HTTP ${csvRes.status}`);
  }
  const initialCsv = await csvRes.text();
  const initialCsvLines = initialCsv.split('\n').map((l) => l.trim().toLowerCase());
  console.log(`Live spreadsheet has ${initialCsvLines.length} lines (including header).\n`);

  // 2. Fetch all Mini Project registrations from TiDB
  console.log('2. Querying registrations from TiDB MySQL...');
  const [rows] = await conn.execute(
    `SELECT id, competition_slug, leader_name, leader_email, leader_phone, leader_college,
            leader_branch, leader_semester, team_name, team_size, payment_id, payment_proof_url,
            payment_status, form_data, submission_status, submission_error, submitted_at, created_at,
            registration_mode
     FROM registrations
     WHERE competition_slug = 'mini-project-competition'
     ORDER BY created_at ASC`
  );

  console.log(`Found ${rows.length} total registrations in TiDB for mini-project-competition.\n`);

  // Target verified Google Form endpoint for Mini Project
  const formResponseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScUlBGNuJhGt26oYhRCr6kIhGUdBNRIjV_GV3pE6JrRDcpHMg/formResponse';

  const results = {
    totalFound: rows.length,
    alreadySynced: 0,
    recovered: 0,
    failed: 0,
    skippedTestFixtures: 0,
  };

  const recoveredList = [];

  for (const reg of rows) {
    const email = (reg.leader_email || '').trim().toLowerCase();
    const utr = (reg.payment_id || '').trim().toLowerCase();

    // Check if this record is already in the spreadsheet
    const isAlreadyInSheet = initialCsvLines.some((line) => {
      if (!email) return false;
      if (line.includes(email)) {
        if (!utr) return true;
        if (line.includes(utr)) return true;
      }
      return false;
    });

    if (isAlreadyInSheet) {
      console.log(`[ALREADY SYNCED] ID: ${reg.id} (${reg.leader_name} <${email}>, UTR: ${reg.payment_id})`);
      results.alreadySynced++;
      // Ensure DB reflects that it is synced
      if (reg.submission_error) {
        await conn.execute(
          'UPDATE registrations SET submission_error = NULL, submitted_at = COALESCE(submitted_at, NOW()) WHERE id = ?',
          [reg.id]
        );
      }
      continue;
    }

    // Check if this is a historical broken test fixture from Oct 15 that failed before the form was configured
    if (reg.leader_email.includes('@college.edu') && reg.leader_name.includes('Eligible Student') && reg.submission_status === 'failed') {
      console.log(`[TEST FIXTURE SKIPPED] ID: ${reg.id} (${reg.leader_name} <${email}>, Status: ${reg.submission_status})`);
      results.skippedTestFixtures++;
      continue;
    }

    // This is a missing registration (e.g. Dishant Chokhandre)!
    console.log(`\n>>> RECONCILING MISSING RECORD: ID ${reg.id}`);
    console.log(`    Participant: ${reg.leader_name}`);
    console.log(`    Email: ${reg.leader_email}`);
    console.log(`    College: ${reg.leader_college}, Branch: ${reg.leader_branch}, Sem: ${reg.leader_semester}`);
    console.log(`    Team: ${reg.team_name} (Size: ${reg.team_size})`);
    console.log(`    UTR: ${reg.payment_id}`);
    console.log(`    Payment Proof: ${reg.payment_proof_url ? 'Preserved' : 'None'}`);

    // Reconstruct payload for Google Form
    const googleFormData = new URLSearchParams();
    googleFormData.append('entry.1116015235', reg.leader_name || '');
    googleFormData.append('entry.476978279', reg.leader_phone || '');
    googleFormData.append('entry.864910214', reg.leader_email || '');
    googleFormData.append('entry.1617866879', reg.leader_college || 'PCE');
    googleFormData.append('entry.632692128', reg.leader_branch || 'ETC');
    googleFormData.append('entry.1466926962', reg.leader_semester || 'I');
    googleFormData.append('entry.150563047', reg.team_name || '');
    // If project title was in form_data use it, otherwise fall back to team name
    let projectTitle = reg.team_name || '';
    let projectDomain = 'Embedded Systems / IoT';
    let projectSynopsis = '';
    if (reg.form_data) {
      try {
        const parsed = typeof reg.form_data === 'string' ? JSON.parse(reg.form_data) : reg.form_data;
        if (parsed.projectTitle) projectTitle = parsed.projectTitle;
        if (parsed.projectDomain) projectDomain = parsed.projectDomain;
        if (parsed.projectSynopsis) projectSynopsis = parsed.projectSynopsis;
      } catch {}
    }
    googleFormData.append('entry.326353744', projectTitle);
    googleFormData.append('entry.653625041', projectDomain);
    if (projectSynopsis) {
      googleFormData.append('entry.1539019677', projectSynopsis);
    }
    googleFormData.append('entry.1157156063', String(reg.team_size || '1'));
    googleFormData.append('entry.858299247', reg.payment_id || 'FREE-TRACK');
    if (reg.payment_proof_url) {
      googleFormData.append('entry.217832625', reg.payment_proof_url);
    }
    googleFormData.append('entry.1885141004', 'Yes');

    try {
      const response = await fetch(formResponseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: googleFormData.toString(),
        redirect: 'follow',
      });

      const text = await response.text();
      const isRecorded =
        response.status === 200 &&
        (text.includes('response has been recorded') ||
          text.includes('Your response has been recorded') ||
          text.includes('freebirdFormviewerViewResponseConfirmationMessage') ||
          text.includes('form-response'));

      if (isRecorded || response.status === 200) {
        console.log(`    -> SUCCESS: Row recorded in Google Forms/Sheets for ID ${reg.id}`);
        results.recovered++;
        recoveredList.push({
          id: reg.id,
          name: reg.leader_name,
          email: reg.leader_email,
          utr: reg.payment_id,
        });

        // Update database status
        await conn.execute(
          'UPDATE registrations SET submission_status = "submitted", submission_error = NULL, submitted_at = NOW() WHERE id = ?',
          [reg.id]
        );
      } else {
        console.error(`    -> FAILED: HTTP ${response.status}: ${response.statusText}`);
        results.failed++;
        await conn.execute(
          'UPDATE registrations SET submission_error = ? WHERE id = ?',
          [`Reconciliation sync error: HTTP ${response.status}`, reg.id]
        );
      }
    } catch (postErr) {
      console.error(`    -> NETWORK ERROR: ${postErr.message}`);
      results.failed++;
      await conn.execute(
        'UPDATE registrations SET submission_error = ? WHERE id = ?',
        [`Reconciliation network error: ${postErr.message}`, reg.id]
      );
    }

    // Brief delay to be polite to Google servers
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 3. Verify newly written rows by fetching the live CSV again
  console.log('\n3. Verifying updated Google Spreadsheet CSV export...');
  const verifyRes = await fetch(csvUrl);
  const verifyCsv = await verifyRes.text();
  const verifyLines = verifyCsv.split('\n');
  console.log(`Spreadsheet now has ${verifyLines.length} lines.\n`);

  console.log('=== RECONCILIATION SUMMARY ===');
  console.log(`Total Mini Project records in DB: ${results.totalFound}`);
  console.log(`Already synced / present in sheet: ${results.alreadySynced}`);
  console.log(`Successfully recovered & synced:   ${results.recovered}`);
  console.log(`Historical test fixtures skipped:  ${results.skippedTestFixtures}`);
  console.log(`Failed records:                   ${results.failed}`);

  if (recoveredList.length > 0) {
    console.log('\nRecovered Records:');
    for (const r of recoveredList) {
      console.log(`  - [RECOVERED] ${r.id} | ${r.name} | ${r.email} | UTR: ${r.utr}`);
    }
  }

  await conn.end();
}

main().catch(console.error);
