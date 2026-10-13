const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(__dirname, '../public/screenshots');

const viewports = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true, scale: 2 },
  { name: 'mobile-360', width: 360, height: 780, mobile: true, scale: 2 },
  { name: 'mobile-375', width: 375, height: 812, mobile: true, scale: 2 },
  { name: 'mobile-412', width: 412, height: 915, mobile: true, scale: 2 },
];

async function captureAll() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--hide-scrollbars',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const target = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const pages = JSON.parse(data);
        const p = pages.find(x => x.url.includes('3000')) || pages[0];
        resolve(p);
      });
    }).on('error', reject);
  });

  console.log('Connected to target:', target.url);
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
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

  await new Promise(r => ws.addEventListener('open', r));

  for (const vp of viewports) {
    console.log(`Setting device metrics for ${vp.name} (${vp.width}x${vp.height})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.scale,
      mobile: vp.mobile
    });
    await send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });

    await new Promise(r => setTimeout(r, 800));

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });

    const buffer = Buffer.from(shot.data, 'base64');
    const outFile = path.join(outDir, `${vp.name}.png`);
    fs.writeFileSync(outFile, buffer);
    console.log(`Saved ${vp.name}.png (${buffer.length} bytes)`);
  }

  ws.close();
  edge.kill();
  console.log('All mobile screenshots captured via CDP successfully!');
}

captureAll().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
