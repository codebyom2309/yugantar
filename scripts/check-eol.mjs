import fs from 'fs';

const content = fs.readFileSync('src/data/events.ts', 'utf8');
const hasCRLF = content.includes('\r\n');
console.log('hasCRLF:', hasCRLF);
const line1033 = content.split(/\r?\n/)[1032];
console.log('Line 1033:', JSON.stringify(line1033));
