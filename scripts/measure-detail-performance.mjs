const BASE_URL = 'http://localhost:3000';

const TEST_SLUGS = [
  'project-competition',
  'ppt-presentation',
  'ideathon',
  'mini-project-competition',
];

async function measureHttp(path, iterations = 3) {
  const timings = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const headerTime = performance.now() - start;
    const text = await res.text();
    const totalTime = performance.now() - start;
    timings.push({ status: res.status, ttfb: headerTime, total: totalTime, sizeBytes: text.length });
  }
  const avgTtfb = timings.reduce((a, b) => a + b.ttfb, 0) / timings.length;
  const avgTotal = timings.reduce((a, b) => a + b.total, 0) / timings.length;
  return { path, avgTtfb, avgTotal, timings };
}

async function main() {
  console.log('================================================================');
  console.log('YUGANTAR 2026 — BASELINE PERFORMANCE MEASUREMENTS');
  console.log('================================================================\n');

  console.log('--- Measuring Competition Detail Pages ---');
  for (const slug of TEST_SLUGS) {
    const res = await measureHttp(`/competitions/${slug}`, 3);
    console.log(`\nRoute: /competitions/${slug}`);
    console.log(`  Average TTFB: ${res.avgTtfb.toFixed(1)} ms`);
    console.log(`  Average Total Time: ${res.avgTotal.toFixed(1)} ms`);
    console.log(`  Individual Runs: ${res.timings.map(t => `${Math.round(t.total)}ms (status ${t.status})`).join(', ')}`);
  }

  console.log('\n--- Measuring Comparison Routes ---');
  const dirRes = await measureHttp('/competitions', 3);
  console.log(`Route: /competitions (Directory)`);
  console.log(`  Average TTFB: ${dirRes.avgTtfb.toFixed(1)} ms`);
  console.log(`  Average Total Time: ${dirRes.avgTotal.toFixed(1)} ms`);

  const homeRes = await measureHttp('/', 3);
  console.log(`\nRoute: / (Homepage)`);
  console.log(`  Average TTFB: ${homeRes.avgTtfb.toFixed(1)} ms`);
  console.log(`  Average Total Time: ${homeRes.avgTotal.toFixed(1)} ms`);

  const turboRes = await measureHttp('/turbobits', 3);
  console.log(`\nRoute: /turbobits (TurboBits)`);
  console.log(`  Average TTFB: ${turboRes.avgTtfb.toFixed(1)} ms`);
  console.log(`  Average Total Time: ${turboRes.avgTotal.toFixed(1)} ms`);
}

main().catch(console.error);
