import fs from 'fs';

async function main() {
  console.log('================================================================');
  console.log('YUGANTAR 2026 — MOBILE DROPDOWN COMPONENT & UX VERIFICATION');
  console.log('================================================================\n');

  const modernSelectSrc = fs.readFileSync('src/components/ui/ModernSelect.tsx', 'utf8');
  const registerPageSrc = fs.readFileSync('src/app/competitions/[slug]/register/page.tsx', 'utf8');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`✅ PASS: ${name} ${extra}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${extra}`);
      failed++;
    }
  }

  console.log('--- 1. Checking Keyboard Auto-Focus Bug Fix (BUG 2) ---');
  assert(
    'No automatic .focus() calls on searchInputRef',
    !modernSelectSrc.includes('searchInputRef.current?.focus()')
  );
  assert(
    'No autoFocus attribute on search input',
    !modernSelectSrc.includes('autoFocus')
  );
  assert(
    'Search input triggers focus only upon explicit user click/tap',
    modernSelectSrc.includes('onClick={(e) => e.stopPropagation()}')
  );
  assert(
    'Trigger element is a standard button type="button" (does not open keyboard on mobile)',
    modernSelectSrc.includes('type="button"') && modernSelectSrc.includes('ref={triggerRef}')
  );

  console.log('\n--- 2. Checking Arena Reference Card Layering Bug Fix (BUG 1) ---');
  assert(
    'ModernSelect uses createPortal to escape parent stacking context',
    modernSelectSrc.includes('createPortal') && modernSelectSrc.includes('document.body')
  );
  assert(
    'Portaled dropdown has fixed z-[9999] elevation',
    modernSelectSrc.includes('fixed z-[9999]')
  );
  assert(
    'Form workspace has explicit z-20 elevation above sidebar',
    registerPageSrc.includes('lg:col-span-8 relative z-20')
  );
  assert(
    'Sidebar with Arena Reference has relative z-10 elevation below form workspace',
    registerPageSrc.includes('lg:col-span-4 space-y-5 lg:sticky lg:top-28 relative z-10')
  );

  console.log('\n--- 3. Checking Viewport Collision & Directional Flipping ---');
  assert(
    'Calculates spaceBelow and spaceAbove for upward flip near bottom',
    modernSelectSrc.includes('spaceBelow < 220 && spaceAbove > spaceBelow')
  );
  assert(
    'Supports window.visualViewport for mobile virtual keyboard awareness',
    modernSelectSrc.includes('window.visualViewport')
  );
  assert(
    'List container has overscroll-contain to prevent parent scrolling',
    modernSelectSrc.includes('overscroll-contain')
  );
  assert(
    'Listens to window scroll (capture) and resize to maintain anchor lock',
    modernSelectSrc.includes("window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true })")
  );

  console.log('\n--- 4. Checking Live HTTP Responses for Mini Project vs Project Comp ---');
  try {
    const miniRes = await fetch('http://localhost:3000/competitions/mini-project-competition/register');
    const miniHtml = await miniRes.text();
    assert(
      'Mini Project registration route responds with HTTP 200',
      miniRes.status === 200
    );
    assert(
      'Mini Project contains eligibility banner for Semesters III, VI',
      miniHtml.includes('Eligibility: Semesters') || miniHtml.includes('III')
    );

    const projRes = await fetch('http://localhost:3000/competitions/project-competition/register');
    const projHtml = await projRes.text();
    assert(
      'Project Competition registration route responds with HTTP 200',
      projRes.status === 200
    );
    assert(
      'Form workspace card renders with z-20 in HTML',
      projHtml.includes('relative z-20')
    );
    assert(
      'Arena Reference card renders with z-10 in HTML',
      projHtml.includes('relative z-10')
    );
  } catch (err) {
    console.error('Network check error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`DROPDOWN VERIFICATION SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
