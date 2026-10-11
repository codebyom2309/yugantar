// scripts/verify-entry-ids.js
const fs = require('fs');

const mdContent = fs.readFileSync('Event Registration Forms Entry Ids (1).md', 'utf8');

// Parse markdown into sections
const sections = mdContent.split('---').map(s => s.trim());

console.log(`Found ${sections.length} form sections in markdown.`);

sections.forEach((sec, i) => {
  const lines = sec.split('\n').map(l => l.trim()).filter(Boolean);
  const title = lines[0];
  const url = lines[1];
  console.log(`\nForm ${i + 1}: ${title}`);
  console.log(`URL: ${url}`);
  
  // Extract questions and entry IDs
  const entries = [];
  for (let j = 2; j < lines.length; j++) {
    if (lines[j].startsWith('entry.')) {
      const entryId = lines[j].replace('entry.', '');
      const question = lines[j - 1];
      entries.push({ question, entryId });
    }
  }
  console.log(`Entries count: ${entries.length}`);
});
