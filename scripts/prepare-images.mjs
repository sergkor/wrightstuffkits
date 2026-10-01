import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'inventory';
const OUT = 'public/images/products';
const MAX = 1600;

// [source file, slug, output basename, kind]
const MAP = [
  ['advanced.PNG', 'advanced-kit', 'render', 'png'],
  ['IMG_1511.JPG', 'advanced-kit', '1', 'jpg'],
  ['IMG_1512.JPG', 'advanced-kit', '2', 'jpg'],
  ['IMG_1513.JPG', 'advanced-kit', '3', 'jpg'],
  ['IMG_1514.JPG', 'advanced-kit', '4', 'jpg'],
  ['Intermediate_Kit_2026-Oct-01_06-19-39AM-000_CustomizedView25131942226.png', 'intermediate-kit', 'render', 'png'],
  ['IMG_1506.JPG', 'intermediate-kit', '1', 'jpg'],
  ['IMG_1508.JPG', 'intermediate-kit', '2', 'jpg'],
  ['IMG_1509.JPG', 'intermediate-kit', '3', 'jpg'],
  ['beginner.PNG', 'beginner-kit', 'render', 'png'],
  ['IMG_1521.JPG', 'beginner-kit', '1', 'jpg'],
  ['IMG_1524.JPG', 'beginner-kit', '2', 'jpg'],
  ['IMG_1538.JPG', 'propeller-kit', '1', 'jpg'],
  ['IMG_1538.JPG', 'custom-propeller', '1', 'jpg'],
];

for (const [file, slug, base, kind] of MAP) {
  const dir = path.join(OUT, slug);
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, `${base}.${kind}`);
  let img = sharp(path.join(SRC, file))
    .rotate()
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  img = kind === 'png' ? img.png({ compressionLevel: 9, palette: true }) : img.jpeg({ quality: 82, mozjpeg: true });
  const info = await img.toFile(out);
  console.log(`${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
