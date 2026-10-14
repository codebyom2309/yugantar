async function runSeoTests() {
  console.log('=== YUGANTAR 2026 — Comprehensive SEO Verification Suite ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Robots.txt
  console.log('\n--- 1. Testing /robots.txt ---');
  try {
    const robotsRes = await fetch('http://localhost:3000/robots.txt');
    assert(robotsRes.status === 200, '/robots.txt returns HTTP 200');
    const robotsTxt = await robotsRes.text();
    assert(robotsTxt.includes('Sitemap: https://teleera.turbobits.in/sitemap.xml'), 'robots.txt references production sitemap');
    assert(robotsTxt.includes('Disallow: /admin'), 'robots.txt disallows /admin');
    assert(robotsTxt.includes('Disallow: /pass'), 'robots.txt disallows /pass');
    assert(robotsTxt.includes('Disallow: /verify'), 'robots.txt disallows /verify');
    assert(robotsTxt.includes('Allow: /api/media/'), 'robots.txt allows /api/media/*');
  } catch (err) {
    assert(false, `robots.txt fetch error: ${err.message}`);
  }

  // 2. Sitemap.xml
  console.log('\n--- 2. Testing /sitemap.xml ---');
  try {
    const sitemapRes = await fetch('http://localhost:3000/sitemap.xml');
    assert(sitemapRes.status === 200, '/sitemap.xml returns HTTP 200');
    const sitemapXml = await sitemapRes.text();
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in</loc>') || sitemapXml.includes('<loc>https://teleera.turbobits.in/</loc>'), 'Sitemap contains homepage with canonical domain');
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in/competitions</loc>'), 'Sitemap contains /competitions');
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in/about</loc>'), 'Sitemap contains /about');
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in/districts</loc>'), 'Sitemap contains /districts');
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in/journey</loc>'), 'Sitemap contains /journey');
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in/faq</loc>'), 'Sitemap contains /faq');
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in/competitions/ideathon</loc>'), 'Sitemap contains published competition: ideathon');
    assert(sitemapXml.includes('<loc>https://teleera.turbobits.in/competitions/breadboard-competition</loc>'), 'Sitemap contains published competition: breadboard-competition');
    assert(!sitemapXml.includes('/admin'), 'Sitemap excludes admin routes');
    assert(!sitemapXml.includes('/pass'), 'Sitemap excludes pass routes');
    assert(!sitemapXml.includes('/verify'), 'Sitemap excludes verify routes');
    assert(!sitemapXml.includes('/register'), 'Sitemap excludes registration sub-routes');
  } catch (err) {
    assert(false, `sitemap.xml fetch error: ${err.message}`);
  }

  // 3. Homepage SEO & Schema
  console.log('\n--- 3. Testing Homepage (/) SEO & JSON-LD ---');
  try {
    const homeRes = await fetch('http://localhost:3000/');
    assert(homeRes.status === 200, 'Homepage returns HTTP 200');
    const homeHtml = await homeRes.text();
    assert(homeHtml.includes('<title>YUGANTAR 2026 — Engineering the Next Era | PCE Nagpur</title>'), 'Homepage has full descriptive title');
    assert(homeHtml.includes('name="description"'), 'Homepage has meta description');
    assert(homeHtml.includes('rel="canonical" href="https://teleera.turbobits.in"'), 'Homepage has canonical URL pointing to teleera.turbobits.in');
    assert(homeHtml.includes('property="og:url" content="https://teleera.turbobits.in"'), 'Homepage OpenGraph URL is teleera.turbobits.in');
    assert(homeHtml.includes('"@type":"EducationalOrganization"'), 'Homepage includes EducationalOrganization schema');
    assert(homeHtml.includes('"@type":"WebSite"'), 'Homepage includes WebSite schema');
    assert(homeHtml.includes('"@type":"Event"'), 'Homepage includes Event schema');
  } catch (err) {
    assert(false, `Homepage fetch error: ${err.message}`);
  }

  // 4. Competitions Directory SEO & Schema
  console.log('\n--- 4. Testing Competitions Directory (/competitions) ---');
  try {
    const compRes = await fetch('http://localhost:3000/competitions');
    assert(compRes.status === 200, '/competitions returns HTTP 200');
    const compHtml = await compRes.text();
    assert(compHtml.includes('Flagship Technical Competitions &amp; Arenas | YUGANTAR 2026') || compHtml.includes('Flagship Technical Competitions & Arenas'), 'Competitions directory has descriptive title');
    assert(compHtml.includes('rel="canonical" href="https://teleera.turbobits.in/competitions"'), 'Competitions directory has canonical URL');
    assert(compHtml.includes('"@type":"BreadcrumbList"'), 'Competitions directory has BreadcrumbList schema');
    assert(compHtml.includes('"@type":"ItemList"'), 'Competitions directory has ItemList schema');
  } catch (err) {
    assert(false, `/competitions fetch error: ${err.message}`);
  }

  // 5. Dynamic Competition Detail Page SEO & Schema
  console.log('\n--- 5. Testing Dynamic Competition Detail (/competitions/ideathon) ---');
  try {
    const ideaRes = await fetch('http://localhost:3000/competitions/ideathon');
    assert(ideaRes.status === 200, '/competitions/ideathon returns HTTP 200');
    const ideaHtml = await ideaRes.text();
    assert(ideaHtml.includes('Ideathon') && ideaHtml.includes('Arena 0'), 'Detail page title contains competition name and Arena');
    assert(ideaHtml.includes('rel="canonical" href="https://teleera.turbobits.in/competitions/ideathon"'), 'Detail page has canonical URL');
    assert(ideaHtml.includes('"@type":"Event"') && ideaHtml.includes('Ideathon — YUGANTAR 2026'), 'Detail page has specific Event schema');
    assert(ideaHtml.includes('"@type":"BreadcrumbList"'), 'Detail page has BreadcrumbList schema');
  } catch (err) {
    assert(false, `/competitions/ideathon fetch error: ${err.message}`);
  }

  // 6. About Page SEO & Schema
  console.log('\n--- 6. Testing About Page (/about) ---');
  try {
    const aboutRes = await fetch('http://localhost:3000/about');
    assert(aboutRes.status === 200, '/about returns HTTP 200');
    const aboutHtml = await aboutRes.text();
    assert(aboutHtml.includes('About &amp; Organizers') || aboutHtml.includes('About & Organizers'), 'About page has descriptive title');
    assert(aboutHtml.includes('rel="canonical" href="https://teleera.turbobits.in/about"'), 'About page has canonical URL');
    assert(aboutHtml.includes('"@type":"BreadcrumbList"'), 'About page has BreadcrumbList schema');
  } catch (err) {
    assert(false, `/about fetch error: ${err.message}`);
  }

  // 7. Nonexistent Competition 404
  console.log('\n--- 7. Testing Nonexistent Competition Route (/competitions/non-existent-arena-xyz) ---');
  try {
    const notFoundRes = await fetch('http://localhost:3000/competitions/non-existent-arena-xyz');
    assert(notFoundRes.status === 404, 'Nonexistent competition returns HTTP 404');
  } catch (err) {
    assert(false, `Nonexistent competition error: ${err.message}`);
  }

  // 8. Privacy & Noindex Enforcement
  console.log('\n--- 8. Testing Privacy & Noindex Enforcement ---');
  try {
    const adminLoginRes = await fetch('http://localhost:3000/admin/login');
    const adminLoginHtml = await adminLoginRes.text();
    assert(adminLoginHtml.includes('name="robots"') && adminLoginHtml.includes('noindex'), 'Admin login has noindex robots tag');

    const adminPanelRes = await fetch('http://localhost:3000/admin');
    const adminPanelHtml = await adminPanelRes.text();
    assert(adminPanelHtml.includes('name="robots"') && adminPanelHtml.includes('noindex'), 'Admin panel has noindex robots tag');

    const regSubpageRes = await fetch('http://localhost:3000/competitions/ideathon/register');
    const regSubpageHtml = await regSubpageRes.text();
    assert(regSubpageHtml.includes('name="robots"') && regSubpageHtml.includes('noindex'), 'Registration subpage has noindex robots tag');
    assert(regSubpageHtml.includes('rel="canonical" href="https://teleera.turbobits.in/competitions/ideathon"'), 'Registration subpage canonical points to parent competition');
  } catch (err) {
    assert(false, `Privacy check error: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSeoTests();
