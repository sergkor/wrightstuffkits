// Builds the site logo and favicons from marketing/logo.jpeg.
// Run: npm run brand
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const SRC = 'marketing/logo.jpeg';
const BRAND_DIR = 'public/images/brand';

// Crop the circular badge out of the light background and make the outside transparent.
async function circularBadge(size) {
  const trimmed = await sharp(SRC).trim({ threshold: 40 }).toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const side = Math.min(width, height);
  const square = await sharp(trimmed)
    .extract({ left: Math.floor((width - side) / 2), top: Math.floor((height - side) / 2), width: side, height: side })
    .resize(size, size)
    .ensureAlpha()
    .toBuffer();
  const r = size / 2;
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r - 0.5}" fill="#fff"/></svg>`,
  );
  return sharp(square).composite([{ input: mask, blend: 'dest-in' }]).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
}

// ICO container holding PNG-encoded images (supported by all modern browsers).
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }
  return Buffer.concat([header, ...dir, ...pngs.map((p) => p.data)]);
}

await mkdir(BRAND_DIR, { recursive: true });

const outputs = [
  [`${BRAND_DIR}/logo.png`, 512],
  ['src/app/icon.png', 512],
  ['src/app/apple-icon.png', 180],
];
for (const [path, size] of outputs) {
  await writeFile(path, await circularBadge(size));
  console.log(`${path} ${size}x${size}`);
}

const icoSizes = [16, 32, 48];
const pngs = await Promise.all(icoSizes.map(async (size) => ({ size, data: await circularBadge(size) })));
await writeFile('src/app/favicon.ico', ico(pngs));
console.log(`src/app/favicon.ico ${icoSizes.join('/')}`);
