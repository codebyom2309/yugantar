import fs from 'fs';
import path from 'path';

const tempDir = path.join(process.cwd(), 'scratch', 'yugantar_xlsx');
function searchInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchInDir(full);
    } else {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('8999189509')) {
        console.log(`Found 8999189509 in ${full}`);
      }
    }
  }
}

searchInDir(tempDir);
