import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'E:\\new project\\artifacts\\qa-2026-10-17';

const missingTargets = [
  {
    name: '05_competition_detail_project_comp.png',
    url: 'http://localhost:3000/competitions/project-competition',
    width: 1440,
    height: 900,
    desc: 'Competition Detail: Project Competition (Desktop) - Rules, Schedule, Evaluation Criteria',
  },
  {
    name: '13_public_about_page.png',
    url: 'http://localhost:3000/about',
    width: 1440,
    height: 900,
    desc: 'Public Page: About YUGANTAR 2026 - Vision, Department of ETC, PCE Nagpur',
  },
];

console.log('Capturing previously timed-out routes now that Turbopack has compiled them...');

for (const target of missingTargets) {
  const filePath = path.join(OUTPUT_DIR, target.name);
  console.log(`Capturing: ${target.name} from ${target.url}...`);
  try {
    execFileSync(
      CHROME_PATH,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        `--window-size=${target.width},${target.height}`,
        `--screenshot=${filePath}`,
        target.url,
      ],
      { timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`  ✓ SUCCESS: ${target.name} (${stats.size.toLocaleString()} bytes)`);
    } else {
      console.log(`  ✗ FAILED: File was not created`);
    }
  } catch (err) {
    console.log(`  ✗ ERROR: ${err.message}`);
  }
}
