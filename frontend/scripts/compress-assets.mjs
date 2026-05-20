/**
 * Compress large hero/marketing JPEGs in public/assets.
 * Run: npm run compress-assets
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '../public/assets');

const TARGETS = [
  {
    file: 'still-life-wireless-cyberpunk-headphones.jpg',
    maxWidth: 1600,
    jpegQuality: 82,
    webpQuality: 80,
  },
  {
    file: 'wireless-earbuds-with-neon-cyberpunk-style-lighting.jpg',
    maxWidth: 1200,
    jpegQuality: 82,
    webpQuality: 80,
  },
];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function compressOne({ file, maxWidth, jpegQuality, webpQuality }) {
  const inputPath = path.join(ASSETS_DIR, file);
  if (!fs.existsSync(inputPath)) {
    console.warn(`Skip (missing): ${file}`);
    return;
  }

  const before = fs.statSync(inputPath).size;
  const base = file.replace(/\.jpe?g$/i, '');
  const webpPath = path.join(ASSETS_DIR, `${base}.webp`);
  const tmpJpg = path.join(ASSETS_DIR, `.compress-${file}`);

  const pipeline = sharp(inputPath).rotate().resize({
    width: maxWidth,
    withoutEnlargement: true,
    fit: 'inside',
  });

  await pipeline.clone().jpeg({ quality: jpegQuality, mozjpeg: true }).toFile(tmpJpg);
  await pipeline.clone().webp({ quality: webpQuality, effort: 4 }).toFile(webpPath);

  fs.renameSync(tmpJpg, inputPath);

  const afterJpg = fs.statSync(inputPath).size;
  const afterWebp = fs.statSync(webpPath).size;
  console.log(`${file}`);
  console.log(`  JPEG: ${formatBytes(before)} → ${formatBytes(afterJpg)}`);
  console.log(`  WebP: ${formatBytes(afterWebp)} (${base}.webp)`);
}

async function main() {
  for (const target of TARGETS) {
    await compressOne(target);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
