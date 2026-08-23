// Project real 1881-87 city coordinates onto the American Rails hex grid.
// Pointy-top odd-r, same formula as the American/Canadian boards, so every
// downstream renderer and the game engine need no change.
//
//   node scripts/western/project.mjs            # table of col,row per city
//   node scripts/western/project.mjs --collide  # only the clashes
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// the project path contains a space, so decode properly rather than slicing the URL
export const HERE = path.dirname(fileURLToPath(import.meta.url));

// --- projection ------------------------------------------------------------
// RESCALED (2nd pass) from the original 40x34 grid. The original board's own
// balance measurement (docs/western-canada-board-balance-measurement.md)
// found the connection-bonus mechanic completely dead — 0 of 16 games —
// because Winnipeg/Calgary/Vancouver sat 17-43 hexes apart, more than double
// the other two boards' working legs (8-11 hexes). A grid-rescale spike
// (docs/western-canada-rescale-prototype.md) proved that compressing the
// same real lon/lat footprint onto far fewer grid cells fixes this (Calgary-
// Vancouver 17 -> ~10 hexes) without changing which real-world area the
// board covers. This is that fix, promoted from spike to the real board,
// with the nudges and terrain re-done properly (see
// docs/western-canada-board-rescale-final.md) rather than the spike's
// admittedly-blunt versions of both.
//
// Isotropic scaling (equal km per hex step in every direction) is what the
// American and Canadian boards use. It does NOT work here: this board's real
// city footprint spans ~28 degrees of longitude but only ~5.1 degrees of
// latitude (Victoria 48.43N to Edmonton 53.55N) — the CPR mainline is a long,
// narrow east-west corridor with almost no north-south depth outside the
// Vancouver Island detour. An isotropic scale set from the longitude spread
// would crush every prairie town into a handful of rows. So, deliberately,
// like the Canadian board's own 29% non-isotropic latitude stretch (done for
// the same reason: pulling a crowded shore apart), this projection stretches
// latitude — about 2x the isotropic rate at this latitude band — purely so
// prairie towns that sit within a few tenths of a degree of each other
// (Fort Qu'Appelle/Qu'Appelle Station, Golden/Field, Winnipeg/St. Boniface,
// Victoria/Esquimalt) land in distinguishable rows instead of the same one.
export const HEX = 40;
export const OX = 60, OY = 60;

export const PROJ = {
  lonLeft: -124.4,   // col 0  — west of Nanaimo, Vancouver Island (unchanged bounds)
  lonRight: -96.4,   // col 23 — east of Selkirk, Manitoba (unchanged bounds)
  latTop: 54.3,      // row 0  — north of Edmonton (unchanged bounds)
  cols: 24,
  rows: 20,
  // 20 rows: 18 of them (0-17) hold every mainland city at this stretch
  // factor; rows 18-19 are a deliberate buffer that exists ONLY to give the
  // Vancouver Island cluster (Nanaimo/Victoria/Esquimalt) room to sit south
  // of the mainland cluster with a real off-map water gap between them —
  // see terrain.json's "Vancouver Island water gap" region note. Isotropic
  // would be roughly 0.9 rows/deg at this longitude spread and latitude
  // band; settled rows use 2.9 rows/deg.
  rowsPerDegLat: 2.9,
};

export function project(lat, lon, nudge) {
  const colsPerDegLon = (PROJ.cols - 1) / (PROJ.lonRight - PROJ.lonLeft);
  const colF = (lon - PROJ.lonLeft) * colsPerDegLon;
  const rowF = (PROJ.latTop - lat) * PROJ.rowsPerDegLat;
  // odd-r: odd rows are shifted right by half a hex, so undo that before rounding
  let row = Math.round(rowF);
  let col = Math.round(colF - (row & 1) * 0.5);
  if (nudge) { col += nudge[0]; row += nudge[1]; }
  return { col, row, colF, rowF };
}

export const HW = HEX * Math.sqrt(3), RP = HEX * 1.5;
export const hexPixel = (c, r) => ({ x: +(OX + c * HW + (r & 1) * HW / 2).toFixed(1), y: +(OY + r * RP).toFixed(1) });

// --- report ----------------------------------------------------------------
if (process.argv[1] && process.argv[1].endsWith('project.mjs')) {
  const { cities } = JSON.parse(fs.readFileSync(path.join(HERE, 'cities.json'), 'utf8'));
  const seen = new Map();
  const rows = cities.map(c => {
    const p = project(c.lat, c.lon, c.nudge);
    const key = `${p.col},${p.row}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(c.name);
    return { ...c, ...p, key };
  });

  const onlyCollide = process.argv.includes('--collide');
  const clashes = [...seen.entries()].filter(([, ns]) => ns.length > 1);

  if (!onlyCollide) {
    rows.sort((a, b) => a.row - b.row || a.col - b.col);
    console.log('col row  region  city                 full/shared  drift');
    for (const r of rows) {
      const drift = Math.hypot(r.colF - (r.col + (r.row & 1) * 0.5), r.rowF - r.row).toFixed(2);
      console.log(
        String(r.col).padStart(3), String(r.row).padStart(3), ' ',
        r.region.padEnd(4), r.name.padEnd(20),
        `${r.full}/${r.shared}`.padStart(5), '      ', drift,
        clashes.some(([k]) => k === r.key) ? '  <-- CLASH' : ''
      );
    }
    console.log(`\n${rows.length} cities, cols ${Math.min(...rows.map(r => r.col))}-${Math.max(...rows.map(r => r.col))}, rows ${Math.min(...rows.map(r => r.row))}-${Math.max(...rows.map(r => r.row))}`);
    console.log('total full value:', rows.reduce((n, r) => n + r.full, 0), ' total shared:', rows.reduce((n, r) => n + r.shared, 0));
  }
  if (clashes.length) {
    console.log('\nCLASHES (two cities on one hex — nudge one in cities.json via "nudge":[dc,dr]):');
    for (const [k, ns] of clashes) console.log('  ', k, ns.join(' + '));
  } else console.log('\nno clashes');
}
