import fs from 'fs';

const html = fs.readFileSync('scripts/mini-project-viewform.html', 'utf8');
const startStr = 'FB_PUBLIC_LOAD_DATA_ = ';
const startIdx = html.indexOf(startStr);
if (startIdx !== -1) {
  const endIdx = html.indexOf(';</script>', startIdx);
  const jsonStr = html.substring(startIdx + startStr.length, endIdx);
  const data = JSON.parse(jsonStr);
  console.log('Form title:', data[1][8]);
  const items = data[1][1];
  console.log('Total items in form:', items.length);
  for (const item of items) {
    const title = item[1];
    const details = item[4];
    if (details && details[0]) {
      const entryId = details[0][0];
      const isRequired = details[0][2] === 1;
      const options = details[0][1] ? details[0][1].map((o) => o[0]) : null;
      console.log(`- entry.${entryId}: "${title}" (required: ${isRequired}) ${options ? '[' + options.join(', ') + ']' : ''}`);
    } else {
      console.log(`- Item without details: "${title}"`);
    }
  }
} else {
  console.log('FB_PUBLIC_LOAD_DATA_ not found');
}
