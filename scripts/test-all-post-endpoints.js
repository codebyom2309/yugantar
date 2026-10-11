// scripts/test-all-post-endpoints.js
const fs = require('fs');

const md = fs.readFileSync('Event Registration Forms Entry Ids (1).md', 'utf8');
const lines = md.split('\n');

const forms = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('https://docs.google.com/forms/d/')) {
    const title = lines[i - 1]?.trim() || `Form ${forms.length + 1}`;
    const viewUrl = lines[i].trim();
    const postUrl = viewUrl.replace(/\/viewform(\?.*)?$/, '/formResponse');
    forms.push({ title, viewUrl, postUrl });
  }
}

async function testAll() {
  console.log(`Testing ${forms.length} forms endpoints:`);
  for (const f of forms) {
    try {
      const res = await fetch(f.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'test=1',
      });
      const html = await res.text();
      const recorded = html.includes('response has been recorded');
      console.log(`[${f.title}] -> Status: ${res.status} | Has recorded text: ${recorded} | URL: ${f.postUrl}`);
    } catch (e) {
      console.log(`[${f.title}] -> ERROR: ${e.message}`);
    }
  }
}

testAll();
