import fs from 'fs';
import path from 'path';

function parseXmlWorksheet(xmlPath, sharedStrings) {
  const content = fs.readFileSync(xmlPath, 'utf8');
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
    const tMatches = si.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
    return tMatches.map(t => t.replace(/<t[^>]*>|<\/t>/g, '')).join('');
  });
}

const tempDir = path.join(process.cwd(), 'scratch', 'yugantar_xlsx', 'xl');
const sharedStrings = parseSharedStrings(path.join(tempDir, 'sharedStrings.xml'));

const sheet2Rows = parseXmlWorksheet(path.join(tempDir, 'worksheets', 'sheet2.xml'), sharedStrings);
console.log('=== EXACT ROWS FROM Sheet1 (Schedule) ===\n');
for (const r of sheet2Rows) {
  console.log(`[Row ${r.rowNum.toString().padStart(2)}] A: "${r.data.A || ''}" | B: "${r.data.B || ''}" | C: "${r.data.C || ''}" | D: "${r.data.D || ''}" | E: "${r.data.E || ''}" | F: "${r.data.F || ''}" | G: "${r.data.G || ''}" | H: "${r.data.H || ''}" | I: "${r.data.I || ''}"`);
}

const sheet1Rows = parseXmlWorksheet(path.join(tempDir, 'worksheets', 'sheet1.xml'), sharedStrings);
console.log('\n=== ROWS FROM Student Roll List ===\n');
for (let i = 0; i < Math.min(sheet1Rows.length, 25); i++) {
  const r = sheet1Rows[i];
  console.log(`[Row ${r.rowNum.toString().padStart(2)}] ${JSON.stringify(r.data)}`);
}
