import Jimp from 'jimp';
// Sample each hex (flat-top, even-columns-down) from the top-down board photo.
// Detect city hexes by their cream fraction; classify terrain for the rest.
// Usage: node sampleBoard.mjs <src> <originX> <originY> <size> <cols> <rows>
const [, , SRC, oxs, oys, ss, colss, rowss] = process.argv;
const originX=Number(oxs), originY=Number(oys), size=Number(ss), cols=Number(colss), rows=Number(rowss);
const img = await Jimp.read(SRC);
const W=img.bitmap.width, H=img.bitmap.height;
function center(col,row){ return [ originX+size*1.5*col, originY+size*Math.sqrt(3)*(row+0.5*(1-(col&1))) ]; }
function samples(cx,cy){ const out=[];
  for (const rr of [0,0.25,0.4,0.55,0.68]) { const n=rr===0?1:Math.round(rr*20);
    for (let a=0;a<n;a++){ const th=a/n*6.283; const x=Math.round(cx+Math.cos(th)*rr*size), y=Math.round(cy+Math.sin(th)*rr*size);
      if (x<0||y<0||x>=W||y>=H) continue; const c=Jimp.intToRGBA(img.getPixelColor(x,y)); out.push([c.r,c.g,c.b]); } }
  return out; }
function med(arr,i){ const a=arr.map(p=>p[i]).sort((x,y)=>x-y); return a.length?a[Math.floor(a.length/2)]:0; }
function isCream([r,g,b]){ const V=Math.max(r,g,b),mn=Math.min(r,g,b),sat=V?(V-mn)/V:0,br=r?b/r:1; return V>185 && br>0.74 && sat<0.24; }
function classifyTerrain(r,g,b){ const V=Math.max(r,g,b),mn=Math.min(r,g,b),sat=V?(V-mn)/V:0,br=r?b/r:1,gr=r?g/r:1;
  if (V>=196 && br>0.70) return 'o';
  if (br>=0.72 && V>=95 && V<196) return 'M';
  if (gr>=0.82 && V<190) return 'f';
  if (r>90 && br<0.72) return '.';
  return 'o'; }
const grid=[], cities=[];
for (let row=0; row<rows; row++){ let line='';
  for (let col=0; col<cols; col++){ const [cx,cy]=center(col,row);
    if (cx<0||cy<0||cx>=W||cy>=H){ line+='o'; continue; }
    const s=samples(cx,cy); const creamFrac=s.filter(isCream).length/s.length;
    let t; if (creamFrac>0.33){ t='C'; cities.push(col+','+row); }
    else t=classifyTerrain(med(s,0),med(s,1),med(s,2));
    line+=t; }
  grid.push(line); }
grid.forEach((l,i)=>console.log(String(i).padStart(2),l));
console.log('   '+[...Array(cols).keys()].map(i=>i%10).join(''));
console.log('\nCITY CELLS ('+cities.length+'):', cities.join(' '));
