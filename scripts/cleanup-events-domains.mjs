import fs from 'fs';

let content = fs.readFileSync('src/data/events.ts', 'utf8');

// Remove approvedDomains
content = content.replace(/approvedDomains:\s*\["DSD",\s*"WSN",\s*"ES",\s*"DSP",\s*"MWR"\],?\r?\n/g, '');

// Update FAQ
content = content.replace(
  'question: "Can we submit projects outside the 5 approved domains?",',
  'question: "What technical domains or subjects are eligible?",'
);
content = content.replace(
  'answer: "No. The core technology must strictly fall under DSD, WSN, ES, DSP, or MWR. Projects outside these domains will not be evaluated.",',
  'answer: "Participants can showcase projects from any relevant engineering or technical subject or domain. Choose a project that demonstrates your ideas, implementation, and problem-solving skills, and follow the competition\'s stated submission requirements.",'
);

fs.writeFileSync('src/data/events.ts', content, 'utf8');
console.log('✓ Cleaned up approvedDomains and FAQ in events.ts');
