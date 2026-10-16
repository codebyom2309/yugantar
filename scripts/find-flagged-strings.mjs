import fs from 'fs';

async function check() {
  const res = await fetch('http://localhost:3000/competitions/project-competition');
  const text = await res.text();
  
  console.log('--- Checking DSD / WSN / ES / DSP / MWR ---');
  ['DSD', 'WSN', 'ES', 'DSP', 'MWR'].forEach(acronym => {
    let pos = 0;
    while ((pos = text.indexOf(acronym, pos)) !== -1) {
      console.log(`Found ${acronym} at position ${pos}: ...${text.slice(Math.max(0, pos - 40), pos + 50)}...`);
      pos += acronym.length;
    }
  });

  console.log('--- Checking Lead Student Coordinator ---');
  let pos = 0;
  while ((pos = text.indexOf('Lead Student Coordinator', pos)) !== -1) {
    console.log(`Found Lead Student Coordinator at ${pos}: ...${text.slice(Math.max(0, pos - 40), pos + 50)}...`);
    pos += 'Lead Student Coordinator'.length;
  }

  console.log('--- Checking Faculty Advisor ---');
  pos = 0;
  while ((pos = text.indexOf('Faculty Advisor', pos)) !== -1) {
    console.log(`Found Faculty Advisor at ${pos}: ...${text.slice(Math.max(0, pos - 40), pos + 50)}...`);
    pos += 'Faculty Advisor'.length;
  }
}

check().catch(console.error);
