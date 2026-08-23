import fs from 'node:fs';
import path from 'node:path';
import { project, HERE } from './project.mjs';

const { cities } = JSON.parse(fs.readFileSync(path.join(HERE, 'cities.json'), 'utf8'));

function neighbours(c, r) {
  const odd = (r & 1) === 1;
  const dirs = odd ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]
                   : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
  return dirs.map(([dc, dr]) => `${c + dc},${r + dr}`);
}

const placed = cities.map(c => {
  const p = project(c.lat, c.lon, c.nudge);
  return { name: c.name, col: p.col, row: p.row, key: `${p.col},${p.row}` };
});

const byKey = new Map();
for (const c of placed) { if (!byKey.has(c.key)) byKey.set(c.key, []); byKey.get(c.key).push(c.name); }
for (const [k, ns] of byKey) if (ns.length > 1) console.log('CLASH', k, ns.join(' + '));

const seenPairs = new Set();
for (let i = 0; i < placed.length; i++) {
  const a = placed[i];
  const nb = new Set(neighbours(a.col, a.row));
  for (let j = 0; j < placed.length; j++) {
    if (i === j) continue;
    const b = placed[j];
    if (nb.has(b.key)) {
      const pair = [a.name, b.name].sort().join('|');
      if (!seenPairs.has(pair)) { seenPairs.add(pair); console.log('ADJACENT', a.name, a.key, '<->', b.name, b.key); }
    }
  }
}
console.log('done. total cities', placed.length);
