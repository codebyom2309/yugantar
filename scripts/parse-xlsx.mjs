import fs from 'fs';
import path from 'path';

function parseXmlWorksheet(xmlPath, sharedStrings) {
  const content = fs.readFileSync(xmlPath, 'utf8');
  // Match rows
  const rowMatches = content.match(/<row[^>]*>.*?<\/row>/gs) || [];
  const rows = [];

  for (const rowXml of rowMatches) {
    const rowNumMatch = rowXml.match(/r="(\d+)"/);
    const rowNum = rowNumMatch ? parseInt(rowNumMatch[1], 10) : rows.length + 1;
    const cellMatches = rowXml.match(/<c\b[^>]*>(?:<v>.*?<\/v>|.*?<\/c>)?/gs) || [];
    const rowData = {};

    for (const cellXml of cellMatches) {
      const colMatch = cellXml.match(/r="([A-Z]+)\d+"/);
      if (!colMatch) continue;
      const colLetter = colMatch[1];
      const isString = cellXml.includes('t="s"');
      const inlineStringMatch = cellXml.match(/<is><t[^>]*>(.*?)<\/t><\/is>/s);
      const valMatch = cellXml.match(/<v>(.*?)<\/v>/);

      let val = '';
      if (inlineStringMatch) {
        val = inlineStringMatch[1];
      } else if (valMatch) {
        if (isString) {
          const idx = parseInt(valMatch[1], 10);
          val = sharedStrings[idx] || '';
        } else {
          val = valMatch[1];
        }
      }
      rowData[colLetter] = val;
    }
    rows.push({ rowNum, data: rowData });
  }
  return rows;
}

function parseSharedStrings(xmlPath) {
  if (!fs.existsSync(xmlPath)) return [];
  const content = fs.readFileSync(xmlPath, 'utf8');
  const matches = content.match(/<si>.*?<\/si>/gs) || [];
  return matches.map(si => {
    // combine all <t> elements inside <si>
    const tMatches = si.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
    return tMatches.map(t => t.replace(/<t[^>]*>|<\/t>/g, '')).join('');
  });
}

const tempDir = path.join(process.env.TEMP || 'C:\\temp', 'xlsx_unpacked', 'xl');
const sharedStrings = parseSharedStrings(path.join(tempDir, 'sharedStrings.xml'));

console.log('Shared strings count:', sharedStrings.length);

console.log('\n=================== SHEET 2 (Sheet1 in Excel) ===================');
const sheet2Rows = parseXmlWorksheet(path.join(tempDir, 'worksheets', 'sheet2.xml'), sharedStrings);
for (const r of sheet2Rows) {
  const letters = Object.keys(r.data).sort();
  const line = letters.map(l => `${l}:${r.data[l]}`).join('  |  ');
  console.log(`Row ${r.rowNum.toString().padStart(2, ' ')}: ${line}`);
}

console.log('\n=================== SHEET 1 (Student Roll List) ===================');
const sheet1Rows = parseXmlWorksheet(path.join(tempDir, 'worksheets', 'sheet1.xml'), sharedStrings);
console.log('Total rows in Sheet 1:', sheet1Rows.length);
for (let i = 0; i < Math.min(10, sheet1Rows.length); i++) {
  const r = sheet1Rows[i];
  const line = Object.keys(r.data).sort().map(l => `${l}:${r.data[l]}`).join('  |  ');
  console.log(`Row ${r.rowNum}: ${line}`);
}

console.log('\n=================== SHEET 3 (Sheet2 in Excel) ===================');
const sheet3Rows = parseXmlWorksheet(path.join(tempDir, 'worksheets', 'sheet3.xml'), sharedStrings);
console.log('Total rows in Sheet 3:', sheet3Rows.length);
for (const r of sheet3Rows) {
  const line = Object.keys(r.data).sort().map(l => `${l}:${r.data[l]}`).join('  |  ');
  console.log(`Row ${r.rowNum}: ${line}`);
}
