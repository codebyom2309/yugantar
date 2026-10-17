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

import { renderTemplateToPdfBuffer } from '../src/lib/studioPdfRenderer.ts';
import { PAPER_DIMENSIONS } from '../src/types/studio.ts';
import { PDFDocument } from 'pdf-lib';

async function testPreset(paperSize, orientation, customW, customH) {
  let w = customW;
  let h = customH;
  if (paperSize !== 'CUSTOM') {
    const dim = PAPER_DIMENSIONS[paperSize][orientation];
    w = dim.widthPt;
    h = dim.heightPt;
  }

  const template = {
    id: `test-${paperSize}-${orientation}`,
    title: `Test ${paperSize} ${orientation}`,
    type: 'registration_pass',
    paper_size: paperSize,
    orientation,
    width_pt: w,
    height_pt: h,
    background_url: null,
    background_fit: 'cover',
    background_opacity: 1,
    is_published: 1,
    is_global: 0,
    version: 1,
    elements: [
      {
        id: 'el_title',
        type: 'text',
        content: `Pres: ${paperSize} ${orientation} (${w} x ${h} pt)`,
        fontFamily: 'Helvetica-Bold',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'center',
        x: 20,
        y: 30,
        width: w - 40,
        height: 40,
        zIndex: 1,
      },
    ],
  };

  const pdfBytes = await renderTemplateToPdfBuffer(template);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();

  const widthDiff = Math.abs(width - w);
  const heightDiff = Math.abs(height - h);
  const passed = widthDiff < 0.05 && heightDiff < 0.05;

  console.log(
    `Preset [${paperSize.padEnd(11)}] [${orientation.padEnd(9)}] Target: ${w.toFixed(2)} x ${h.toFixed(2)} pt | Actual: ${width.toFixed(2)} x ${height.toFixed(2)} pt | Passed: ${passed ? 'YES' : 'NO'}`
  );
  if (!passed) {
    throw new Error(`Dimension mismatch for ${paperSize} ${orientation}`);
  }
}

async function main() {
  console.log('--- TESTING ALL PAGE PRESETS AND DIMENSIONS ---');
  await testPreset('A4', 'portrait');
  await testPreset('A4', 'landscape');
  await testPreset('A5', 'portrait');
  await testPreset('A5', 'landscape');
  await testPreset('ID_BADGE', 'portrait');
  await testPreset('ID_BADGE', 'landscape');
  await testPreset('CERTIFICATE', 'portrait');
  await testPreset('CERTIFICATE', 'landscape');
  await testPreset('CUSTOM', 'portrait', 300, 600);
  await testPreset('CUSTOM', 'landscape', 750, 450);
  console.log('ALL PRESET TESTS PASSED PERFECTLY!');
}

main().catch(console.error);
