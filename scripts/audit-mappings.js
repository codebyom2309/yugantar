// scripts/audit-mappings.js
const fs = require('fs');

const tsContent = fs.readFileSync('src/data/registrationForms.ts', 'utf8');
const mdContent = fs.readFileSync('Event Registration Forms Entry Ids (1).md', 'utf8');

// Extract all entry IDs from markdown
const mdEntryRegex = /(?:entry\.)(\d+)/g;
const mdEntries = new Set();
let match;
while ((match = mdEntryRegex.exec(mdContent)) !== null) {
  mdEntries.add(match[1]);
}

// Extract all entry IDs from registrationForms.ts
const tsEntryRegex = /entryId:\s*['"](\d+)['"]/g;
const tsEntries = new Set();
while ((match = tsEntryRegex.exec(tsContent)) !== null) {
  tsEntries.add(match[1]);
}

const ackRegex = /acknowledgmentEntryId:\s*['"](\d+)['"]/g;
while ((match = ackRegex.exec(tsContent)) !== null) {
  tsEntries.add(match[1]);
}

console.log(`Markdown total unique entry IDs: ${mdEntries.size}`);
console.log(`TypeScript total unique entry IDs: ${tsEntries.size}`);

// Find any in markdown that are missing in TypeScript
const missingInTs = [...mdEntries].filter(id => !tsEntries.has(id));
console.log(`Missing in TypeScript (${missingInTs.length}):`, missingInTs);

// Find any in TypeScript that are not in markdown
const unexpectedInTs = [...tsEntries].filter(id => !mdEntries.has(id));
console.log(`Unexpected in TypeScript (${unexpectedInTs.length}):`, unexpectedInTs);
