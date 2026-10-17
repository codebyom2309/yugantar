import fs from 'fs';

// Load .env.local for standalone testing
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { getDbConnection } from './db-helper.mjs';
import { renderTemplateToPdfBuffer } from '../src/lib/studioPdfRenderer.ts';

async function main() {
  const conn = await getDbConnection();
  const [rows] = await conn.query('SELECT * FROM pass_templates WHERE id IN ("827ebe0e-e3d9-4959-abb2-aff2476ff5b5", "7c452636-20c2-4ab7-beee-382eac96f2af")');
  await conn.end();

  for (const r of rows) {
    const tpl = {
      ...r,
      width_pt: Number(r.width_pt),
      height_pt: Number(r.height_pt),
      background_opacity: Number(r.background_opacity),
      elements: typeof r.elements === 'string' ? JSON.parse(r.elements) : r.elements,
    };

    console.log(`Testing renderer for [${tpl.title}] (${tpl.paper_size} ${tpl.orientation}, ${tpl.width_pt}x${tpl.height_pt} pt)...`);
    const pdfBytes = await renderTemplateToPdfBuffer(tpl);
    const outPath = `public/test-${tpl.title}-new-renderer.pdf`;
    fs.writeFileSync(outPath, pdfBytes);
    console.log(`SUCCESS! Generated ${outPath} (${pdfBytes.length} bytes)`);
  }
}

main().catch(console.error);
