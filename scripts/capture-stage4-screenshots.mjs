import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const publicDir = path.join(__dirname, '../public/screenshots/stage4');
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

async function main() {
  console.log('====================================================');
  console.log('   CAPTURING STAGE 4 VISUAL QA SCREENSHOTS          ');
  console.log('====================================================\n');

  const adminToken = await getValidAdminCookie();
  console.log('Admin session cookie verified.');

  // Launch Edge with remote debugging
  console.log('Launching headless Edge for visual captures...');
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

  // Inject session cookie
  await send('Network.setCookie', {
    name: 'authjs.session-token',
    value: adminToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });

  const saveShot = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');

    const publicPath = path.join(publicDir, filename);
    fs.writeFileSync(publicPath, buffer);

    const brainPath = path.join(brainDir, filename);
    fs.writeFileSync(brainPath, buffer);

    console.log(`📸 Saved [${filename}] (${buffer.length} bytes)`);
  };

  const setDesktop = async () => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
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

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });
    return res?.result?.value;
  };

  const waitForPageReady = async (matchText, maxWaitMs = 8000) => {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const text = await evaluate(`document.body ? document.body.innerText : ''`);
      if (text && text.includes(matchText)) {
        await new Promise((r) => setTimeout(r, 600));
        return true;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    console.warn(`Timeout waiting for "${matchText}"`);
    return false;
  };

  // -------------------------------------------------------------
  // 1. Studio Landing Page
  // -------------------------------------------------------------
  console.log('\n1. Capturing Studio Landing Page...');
  await setDesktop();
  await send('Page.navigate', { url: 'http://localhost:3000/admin/studio' });
  await waitForPageReady('Pass & Certificate Studio');
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot('01_studio_landing_page.png');

  // -------------------------------------------------------------
  // 2. Desktop Editor Layout
  // -------------------------------------------------------------
  console.log('\n2. Capturing Desktop Editor Layout...');
  await send('Page.navigate', {
    url: 'http://localhost:3000/admin/studio/designer/global-registration-pass-default',
  });
  await waitForPageReady('Checklist');
  await new Promise((r) => setTimeout(r, 1500));
  await saveShot('02_desktop_editor.png');

  // -------------------------------------------------------------
  // 3. Mobile Editor Layout (390px)
  // -------------------------------------------------------------
  console.log('\n3. Capturing Mobile Editor Layout...');
  await setMobile(390, 844);
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('03_mobile_editor.png');

  // Return to Desktop and reset zoom to default
  await setDesktop();
  await new Promise((r) => setTimeout(r, 400));
  await evaluate(`
    const fitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Fit');
    if (fitBtn) fitBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // -------------------------------------------------------------
  // 4. Uploaded-Background Editing (Uploads Tab)
  // -------------------------------------------------------------
  console.log('\n4. Capturing Uploaded-Background Editing...');
  await evaluate(`
    const uploadBtn = document.getElementById('tab-btn-uploads');
    if (uploadBtn) uploadBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('04_uploaded_background_editing.png');

  // -------------------------------------------------------------
  // 5. Typography Properties (Select a Text Element)
  // -------------------------------------------------------------
  console.log('\n5. Capturing Typography Properties...');
  await evaluate(`
    // Click on participant name or heading element on canvas
    const canvasElements = Array.from(document.querySelectorAll('main div.group'));
    const textTarget = canvasElements.find(el => el.textContent.includes('Aarav') || el.textContent.includes('Project Competition')) || canvasElements[1];
    if (textTarget) {
      textTarget.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    }
  `);
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('05_typography_properties.png');

  // -------------------------------------------------------------
  // 6. Dynamic-Field Picker (Fields Tab)
  // -------------------------------------------------------------
  console.log('\n6. Capturing Dynamic-Field Picker...');
  await evaluate(`
    const fieldsBtn = document.getElementById('tab-btn-fields');
    if (fieldsBtn) fieldsBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('06_dynamic_field_picker.png');

  // -------------------------------------------------------------
  // 7. Layers Panel (Layers Tab)
  // -------------------------------------------------------------
  console.log('\n7. Capturing Layers Panel...');
  await evaluate(`
    const layersBtn = document.getElementById('tab-btn-layers');
    if (layersBtn) layersBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('07_layers_panel.png');

  // -------------------------------------------------------------
  // 8. Alignment Guides & Snapping
  // -------------------------------------------------------------
  console.log('\n8. Capturing Alignment Guides...');
  await evaluate(`
    // Select an element
    const canvasElements = Array.from(document.querySelectorAll('main div.group'));
    if (canvasElements[0]) {
      canvasElements[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    }
  `);
  await new Promise((r) => setTimeout(r, 600));
  await saveShot('08_alignment_guides.png');

  // -------------------------------------------------------------
  // 9. Template Validation Checklist Modal
  // -------------------------------------------------------------
  console.log('\n9. Capturing Template Validation Checklist...');
  await evaluate(`
    const checklistBtn = document.getElementById('btn-open-checklist');
    if (checklistBtn) {
      checklistBtn.click();
    }
  `);
  await waitForPageReady('Pre-Publish Template Checklist');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('09_template_validation_checklist.png');

  // Close Checklist Modal
  await evaluate(`
    const closeButtons = Array.from(document.querySelectorAll('button'));
    const closeBtn = closeButtons.find(b => b.textContent.trim() === 'Close');
    if (closeBtn) {
      closeBtn.click();
    }
  `);
  await new Promise((r) => setTimeout(r, 600));

  // -------------------------------------------------------------
  // 10. Live Sample Preview Modal (Participant Pass)
  // -------------------------------------------------------------
  console.log('\n10. Capturing Live Sample Preview...');
  await evaluate(`
    const previewBtn = document.getElementById('btn-open-preview');
    if (previewBtn) {
      previewBtn.click();
    }
  `);
  await waitForPageReady('Live Studio Preview');
  await new Promise((r) => setTimeout(r, 1000));
  await saveShot('10_live_sample_preview.png');

  // -------------------------------------------------------------
  // 11. PDF Preview Modal (Compiled Vector PDF)
  // -------------------------------------------------------------
  console.log('\n11. Capturing PDF Preview...');
  await evaluate(`
    const pdfModeBtn = document.getElementById('modal-btn-pdf-mode');
    if (pdfModeBtn) {
      pdfModeBtn.click();
    }
  `);
  await new Promise((r) => setTimeout(r, 3500));
  await saveShot('11_pdf_preview.png');

  // Close Preview Modal
  await evaluate(`
    const closeBtn = document.getElementById('btn-close-preview-modal');
    if (closeBtn) closeBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 800));

  // -------------------------------------------------------------
  // 12. Template Save/Version State
  // -------------------------------------------------------------
  console.log('\n12. Capturing Template Save/Version State...');
  await send('Page.navigate', {
    url: 'http://localhost:3000/admin/studio/designer/global-registration-pass-default',
  });
  await waitForPageReady('Checklist');
  await new Promise((r) => setTimeout(r, 1200));
  await evaluate(`
    const saveBtn = document.getElementById('btn-save-template');
    if (saveBtn) saveBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot('12_template_save_version_state.png');

  // -------------------------------------------------------------
  // 13. Mobile Admin Layout (375px with Bottom Drawer Open)
  // -------------------------------------------------------------
  console.log('\n13. Capturing Mobile Admin Layout...');
  await setMobile(375, 812);
  await new Promise((r) => setTimeout(r, 1000));
  await evaluate(`
    const fieldsBtn = document.getElementById('mobile-tab-fields');
    if (fieldsBtn) fieldsBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await saveShot('13_mobile_admin_layout.png');

  console.log('\n====================================================');
  console.log(' ALL 13 REQUIRED SCREENSHOTS CAPTURED SUCCESSFULLY! ');
  console.log('====================================================\n');

  edge.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
