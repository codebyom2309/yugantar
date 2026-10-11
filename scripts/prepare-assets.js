const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '../public/images/nexus-city');

async function processAssets() {
  console.log('Processing assets in:', dir);

  // 1. Convert large photo/panoramic to WebP
  await sharp(path.join(dir, 'hero-panoramic-city.png'))
    .webp({ quality: 88, effort: 4 })
    .toFile(path.join(dir, 'hero-panoramic-city.webp'));
  console.log('Generated hero-panoramic-city.webp');

  await sharp(path.join(dir, 'architectural-skybridge.png'))
    .webp({ quality: 88, effort: 4 })
    .toFile(path.join(dir, 'architectural-skybridge.webp'));
  console.log('Generated architectural-skybridge.webp');

  await sharp(path.join(dir, 'atmospheric-clouds.png'))
    .webp({ quality: 88, effort: 4 })
    .toFile(path.join(dir, 'atmospheric-clouds.webp'));
  console.log('Generated atmospheric-clouds.webp');

  await sharp(path.join(dir, 'landmark-crystal-tower.png'))
    .webp({ quality: 90, alphaQuality: 100, lossless: false })
    .toFile(path.join(dir, 'landmark-crystal-tower.webp'));
  console.log('Generated landmark-crystal-tower.webp');

  await sharp(path.join(dir, 'city-districts-map.png'))
    .webp({ quality: 90, alphaQuality: 100, lossless: false })
    .toFile(path.join(dir, 'city-districts-map.webp'));
  console.log('Generated city-districts-map.webp');

  await sharp(path.join(dir, 'technical-grid.png'))
    .webp({ quality: 90, alphaQuality: 100, lossless: false })
    .toFile(path.join(dir, 'technical-grid.webp'));
  console.log('Generated technical-grid.webp');

  // 2. Process Logo: generate transparent version from white-ish background
  // Read raw RGBA pixels of yugantar-logo-emblem.png
  const { data, info } = await sharp(path.join(dir, 'yugantar-logo-emblem.png'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const output = Buffer.from(data);
  // For each pixel, if close to white background (R>245, G>245, B>248), calculate alpha
  for (let i = 0; i < output.length; i += 4) {
    const r = output[i];
    const g = output[i + 1];
    const b = output[i + 2];
    
    // Whiteness metric
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const isNeutral = (maxVal - minVal) < 18;
    
    if (minVal > 230 && isNeutral) {
      if (minVal > 248) {
        output[i + 3] = 0; // completely transparent
      } else {
        // smooth feather
        const factor = (248 - minVal) / 18; // 0 to 1
        output[i + 3] = Math.round(255 * factor);
      }
    }
  }

  await sharp(output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'yugantar-logo-emblem-transparent.png'));
  console.log('Generated yugantar-logo-emblem-transparent.png');

  await sharp(output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(dir, 'yugantar-logo-emblem-transparent.webp'));
  console.log('Generated yugantar-logo-emblem-transparent.webp');

  console.log('All asset processing complete!');
}

processAssets().catch(err => {
  console.error('Error processing assets:', err);
  process.exit(1);
});
