import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'E:\\new project\\artifacts\\qa-2026-10-18';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const competitions = [
  'project-competition',
  'mini-project-competition',
  'ppt-presentation',
  'mock-placement-drive',
  'poster-competition',
  'breadboard-competition',
  'e-gaming',
  'open-mic',
  'ideathon',
];

async function verifyAll() {
  console.log('=== VERIFYING REGISTRATION PAGES & QR RENDERING ===');
  for (const slug of competitions) {
    const url = `http://localhost:3000/competitions/${slug}/register`;
    try {
      const res = await fetch(url);
      console.log(`[${slug.padEnd(26)}] HTTP ${res.status}`);
    } catch (err) {
      console.error(`[${slug.padEnd(26)}] Error: ${err.message}`);
    }
  }

  // Capture desktop and mobile screenshots for competitions at step=payment
  const captureTargets = [
    {
      name: 'mini_project_payment_qr_desktop.png',
      url: 'http://localhost:3000/competitions/mini-project-competition/register?step=payment',
      width: 1440,
      height: 1400,
      desc: 'Mini Project Competition - Official Static UPI QR Code (Pooja Konge) at Step 4 Review & Pay',
    },
    {
      name: 'mini_project_payment_qr_mobile.png',
      url: 'http://localhost:3000/competitions/mini-project-competition/register?step=payment',
      width: 390,
      height: 1200,
      desc: 'Mini Project Competition (Mobile 390×1200) - Responsive Static Official UPI QR Code',
    },
    {
      name: 'project_competition_payment_qr_desktop.png',
      url: 'http://localhost:3000/competitions/project-competition/register?step=payment',
      width: 1440,
      height: 1400,
      desc: 'Project Competition - Official Static UPI QR Code (Pooja Konge) at Step 4 Review & Pay',
    },
    {
      name: 'ppt_presentation_payment_qr_desktop.png',
      url: 'http://localhost:3000/competitions/ppt-presentation/register?step=payment',
      width: 1440,
      height: 1400,
      desc: 'PPT Presentation Competition - Official Static UPI QR Code at Step 4 Review & Pay',
    },
    {
      name: 'ideathon_payment_section_desktop.png',
      url: 'http://localhost:3000/competitions/ideathon/register?step=payment',
      width: 1440,
      height: 1400,
      desc: 'Ideathon Registration Form - Recipient Notice Guarding Against Silent Misdirection',
    },
  ];

  console.log('\n=== CAPTURING PAYMENT SECTION EVIDENCE SCREENSHOTS ===');
  for (const target of captureTargets) {
    const filePath = path.join(OUTPUT_DIR, target.name);
    console.log(`Capturing: ${target.name} (${target.width}×${target.height})...`);
    try {
      execFileSync(
        CHROME_PATH,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-sandbox',
          `--window-size=${target.width},${target.height}`,
          '--virtual-time-budget=3000',
          `--screenshot=${filePath}`,
          target.url,
        ],
        { timeout: 45000, stdio: ['ignore', 'pipe', 'pipe'] }
      );
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✓ SUCCESS: ${target.name} (${stats.size.toLocaleString()} bytes)`);
      } else {
        console.log(`  ✗ FAILED: File not written`);
      }
    } catch (err) {
      console.log(`  ✗ ERROR: ${err.message}`);
    }
  }

  console.log('\nAll checks completed!');
}

verifyAll();
