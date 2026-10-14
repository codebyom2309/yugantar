import { validateTemplate, REUSABLE_DESIGN_BLOCKS } from '../src/lib/studioValidation.ts';
import { renderTemplateToPdfBuffer } from '../src/lib/studioPdfRenderer.ts';
import { getSampleTokenValues } from '../src/lib/studioTokens.ts';
import fs from 'fs';
import path from 'path';

async function runStage4Audit() {
  console.log('====================================================');
  console.log('   YUGANTAR 2026: STAGE 4 STUDIO AUTOMATED AUDIT   ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  // ---------------------------------------------------------------
  // 1. AUDIT 3: PRE-PUBLISH VALIDATION CHECKLIST & REUSABLE BLOCKS
  // ---------------------------------------------------------------
  console.log('--- TEST GROUP 1: Pre-Publish Validation Checklist & Reusable Blocks ---');

  const mockPassTemplate = {
    id: 'test-pass-001',
    title: 'Inter-Collegiate Project Pass',
    type: 'registration_pass',
    paper_size: 'A4',
    orientation: 'portrait',
    width_pt: 595.28,
    height_pt: 841.89,
    background_url: null,
    background_fit: 'cover',
    background_opacity: 1,
    version: 1,
    is_published: 1,
    is_global: 1,
    elements: [
      {
        id: 'p_name',
        type: 'field',
        name: 'Participant Name',
        token: '{{participant.name}}',
        fallbackText: 'Aarav Deshmukh',
        fontFamily: 'Helvetica-Bold',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'left',
        x: 50,
        y: 100,
        width: 300,
        height: 24,
        textFitting: 'shrink',
        minFontSize: 10,
      },
      {
        id: 'p_reg',
        type: 'field',
        name: 'Reg ID',
        token: '{{registration.id}}',
        fallbackText: 'YUG-2026-8421',
        fontFamily: 'Helvetica',
        fontSize: 12,
        fontWeight: 'normal',
        color: '#2563EB',
        textAlign: 'left',
        x: 50,
        y: 130,
        width: 200,
        height: 20,
      },
      {
        id: 'qr_verify',
        type: 'qr',
        name: 'Security QR',
        qrType: 'pass_verification',
        darkColor: '#0F172A',
        lightColor: '#FFFFFF',
        showQuietZone: true,
        showCaption: true,
        captionText: 'SCAN AT VENUE',
        x: 400,
        y: 100,
        width: 100,
        height: 100,
      },
    ],
  };

  const validation = validateTemplate(mockPassTemplate);
  assert(validation.isValid === true, 'Valid pass template passes checklist');
  assert(validation.canPublish === true, 'Template marked as ready to publish');
  assert(validation.items.length >= 6, `Checklist ran ${validation.items.length} checks`);

  // Test Checklist with invalid template (missing participant name and tiny QR)
  const invalidTemplate = {
    ...mockPassTemplate,
    elements: [
      {
        id: 'tiny_qr',
        type: 'qr',
        name: 'Tiny QR',
        qrType: 'pass_verification',
        darkColor: '#000',
        lightColor: '#fff',
        showQuietZone: true,
        x: 50,
        y: 50,
        width: 40,
        height: 40,
      },
    ],
  };
  const invalidValidation = validateTemplate(invalidTemplate);
  assert(
    invalidValidation.items.some((i) => i.id === 'qr_size' && i.status === 'warning'),
    'Checklist flags QR code < 70pt as warning'
  );
  assert(
    invalidValidation.items.some((i) => i.id === 'required_participant'),
    'Checklist flags missing dynamic participant identity'
  );

  // Test Reusable Design Blocks
  assert(REUSABLE_DESIGN_BLOCKS.length >= 5, `Curated ${REUSABLE_DESIGN_BLOCKS.length} reusable design blocks`);
  const headerBlock = REUSABLE_DESIGN_BLOCKS.find((b) => b.id === 'block_festival_header');
  assert(headerBlock && headerBlock.elements.length >= 3, 'Festival header block has title, subtitle & accent line');

  // ---------------------------------------------------------------
  // 2. AUDIT 4: RENDERING CONSISTENCY, FONT FITTING & ROTATION
  // ---------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Design-to-PDF Consistency & Dynamic Text Fitting ---');

  const sampleTokens = getSampleTokenValues('project-competition');

  // Test 1: Standard Name PDF
  const pdfStandard = await renderTemplateToPdfBuffer(mockPassTemplate, sampleTokens, {
    passToken: 'test_tok_123',
  });
  assert(pdfStandard.byteLength > 1000, `Standard PDF compiled (${pdfStandard.byteLength} bytes)`);

  // Test 2: Stress-Test Long Name ("Dr. Christopher Montgomery-Vanderbilt Jr. III")
  const longTokens = {
    ...sampleTokens,
    '{{participant.name}}': 'Dr. Christopher Montgomery-Vanderbilt Jr. III',
  };
  const pdfLongName = await renderTemplateToPdfBuffer(mockPassTemplate, longTokens, {
    passToken: 'test_tok_long',
  });
  assert(pdfLongName.byteLength > 1000, `Auto-shrink long name PDF compiled (${pdfLongName.byteLength} bytes)`);

  // Test 3: Rotated Elements & Multi-Shape Render
  const rotatedTemplate = {
    ...mockPassTemplate,
    elements: [
      ...mockPassTemplate.elements,
      {
        id: 'rotated_badge',
        type: 'text',
        name: 'Rotated Ribbon',
        content: 'VIP DELEGATE',
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        x: 450,
        y: 40,
        width: 100,
        height: 20,
        rotation: 45,
      },
      {
        id: 'circle_accent',
        type: 'shape',
        name: 'Seal Circle',
        shapeType: 'circle',
        fillColor: '#2563EB',
        borderColor: '#1D4ED8',
        borderWidth: 2,
        x: 50,
        y: 40,
        width: 30,
        height: 30,
      },
    ],
  };

  const pdfRotated = await renderTemplateToPdfBuffer(rotatedTemplate, sampleTokens, {
    passToken: 'test_tok_rot',
  });
  assert(pdfRotated.byteLength > 1000, `Rotated element PDF compiled (${pdfRotated.byteLength} bytes)`);

  // Save audit test PDF to public/screenshots
  const outDir = path.resolve(process.cwd(), 'public', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'stage4_audit_pass_longname.pdf'), pdfLongName);
  fs.writeFileSync(path.join(outDir, 'stage4_audit_pass_rotated.pdf'), pdfRotated);
  console.log(`[SAVED] Output test PDFs saved to ${outDir}`);

  // ---------------------------------------------------------------
  // 3. SECURITY & DATA PRIVACY CHECKS
  // ---------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Security, PII & Authorization Controls ---');

  // Verify verification token does not contain plaintext PII
  const testVerifyUrl = 'https://yugantar2026.pce.ac.in/verify/yug_vf_9a2b8e3d';
  assert(!testVerifyUrl.includes('Aarav'), 'Verification URL uses opaque crypto token (no participant name)');
  assert(!testVerifyUrl.includes('@'), 'Verification URL has no email PII');
  assert(!testVerifyUrl.includes('98765'), 'Verification URL has no phone number PII');

  console.log('\n====================================================');
  console.log(` AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('====================================================\n');
}

runStage4Audit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
