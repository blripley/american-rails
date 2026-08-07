import Jimp from 'jimp';

// Overlay a predicted flat-top odd-q hex grid (outlines) onto the board photo so
// we can tune geometry until the drawn hexes match the real hexes.
// Usage: node gridCalibrate.mjs <src> <out> <originX> <originY> <size> <cols> <rows>
const [, , SRC, OUT, oxs, oys, ss, colss, rowss] = process.argv;
const originX = Number(oxs), originY = Number(oys), size = Number(ss);
const cols = Number(colss), rows = Number(rowss);

let img = await Jimp.read(SRC);
if (img.bitmap.height > img.bitmap.width) img = img.rotate(-90);
const W = img.bitmap.width, H = img.bitmap.height;
const RED = 0xff2200ff, YEL = 0xffe000ff;

function px(x, y, c){ x=Math.round(x); y=Math.round(y); if (x>=0&&y>=0&&x<W&&y<H) img.setPixelColor(c, x, y); }
function dot(x, y, r, c){ for (let dx=-r;dx<=r;dx++) for (let dy=-r;dy<=r;dy++) px(x+dx,y+dy,c); }
function line(x0,y0,x1,y1,c){ x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1; let err=dx-dy;
  for(;;){ px(x0,y0,c); px(x0+1,y0,c); if(x0===x1&&y0===y1)break; const e2=2*err; if(e2>-dy){err-=dy;x0+=sx;} if(e2<dx){err+=dx;y0+=sy;} } }

function hexCenter(col,row){ return [ originX + size*1.5*col, originY + size*Math.sqrt(3)*(row + 0.5*(1-(col&1))) ]; }
function hexVerts(cx,cy){ const v=[]; for(let i=0;i<6;i++){ const a=Math.PI/180*(60*i); v.push([cx+size*Math.cos(a), cy+size*Math.sin(a)]); } return v; }

for (let col=0; col<cols; col++) for (let row=0; row<rows; row++){
  const [cx,cy]=hexCenter(col,row); if (cx>W+size||cy>H+size) continue;
  const v=hexVerts(cx,cy);
  for (let i=0;i<6;i++){ const [ax,ay]=v[i], [bx,by]=v[(i+1)%6]; line(ax,ay,bx,by,RED); }
  dot(cx,cy,3,YEL);
}
// axis labels: column number above each column, row number left of each row
const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
for (let col=0; col<cols; col++){ const [cx]=hexCenter(col,0); img.print(font, cx-14, 6, String(col)); }
for (let row=0; row<rows; row++){ const [,cy]=hexCenter(0,row); img.print(font, 8, cy-18, String(row)); }
await img.writeAsync(OUT);
console.log('wrote', OUT, 'size', size, 'origin', originX, originY, 'grid', cols+'x'+rows);
