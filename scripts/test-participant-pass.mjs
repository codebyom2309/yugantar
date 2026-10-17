import fs from 'fs';
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { getDbConnection } from './db-helper.mjs';
import { resolveActiveTemplate, extractRegistrationTokenMap } from '../src/lib/studioService.ts';
import { renderTemplateToPdfBuffer } from '../src/lib/studioPdfRenderer.ts';

async function main() {
  const regId = '00571e90-a14f-4584-a062-06e6dc985813';
  const conn = await getDbConnection();
  const [rows] = await conn.query('SELECT * FROM registrations WHERE id = ?', [regId]);
  await conn.end();

  if (rows.length === 0) {
    throw new Error('Registration not found');
  }

  const reg = rows[0];
  console.log(`Generating participant pass for: ${reg.leader_name} (${reg.competition_slug})`);

  const activeTemplate = await resolveActiveTemplate(reg.competition_slug, 'registration_pass');
  if (!activeTemplate) {
    throw new Error('No active template found');
  }

  console.log(`Resolved active template: [${activeTemplate.title}] (${activeTemplate.id})`);
  console.log(`Template bg: ${activeTemplate.background_url}, size: ${activeTemplate.paper_size} (${activeTemplate.width_pt} x ${activeTemplate.height_pt})`);

  const tokenMap = extractRegistrationTokenMap(reg);
  console.log('Sample tokens resolved:');
  console.log('- {{participant.name}}:', tokenMap['{{participant.name}}']);
  console.log('- {{registration.id}}:', tokenMap['{{registration.id}}']);
  console.log('- {{competition.name}}:', tokenMap['{{competition.name}}']);
  console.log('- {{payment.status}}:', tokenMap['{{payment.status}}']);

  const pdfBytes = await renderTemplateToPdfBuffer(activeTemplate, tokenMap, {
    passToken: reg.verification_token || reg.id,
  });

  const outPath = 'public/test-participant-pass-generated.pdf';
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`SUCCESS! Generated participant pass at ${outPath} (${pdfBytes.length} bytes)`);
}

main().catch(console.error);
