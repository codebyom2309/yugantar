import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('.');
const pattern = /vercel\.app/i;

files.forEach(f => {
  // skip scripts/search-vercel-urls.mjs
  if (f.includes('search-vercel-urls')) return;
  try {
    const content = fs.readFileSync(f, 'utf8');
    if (pattern.test(content)) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (pattern.test(line)) {
          console.log(`${f}:${idx + 1} -> ${line.trim()}`);
        }
      });
    }
  } catch (e) {
    // binary files
  }
});
