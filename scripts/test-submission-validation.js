// scripts/test-submission-validation.js
async function test() {
  const url = 'https://docs.google.com/forms/d/1ICJX-33Lx7Hei21yeDOquyZ857XcV1vnGVqQKCtaUo8/formResponse';

  // Case 1: Missing required fields
  console.log('Testing Case 1: Empty / Missing Required Fields');
  const badParams = new URLSearchParams();
  badParams.append('entry.1247623769', ''); // Empty leader name

  const res1 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: badParams.toString(),
  });
  const html1 = await res1.text();
  console.log('Case 1 Status:', res1.status);
  console.log('Case 1 has "response has been recorded"?:', html1.includes('response has been recorded'));
  console.log('Case 1 has "This is a required question"?:', html1.includes('This is a required question') || html1.includes('required'));

  // Case 2: Full valid submission
  console.log('\nTesting Case 2: Valid Full Submission');
  const goodParams = new URLSearchParams();
  goodParams.append('entry.1247623769', 'Auto Diagnostic Test');
  goodParams.append('entry.1886253153', '+91 9876543210');
  goodParams.append('entry.57127786', 'test@pce.edu');
  goodParams.append('entry.355433790', 'PCE');
  goodParams.append('entry.677017667', 'ETC');
  goodParams.append('entry.1484093551', 'V');
  goodParams.append('entry.1310711298', 'Diagnostic Alpha');
  goodParams.append('entry.1767563588', 'Smart Nexus System');
  goodParams.append('entry.783060620', 'Embedded IoT');
  goodParams.append('entry.742691939', 'https://drive.google.com/test');
  goodParams.append('entry.1973523851', '1');
  goodParams.append('entry.870331274', 'TEST_UTR_DIAGNOSTIC_999');
  goodParams.append('entry.576016933', 'https://drive.google.com/payment-proof');
  goodParams.append('entry.522674004', 'Yes');

  const res2 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: goodParams.toString(),
  });
  const html2 = await res2.text();
  console.log('Case 2 Status:', res2.status);
  console.log('Case 2 has "response has been recorded"?:', html2.includes('response has been recorded'));
}

test();
