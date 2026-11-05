const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const adminPublicDir = path.join(rootDir, 'admin', 'public');
  const srcLogoPath = path.join(publicDir, 'lordz-logo.png');

  if (!fs.existsSync(srcLogoPath)) {
    console.error('Source logo not found at', srcLogoPath);
    process.exit(1);
  }

  console.log('Generating crisp favicon suite from', srcLogoPath);

  // Trim the padding from the original 1024x1024 logo so the emblem is large and prominent
  const trimmedBuffer = await sharp(srcLogoPath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log('Trimmed dimensions:', trimmedMeta.width, 'x', trimmedMeta.height);

  // We want to place the trimmed logo in a square canvas with ~8% balanced padding
  // This makes the LE logo prominent, crisp and easily readable even at 16x16 and 32x32 in browser tabs!
  const maxDim = Math.max(trimmedMeta.width, trimmedMeta.height);
  const padding = Math.round(maxDim * 0.08);
  const targetSize = maxDim + padding * 2;

  const framedSquare = await sharp(trimmedBuffer)
    .resize(maxDim, maxDim, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Create favicon sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'favicon-96x96.png', size: 96 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'apple-touch-icon-precomposed.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  const pngBuffers = {};
  for (const item of sizes) {
    const buf = await sharp(framedSquare)
      .resize(item.size, item.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    pngBuffers[item.size] = buf;

    // Save to public and admin/public
    fs.writeFileSync(path.join(publicDir, item.name), buf);
    if (fs.existsSync(adminPublicDir)) {
      fs.writeFileSync(path.join(adminPublicDir, item.name), buf);
    }
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Create multi-image ICO file with 16x16, 32x32, 48x48
  // An ICO file structure:
  // ICONDIR header: 6 bytes
  // ICONDIRENTRY: 16 bytes each
  // Image data (PNG compressed format for modern ICO)
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // number of images

  let offset = 6 + count * 16;
  const entries = [];
  const imageBuffers = [];

  for (const s of icoSizes) {
    const imgBuf = pngBuffers[s];
    imageBuffers.push(imgBuf);

    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(imgBuf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset

    entries.push(entry);
    offset += imgBuf.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  if (fs.existsSync(adminPublicDir)) {
    fs.writeFileSync(path.join(adminPublicDir, 'favicon.ico'), icoBuffer);
  }
  console.log('Generated multi-resolution favicon.ico (16, 32, 48)');

  // Also create a dark background version for SVG or pure vector SVG
  // Let's create an ultra-clean, high-contrast SVG favicon for modern browsers!
  // The official LE logo in gold with dark background circle / shield or transparent
  const d0 = 'M256,218 L340,218 L340,517 L344,541 L366,598 L386,629 L414,661 L416,593 L485,594 L485,802 L420,757 L349,691 L299,626 L270,570 L255,510 Z';
  const d1 = 'M531,218 L769,220 L768,281 L603,282 L602,422 L766,424 L767,485 L603,487 L604,663 L664,592 L742,593 L713,641 L658,706 L598,759 L531,805 Z';

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <linearGradient id="leGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE066"/>
      <stop offset="40%" stop-color="#FFBE32"/>
      <stop offset="85%" stop-color="#E59B00"/>
      <stop offset="100%" stop-color="#B87700"/>
    </linearGradient>
    <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#FFBE32" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="#0A0A0C"/>
  <rect width="1016" height="1016" x="4" y="4" rx="216" fill="none" stroke="url(#leGold)" stroke-width="8" stroke-opacity="0.25"/>
  <g filter="url(#glow)">
    <path d="${d0}" fill="url(#leGold)"/>
    <path d="${d1}" fill="url(#leGold)"/>
  </g>
</svg>`;

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
  if (fs.existsSync(adminPublicDir)) {
    fs.writeFileSync(path.join(adminPublicDir, 'favicon.svg'), svgContent, 'utf8');
  }
  console.log('Generated premium vector favicon.svg with dark rounded background and gold LE emblem');

  console.log('All favicon assets generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
