import Jimp from 'jimp';

// Sample terrain colour per hex from the (right-side-up) board photo using a
// calibrated flat-top even-down odd... (even-column-down) grid, and classify.
// Usage: node sampleBoard.mjs <src> <originX> <originY> <size> <cols> <rows>
const [, , SRC, oxs, oys, ss, colss, rowss] = process.argv;
const originX=Number(oxs), originY=Number(oys), size=Number(ss), cols=Number(colss), rows=Number(rowss);
const img = await Jimp.read(SRC);
const W=img.bitmap.width, H=img.bitmap.height;

function center(col,row){ return [ originX+size*1.5*col, originY+size*Math.sqrt(3)*(row+0.5*(1-(col&1))) ]; }
function sampleMedian(cx,cy){
  const rs=[0.28,0.42], rgb=[[],[],[]];
  for (const rr of rs) for (let a=0;a<14;a++){ const th=a/14*6.283;
    const x=Math.round(cx+Math.cos(th)*rr*size), y=Math.round(cy+Math.sin(th)*rr*size);
    if (x<0||y<0||x>=W||y>=H) continue; const c=Jimp.intToRGBA(img.getPixelColor(x,y));
    rgb[0].push(c.r); rgb[1].push(c.g); rgb[2].push(c.b); }
  const med=a=>{ a.sort((x,y)=>x-y); return a.length?a[Math.floor(a.length/2)]:0; };
  return [med(rgb[0]),med(rgb[1]),med(rgb[2])];
}
function classify(r,g,b){
  const V=Math.max(r,g,b), mn=Math.min(r,g,b), sat=V?(V-mn)/V:0;
  const br=r?b/r:1, gr=r?g/r:1;
  if (V>=196 && br>0.68) return 'o';        // bright sea parchment / off-board (cities overridden separately)
  if (V>=170 && br>0.66 && sat<0.30) return 'C'; // cream city (mid-bright, warm-neutral)
  if (br>=0.72 && V>=95 && V<196) return 'M';    // grey mountain (high blue/red)
  if (gr>=0.82 && V<190) return 'f';        // olive forest (green-leaning)
  if (r>90 && br<0.72) return '.';          // golden plains
  return 'o';
}
const grid=[], cities=[];
for (let row=0; row<rows; row++){ let line='';
  for (let col=0; col<cols; col++){ const [cx,cy]=center(col,row); const [r,g,b]=sampleMedian(cx,cy);
    let t=(cx>=0&&cy>=0&&cx<W&&cy<H)?classify(r,g,b):'o'; line+=t; if (t==='C') cities.push(col+','+row); }
  grid.push(line);
}
grid.forEach((l,i)=>console.log(String(i).padStart(2),l));
console.log('    '+[...Array(cols).keys()].map(i=>i%10).join(''));
console.log('\nCITY CELLS:', cities.join(' '));
