// Work out how to stop cities touching.
//
//   node scripts/canada/space-cities.mjs          # report only
//   node scripts/canada/space-cities.mjs --apply  # write nudges/cuts to cities.json
//
// The American board has ZERO adjacent city pairs — every city is surrounded
// entirely by terrain you have to pay to cross. That is a load-bearing rule, not
// an accident: city tiles are cheap and multi-cube, so a chain of touching
// cities is a free conveyor of income.
//
// Strategy, in order of preference:
//   1. MOVE the town to a nearby land tile that has no city neighbour. A one-tile
//      shift is the same licence already used to resolve projection clashes, so
//      the map stays honest.
//   2. CUT it, lowest 1851 population first.
// Big towns are placed first and never displaced by small ones.
import fs from 'node:fs';
import path from 'node:path';
import { HERE } from './project.mjs';

const map = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'canada-board-data.json'), 'utf8'));
const cityFile = path.join(HERE, 'cities.json');
const cityDoc = JSON.parse(fs.readFileSync(cityFile, 'utf8'));

const key = (c, r) => `${c},${r}`;
const nb = (c, r) => {
  const odd = (r & 1) === 1;
  const d = odd ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]
                : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
  return d.map(([a, b]) => key(c + a, r + b));
};

// every land tile, and which are currently cities
const land = new Map(map.cells.map(c => [key(c.col, c.row), c]));
const meta = new Map(cityDoc.cities.map(c => [c.name, c]));

// Biggest first — a large town claims its tile and never yields to a small one.
const ranked = map.cells.filter(c => c.city)
  .map(c => ({ ...c, pop: meta.get(c.city)?.pop1851 ?? 0 }))
  .sort((a, b) => b.pop - a.pop);

const placed = new Map();               // key -> name
const free = k => land.has(k) && !placed.has(k) && !nb(...k.split(',').map(Number)).some(n => placed.has(n));

const moved = [], cut = [], kept = [];
for (const c of ranked) {
  const home = key(c.col, c.row);
  if (free(home)) { placed.set(home, c.city); kept.push(c); continue; }

  // ONE tile only. Two tiles is enough to put Sherbrooke in the New Brunswick
  // highlands and Brantford on Georgian Bay — past the point where the map is
  // still telling the truth. If one tile cannot solve it, the town is cut.
  const spot = nb(c.col, c.row).find(free);

  if (spot) {
    const [nc, nr] = spot.split(',').map(Number);
    placed.set(spot, c.city);
    moved.push({ ...c, to: [nc, nr], d: [nc - c.col, nr - c.row] });
  } else {
    cut.push(c);
  }
}

const total = kept.length + moved.length;
console.log(`kept in place ${kept.length} · moved ${moved.length} · cut ${cut.length}  ->  ${total} cities`);
console.log(`density ${(total / map.summary.tiles * 100).toFixed(1)}%  (American board 18.1%)\n`);

console.log('MOVED (one or two tiles, to a spot with no city neighbour)');
for (const m of moved.sort((a, b) => b.pop - a.pop))
  console.log(`  ${m.city.padEnd(18)} ${String(m.pop).padStart(6)}   ${m.col},${m.row} -> ${m.to[0]},${m.to[1]}`);

console.log('\nCUT (no free tile within two hexes)');
for (const c of cut.sort((a, b) => b.pop - a.pop))
  console.log(`  ${c.city.padEnd(18)} ${String(c.pop).padStart(6)}   ${meta.get(c.city)?.note?.slice(0, 60) ?? ''}`);

if (process.argv.includes('--apply')) {
  const cutNames = new Set(cut.map(c => c.city));
  cityDoc.cities = cityDoc.cities.filter(c => !cutNames.has(c.name));
  for (const m of moved) {
    const c = meta.get(m.city);
    const base = c.nudge ?? [0, 0];
    c.nudge = [base[0] + m.d[0], base[1] + m.d[1]];
    c.nudgeWhy = (c.nudgeWhy ? c.nudgeWhy + '; ' : '') + 'shifted so no two cities touch';
  }
  fs.writeFileSync(cityFile, JSON.stringify(cityDoc, null, 2) + '\n');
  console.log(`\napplied: ${cityDoc.cities.length} cities remain in cities.json`);
  console.log('now edit terrain.json so the C marks match, then re-run build-map.mjs');
}
