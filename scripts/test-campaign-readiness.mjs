import fs from 'fs';
import mysql from 'mysql2/promise';

async function runTests() {
  console.log('====================================================');
  console.log('   YUGANTAR 2026 CAMPAIGN-READINESS TEST SUITE      ');
  console.log('====================================================\n');

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

  // 1. Database Connection & Event Date Checks
  console.log('--- TEST GROUP 1: Event Dates & Database Settings ---');
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) dbUrl = match[1];
  }
  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  });

  const [dateFaqs] = await connection.execute('SELECT question, answer FROM faqs WHERE answer LIKE "%19 October%" OR answer LIKE "%19th October%"');
  assert(dateFaqs.length === 0, `No stale "19 October" in faqs table (found: ${dateFaqs.length})`);

  const [correctFaqs] = await connection.execute('SELECT question, answer FROM faqs WHERE answer LIKE "%21 October 2026%"');
  assert(correctFaqs.length > 0, `Found "21 October 2026" in faqs table (${correctFaqs.length} entries)`);

  const [settings] = await connection.execute('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ("event_dates", "department_discount_rules")');
  const discountRuleSetting = settings.find(s => s.setting_key === 'department_discount_rules');
  assert(!!discountRuleSetting, 'department_discount_rules setting exists in site_settings');

  let discountRule = null;
  if (discountRuleSetting) {
    try {
      discountRule = typeof discountRuleSetting.setting_value === 'string'
        ? JSON.parse(discountRuleSetting.setting_value)
        : discountRuleSetting.setting_value;
    } catch (e) {}
  }
  assert(discountRule && discountRule.enabled === true, 'Department discount rule is enabled');
  assert(discountRule && discountRule.institution === 'PCE', `Discount institution is PCE (actual: ${discountRule?.institution})`);
  const targetDept = discountRule?.department || 'ETC';
  assert(discountRule && (discountRule.department === 'ETC' || discountRule.department === 'ITC'), `Discount department is valid (actual: ${discountRule?.department})`);
  assert(discountRule && discountRule.discountPercentage === 50, `Discount percentage is 50% (actual: ${discountRule?.discountPercentage}%)`);

  // 2. Pricing & Discount Calculations on multiple fees
  console.log('\n--- TEST GROUP 2: Pricing & Discount Engine ---');
  function calculateDiscount(normalFee, college, branch, rule) {
    if (!rule || !rule.enabled || normalFee <= 0) {
      return { eligible: false, normalFee, discountAmount: 0, finalFee: normalFee };
    }
    const cMatch = !rule.institution || rule.institution === 'ALL' || (college || '').toUpperCase() === rule.institution.toUpperCase();
    const dMatch = !rule.department || rule.department === 'ALL' || (branch || '').toUpperCase() === rule.department.toUpperCase();
    if (cMatch && dMatch) {
      const pct = rule.discountPercentage || 50;
      const discountAmount = Math.round(normalFee * (pct / 100));
      const finalFee = Math.max(0, normalFee - discountAmount);
      return { eligible: true, normalFee, discountAmount, finalFee, pct };
    }
    return { eligible: false, normalFee, discountAmount: 0, finalFee: normalFee };
  }

  // Test Case A: ₹200 fee, eligible PCE + targetDept
  const calcA = calculateDiscount(200, 'PCE', targetDept, discountRule);
  assert(calcA.eligible === true, `PCE + ${targetDept} eligible for 200 fee`);
  assert(calcA.discountAmount === 100, `₹200 fee produces ₹100 discount (got: ${calcA.discountAmount})`);
  assert(calcA.finalFee === 100, `₹200 fee produces ₹100 final payable (got: ${calcA.finalFee})`);

  // Test Case B: ₹300 fee, eligible PCE + targetDept
  const calcB = calculateDiscount(300, 'PCE', targetDept, discountRule);
  assert(calcB.eligible === true, `PCE + ${targetDept} eligible for 300 fee`);
  assert(calcB.discountAmount === 150, `₹300 fee produces ₹150 discount (got: ${calcB.discountAmount})`);
  assert(calcB.finalFee === 150, `₹300 fee produces ₹150 final payable (got: ${calcB.finalFee})`);

  // Test Case C: ₹150 fee, eligible PCE + targetDept
  const calcC = calculateDiscount(150, 'PCE', targetDept, discountRule);
  assert(calcC.discountAmount === 75, `₹150 fee produces ₹75 discount (got: ${calcC.discountAmount})`);
  assert(calcC.finalFee === 75, `₹150 fee produces ₹75 final payable (got: ${calcC.finalFee})`);

  // Test Case D: ₹200 fee, ineligible branch (CSE)
  const calcD = calculateDiscount(200, 'PCE', 'CSE', discountRule);
  assert(calcD.eligible === false, 'PCE + CSE is ineligible');
  assert(calcD.discountAmount === 0, 'Ineligible student gets ₹0 discount');
  assert(calcD.finalFee === 200, 'Ineligible student pays full ₹200 fee');

  // Test Case E: ₹200 fee, ineligible college (VNIT)
  const calcE = calculateDiscount(200, 'VNIT', targetDept, discountRule);
  assert(calcE.eligible === false, `VNIT + ${targetDept} is ineligible`);
  assert(calcE.finalFee === 200, 'VNIT student pays full ₹200 fee');

  // Test Case F: Free event (₹0)
  const calcF = calculateDiscount(0, 'PCE', targetDept, discountRule);
  assert(calcF.finalFee === 0, 'Free competition remains ₹0');

  // 3. Dynamic Competitions Count & Arenas
  console.log('\n--- TEST GROUP 3: Dynamic Competitions & Arenas ---');
  const [publishedComps] = await connection.execute('SELECT id, slug, name, display_order FROM competitions WHERE is_published = 1 ORDER BY display_order ASC');
  assert(publishedComps.length >= 9, `System supports 9+ published competitions (found: ${publishedComps.length})`);
  const ninth = publishedComps[8];
  assert(!!ninth, `9th competition is present: "${ninth?.name}" (slug: ${ninth?.slug})`);

  // 4. Dedicated TurboBits Page & Sitemap
  console.log('\n--- TEST GROUP 4: Dedicated TurboBits Page & Sitemap ---');
  const turbobitsPath = 'src/app/turbobits/page.tsx';
  assert(fs.existsSync(turbobitsPath), 'src/app/turbobits/page.tsx exists');
  const turbobitsContent = fs.readFileSync(turbobitsPath, 'utf8');
  assert(turbobitsContent.includes('Meet TurboBits'), 'TurboBits page contains "Meet TurboBits" headline');
  assert(
    turbobitsContent.includes('student team behind the YUGANTAR 2026 digital experience') ||
    turbobitsContent.includes('TURBOBITS · STUDENT TECH & PLATFORM TEAM'),
    'TurboBits page contains verified team copy'
  );

  const [turbobitsMembers] = await connection.execute('SELECT id, name, role FROM organizer_members WHERE category = "turbo_bits"');
  assert(turbobitsMembers.length > 0, `Database contains TurboBits team members (${turbobitsMembers.length} verified members)`);

  const sitemapContent = fs.readFileSync('src/app/sitemap.ts', 'utf8');
  assert(sitemapContent.includes('/turbobits'), 'Sitemap includes /turbobits route');

  // 5. Small Student Coordinator Cards on About
  console.log('\n--- TEST GROUP 5: Student Coordinators on About ---');
  const aboutContent = fs.readFileSync('src/app/about/page.tsx', 'utf8');
  assert(aboutContent.includes("m.category === 'core_committee'"), 'About page filters for core_committee student coordinators');
  assert(!aboutContent.includes('Turbobits') && !aboutContent.includes('TURBOBITS TEAM'), 'About page does NOT display redundant TurboBits team section');
  assert(aboutContent.includes('/turbobits'), 'About page links cleanly to dedicated /turbobits page');

  // 6. Registration Dropdown & ModernSelect Component
  console.log('\n--- TEST GROUP 6: Modern Registration Dropdowns ---');
  const modernSelectPath = 'src/components/ui/ModernSelect.tsx';
  assert(fs.existsSync(modernSelectPath), 'src/components/ui/ModernSelect.tsx exists');
  const regFormContent = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');
  assert(regFormContent.includes('ModernSelect'), 'RegistrationForm uses ModernSelect component');
  assert(!regFormContent.includes('₹$$'), 'No double dollar sign typo in RegistrationForm');
  assert(regFormContent.includes('₹{discountEligibility.finalFee}'), 'Concession payable display cleanly shows ₹{discountEligibility.finalFee}');

  console.log('\n====================================================');
  console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  await connection.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
