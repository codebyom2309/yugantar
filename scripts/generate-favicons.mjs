import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE_IMAGE = 'IMG-20261015-WA0010.jpg';

async function generateCircularAsset(sourcePath, size, outputPath, format = 'png', quality = 95) {
  const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff"/></svg>`;
  const mask = await sharp(Buffer.from(circleSvg)).resize(size, size).png().toBuffer();
  
  const resized = await sharp(sourcePath)
    .rotate()
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();

  const pipeline = sharp(resized).composite([{ input: mask, blend: 'dest-in' }]);

  if (format === 'webp') {
    await pipeline.webp({ quality }).toFile(outputPath);
  } else {
    await pipeline.png({ compressionLevel: 9 }).toFile(outputPath);
  }
}

async function generate() {
  console.log('Generating favicons & brand assets...');

  // 1. If root favicon.ico exists, preserve and copy it directly
  if (fs.existsSync('favicon.ico')) {
    fs.copyFileSync('favicon.ico', path.join('src', 'app', 'favicon.ico'));
    fs.copyFileSync('favicon.ico', path.join('public', 'favicon.ico'));
    console.log('✓ Preserved & copied user favicon.ico to src/app/ and public/');

    // Extract 32x32 and 16x16 PNG from root favicon.ico
    const icoBuf = fs.readFileSync('favicon.ico');
    const bgra = icoBuf.subarray(62, 62 + 4096);
    const rgba32 = Buffer.alloc(4096);
    for (let r = 0; r < 32; r++) {
      const srcRow = 31 - r;
      for (let c = 0; c < 32; c++) {
        const s = (srcRow * 32 + c) * 4;
        const d = (r * 32 + c) * 4;
        rgba32[d] = bgra[s + 2];
        rgba32[d + 1] = bgra[s + 1];
        rgba32[d + 2] = bgra[s];
        rgba32[d + 3] = bgra[s + 3];
      }
    }

    await sharp(rgba32, { raw: { width: 32, height: 32, channels: 4 } })
      .png()
      .toFile(path.join('public', 'favicon-32x32.png'));
    await sharp(rgba32, { raw: { width: 32, height: 32, channels: 4 } })
      .resize(16, 16)
      .png()
      .toFile(path.join('public', 'favicon-16x16.png'));
    console.log('✓ Extracted public/favicon-32x32.png and public/favicon-16x16.png');
  }

  // 2. High-res circular masked assets
  if (fs.existsSync(SOURCE_IMAGE)) {
    // Navbar emblem
    await generateCircularAsset(SOURCE_IMAGE, 256, path.join('public', 'images', 'yugantar-logo.png'), 'png');
    await generateCircularAsset(SOURCE_IMAGE, 256, path.join('public', 'images', 'yugantar-logo.webp'), 'webp');

    // App & metadata icons
    await generateCircularAsset(SOURCE_IMAGE, 512, path.join('src', 'app', 'icon.png'), 'png');
    await generateCircularAsset(SOURCE_IMAGE, 180, path.join('src', 'app', 'apple-icon.png'), 'png');
    await generateCircularAsset(SOURCE_IMAGE, 512, path.join('public', 'icon.png'), 'png');
    await generateCircularAsset(SOURCE_IMAGE, 512, path.join('public', 'icon-512.png'), 'png');
    await generateCircularAsset(SOURCE_IMAGE, 192, path.join('public', 'icon-192.png'), 'png');
    await generateCircularAsset(SOURCE_IMAGE, 180, path.join('public', 'apple-touch-icon.png'), 'png');
    console.log('✓ Generated circular brand and app icons (180, 192, 256, 512)');
  }

  console.log('Favicon & Brand generation complete!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
