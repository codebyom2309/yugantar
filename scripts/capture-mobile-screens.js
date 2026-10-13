const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(__dirname, '../public/screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: 'mobile-390', width: 390, height: 844, isMobile: true },
  { name: 'mobile-360', width: 360, height: 780, isMobile: true },
  { name: 'mobile-375', width: 375, height: 812, isMobile: true },
  { name: 'mobile-412', width: 412, height: 915, isMobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, isMobile: false }
];

function capture(index) {
  if (index >= viewports.length) {
    console.log('All screenshots captured successfully.');
    return;
  }
  const vp = viewports[index];
  const outFile = path.join(outDir, `${vp.name}.png`);
  
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--virtual-time-budget=2500',
    '--force-device-scale-factor=1',
    `--screenshot=${outFile}`,
    `--window-size=${vp.width},${vp.height}`
  ];

  if (vp.isMobile) {
    args.push('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  }

  args.push('http://localhost:3000');

  console.log(`Capturing ${vp.name} (${vp.width}x${vp.height})...`);
  execFile(edgePath, args, (error) => {
    if (error) {
      console.error(`Error capturing ${vp.name}:`, error);
    } else {
      const stats = fs.statSync(outFile);
      console.log(`Saved ${vp.name}.png (${stats.size} bytes)`);
    }
    setTimeout(() => capture(index + 1), 600);
  });
}

capture(0);
