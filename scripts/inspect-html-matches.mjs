import fs from 'fs';

async function inspectHtml() {
  const projRes = await fetch('http://localhost:3000/competitions/project-competition');
  const projHtml = await projRes.text();
  const projLines = projHtml.split('\n');

  console.log('=== Matches for /DSD|WSN|ES|DSP|MWR/ in project-competition ===');
  projLines.forEach((l, idx) => {
    if (/DSD|WSN|ES|DSP|MWR/.test(l)) {
      console.log(`Line ${idx + 1}: ${l.slice(0, 150)}`);
    }
  });

  console.log('=== Matches for "Lead Student Coordinator" or "Faculty Advisor" in project-competition ===');
  projLines.forEach((l, idx) => {
    if (l.includes('Lead Student Coordinator') || l.includes('Faculty Advisor')) {
      console.log(`Line ${idx + 1}: ${l.slice(0, 150)}`);
    }
  });

  console.log('=== Homepage Arenas Text ===');
  const homeRes = await fetch('http://localhost:3000/');
  const homeHtml = await homeRes.text();
  const homeLines = homeHtml.split('\n');
  homeLines.forEach((l, idx) => {
    if (l.includes('Arenas') || l.includes('arenas')) {
      console.log(`Line ${idx + 1}: ${l.trim()}`);
    }
  });
}

inspectHtml().catch(console.error);
