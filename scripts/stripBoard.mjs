import Jimp from 'jimp';
import path from 'node:path';

const SRC = process.argv[2];
const OUTDIR = process.argv[3];
const ROT = Number(process.argv[4] ?? -90);

let img = await Jimp.read(SRC);
if (img.bitmap.height > img.bitmap.width) img = img.rotate(ROT);
const W = img.bitmap.width;
const H = img.bitmap.height;
console.log('oriented', W, 'x', H);

// Five overlapping full-height vertical strips across the map.
const strips = [
  ['s1', 0.00, 0.30],
  ['s2', 0.24, 0.50],
  ['s3', 0.44, 0.68],
  ['s4', 0.60, 0.84],
  ['s5', 0.76, 1.00],
];

for (const [name, x0, x1] of strips) {
  const x = Math.round(x0 * W);
  const w = Math.round((x1 - x0) * W);
  const c = img.clone().crop(x, 0, w, H).scale(1.4);
  await c.writeAsync(path.join(OUTDIR, `strip-${name}.png`));
  console.log('wrote', `strip-${name}.png`, w, 'x', H);
}
