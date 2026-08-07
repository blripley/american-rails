import { readFileSync, writeFileSync } from 'node:fs';
const SCRATCH = process.argv[2];
const items = JSON.parse(readFileSync(SCRATCH + '/pdf_items.json', 'utf8'));

// known city income values (full/shared) + which cities are hubs/special
const CITY_VALUES = {
  'Chicago':[7,5],'Rock Island':[2,1],'Detroit':[4,2],'Fort Wayne':[2,1],'Cleveland':[4,2],
  'Buffalo':[4,3],'Syracuse':[2,1],'Albany':[3,2],'Boston':[5,3],'Pittsburg':[5,3],
  'Harrisburg':[1,1],'New York':[8,5],'Philadelphia':[6,4],'Baltimore':[5,3],'Indianapolis':[4,2],
  'Columbus':[1,1],'Cincinnati':[4,2],'St. Louis':[5,3],'Louisville':[1,1],'Charlestown':[2,1],
  'Roanoke':[2,1],'Richmond':[3,2],'Norfolk':[2,2],'Nashville':[3,2],'Knoxville':[2,1],
  'Raleigh':[2,1],'Memphis':[3,2],'Chattanooga':[4,2],'Charlotte':[3,2],'Wilmington':[2,1],
  'Birmingham':[2,1],'Atlanta':[5,3],'Charleston':[3,2],'Jackson':[3,2],'Montgomery':[2,1],
  'Savannah':[3,2],'Mobile':[2,1],'Tallahassee':[2,1],'New Orleans':[5,3],
};
const cityKeys = Object.keys(CITY_VALUES).map(n => [n, n.toLowerCase().replace(/[^a-z]/g,'')]);
const ALIAS = { philidelphia:'Philadelphia', roanake:'Roanoke', bosn:'Boston', boston:'Boston', charlestown:'Charlestown', charleston:'Charleston' };
function matchCity(joined){
  const k = joined.toLowerCase().replace(/[^a-z]/g,'');
  if (k.length<3) return null;
  if (ALIAS[k]) return ALIAS[k];
  let best=null, bestLen=0;
  for (const [name,key] of cityKeys){
    if (k===key) return name;
    if (key.startsWith(k) || k.startsWith(key)){ const len=Math.min(k.length,key.length); if (len>bestLen){ bestLen=len; best=name; } }
  }
  return bestLen>=4 ? best : null;
}

function clusterPage(page){
  const its = items.filter(i=>i.page===page);
  const clusters=[];
  for (const it of its){ let c=clusters.find(c=>Math.hypot(c.x-it.x,c.y-it.y)<24);
    if(!c){ c={x:it.x,y:it.y,parts:[]}; clusters.push(c);} c.parts.push(it);
    c.x=c.parts.reduce((s,p)=>s+p.x,0)/c.parts.length; c.y=c.parts.reduce((s,p)=>s+p.y,0)/c.parts.length; }
  return clusters;
}
function classify(c){
  const joined = c.parts.slice().sort((a,b)=>a.y-b.y||a.x-b.x).map(p=>p.s).join('');
  const j = joined.toLowerCase();
  if (j.includes('oun')) return {t:'M'};
  if (j.includes('ead')) return {t:'.'};
  if (j.includes('forest')) return {t:'f'};
  const name = matchCity(joined);
  return {t:'C', name, raw:joined};
}

// assign col,row using flat-top geometry, auto-fitting the exact lattice spacing.
function fitStep(vals, lo, hi){ // find step minimizing rounding residual
  const v0=Math.min(...vals); let best=lo, bestErr=1e9;
  for (let s=lo; s<=hi; s+=0.05){ let e=0; for(const v of vals){ const k=(v-v0)/s; e+=Math.abs(k-Math.round(k)); } if(e<bestErr){bestErr=e;best=s;} }
  return best;
}
function assign(clusters, forceColStep){
  const xs=clusters.map(c=>c.x), ys=clusters.map(c=>c.y);
  const x0=Math.min(...xs), y0raw=Math.min(...ys);
  const COLSTEP = forceColStep || fitStep(xs, 35, 40);
  const ROWSTEP = COLSTEP * Math.sqrt(3)/1.5;
  const hexes = clusters.map(c=>({ col:Math.round((c.x-x0)/COLSTEP), x:c.x, y:c.y, ...classify(c) }));
  // choose parity (odd-down vs even-down) + y0 by minimum residual
  let best=null;
  for (const parity of [0,1]){
    const y0 = Math.min(...hexes.map(h=>h.y - (h.col%2===parity?0.5:0)*ROWSTEP));
    let err=0; const rows=hexes.map(h=>{ const off=(h.col%2===parity?0.5:0); const rf=(h.y-y0)/ROWSTEP-off; err+=Math.abs(rf-Math.round(rf)); return Math.round(rf); });
    if (!best||err<best.err) best={parity,y0,rows,err,COLSTEP,ROWSTEP};
  }
  hexes.forEach((h,i)=>h.row=best.rows[i]);
  return { hexes, x0, y0:best.y0, COLSTEP, ROWSTEP, parity:best.parity };
}

