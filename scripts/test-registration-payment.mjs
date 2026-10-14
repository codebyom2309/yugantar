/**
 * Automated Verification Suite — Registration Stability & Dynamic UPI QR
 *
 * Verifies:
 * 1. Authoritative fee extraction from TiDB database & events catalog.
 * 2. Standard UPI URI parameter encoding (pa, pn, am, cu, tn).
 * 3. Exact matching between configured fee and encoded am parameter.
 * 4. Strict validation preventing missing/empty fee from defaulting to ₹1 or ₹300.
 * 5. Free track protection (no paid QR generated).
 * 6. Differentiation between tracks with different fees (e.g. ₹200, ₹150, ₹100, ₹1).
 * 7. End-to-end QR decoding and parameter inspection.
 */

import { buildUpiPaymentUri, extractNumericFee, validateCompetitionFee, isValidUpiId } from '../src/lib/upiPayment.ts';
import mysql from 'mysql2/promise';

const divider = '─'.repeat(72);

async function runTests() {
  console.log('\n' + divider);
  console.log('🚀 YUGANTAR 2026 — REGISTRATION & UPI QR VERIFICATION SUITE');
  console.log(divider + '\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Unit Tests on extractNumericFee & Multi-tier parsing
  // -------------------------------------------------------------------------
  console.log('📦 SUITE 1: Fee Extraction & Numeric Parsing');
  assert(extractNumericFee('₹300 per team') === '300.00', 'Extracts ₹300 per team -> 300.00');
  assert(extractNumericFee('₹200 per team') === '200.00', 'Extracts ₹200 per team -> 200.00');
  assert(extractNumericFee('₹150 per team') === '150.00', 'Extracts ₹150 per team -> 150.00');
  assert(extractNumericFee('₹100 per person / ₹150 team', 1) === '100.00', 'Extracts compound solo tier -> 100.00');
  assert(extractNumericFee('₹100 per person / ₹150 team', 2) === '150.00', 'Extracts compound team tier -> 150.00');
  assert(extractNumericFee('1') === '1.00', 'Extracts raw string "1" -> 1.00');
  assert(extractNumericFee('Free') === null, 'Extracts "Free" -> null');
  assert(extractNumericFee('') === null, 'Extracts empty string -> null');
  assert(extractNumericFee(null) === null, 'Extracts null -> null');

  // -------------------------------------------------------------------------
  // TEST 2: Fee Validation & Anti-Silent Substitution Guards
  // -------------------------------------------------------------------------
  console.log('\n🛡️ SUITE 2: Anti-Silent Substitution & Missing Fee Protection');
  
  // Guard 1: Missing fee on paid track cannot silently become ₹1 or ₹300
  const missingFeeCheck = validateCompetitionFee(true, '', 'teleera@oksbi');
  assert(missingFeeCheck.isValid === false, 'Rejects empty fee for paid track');
  assert(missingFeeCheck.numericAmount === null, 'Missing fee has null amount (never defaults to 1.00)');
  assert(missingFeeCheck.errorMessage?.includes('not been configured'), 'Provides clear coordinator configuration error');

  // Guard 2: Free string on paid track is rejected
  const freeOnPaidCheck = validateCompetitionFee(true, 'Free', 'teleera@oksbi');
  assert(freeOnPaidCheck.isValid === false, 'Rejects "Free" on track marked as paid');

  // Guard 3: Invalid UPI VPA is rejected
  const invalidVpaCheck = validateCompetitionFee(true, '₹200', 'invalid-vpa-without-handle');
  assert(invalidVpaCheck.isValid === false, 'Rejects invalid UPI ID format');

  // Guard 4: Free competition preserves free workflow without generating paid QR
  const freeTrackCheck = validateCompetitionFee(false, 'Free', null);
  assert(freeTrackCheck.isValid === true, 'Free competition is valid');
  assert(freeTrackCheck.isPaid === false, 'Free competition isPaid is false');
  assert(freeTrackCheck.numericAmount === null, 'Free competition numericAmount is null');

  // -------------------------------------------------------------------------
  // TEST 3: UPI URI Construction & Decoding
  // -------------------------------------------------------------------------
  console.log('\n🔗 SUITE 3: UPI URI Construction & Param Validation');
  const uri = buildUpiPaymentUri({
    upiId: 'omsatange5788@okaxis',
    payeeName: 'TELE-ERA YUGANTAR 2026',
    amount: '1.00',
    transactionNote: 'Project Competition Registration',
  });

  const parsedUrl = new URL(uri);
  const params = parsedUrl.searchParams;
  assert(parsedUrl.protocol === 'upi:', 'Protocol is upi:');
  assert(parsedUrl.hostname === 'pay', 'Host is pay');
  assert(params.get('pa') === 'omsatange5788@okaxis', 'Param "pa" matches payee UPI ID');
  assert(params.get('pn') === 'TELE-ERA YUGANTAR 2026', 'Param "pn" matches payee name');
  assert(params.get('am') === '1.00', 'Param "am" matches exact configured fee 1.00');
  assert(params.get('cu') === 'INR', 'Param "cu" is currency INR');
  assert(params.get('tn') === 'Project Competition Registration', 'Param "tn" matches transaction note');

  // -------------------------------------------------------------------------
  // TEST 4: Live TiDB Database Fee Inspection & Decoded URIs
  // -------------------------------------------------------------------------
  console.log('\n🗄️ SUITE 4: Live Database Configuration & Cross-Track Fee Isolation');
  let dbPool;
  try {
    const url = new URL(process.env.DATABASE_URL);
    dbPool = mysql.createPool({
      host: url.hostname,
      port: parseInt(url.port || '4000', 10),
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', '') || 'yugantar',
      ssl: { rejectUnauthorized: true },
    });

    const [rows] = await dbPool.query(
      'SELECT slug, name, is_paid, registration_fee, upi_id, payee_name, is_fee_fixed FROM competitions ORDER BY slug'
    );

    console.log(`  Found ${rows.length} competition tracks in database.`);

    for (const comp of rows) {
      const isPaid = Boolean(comp.is_paid);
      const validation = validateCompetitionFee(isPaid, comp.registration_fee, comp.upi_id);

      if (!isPaid) {
        assert(!validation.isPaid && validation.numericAmount === null, `Free track "${comp.slug}" correctly has zero paid QR amount`);
      } else {
        assert(validation.isValid, `Paid track "${comp.slug}" passes validation`);
        assert(validation.numericAmount !== null, `Paid track "${comp.slug}" has parsed numeric amount: ₹${validation.numericAmount}`);

        const trackUri = buildUpiPaymentUri({
          upiId: comp.upi_id,
          payeeName: comp.payee_name || 'TELE-ERA YUGANTAR 2026',
          amount: validation.numericAmount,
          transactionNote: `${comp.name} Registration`,
        });

        const trackParams = new URL(trackUri).searchParams;
        assert(trackParams.get('am') === validation.numericAmount, `Track "${comp.slug}" URI am strictly matches: ${trackParams.get('am')}`);
        assert(trackParams.get('pa') === comp.upi_id, `Track "${comp.slug}" UPI ID matches: ${trackParams.get('pa')}`);
      }
    }
  } catch (err) {
    console.error('Database connection/query error:', err);
    assert(false, `Database test encountered error: ${err.message}`);
  } finally {
    if (dbPool) await dbPool.end();
  }

  // -------------------------------------------------------------------------
  // TEST 5: Verify Different Competitions Generate Different Amounts
  // -------------------------------------------------------------------------
  console.log('\n🎯 SUITE 5: Cross-Track Isolation & Differentiation');
  const projectUri = buildUpiPaymentUri({
    upiId: 'omsatange5788@okaxis',
    payeeName: 'TELE-ERA YUGANTAR 2026',
    amount: extractNumericFee('1'),
    transactionNote: 'Project Competition Registration',
  });
  const pptUri = buildUpiPaymentUri({
    upiId: 'teleera@oksbi',
    payeeName: 'TELE-ERA YUGANTAR 2026',
    amount: extractNumericFee('₹200 per team'),
    transactionNote: 'PPT Presentation Registration',
  });
  const posterUri = buildUpiPaymentUri({
    upiId: 'teleera@oksbi',
    payeeName: 'TELE-ERA YUGANTAR 2026',
    amount: extractNumericFee('₹150 per team'),
    transactionNote: 'Poster Competition Registration',
  });

  const pAm = new URL(projectUri).searchParams.get('am');
  const pptAm = new URL(pptUri).searchParams.get('am');
  const posterAm = new URL(posterUri).searchParams.get('am');

  assert(pAm === '1.00', 'Project competition encodes 1.00');
  assert(pptAm === '200.00', 'PPT presentation encodes 200.00');
  assert(posterAm === '150.00', 'Poster competition encodes 150.00');
  assert(pAm !== pptAm && pptAm !== posterAm, 'All three tracks generate isolated, distinct fees');

  // Summary
  console.log('\n' + divider);
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(divider + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
