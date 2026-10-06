import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'inventory';
const OUT = 'public/images/products';
const MAX = 1600;
// Optional: `npm run images -- render` regenerates only entries with that output basename.
const ONLY = process.argv[2];

// [source file, slug, output basename, kind]
const MAP = [
  ['renders/elliptical.png', 'elliptical-kit', 'render', 'png'],
  ['IMG_1511.JPG', 'elliptical-kit', '1', 'jpg'],
  ['IMG_1512.JPG', 'elliptical-kit', '2', 'jpg'],
  ['IMG_1513.JPG', 'elliptical-kit', '3', 'jpg'],
  ['IMG_1514.JPG', 'elliptical-kit', '4', 'jpg'],
  ['renders/classic.png', 'classic-kit', 'render', 'png'],
  ['IMG_1506.JPG', 'classic-kit', '1', 'jpg'],
  ['IMG_1508.JPG', 'classic-kit', '2', 'jpg'],
  ['IMG_1509.JPG', 'classic-kit', '3', 'jpg'],
  ['renders/beginner.png', 'beginner-kit', 'render', 'png'],
  ['IMG_1521.JPG', 'beginner-kit', '1', 'jpg'],
  ['IMG_1524.JPG', 'beginner-kit', '2', 'jpg'],
  ['renders/package.png', 'classic-elliptical-package', 'render', 'png'],
  ['IMG_1538.JPG', 'propeller-kit', '1', 'jpg'],
  ['IMG_1538.JPG', 'custom-propeller', '1', 'jpg'],
];

for (const [file, slug, base, kind] of MAP) {
  if (ONLY && base !== ONLY) continue;
  const dir = path.join(OUT, slug);
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, `${base}.${kind}`);
  let img = sharp(path.join(SRC, file))
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  img = kind === 'png' ? img.png({ compressionLevel: 9, palette: true }) : img.jpeg({ quality: 82, mozjpeg: true });
  const info = await img.toFile(out);
  console.log(`${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
