import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE_IMAGE = 'IMG-20261015-WA0010.jpg';

function createIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + (16 * count);
  const dirEntries = [];

  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i];
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Image data offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function generate() {
  console.log('Generating favicons from', SOURCE_IMAGE);
  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error(`Source image not found: ${SOURCE_IMAGE}`);
  }

  // 1. Generate ICO sizes: 16x16, 32x32, 48x48
  // Turbopack's Rust ICO decoder strictly requires ColorType::Rgba8 (Color type 6)
  const icoSizes = [16, 32, 48];
  const icoPngBuffers = await Promise.all(
    icoSizes.map(size =>
      sharp(SOURCE_IMAGE)
        .resize(size, size, { fit: 'contain' })
        .ensureAlpha(1)
        .png({ force: true, compressionLevel: 9 })
        .toBuffer()
    )
  );

  const icoBuffer = createIco(icoPngBuffers, icoSizes);

  // Write favicon.ico to both src/app/ and public/
  fs.writeFileSync(path.join('src', 'app', 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join('public', 'favicon.ico'), icoBuffer);
  console.log('✓ Written src/app/favicon.ico and public/favicon.ico');

  // 2. High-res app icons for Next.js App Router
  // src/app/icon.png (Next.js automatically discovers this for <link rel="icon">)
  await sharp(SOURCE_IMAGE)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('src', 'app', 'icon.png'));
  console.log('✓ Written src/app/icon.png (512x512)');

  // src/app/apple-icon.png (Next.js automatically discovers this for <link rel="apple-touch-icon">)
  await sharp(SOURCE_IMAGE)
    .resize(180, 180, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('src', 'app', 'apple-icon.png'));
  console.log('✓ Written src/app/apple-icon.png (180x180)');

  // 3. Static public icons for browsers and PWA manifests
  await sharp(SOURCE_IMAGE)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('public', 'icon.png'));
  await sharp(SOURCE_IMAGE)
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('public', 'icon-512.png'));
  await sharp(SOURCE_IMAGE)
    .resize(192, 192, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('public', 'icon-192.png'));
  await sharp(SOURCE_IMAGE)
    .resize(180, 180, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('public', 'apple-touch-icon.png'));
  await sharp(SOURCE_IMAGE)
    .resize(32, 32, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('public', 'favicon-32x32.png'));
  await sharp(SOURCE_IMAGE)
    .resize(16, 16, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join('public', 'favicon-16x16.png'));

  console.log('✓ Written all public/ icons (16, 32, 180, 192, 512)');
  console.log('Favicon generation complete!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
