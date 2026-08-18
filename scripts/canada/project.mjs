// Project real 1851 city coordinates onto the American Rails hex grid.
// Pointy-top odd-r, R=41, origin (120,97) — identical geometry to the US board,
// so every downstream renderer and the game engine need no change.
//
//   node scripts/canada/project.mjs            # table of col,row per city
//   node scripts/canada/project.mjs --collide  # only the clashes
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// the project path contains a space, so decode properly rather than slicing the URL
export const HERE = path.dirname(fileURLToPath(import.meta.url));

// --- projection ------------------------------------------------------------
// Isotropic: one hex step is the same distance in every direction, so km/px must
// be constant. Latitude sets the scale; longitude then falls where it falls.
// Hex radius 34, not the American board's 41. Same 1700x1400 frame, but the
// smaller tile fits a 26x22 grid instead of 22x18 — 44% more cells, in both
// directions. The east-west gain is the point: Detroit/Windsor/Chatham/Buffalo
// and the Lake Ontario shore are crowded across columns, which no amount of
// vertical stretch can fix.
export const HEX = 34;
export const OX = 99, OY = 84;

export const PROJ = {
  lonLeft: -84.45,   // col 0  — Sault Ste. Marie / Lake Superior
  lonRight: -59.95,  // col 25 — Sydney, Cape Breton
  latTop: 48.95,     // row 0  — tip of Gaspé / the Saguenay
  cols: 26,
  rows: 22,
  // Isotropic would be 1.664 rows/deg at this tile size. We stretch to 2.15 —
  // the land band is much wider than it is tall, so there is vertical room to
  // spend, and spending it pulls the Lake Ontario shore and the Golden
  // Horseshoe apart. The map therefore reads ~29% taller than it truly is.
  rowsPerDegLat: 2.15,
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
