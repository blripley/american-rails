import Jimp from 'jimp';
import path from 'node:path';

const SRC = process.argv[2];
const OUTDIR = process.argv[3];
const ROT = Number(process.argv[4] ?? -90); // degrees CCW to reach landscape

let img = await Jimp.read(SRC);
if (img.bitmap.height > img.bitmap.width) {
  img = img.rotate(ROT); // straighten portrait -> landscape
}
const W = img.bitmap.width;
const H = img.bitmap.height;
console.log('oriented', W, 'x', H);
await img.clone().scale(0.5).writeAsync(path.join(OUTDIR, 'oriented.png'));

const tiles = [
  ['nw', 0.02, 0.02, 0.56, 0.58],
  ['ne', 0.44, 0.02, 0.86, 0.58],
  ['sw', 0.02, 0.42, 0.56, 0.98],
  ['se', 0.44, 0.42, 0.86, 0.98],
];

for (const [name, x0, y0, x1, y1] of tiles) {
  const x = Math.round(x0 * W);
  const y = Math.round(y0 * H);
  const w = Math.round((x1 - x0) * W);
  const h = Math.round((y1 - y0) * H);
  const c = img.clone().crop(x, y, w, h).scale(1.5);
  await c.writeAsync(path.join(OUTDIR, `crop-${name}.png`));
  console.log('wrote', `crop-${name}.png`, w, 'x', h);
}
