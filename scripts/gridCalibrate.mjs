import Jimp from 'jimp';

// Overlay a predicted flat-top odd-q hex grid onto the board photo so we can
// tune the geometry (origin + size) until the dots sit on the real hex centres.
// Usage: node gridCalibrate.mjs <src> <out> <originX> <originY> <size> <cols> <rows>

const [, , SRC, OUT, oxs, oys, ss, colss, rowss] = process.argv;
const originX = Number(oxs), originY = Number(oys), size = Number(ss);
const cols = Number(colss), rows = Number(rowss);

let img = await Jimp.read(SRC);
if (img.bitmap.height > img.bitmap.width) img = img.rotate(-90);

const RED = 0xff0000ff, YEL = 0xffff00ff, CYAN = 0x00ffffff;
function dot(x, y, r, color) {
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++) {
      const px = Math.round(x + dx), py = Math.round(y + dy);
      if (px >= 0 && py >= 0 && px < img.bitmap.width && py < img.bitmap.height) img.setPixelColor(color, px, py);
    }
}

for (let col = 0; col < cols; col++) {
  for (let row = 0; row < rows; row++) {
    const x = originX + size * 1.5 * col;
    const y = originY + size * Math.sqrt(3) * (row + 0.5 * (col & 1));
    if (x > img.bitmap.width || y > img.bitmap.height) continue;
    dot(x, y, 4, RED); // centre
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i);
      dot(x + size * Math.cos(a), y + size * Math.sin(a), 2, col === 0 && row === 0 ? CYAN : YEL); // vertices
    }
  }
}

await img.writeAsync(OUT);
console.log('wrote', OUT, 'grid', cols, 'x', rows, 'size', size, 'origin', originX, originY);
