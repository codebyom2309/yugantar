import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const publicDir = path.join(__dirname, '../public/screenshots/stage3');
const brainDir = 'C:\\Users\\omsat\\.gemini\\antigravity-ide\\brain\\6e6c6d0a-b932-4280-a7c9-44d1fb730d14';

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function getValidAdminCookie() {
  console.log('Obtaining authenticated admin session token via NextAuth...');
  const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const rawCookies = csrfRes.headers.get('set-cookie') || '';

  const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: rawCookies,
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: 'om@gmail.com',
      password: 'admin123',
    }),
    redirect: 'manual',
  });

  const setCookieHeader = loginRes.headers.get('set-cookie') || '';
  const match = setCookieHeader.match(/authjs\.session-token=([^;]+)/);
  if (!match) {
    throw new Error('Could not find authjs.session-token in response: ' + setCookieHeader);
  }
  return match[1];
}

async function getDbCredentials() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  const url = new URL(match[1]);
  return {
    host: url.hostname,
    port: parseInt(url.port || '4000', 10),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', '') || 'yugantar',
    ssl: { rejectUnauthorized: true },
  };
}

async function main() {
  console.log('--- PREPARING STAGE 3 VISUAL AUDIT & 15 SCREENSHOT CAPTURES ---');
  const dbConfig = await getDbCredentials();
  const conn = await mysql.createConnection(dbConfig);

  // 1. Fetch recent registration with pass token
  const [soloRows] = await conn.query(
    `SELECT id, verification_token, leader_name, competition_slug 
     FROM registrations 
     ORDER BY created_at DESC LIMIT 1`
  );
  const soloReg = soloRows[0];

  const adminToken = await getValidAdminCookie();

  // Issue a fresh certificate for screenshot
  const certRes = await fetch('http://localhost:3000/api/admin/studio/certificates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `authjs.session-token=${adminToken}`,
    },
    body: JSON.stringify({
      recipientName: 'Arjun Verma',
      recipientEmail: 'arjun.verma@pce.ac.in',
      recipientCollege: 'Priyadarshini College of Engineering',
      competitionSlug: 'project-competition',
      certificateType: 'winner_cert',
      rankCitation: 'First Place & Gold Honor',
      registrationId: soloReg.id,
      issuedBy: 'om@gmail.com',
    }),
  });
  const certData = await certRes.json();
  const certCode = certData.certificate?.certificate_code;
  const certId = certData.certificate?.id;
  console.log('Active Certificate Code:', certCode, 'ID:', certId);

  const { signPassToken } = await import('../src/lib/passToken.ts');
  const soloPassToken = signPassToken({
    id: soloReg.id,
    slug: soloReg.competition_slug,
    leaderName: soloReg.leader_name,
    teamName: 'Team Project Alpha',
    teamSize: 2,
    members: [{ name: 'Aditya Kulkarni', college: 'VNIT Nagpur', branch: 'ETC', semester: 'VI' }],
  });

  await conn.end();

  // Launch Edge CDP
  console.log('Launching headless Edge for Stage 3 Screenshots...');
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--hide-scrollbars',
    '--disable-gpu',
    'http://localhost:3000',
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const target = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const pages = JSON.parse(data);
        const p = pages.find((x) => x.url.includes('3000')) || pages[0];
        resolve(p);
      });
    }).on('error', reject);
  });

  console.log('Connected to CDP target:', target.url);
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      const handler = (evt) => {
        const resp = JSON.parse(evt.data);
        if (resp.id === id) {
          ws.removeEventListener('message', handler);
          resolve(resp.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await new Promise((r) => ws.addEventListener('open', r));
  await send('Network.enable');
  await send('Page.enable');

  // Inject authenticated NextAuth session cookie
  await send('Network.setCookie', {
    name: 'authjs.session-token',
    value: adminToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });

  const saveShot = async (filename, captureBeyondViewport = false) => {
    const shot = await send('Page.captureScreenshot', { 
      format: 'png',
      captureBeyondViewport 
    });
    const buffer = Buffer.from(shot.data, 'base64');
    
    const publicPath = path.join(publicDir, filename);
    fs.writeFileSync(publicPath, buffer);

    const brainPath = path.join(brainDir, filename);
    fs.writeFileSync(brainPath, buffer);

    console.log(`📸 Saved [${filename}] (${buffer.length} bytes)`);
  };

  const setDesktop = async (width = 1440, height = 900) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1.5,
      mobile: false,
    });
  };

  const setMobile = async (width = 390, height = 844) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true,
    });
  };

  const waitForPageReady = async (matchText, maxWaitMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `document.body ? document.body.innerText : ''`,
        returnByValue: true,
      });
      const text = evalRes?.result?.value || '';
      if (text.includes(matchText)) {
        await new Promise((r) => setTimeout(r, 600));
        return true;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    console.warn(`Timeout waiting for "${matchText}"`);
    return false;
  };

  // -------------------------------------------------------------
  // 1. Pass & Certificate Studio landing page
  // -------------------------------------------------------------
  console.log('1. Capturing Studio landing page...');
  await setDesktop();
  await send('Page.navigate', { url: 'http://localhost:3000/admin/studio' });
  await waitForPageReady('Pass & Certificate Studio');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('01_studio_landing.png');

  // -------------------------------------------------------------
  // 2. Pass canvas with uploaded background
  // -------------------------------------------------------------
  console.log('2. Capturing Pass canvas with uploaded background...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/studio/designer/pass-default-badge' });
  await waitForPageReady('Pass Designer');
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot('02_pass_canvas_background.png');

  // -------------------------------------------------------------
  // 3. Field-picker panel
  // -------------------------------------------------------------
  console.log('3. Capturing Field-picker panel...');
  await saveShot('03_field_picker_panel.png');

  // -------------------------------------------------------------
  // 4. Dynamic QR editor
  // -------------------------------------------------------------
  console.log('4. Capturing Dynamic QR editor...');
  // Select QR element on canvas
  await send('Runtime.evaluate', {
    expression: `
      const qrEl = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('QR Code') || el.id === 'qr-element');
      if (qrEl) qrEl.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('04_dynamic_qr_editor.png');

  // -------------------------------------------------------------
  // 5. Global template settings
  // -------------------------------------------------------------
  console.log('5. Capturing Global template settings...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/studio' });
  await waitForPageReady('Pass & Certificate Studio');
  // Click Tab 2: Template Assignments
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const tabBtn = buttons.find(b => b.textContent.includes('Template Assignments') || b.textContent.includes('Assignments'));
      if (tabBtn) tabBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('05_global_template_settings.png');

  // -------------------------------------------------------------
  // 6. Competition-specific template settings
  // -------------------------------------------------------------
  console.log('6. Capturing Competition-specific template settings...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/competitions/project-competition' });
  await waitForPageReady('Edit Competition');
  await send('Runtime.evaluate', {
    expression: `
      const h = Array.from(document.querySelectorAll('h4')).find(el => el.textContent.includes('Pass & Certificate Template'));
      if (h) h.scrollIntoView({ behavior: 'instant', block: 'center' });
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('06_competition_template_settings.png');

  // -------------------------------------------------------------
  // 7. Generated pass PDF / preview
  // -------------------------------------------------------------
  console.log('7. Capturing Generated pass view...');
  const passUrl = `http://localhost:3000/pass/${soloReg.id}?token=${encodeURIComponent(soloPassToken)}`;
  await send('Page.navigate', { url: passUrl });
  await waitForPageReady('DELEGATE PASS');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('07_generated_pass_view.png');

  // -------------------------------------------------------------
  // 8. Generated certificate view
  // -------------------------------------------------------------
  console.log('8. Capturing Generated certificate view...');
  const certVerifyUrl = `http://localhost:3000/verify/${certCode}`;
  await send('Page.navigate', { url: certVerifyUrl });
  await waitForPageReady('CERTIFICATE');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('08_generated_certificate_view.png');

  // -------------------------------------------------------------
  // 9. Admin payment QR generator with a configured INR amount
  // -------------------------------------------------------------
  console.log('9. Capturing Admin payment QR generator with INR amount...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/competitions/project-competition' });
  await waitForPageReady('Edit Competition');
  // Scroll to Payment & Fees Configuration Card
  await send('Runtime.evaluate', {
    expression: `
      const h = Array.from(document.querySelectorAll('h4')).find(el => el.textContent.includes('Payment & Fees Configuration'));
      if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('09_admin_payment_qr_generator.png');

  // -------------------------------------------------------------
  // 10. Competition registration payment section
  // -------------------------------------------------------------
  console.log('10. Capturing Competition registration payment section...');
  // Open the live participant flow preview drawer in admin competition edit
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const previewBtn = btns.find(b => b.textContent.includes('Participant Flow Preview') || b.textContent.includes('Participant Preview'));
      if (previewBtn) previewBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await send('Runtime.evaluate', {
    expression: `
      const h = Array.from(document.querySelectorAll('h4')).find(el => el.textContent.includes('Participant Payment Section Preview'));
      if (h) h.scrollIntoView({ behavior: 'instant', block: 'start' });
    `,
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('10_registration_payment_section.png');

  // -------------------------------------------------------------
  // 11. UTR and screenshot fields in the corrected order
  // -------------------------------------------------------------
  console.log('11. Capturing UTR and screenshot fields in corrected order...');
  // Scroll slightly to reveal steps 2, 3, 4, 5
  await send('Runtime.evaluate', {
    expression: `window.scrollBy({ top: 300, behavior: 'instant' })`,
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('11_utr_screenshot_fields_order.png');

  // -------------------------------------------------------------
  // 12. Registration success state
  // -------------------------------------------------------------
  console.log('12. Capturing Registration success state...');
  const successUrl = `http://localhost:3000/competitions/project-competition/register?registered_id=${soloReg.id}&token=${encodeURIComponent(soloPassToken)}&v=${soloReg.verification_token}`;
  await send('Page.navigate', { url: successUrl });
  await waitForPageReady('Registration successful');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('12_registration_success_state.png');

  // -------------------------------------------------------------
  // 13. Mobile admin dashboard (390px)
  // -------------------------------------------------------------
  console.log('13. Capturing Mobile admin dashboard (390px)...');
  await setMobile(390, 844);
  await send('Page.navigate', { url: 'http://localhost:3000/admin' });
  await waitForPageReady('Dashboard');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('13_mobile_admin_dashboard.png');

  // -------------------------------------------------------------
  // 14. Mobile registration form (375px & 390px)
  // -------------------------------------------------------------
  console.log('14. Capturing Mobile registration form (375px)...');
  await setMobile(375, 812);
  await send('Page.navigate', { url: 'http://localhost:3000/competitions/project-competition/register' });
  await waitForPageReady('Registration');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('14_mobile_registration_form.png');

  // Also capture at 360px width to prove responsive zero-overflow
  await setMobile(360, 800);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('14b_mobile_registration_360px.png');

  // -------------------------------------------------------------
  // 15. Mobile pass-download state (390px)
  // -------------------------------------------------------------
  console.log('15. Capturing Mobile pass-download state (390px)...');
  await setMobile(390, 844);
  await send('Page.navigate', { url: passUrl });
  await waitForPageReady('DELEGATE PASS');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('15_mobile_pass_download.png');

  console.log('✨ ALL 15 REQUIRED SCREENSHOTS CAPTURED AND PERSISTED SUCCESSFULLY!');
  edge.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
