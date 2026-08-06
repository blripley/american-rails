import Jimp from 'jimp';

// Reads terrain straight off the flat board scan by sampling each hex centre's
// colour and classifying it. Also writes an overlay so we can verify the grid
// lines up with the real hexes.
//
// Usage: node scripts/sampleBoard.mjs <src> <outdir> <originX> <originY> <size> <cols> <rows>
// With no geometry args it just prints the image size.

const SRC = process.argv[2];
const OUTDIR = process.argv[3];
let img = await Jimp.read(SRC);
if (img.bitmap.height > img.bitmap.width) img = img.rotate(-90); // straighten portrait photos
const W = img.bitmap.width, H = img.bitmap.height;
console.log('image', W + 'x' + H);
if (process.argv.length < 8) process.exit(0);

const originX = Number(process.argv[4]);
const originY = Number(process.argv[5]);
const size = Number(process.argv[6]);
const cols = Number(process.argv[7]);
const rows = Number(process.argv[8]);

function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

// Average colour of a small patch around (x,y).
function sample(x, y, rad) {
  let R = 0, G = 0, B = 0, n = 0;
  for (let dx = -rad; dx <= rad; dx++)
    for (let dy = -rad; dy <= rad; dy++) {
      const px = Math.round(x + dx), py = Math.round(y + dy);
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const c = Jimp.intToRGBA(img.getPixelColor(px, py));
      R += c.r; G += c.g; B += c.b; n++;
    }
  return { r: R / n, g: G / n, b: B / n };
}

function classify(r, g, b) {
  const { h, s, v } = hsv(r, g, b);
  if (v < 0.28) return 'o'; // dark border / off-board
  if (h >= 170 && h <= 260 && s > 0.15) return 'o'; // blue ocean/border
  if (s < 0.18) return v > 0.72 ? 'C' : 'M'; // low sat: bright=city, mid=mountain(grey)
  if (h >= 30 && h < 62) return '.'; // yellow/gold plains
  if (h >= 62 && h <= 160) return 'f'; // green/olive forest
  if (v > 0.7 && s < 0.32) return 'C'; // pale cream city
  return '?';
}

const RED = 0xff0000ff, GRN = 0x00ff00ff;
function dot(x, y, r, color) {
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++) {
      const px = Math.round(x + dx), py = Math.round(y + dy);
      if (px >= 0 && py >= 0 && px < W && py < H) img.setPixelColor(color, px, py);
    }
}

const patch = Math.max(3, Math.round(size * 0.28));
const grid = [];
for (let row = 0; row < rows; row++) {
  const line = [];
  for (let col = 0; col < cols; col++) {
    const x = originX + size * 1.5 * col;
    const y = originY + size * Math.sqrt(3) * (row + 0.5 * (col & 1));
    if (x >= W || y >= H) { line.push(' '); continue; }
    const { r, g, b } = sample(x, y, patch);
    const t = classify(r, g, b);
    line.push(t);
    dot(x, y, 2, t === 'o' ? RED : GRN);
  }
  grid.push(line.join(''));
}

await img.scale(2).writeAsync(`${OUTDIR}/sample-overlay.png`);
console.log('\n=== classified grid (. plains, f forest, M mountain, C city, o off) ===');
for (const l of grid) console.log(l);
