import fs from 'fs';
import { getDbConnection } from './db-helper.mjs';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

async function resolveImage(urlOrKey) {
  if (!urlOrKey) return null;
  const str = urlOrKey.trim();

  // 1. Data URL
  if (str.startsWith('data:image/')) {
    const base64 = str.split(';base64,')[1];
    return Buffer.from(base64, 'base64');
  }

  // 2. Filebase Key or Proxy URL
  if (str.includes('/api/media/filebase') || str.includes('filebase.io') || str.startsWith('yugantar/')) {
    let key = str;
    if (str.includes('key=')) {
      const match = str.match(/key=([^&]+)/);
      if (match) key = decodeURIComponent(match[1]);
    }
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const getEnv = (k) => {
      const l = envContent.split(/\r?\n/).find((x) => x.startsWith(k + '='));
      return l ? l.slice(k.length + 1).replace(/^["']|["']$/g, '') : '';
    };

    const s3 = new S3Client({
      endpoint: getEnv('FILEBASE_ENDPOINT') || 'https://s3.filebase.io',
      region: getEnv('FILEBASE_REGION') || 'auto',
      credentials: {
        accessKeyId: getEnv('FILEBASE_ACCESS_KEY'),
        secretAccessKey: getEnv('FILEBASE_SECRET_KEY'),
      },
      forcePathStyle: true,
    });

    const res = await s3.send(new GetObjectCommand({
      Bucket: getEnv('FILEBASE_BUCKET') || 'teleera',
      Key: key,
    }));
    const chunks = [];
    for await (const c of res.Body) chunks.push(c);
    return Buffer.concat(chunks);
  }

  // 3. Local file
  if (str.startsWith('/')) {
    const localPath = `${process.cwd()}/public${str}`;
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
  }

  // 4. Remote HTTP
  if (str.startsWith('http://') || str.startsWith('https://')) {
    const res = await fetch(str);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  }

  return null;
}

async function main() {
  const conn = await getDbConnection();
  const [rows] = await conn.query('SELECT * FROM pass_templates WHERE id = "827ebe0e-e3d9-4959-abb2-aff2476ff5b5"');
  await conn.end();

  const tpl = rows[0];
  console.log('Rendering template:', tpl.title, 'W:', tpl.width_pt, 'H:', tpl.height_pt, 'Bg:', tpl.background_url);

  const pdfDoc = await PDFDocument.create();
  const pageWidth = Number(tpl.width_pt) || 595.28;
  const pageHeight = Number(tpl.height_pt) || 841.89;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const bgBuf = await resolveImage(tpl.background_url);
  if (!bgBuf) {
    throw new Error('Could not resolve background image!');
  }
  console.log('Background buffer resolved:', bgBuf.length, 'bytes');

  const pngBuf = await sharp(bgBuf).png().toBuffer();
  const embeddedBg = await pdfDoc.embedPng(pngBuf);

  const imgW = embeddedBg.width;
  const imgH = embeddedBg.height;
  console.log('Background embedded size:', imgW, 'x', imgH);

  // Cover fitting
  let drawX = 0, drawY = 0, drawW = pageWidth, drawH = pageHeight;
  const pageRatio = pageWidth / pageHeight;
  const imgRatio = imgW / imgH;

  if (tpl.background_fit === 'stretch') {
    drawW = pageWidth;
    drawH = pageHeight;
  } else if (tpl.background_fit === 'contain') {
    if (imgRatio > pageRatio) {
      drawW = pageWidth;
      drawH = pageWidth / imgRatio;
      drawY = (pageHeight - drawH) / 2;
    } else {
      drawH = pageHeight;
      drawW = pageHeight * imgRatio;
      drawX = (pageWidth - drawW) / 2;
    }
  } else {
    // cover
    if (imgRatio > pageRatio) {
      drawH = pageHeight;
      drawW = pageHeight * imgRatio;
      drawX = (pageWidth - drawW) / 2;
    } else {
      drawW = pageWidth;
      drawH = pageWidth / imgRatio;
      drawY = (pageHeight - drawH) / 2;
    }
  }

  page.drawImage(embeddedBg, {
    x: drawX,
    y: drawY,
    width: drawW,
    height: drawH,
    opacity: Number(tpl.background_opacity) || 1,
  });

  const elements = typeof tpl.elements === 'string' ? JSON.parse(tpl.elements) : tpl.elements;
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const el of elements) {
    const pdfY = pageHeight - el.y - el.height;
    if (el.type === 'field' || el.type === 'text') {
      page.drawText(el.token || el.content || 'Test Text', {
        x: el.x,
        y: pdfY,
        size: el.fontSize || 12,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('public/test-tt2-rendered.pdf', pdfBytes);
  console.log('Successfully wrote public/test-tt2-rendered.pdf! Bytes:', pdfBytes.length);
}

main().catch(console.error);
