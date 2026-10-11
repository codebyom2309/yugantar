const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outputPath = path.join(__dirname, '../public/nexus-city-preview.png');

const args = [
  '--headless',
  '--disable-gpu',
  `--screenshot=${outputPath}`,
  '--window-size=1440,1080',
  'http://localhost:3000'
];

execFile(edgePath, args, (error, stdout, stderr) => {
  if (error) {
    console.error('Error taking screenshot:', error);
    process.exit(1);
  }
  console.log('Screenshot successfully saved to:', outputPath);
  const stats = fs.statSync(outputPath);
  console.log('Screenshot file size:', stats.size, 'bytes');
});
