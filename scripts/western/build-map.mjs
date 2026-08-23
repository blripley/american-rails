// Build (and validate) the Western Canada map data from cities.json + terrain.json.
//
//   node scripts/western/build-map.mjs
//
// Emits scripts/western/out/western-board-data.json, in the same shape as the
// American board's board-data.json so the same renderers and the same handoff
// bundle format work unchanged. Exits non-zero if the map fails validation.
import fs from 'node:fs';
import path from 'node:path';
import { project, hexPixel, HERE, HEX, OX, OY, HW, RP, PROJ } from './project.mjs';

const read = f => JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));
const { cities } = read('cities.json');
const { grid, legend, regions } = read('terrain.json');

const id = (c, r) => `${c},${r}`;

// pointy-top odd-r — must stay identical to neighborCoords() in index.html
function neighbours(c, r) {
  const odd = (r & 1) === 1;
  const dirs = odd ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]
                   : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
  return dirs.map(([dc, dr]) => id(c + dc, r + dr));
}

const problems = [];
const fail = m => problems.push(m);

// ---- 1. project the cities -------------------------------------------------
const cityAt = new Map();
for (const c of cities) {
  const p = project(c.lat, c.lon, c.nudge);
  const key = id(p.col, p.row);
  if (cityAt.has(key)) fail(`two cities land on ${key}: ${cityAt.get(key).name} and ${c.name}`);
  cityAt.set(key, { ...c, col: p.col, row: p.row });
}

// city names are the engine's primary key (cityHexByName), so they must be unique
const byName = new Map();
for (const c of cities) {
  if (byName.has(c.name)) fail(`duplicate city name "${c.name}" — the engine looks cities up by name`);
  byName.set(c.name, c);
}

// ---- 2. reconcile the grid against the cities ------------------------------
const cells = {};
grid.forEach((line, row) => {
  if (line.length !== PROJ.cols) fail(`grid row ${row} is ${line.length} chars, expected ${PROJ.cols}`);
  [...line].forEach((ch, col) => {
    if (!(ch in legend)) fail(`grid row ${row} col ${col}: unknown terrain "${ch}"`);
    if (ch === 'O') {
      if (cityAt.has(id(col, row))) fail(`${cityAt.get(id(col, row)).name} sits on an off-map tile at ${col},${row}`);
      return;
    }
    // The grid supplies BASE terrain only. Cities are stamped on afterwards from
    // cities.json, so moving or cutting a town never desyncs the two files.
    // 'C' just means "land under a town", which reverts to plains if the town goes.
    const cell = { col, row, ...hexPixel(col, row) };
    cell.terrain = { P: 'plains', F: 'forest', M: 'mountain', C: 'plains' }[ch];
    cells[id(col, row)] = cell;
  });
});

for (const [k, c] of cityAt) {
  const cell = cells[k];
  if (!cell) { fail(`${c.name} projects to ${k}, which is off-map`); continue; }
  Object.assign(cell, { terrain: 'city', city: c.name, value: `${c.full}/${c.shared}`, full: c.full, shared: c.shared });
  if (c.hub) cell.port = true;
  if (c.special) cell.start = true;
}

// ---- 3. connectivity -------------------------------------------------------
const ids = Object.keys(cells);
if (ids.length) {
  const seen = new Set([ids[0]]);
  const queue = [ids[0]];
  while (queue.length) {
    const cur = queue.pop();
    const { col, row } = cells[cur];
    for (const n of neighbours(col, row)) if (cells[n] && !seen.has(n)) { seen.add(n); queue.push(n); }
  }
  const orphans = ids.filter(i => !seen.has(i));
  if (orphans.length) fail(`${orphans.length} tile(s) unreachable from the main landmass: ${orphans.map(o => cells[o].city || o).join(', ')}`);
}
for (const [key, cell] of Object.entries(cells)) {
  if (!neighbours(cell.col, cell.row).some(n => cells[n])) fail(`${cell.city || key} has no neighbours at all`);
}

// ---- 4. balance ------------------------------------------------------------
const cityCells = Object.values(cells).filter(c => c.terrain === 'city');
const counts = Object.values(cells).reduce((a, c) => (a[c.terrain] = (a[c.terrain] || 0) + 1, a), {});
const totalFull = cityCells.reduce((n, c) => n + c.full, 0);
const totalShared = cityCells.reduce((n, c) => n + c.shared, 0);
const hubs = cityCells.filter(c => c.port).map(c => c.city);
const specials = cityCells.filter(c => c.start).map(c => c.city);
if (hubs.length !== 5) fail(`expected 5 hub ports, found ${hubs.length}: ${hubs.join(', ')}`);
if (specials.length !== 3) fail(`expected 3 special-connection cities, found ${specials.length}: ${specials.join(', ')}`);

// No two cities may touch. The American board has ZERO adjacent city pairs, and
// it matters for more than looks: city tiles are cheap and hold several cubes,
// so a chain of touching cities is a free conveyor of income. Every city must be
// reachable only through terrain somebody paid to cross.
const touching = [];
for (const cell of cityCells)
  for (const n of neighbours(cell.col, cell.row))
    if (cells[n]?.city && cells[n].city < cell.city) touching.push(`${cells[n].city} + ${cell.city}`);
if (touching.length) fail(`${touching.length} pair(s) of cities are adjacent: ${touching.join(', ')}`);

// ---- 5. report + emit ------------------------------------------------------
console.log('Western Canada (CPR, 1881-87) — map build');
console.log('  tiles      ', Object.keys(cells).length, JSON.stringify(counts));
console.log('  cities     ', cityCells.length, `| total full ${totalFull}, shared ${totalShared}`);
console.log('  hubs       ', hubs.join(', '));
console.log('  specials   ', specials.join(', '));

const out = {
  board: { width: 1700, height: 1400, note: 'Western Canada, CPR 1881-87. Same frame, geometry and scoring track as the American board; only the map field, city furniture, labels, title and panel positions differ.' },
  hexGrid: { orientation: 'pointy-top odd-r', radius: HEX, horizontalSpacing: +HW.toFixed(4), rowSpacing: RP, origin: { x: OX, y: OY }, cols: PROJ.cols, rows: PROJ.rows,
             formula: `x = ${OX} + col*${HW.toFixed(4)} + (row&1)*${(HW/2).toFixed(4)} ;  y = ${OY} + row*${RP}`,
             note: `Radius ${HEX}, not the American board's 41. Pieces and city type scale by ${(HEX / 41).toFixed(4)}.` },
  terrainCost: { plains: '$2 + $2 per cube already in the hex', city: '$2 + $2 per cube already in the hex', forest: '$3, one cube only', mountain: '$5, one cube only' },
  grid, gridLegend: legend, regions,
  cells: Object.values(cells).sort((a, b) => a.row - b.row || a.col - b.col),
  cities: cities.map(c => { const p = project(c.lat, c.lon, c.nudge); return { ...c, col: p.col, row: p.row }; }),
  hubs, specials,
  specialPairs: [[specials[0], specials[1]], [specials[0], specials[2]], [specials[1], specials[2]]],
  years: [1881, 1882, 1883, 1884, 1885, 1886, 1887],
  summary: { tiles: Object.keys(cells).length, ...counts, totalFullValue: totalFull, totalSharedValue: totalShared },
};
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'western-board-data.json'), JSON.stringify(out, null, 2) + '\n');
console.log('\nwrote scripts/western/out/western-board-data.json');

if (problems.length) {
  console.error('\nFAILED:');
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log('  validation  OK — connected, named uniquely, 5 hubs, 3 specials, no two cities touching');
