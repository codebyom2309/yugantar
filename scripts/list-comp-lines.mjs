import fs from 'fs';

const content = fs.readFileSync('src/data/events.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.trim().startsWith('id: ') || l.trim().startsWith('slug: ')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
