import fs from 'fs';

async function checkHome() {
  const res = await fetch('http://localhost:3000/');
  const text = await res.text();
  const matches = [...text.matchAll(/.{0,30}arenas?.{0,30}/gi)];
  console.log(`Found ${matches.length} matches for arena(s):`);
  matches.forEach(m => console.log('MATCH:', m[0]));
}

checkHome().catch(console.error);
