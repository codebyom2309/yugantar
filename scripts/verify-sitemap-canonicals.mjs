async function verifyAllCanonicals() {
  const routes = [
    '/',
    '/competitions',
    '/about',
    '/districts',
    '/journey',
    '/faq',
    '/competitions/project-competition',
    '/competitions/ppt-presentation',
    '/competitions/breadboard-competition',
    '/competitions/ideathon',
    '/competitions/mock-placement-drive',
    '/competitions/poster-competition',
    '/competitions/e-gaming',
    '/competitions/open-mic'
  ];

  console.log('--- Verifying Canonical Alignment with Sitemap ---');
  let matches = 0;
  for (const r of routes) {
    const res = await fetch(`http://localhost:3000${r}`);
    const html = await res.text();
    const match = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
    const expected = `https://teleera.turbobits.in${r === '/' ? '' : r}`;
    const actual = match ? match[1] : 'NONE';
    const isMatch = actual === expected;
    if (isMatch) matches++;
    console.log(`${isMatch ? '✓' : '✗'} Route: ${r.padEnd(40)} Canonical: ${actual}`);
  }

  console.log(`\nResult: ${matches} / ${routes.length} canonical URLs perfectly match the sitemap!`);
  if (matches !== routes.length) process.exit(1);
}

verifyAllCanonicals().catch(err => {
  console.error(err);
  process.exit(1);
});
