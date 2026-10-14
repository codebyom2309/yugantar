import fs from 'fs';
import mysql from 'mysql2/promise';
import { renderTemplateToPdfBuffer } from '../src/lib/studioPdfRenderer.ts';
import { getSampleTokenValues } from '../src/lib/studioTokens.ts';

async function main() {
  console.log('=== AUDIT 2: DESIGN-TO-PDF CONSISTENCY TEST ===');

  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const url = new URL(match[1]);
  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [rows] = await conn.query('SELECT * FROM pass_templates WHERE id = ?', ['global-registration-pass-default']);
  if (!rows || rows.length === 0) {
    throw new Error('Default template not found');
  }
  const rawTemplate = rows[0];
  const template = {
    ...rawTemplate,
    width_pt: Number(rawTemplate.width_pt),
    height_pt: Number(rawTemplate.height_pt),
    background_opacity: Number(rawTemplate.background_opacity),
    elements: typeof rawTemplate.elements === 'string' ? JSON.parse(rawTemplate.elements) : rawTemplate.elements,
  };

  console.log(`Template: "${template.title}" (${template.paper_size} ${template.orientation})`);
  console.log(`Page Dimensions: ${template.width_pt} pt x ${template.height_pt} pt`);
  console.log(`Elements Count: ${template.elements.length}`);

  // Inspect elements
  const findings = [];

  for (const el of template.elements) {
    // Check out of bounds
    if (el.x < 0 || el.x + el.width > template.width_pt) {
      findings.push(`Horizontal boundary alert: ${el.id} (x: ${el.x}, w: ${el.width}) exceeds width ${template.width_pt}`);
    }
    if (el.y < 0 || el.y + el.height > template.height_pt) {
      findings.push(`Vertical boundary alert: ${el.id} (y: ${el.y}, h: ${el.height}) exceeds height ${template.height_pt}`);
    }
    // Check text element font and sizing
    if (el.type === 'text' || el.type === 'field') {
      if (!el.fontSize || el.fontSize < 6) {
        findings.push(`Font size alert: ${el.id} has very small font size: ${el.fontSize}pt`);
      }
    }
    // Check QR
    if (el.type === 'qr') {
      if (el.width < 50 || el.height < 50) {
        findings.push(`QR size alert: ${el.id} (${el.width}x${el.height}pt) may be too small for reliable mobile scanning.`);
      }
    }
  }

  // Render to PDF buffer
  const sampleData = getSampleTokenValues('project-competition');
  const pdfBytes = await renderTemplateToPdfBuffer(template, sampleData, {
    passToken: 'v2.audit.test.token',
    certToken: 'CERT-YUG-2026-AUDIT',
  });

  console.log(`\nGenerated PDF buffer size: ${pdfBytes.length} bytes`);
  fs.writeFileSync('public/screenshots/stage3_baseline_test_pass.pdf', Buffer.from(pdfBytes));
  console.log('Saved baseline PDF: public/screenshots/stage3_baseline_test_pass.pdf');

  console.log('\n--- Consistency & Layout Baseline Findings ---');
  if (findings.length === 0) {
    console.log('✅ All template elements are strictly positioned within page boundaries.');
  } else {
    findings.forEach((f) => console.log('⚠️', f));
  }

  await conn.end();
}

main().catch(console.error);
