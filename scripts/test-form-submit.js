// test-form-submit.js
const testUrls = [
  'https://docs.google.com/forms/d/1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8/formResponse',
  'https://docs.google.com/forms/d/e/1FAIpQLSctQ37Xj0_FjX_q44iZ4k6r_HhE9C-n5r0-uQkXf8w/formResponse',
  'https://docs.google.com/forms/d/e/1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8/formResponse',
];

async function testUrl(url) {
  console.log('\n--- Testing URL:', url);
  try {
    const params = new URLSearchParams();
    // Test payload with dummy test data
    params.append('entry.1247623769', 'Diagnostic Test Leader');
    params.append('entry.1886253153', '+91 9999999999');
    params.append('entry.57127786', 'test@test.edu');
    params.append('entry.355433790', 'PCE');
    params.append('entry.677017667', 'ETC');
    params.append('entry.1484093551', 'V');
    params.append('entry.1310711298', 'Test Team');
    params.append('entry.1767563588', 'Test Project Title');
    params.append('entry.783060620', 'Robotics');
    params.append('entry.1973523851', '1');
    params.append('entry.870331274', 'TEST_UTR_12345');
    params.append('entry.576016933', 'https://drive.google.com/test');
    params.append('entry.522674004', 'Yes');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: params.toString(),
      redirect: 'manual', // Check if it redirects
    });

    console.log('Status:', res.status, res.statusText);
    console.log('Location header:', res.headers.get('location'));
    const text = await res.text();
    console.log('Body snippet (first 300 chars):', text.slice(0, 300));
    console.log('Contains "Your response has been recorded"?:', text.includes('Your response has been recorded') || text.includes('response has been recorded'));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function run() {
  for (const u of testUrls) {
    await testUrl(u);
  }
}

run();
