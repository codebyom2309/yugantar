import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('src');
const patterns = [
  /\b8\s*arenas\b/i,
  /\beight\s*arenas\b/i,
  /\b8\s*districts\b/i,
  /\beight\s*districts\b/i,
  /\b8\s*competitions\b/i,
  /\beight\s*competitions\b/i,
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  patterns.forEach(p => {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (p.test(line)) {
        console.log(`${f}:${idx + 1} -> ${line.trim()}`);
      }
    });
  });
});
