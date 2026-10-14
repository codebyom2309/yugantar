const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(__dirname, '../public/screenshots/studio');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
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
  const sessionToken = match[1];
  console.log('Successfully acquired valid NextAuth session token!');
  return sessionToken;
}

async function main() {
  const sessionToken = await getValidAdminCookie();

  console.log('Launching headless Edge for audit screenshots...');
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

  console.log('Connected to target:', target.url);
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
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });

  const takeScreenshot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved screenshot: ${filePath} (${buffer.length} bytes)`);
  };

  // 1. Studio Landing Page (Desktop 1440x900)
  console.log('Navigating to Studio Landing Page...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1.5,
    mobile: false,
  });
  await send('Page.navigate', { url: 'http://localhost:3000/admin/studio' });
  await new Promise((r) => setTimeout(r, 2500));
  await takeScreenshot('01-studio-landing-page.png');

  // 5. Global Template Assignment (Switch tab to assignments)
  console.log('Capturing: Global Template Assignment Tab...');
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const assignBtn = btns.find(b => b.textContent.includes('Assignments'));
      if (assignBtn) assignBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await takeScreenshot('05-global-template-assignment.png');

  // 6. Competition-Specific Template Assignment
  console.log('Capturing: Competition Specific Template Assignment...');
  await takeScreenshot('06-competition-specific-assignment.png');

  // 7. Mobile Admin View (390x844)
  console.log('Capturing: Mobile Admin View...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send('Page.navigate', { url: 'http://localhost:3000/admin/studio' });
  await new Promise((r) => setTimeout(r, 2000));
  await takeScreenshot('07-mobile-admin-view.png');

  // Reset to desktop for designer
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1.5,
    mobile: false,
  });

  // 2. Canvas with Background Image (Designer Page)
  console.log('Navigating to Canvas Designer...');
  await send('Page.navigate', {
    url: 'http://localhost:3000/admin/studio/designer/global-registration-pass-default',
  });
  await new Promise((r) => setTimeout(r, 3000));
  await takeScreenshot('02-canvas-with-background.png');

  // 3. Canvas with Dynamic Text Fields (Click participant name)
  console.log('Selecting Dynamic Text Field on canvas...');
  await send('Runtime.evaluate', {
    expression: `
      const textEls = Array.from(document.querySelectorAll('div')).filter(d => d.textContent.includes('Aarav Deshmukh'));
      if (textEls.length > 0) textEls[textEls.length - 1].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await takeScreenshot('03-canvas-dynamic-text-fields.png');

  // 4. QR Element Editing (Click QR Code)
  console.log('Selecting QR element on canvas...');
  await send('Runtime.evaluate', {
    expression: `
      const qrSvg = document.querySelector('svg.lucide-qr-code');
      if (qrSvg) {
        const target = qrSvg.closest('.cursor-move') || qrSvg.parentElement;
        if (target) target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      }
    `,
  });
  await new Promise((r) => setTimeout(r, 1200));
  await takeScreenshot('04-qr-element-editing.png');

  // 8. Generated PDF Preview (Click PDF Preview button in header)
  console.log('Triggering PDF Preview Modal...');
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const pdfBtn = btns.find(b => b.textContent.includes('PDF Preview'));
      if (pdfBtn) pdfBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 3500));
  await takeScreenshot('08-generated-pdf-preview.png');

  console.log('All authenticated screenshots captured successfully!');
  edge.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Screenshot script error:', err);
  process.exit(1);
});
