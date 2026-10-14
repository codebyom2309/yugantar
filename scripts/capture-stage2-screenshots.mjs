import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const publicDir = path.join(__dirname, '../public/screenshots/stage2');
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
  console.log('--- PREPARING AUDIT DATA FOR STAGE 2 SCREENSHOTS ---');
  const dbConfig = await getDbCredentials();
  const conn = await mysql.createConnection(dbConfig);

  // 1. Fetch recent solo registration
  const [soloRows] = await conn.query(
    `SELECT id, verification_token, leader_name, competition_slug 
     FROM registrations 
     WHERE team_size = 1 AND leader_name = 'Arjun Verma' 
     ORDER BY created_at DESC LIMIT 1`
  );
  if (!soloRows || soloRows.length === 0) {
    throw new Error('No solo registration found for Arjun Verma');
  }
  const soloReg = soloRows[0];

  // 2. Fetch recent team registration
  const [teamRows] = await conn.query(
    `SELECT id, verification_token, team_name, leader_name, form_data 
     FROM registrations 
     WHERE team_size > 1 
     ORDER BY created_at DESC LIMIT 1`
  );
  if (!teamRows || teamRows.length === 0) {
    throw new Error('No team registration found');
  }
  const teamReg = teamRows[0];

  // 3. Issue a fresh active certificate for verification screenshot
  const adminToken = await getValidAdminCookie();
  console.log('Issuing fresh Gold Honor certificate for screenshot audit...');
  const certRes = await fetch('http://localhost:3000/api/admin/studio/certificates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `authjs.session-token=${adminToken}`,
    },
    body: JSON.stringify({
      recipientName: 'Arjun Verma',
      recipientEmail: 'arjun.verma@pce.ac.in',
      recipientCollege: 'Priyardarshini College of Engineering',
      competitionSlug: 'project-competition',
      certificateType: 'winner_cert',
      rankCitation: 'First Place & Gold Honor',
      registrationId: soloReg.id,
      notes: 'Stage 2 Visual Audit Proof Certificate',
    }),
  });
  const certData = await certRes.json();
  const certCode = certData.certificate?.certificate_code || certData.certificate?.certificateCode;
  console.log('Active Certificate Code:', certCode);

  const { signPassToken } = await import('../src/lib/passToken.ts');
  const soloPassToken = signPassToken({
    id: soloReg.id,
    slug: soloReg.competition_slug,
    leaderName: soloReg.leader_name,
    teamName: null,
    teamSize: 1,
    members: [],
  });

  let teamMembers = [];
  try {
    const parsed = JSON.parse(teamReg.form_data || '{}');
    if (parsed.member2Name) {
      teamMembers.push({ name: parsed.member2Name, college: parsed.member2College, branch: parsed.member2Branch, semester: parsed.member2Semester, role: 'Hardware & Edge Specialist' });
    }
    if (parsed.member3Name) {
      teamMembers.push({ name: parsed.member3Name, college: parsed.member3College, branch: parsed.member3Branch, semester: parsed.member3Semester, role: 'Cloud & Telemetry Lead' });
    }
  } catch {}

  const teamPassToken = signPassToken({
    id: teamReg.id,
    slug: 'project-competition',
    leaderName: teamReg.leader_name,
    teamName: teamReg.team_name,
    teamSize: 1 + teamMembers.length,
    members: teamMembers,
  });

  await conn.end();

  // Launch Edge CDP
  console.log('Launching headless Edge for Stage 2 Screenshots...');
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
    
    // Save to public/screenshots/stage2
    const publicPath = path.join(publicDir, filename);
    fs.writeFileSync(publicPath, buffer);

    // Save to brain artifacts directory
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

  const setMobile = async () => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
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
  // 1. Registration Success State
  // -------------------------------------------------------------
  console.log('1. Capturing Registration Success State...');
  await setDesktop();
  const successUrl = `http://localhost:3000/competitions/project-competition/register?registered_id=${soloReg.id}&token=${encodeURIComponent(soloPassToken)}&v=${soloReg.verification_token}`;
  await send('Page.navigate', { url: successUrl });
  await waitForPageReady('Registration successful');
  await saveShot('registration_success.png');

  // -------------------------------------------------------------
  // 2. Automatic Download / Fallback Button State
  // -------------------------------------------------------------
  console.log('2. Capturing Automatic Download & Fallback State...');
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: 380, behavior: 'instant' })`,
  });
  await new Promise((r) => setTimeout(r, 800));
  await saveShot('download_fallback.png');

  // -------------------------------------------------------------
  // 3. Generated Solo Pass (Digital Pass Recovery View)
  // -------------------------------------------------------------
  console.log('3. Capturing Generated Solo Pass...');
  const soloPassUrl = `http://localhost:3000/pass/${soloReg.id}?token=${encodeURIComponent(soloPassToken)}`;
  await send('Page.navigate', { url: soloPassUrl });
  await waitForPageReady('DELEGATE PASS');
  await saveShot('generated_pass.png');

  // -------------------------------------------------------------
  // 4. Generated Team Pass
  // -------------------------------------------------------------
  console.log('4. Capturing Generated Team Pass with Multi-Member Roster...');
  const teamPassUrl = `http://localhost:3000/pass/${teamReg.id}?token=${encodeURIComponent(teamPassToken)}`;
  await send('Page.navigate', { url: teamPassUrl });
  await waitForPageReady('DELEGATE PASS');
  await saveShot('team_pass.png');

  // -------------------------------------------------------------
  // 5. Generated Certificate Verification
  // -------------------------------------------------------------
  console.log('5. Capturing Generated Certificate...');
  const certVerifyUrl = `http://localhost:3000/verify/${certCode}`;
  await send('Page.navigate', { url: certVerifyUrl });
  await waitForPageReady('CERTIFICATE');
  await saveShot('generated_certificate.png');

  // -------------------------------------------------------------
  // 6. QR Verification Result (Pass Audit Gating)
  // -------------------------------------------------------------
  console.log('6. Capturing QR Verification Result...');
  const passVerifyUrl = `http://localhost:3000/verify/${soloReg.verification_token}`;
  await send('Page.navigate', { url: passVerifyUrl });
  await waitForPageReady('REGISTRATION');
  await saveShot('qr_verification.png');

  // -------------------------------------------------------------
  // 7. Admin Issuance Controls (Tab 4)
  // -------------------------------------------------------------
  console.log('7. Capturing Admin Studio Credential Issuance Controls...');
  await send('Page.navigate', { url: 'http://localhost:3000/admin/studio' });
  await waitForPageReady('Pass & Certificate Studio');

  // Click Tab 4 "Credential Issuance & Records"
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const issuanceBtn = buttons.find(b => b.textContent.includes('Credential Issuance') || b.textContent.includes('Issuance'));
      if (issuanceBtn) issuanceBtn.click();
    `,
  });
  await waitForPageReady('Arena Credential Status & Generation Matrix');
  await saveShot('admin_issuance_controls.png');

  // -------------------------------------------------------------
  // 8. Mobile Registration Success Page (390x844)
  // -------------------------------------------------------------
  console.log('8. Capturing Mobile Registration Success (390x844)...');
  await setMobile();
  await send('Page.navigate', { url: successUrl });
  await waitForPageReady('Registration successful');
  await saveShot('mobile_registration_success.png');

  console.log('✨ ALL 8 SCREENSHOTS CAPTURED AND PERSISTED SUCCESSFULLY!');
  edge.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