const p1 = assign(clusterPage(1));
const p2 = assign(clusterPage(2), p1.COLSTEP);
// stitch page2 (gulf strip) beneath page1: both leftmost columns are col 0; stack rows below.
const p1maxRow = Math.max(...p1.hexes.map(h=>h.row));
const p2minRow = Math.min(...p2.hexes.map(h=>h.row));
for (const h of p2.hexes){ h.row = h.row - p2minRow + p1maxRow + 1; }
console.log('geometry: colStep', p1.COLSTEP.toFixed(2), 'parity', p1.parity, '| p1 hexes', p1.hexes.length, 'p2', p2.hexes.length);

const all = [...p1.hexes, ...p2.hexes];
// collision check
const seen={}; let collisions=0;
for (const h of all){ const k=h.col+','+h.row; if(seen[k]){ collisions++; if(collisions<=8) console.log('COLLISION at',k,':',seen[k].t,seen[k].name||'',' vs ',h.t,h.name||''); } seen[k]=h; }
console.log('collisions:', collisions);
const maxCol = Math.max(...all.map(h=>h.col)), maxRow=Math.max(...all.map(h=>h.row));
const minCol = Math.min(...all.map(h=>h.col)), minRow=Math.min(...all.map(h=>h.row));

// ASCII grid for verification (shift so min is 0)
const grid = {};
for (const h of all){ const c=h.col-minCol, r=h.row-minRow; const key=c+','+r;
  grid[key] = h.t==='C' ? (h.name?('['+h.name.slice(0,3)+']'):'[?'+h.raw.slice(0,4)+']') : h.t; }
let ascii='';
for (let r=0;r<=maxRow-minRow;r++){ let line=String(r).padStart(2)+' ';
  for (let c=0;c<=maxCol-minCol;c++){ const v=grid[c+','+r]; line += (v? v.padEnd(6).slice(0,6) : '  .   ').slice(0,6); }
  ascii+=line+'\n'; }
console.log('cols', maxCol-minCol+1, 'rows', maxRow-minRow+1, 'hexes', all.length);
console.log(ascii);

// dump normalized hex list
const norm = all.map(h=>({ col:h.col-minCol, row:h.row-minRow, t:h.t, name:h.name||null, raw:h.raw||null }));
const unmatched = norm.filter(h=>h.t==='C'&&!h.name);
console.log('city hexes:', norm.filter(h=>h.t==='C').length, 'unmatched:', unmatched.length, unmatched.map(h=>h.raw));

// disambiguate the two "Charleston" hexes by row: upper = Charlestown (WV, 2/1), lower = Charleston (SC, 3/2)
const chas = norm.filter(h=>h.name==='Charleston'||h.name==='Charlestown').sort((a,b)=>a.row-b.row);
if (chas.length===2){ chas[0].name='Charlestown'; chas[1].name='Charleston'; }

// coverage report
const placed = new Set(norm.filter(h=>h.name).map(h=>h.name));
const missing = Object.keys(CITY_VALUES).filter(n=>!placed.has(n));
const dupes = {}; norm.filter(h=>h.name).forEach(h=>dupes[h.name]=(dupes[h.name]||0)+1);
console.log('cities placed:', placed.size, '/', Object.keys(CITY_VALUES).length);
console.log('MISSING:', missing);
console.log('DUPLICATES:', Object.entries(dupes).filter(([,n])=>n>1));

// build explicit cell map — cities always win their cell over colliding terrain
const cells = {};
for (const h of norm){ if (h.t==='C' && h.name){ const [full,shared]=CITY_VALUES[h.name]; cells[h.col+','+h.row]={t:'C',name:h.name,full,shared}; } }
for (const h of norm){ const k=h.col+','+h.row; if (h.t!=='C' && !cells[k]) cells[k]={t:h.t}; }
const cols=maxCol-minCol+1, rows=maxRow-minRow+1;
writeFileSync(SCRATCH+'/board-data.json', JSON.stringify({cols,rows,cells}));
console.log('wrote board-data.json —', Object.keys(cells).length, 'cells');
