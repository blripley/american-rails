// One-off generator that builds terrain.json's grid from a hand-specified route
// network + region rules. Not part of the reusable pipeline (cities.json and
// terrain.json are the checked-in, hand-authored artifacts downstream scripts
// read) — this just produces the ASCII grid once so it doesn't have to be
// typed out by hand across ~1300 cells. Safe to delete after terrain.json is
// written and reviewed.
import fs from 'node:fs';
import path from 'node:path';
import { project, HERE, PROJ } from './project.mjs';

const { cities } = JSON.parse(fs.readFileSync(path.join(HERE, 'cities.json'), 'utf8'));
const byName = new Map(cities.map(c => [c.name, { ...c, ...project(c.lat, c.lon, c.nudge) }]));

// ---- hex line drawing (cube coords, odd-r offset, matches neighborCoords()) --
const oddrToCube = (col, row) => { const x = col - (row - (row & 1)) / 2, z = row; return { x, y: -x - z, z }; };
const cubeToOddr = (c) => ({ col: c.x + (c.z - (c.z & 1)) / 2, row: c.z });
const cubeRound = (c) => {
  let rx = Math.round(c.x), ry = Math.round(c.y), rz = Math.round(c.z);
  const dx = Math.abs(rx - c.x), dy = Math.abs(ry - c.y), dz = Math.abs(rz - c.z);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return { x: rx, y: ry, z: rz };
};
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
function hexLine(colA, rowA, colB, rowB) {
  const a = oddrToCube(colA, rowA), b = oddrToCube(colB, rowB);
  const N = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
  const out = [];
  for (let i = 0; i <= N; i++) { const t = N === 0 ? 0 : i / N; out.push(cubeToOddr(cubeRound(lerp(a, b, t)))); }
  return out;
}
function neighbours(col, row) {
  const odd = (row & 1) === 1;
  const dirs = odd ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]
                   : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
  return dirs.map(([dc, dr]) => [col + dc, row + dr]);
}

// ---- the route network ------------------------------------------------------
// Mirrors the real CPR mainline plus its branches (colonization railways /
// contractor sections per the research doc): a west-east prairie spine,
// the mountain chokepoint, the Lower Mainland cluster, the Vancouver Island
// crossing, and the Battleford/Prince Albert/Edmonton northern arc.
const EDGES = [
  ['Victoria', 'Esquimalt'], ['Victoria', 'Nanaimo'],
  ['Nanaimo', 'Vancouver'],                                    // the water-gap crossing — see BRIDGE below
  ['Vancouver', 'Port Moody'], ['Vancouver', 'New Westminster'], ['Port Moody', 'New Westminster'],
  ['Vancouver', 'Yale'], ['Yale', 'Kamloops'], ['Kamloops', 'Revelstoke'],
  ['Revelstoke', 'Golden'], ['Golden', 'Field'], ['Field', 'Banff'], ['Banff', 'Cochrane'], ['Cochrane', 'Calgary'],
  ['Calgary', 'Gleichen'], ['Gleichen', 'Medicine Hat'], ['Medicine Hat', 'Maple Creek'],
  ['Maple Creek', 'Swift Current'], ['Swift Current', 'Moose Jaw'], ['Moose Jaw', 'Regina'],
  ['Regina', 'Indian Head'], ['Indian Head', "Qu'Appelle Station"], ["Qu'Appelle Station", "Fort Qu'Appelle"],
  ['Regina', 'Brandon'], ['Brandon', 'Portage la Prairie'], ['Portage la Prairie', 'Winnipeg'],
  ['Winnipeg', 'St. Boniface'], ['Winnipeg', 'Selkirk'], ['Winnipeg', 'Emerson'],
  ['Calgary', 'Fort Macleod'], ['Fort Macleod', 'Lethbridge'],
  ['Calgary', 'Edmonton'], ['Edmonton', 'Battleford'], ['Battleford', 'Prince Albert'], ['Prince Albert', 'Regina'],
];
const BRIDGE = new Set(['Nanaimo|Vancouver', 'Vancouver|Nanaimo']);

const land = new Set();  // "col,row" already marked as land
const add = (c, r) => land.add(`${c},${r}`);

for (const [a, b] of EDGES) {
  const A = byName.get(a), B = byName.get(b);
  if (!A || !B) throw new Error('unknown city in EDGES: ' + a + '/' + b);
  const line = hexLine(A.col, A.row, B.col, B.row);
  const isBridge = BRIDGE.has(`${a}|${b}`);
  for (const { col, row } of line) {
    add(col, row);
    if (!isBridge) for (const [nc, nr] of neighbours(col, row)) add(nc, nr);
  }
}
// every city itself, regardless of route padding
for (const c of byName.values()) add(c.col, c.row);

// ---- terrain typing ---------------------------------------------------------
// Region rules per docs/western-canada-board-research.md §4: prairie
// dominant east of Calgary; a mountain belt through the Rockies/Selkirks
// (Banff-Field-Golden-Revelstoke-Kamloops-Yale corridor); boreal forest in
// the north (the Edmonton/Battleford/Prince Albert arc, rows 0-9); BC
// interior plateau and coastal lowlands; Vancouver Island as its own
// mixed plains/forest landmass.
function terrainFor(col, row) {
  if (row <= 9) return 'F';                                    // northern boreal arc
  if (row >= 25 && col <= 7) return (row <= 28 ? 'P' : 'F');    // Vancouver Island
  if (row >= 19 && row <= 25 && col <= 7) return 'P';           // Lower Mainland / Fraser lowlands
  if (col <= 19 && row >= 10 && row <= 19) return 'M';          // Rockies/Selkirks + Fraser Canyon + interior plateau edge
  return 'P';                                                   // prairie
}

const cityAt = new Set([...byName.values()].map(c => `${c.col},${c.row}`));
const grid = [];
for (let r = 0; r < PROJ.rows; r++) {
  let line = '';
  for (let c = 0; c < PROJ.cols; c++) {
    const k = `${c},${r}`;
    if (!land.has(k)) { line += 'O'; continue; }
    line += cityAt.has(k) ? 'C' : terrainFor(c, r);
  }
  grid.push(line);
}

const counts = {};
for (const l of grid) for (const ch of l) counts[ch] = (counts[ch] || 0) + 1;
console.log('terrain counts', counts, 'total land', Object.entries(counts).filter(([k]) => k !== 'O').reduce((n, [, v]) => n + v, 0));

fs.writeFileSync(path.join(HERE, 'terrain-grid.json'), JSON.stringify(grid, null, 2));
console.log('wrote scripts/western/terrain-grid.json (grid array only — spliced into terrain.json by hand)');
