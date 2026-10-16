import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

const PUBLIC_ROUTES = [
  { path: '/', expectedStatus: 200, name: 'Homepage' },
  { path: '/competitions', expectedStatus: 200, name: 'Competitions Directory' },
  { path: '/about', expectedStatus: 200, name: 'About Page' },
  { path: '/districts', expectedStatus: 200, name: 'Districts Page' },
  { path: '/journey', expectedStatus: 200, name: 'Journey Page' },
  { path: '/faq', expectedStatus: 200, name: 'FAQ Page' },
  { path: '/turbobits', expectedStatus: 200, name: 'TurboBits Team Page' },
  { path: '/robots.txt', expectedStatus: 200, name: 'Robots.txt' },
  { path: '/sitemap.xml', expectedStatus: 200, name: 'Sitemap XML' },
  { path: '/api/faqs', expectedStatus: 200, name: 'Public FAQs API' },
  { path: '/api/competitions', expectedStatus: 200, name: 'Public Competitions API' },

  // All 9 published competition detail pages
  { path: '/competitions/breadboard-competition', expectedStatus: 200, name: 'Detail: Bread Board' },
  { path: '/competitions/e-gaming', expectedStatus: 200, name: 'Detail: E-Gaming' },
  { path: '/competitions/ideathon', expectedStatus: 200, name: 'Detail: Ideathon' },
  { path: '/competitions/mini-project-competition', expectedStatus: 200, name: 'Detail: Mini Project' },
  { path: '/competitions/mock-placement-drive', expectedStatus: 200, name: 'Detail: Mock Placement' },
  { path: '/competitions/open-mic', expectedStatus: 200, name: 'Detail: Open Mic' },
  { path: '/competitions/poster-competition', expectedStatus: 200, name: 'Detail: Poster Competition' },
  { path: '/competitions/ppt-presentation', expectedStatus: 200, name: 'Detail: PPT Presentation' },
  { path: '/competitions/project-competition', expectedStatus: 200, name: 'Detail: Project Competition' },

  // All 9 published competition registration pages
  { path: '/competitions/breadboard-competition/register', expectedStatus: 200, name: 'Register: Bread Board' },
  { path: '/competitions/e-gaming/register', expectedStatus: 200, name: 'Register: E-Gaming' },
  { path: '/competitions/ideathon/register', expectedStatus: 200, name: 'Register: Ideathon' },
  { path: '/competitions/mini-project-competition/register', expectedStatus: 200, name: 'Register: Mini Project' },
  { path: '/competitions/mock-placement-drive/register', expectedStatus: 200, name: 'Register: Mock Placement' },
  { path: '/competitions/open-mic/register', expectedStatus: 200, name: 'Register: Open Mic' },
  { path: '/competitions/poster-competition/register', expectedStatus: 200, name: 'Register: Poster Competition' },
  { path: '/competitions/ppt-presentation/register', expectedStatus: 200, name: 'Register: PPT Presentation' },
  { path: '/competitions/project-competition/register', expectedStatus: 200, name: 'Register: Project Competition' },

  // Known pass page with test record
  { path: '/pass/4fd48c9a-dabc-4c48-8fff-ce673e8ae5ab', expectedStatus: 200, name: 'Pass Page (Test Record)' },

  // Negative test cases: non-existent / invalid routes
  { path: '/competitions/invalid-arena-nonexistent', expectedStatus: 404, name: 'Invalid Competition Slug (404)' },
  { path: '/competitions/invalid-arena-nonexistent/register', expectedStatus: 404, name: 'Invalid Registration Slug (404)' },
  { path: '/pass/00000000-0000-0000-0000-000000000000', expectedStatus: 404, name: 'Invalid Pass ID (404)' },
];

async function main() {
  console.log('================================================================');
  console.log('YUGANTAR 2026 — PHASE 3: EXHAUSTIVE PUBLIC ROUTE AUDIT');
  console.log('================================================================\n');

  const results = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const item of PUBLIC_ROUTES) {
    const url = `${BASE_URL}${item.path}`;
    const startTime = Date.now();
    try {
      const res = await fetch(url);
      const durationMs = Date.now() - startTime;
      const text = await res.text();

      const statusMatch = res.status === item.expectedStatus;
      const hasFatalCrash = text.includes('Application error: a client-side exception') ||
                            text.includes('Unhandled Runtime Error') ||
                            text.includes('Internal Server Error') && item.expectedStatus !== 500;

      const isPass = statusMatch && !hasFatalCrash;

      if (isPass) {
        passedCount++;
        console.log(`✅ [${res.status}] ${item.name} (${item.path}) - ${durationMs}ms`);
      } else {
        failedCount++;
        console.error(`❌ [${res.status} != ${item.expectedStatus}] ${item.name} (${item.path}) - FatalCrash: ${hasFatalCrash}`);
      }

      results.push({
        name: item.name,
        path: item.path,
        expectedStatus: item.expectedStatus,
        actualStatus: res.status,
        durationMs,
        hasFatalCrash,
        passed: isPass,
      });
    } catch (err) {
      failedCount++;
      console.error(`💥 EXCEPTION on ${item.name} (${item.path}):`, err.message);
      results.push({
        name: item.name,
        path: item.path,
        expectedStatus: item.expectedStatus,
        actualStatus: 'FETCH_ERROR',
        error: err.message,
        passed: false,
      });
    }
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: Total Tested: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
