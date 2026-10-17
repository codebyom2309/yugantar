import fs from 'fs';
if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

import { COMPETITIONS } from '../src/data/events.ts';
import { REGISTRATION_FORMS } from '../src/data/registrationForms.ts';
import { db } from '../src/lib/db.ts';

async function auditData() {
  console.log('=== COMPETITIONS & REGISTRATION FORMS AUDIT ===');
  console.log('Total Competitions in events.ts:', COMPETITIONS.length);
  console.log('Total Forms in registrationForms.ts:', REGISTRATION_FORMS.length);

  let allMatched = true;
  COMPETITIONS.forEach((c, idx) => {
    const form = REGISTRATION_FORMS.find(f => f.competitionSlug === c.slug);
    console.log(`\n[${idx + 1}] Slug: ${c.slug}`);
    console.log(`    Name: ${c.name}`);
    console.log(`    Fee: ${c.registrationFee} | isPaid: ${c.isPaid}`);
    console.log(`    Team Size: ${c.teamSizeLimit} (max: ${c.maxTeamMembers}) | IndividualOnly: ${c.isIndividualOnly}`);
    console.log(`    Allowed Semesters: ${JSON.stringify(c.allowedSemesters || 'ALL')}`);
    console.log(`    Coordinators: ${c.coordinators ? c.coordinators.length : 0}`);
    console.log(`    Registration Form Found: ${form ? 'YES (' + form.fields.length + ' fields)' : 'NO'}`);
    if (form) {
      const requiredFields = form.fields.filter(f => f.required).map(f => f.name);
      console.log(`    Required fields (${requiredFields.length}): ${requiredFields.join(', ')}`);
    } else {
      allMatched = false;
    }
  });

  console.log('\nAll 9 competitions match their registration forms:', allMatched ? 'YES' : 'NO');

  console.log('\n=== DATABASE RECORD COUNTS (READ ONLY) ===');
  try {
    const [regs] = await db.query('SELECT COUNT(*) as cnt FROM registrations');
    const [tpls] = await db.query('SELECT COUNT(*) as cnt FROM pass_templates');
    const [fallbacks] = await db.query('SELECT COUNT(*) as cnt FROM studio_asset_fallbacks');
    console.log('Registrations in DB:', regs ? regs.cnt : 'N/A');
    console.log('Pass Templates in DB:', tpls ? tpls.cnt : 'N/A');
    console.log('Studio Asset Fallbacks in DB:', fallbacks ? fallbacks.cnt : 'N/A');
  } catch (err) {
    console.error('DB query error:', err.message);
  }
}

auditData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
