import fs from 'fs';

async function testAll() {
  console.log('--- 1. Testing API Competitions ---');
  const apiRes = await fetch('http://localhost:3000/api/competitions');
  const apiJson = await apiRes.json();
  const comps = apiJson.competitions || apiJson;
  console.log(`Total competitions returned: ${comps.length}`);

  let totalCoords = 0;
  comps.forEach(c => {
    const coords = c.coordinators || [];
    totalCoords += coords.length;
    console.log(`- ${c.name} (${c.slug}): ${coords.length} coordinators`);
  });
  console.log(`Total coordinators across all competitions: ${totalCoords}`);

  console.log('\n--- 2. Checking Project Competition Description & Coordinators ---');
  const proj = comps.find(c => c.slug === 'project-competition');
  if (proj) {
    console.log('Project Comp Description snippet:', proj.about?.slice(0, 120));
    console.log('Approved domains:', proj.approved_domains || proj.approvedDomains || 'NONE (Correct)');
    console.log('Project Coordinators:');
    proj.coordinators.forEach(coord => {
      console.log(`  * [${coord.role}] ${coord.name} - Phone: ${coord.phone || 'N/A'}`);
    });
  }

  console.log('\n--- 3. Checking Mini Project Competition ---');
  const mini = comps.find(c => c.slug === 'mini-project-competition');
  if (mini) {
    console.log('Mini Project Coordinators:');
    mini.coordinators.forEach(coord => {
      console.log(`  * [${coord.role}] ${coord.name} - Phone: ${coord.phone || 'N/A'}`);
    });
  }

  console.log('\n--- 4. Checking Public HTML for Project Competition ---');
  const htmlRes = await fetch('http://localhost:3000/competitions/project-competition');
  const htmlText = await htmlRes.text();
  const hasSubjectRestrictionRule = htmlText.includes('must belong to approved domains') || htmlText.includes('approved technical domains:');
  const hasNewCopy = htmlText.includes('relevant engineering or technical subject or domain');
  const hasRealCoordName = htmlText.includes('Khushi Pardhi') && htmlText.includes('Dr. (Mrs) J. M. Bhattad');
  const hasPlaceholderCoordinator = htmlText.includes('name":"Lead Student Coordinator"') || htmlText.includes('>Lead Student Coordinator<');
  console.log('Public Project Comp Page:');
  console.log('  - Has restrictive subject rule ("must belong to approved domains"):', hasSubjectRestrictionRule ? 'FAIL' : 'PASS (Clean)');
  console.log('  - Has new student-friendly copy:', hasNewCopy ? 'PASS' : 'FAIL');
  console.log('  - Has real coordinator names:', hasRealCoordName ? 'PASS' : 'FAIL');
  console.log('  - Has generic placeholder coordinator:', hasPlaceholderCoordinator ? 'FAIL' : 'PASS (Clean)');

  console.log('\n--- 5. Checking Homepage for Meet TurboBits and Arenas Count ---');
  const homeRes = await fetch('http://localhost:3000/');
  const homeText = await homeRes.text();
  const hasTurboBitsBtn = homeText.includes('Meet TurboBits') && homeText.includes('/turbobits');
  const hasWatchTrailer = homeText.includes('Watch Trailer');
  const has9ArenasInHome = /9(<!-- -->)?\s*Arenas/.test(homeText);
  console.log('Homepage:');
  console.log('  - Has "Meet TurboBits" button linking to /turbobits:', hasTurboBitsBtn ? 'PASS' : 'FAIL');
  console.log('  - Has "Watch Trailer" button:', hasWatchTrailer ? 'PASS' : 'FAIL');
  console.log('  - Shows "9 Arenas":', has9ArenasInHome ? 'PASS' : 'FAIL');

  console.log('\n--- 6. Checking Districts Page ---');
  const distRes = await fetch('http://localhost:3000/districts');
  const distText = await distRes.text();
  const has9Districts = distText.includes('The Nine Districts of') || distText.includes('9 Arenas');
  console.log('Districts Page:');
  console.log('  - Mentions Nine Districts:', has9Districts ? 'PASS' : 'FAIL');
}

testAll().catch(console.error);
