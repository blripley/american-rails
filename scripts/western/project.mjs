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
// RESCALED (3rd pass, board-rework-2). The 2nd pass (see
// docs/western-canada-board-rescale-final.md) fixed the dead connection-bonus
// mechanic by compressing the grid to 24x20 at HEX=40. This 3rd pass removes
// Vancouver Island entirely (Ben's direct feedback after playing the board:
// the island crossing didn't fit well and wasn't worth keeping) and shrinks
// the hex tile itself, which was visibly too big and spilling past the frame
// edge at HEX=40 (24 cols * HEX*sqrt(3) + OX = 1722.8, already over the
// 1700-wide frame before any margin). Two independent, additive fixes:
//   1. Rows drop from 20 to 18: the old rows 18-19 existed ONLY as a buffer
//      so the island cluster had room south of the mainland (see the prior
//      version of this comment, in git history) — with the island gone,
//      every remaining city still sits in rows 0-17, so the buffer is
//      deleted outright rather than left as dead space.
//   2. HEX drops from 40 to 38, sized to fit 24 cols inside 1700px with a
//      real margin, computed (not copied from the Canadian board's 34,
//      which is a different cols/rows count): 24*38*sqrt(3)+60 = 1639.6,
//      leaving ~60px on the right — the same as the left margin (OX=60),
//      not just "barely fits". At rows=18, the vertical footprint is only
//      60+18*38*1.5 = 1086px against a 1400px-tall frame — this board reads
//      as a long, narrow east-west band with a lot of open parchment below
//      it, which is exactly where the panels (see make-board-svg.mjs) live.
// cols/rowsPerDegLat/lon-lat bounds are UNCHANGED from the 2nd pass, so every
// mainland city's projected column and row (and therefore every previously-
// measured hex distance, including Winnipeg-Calgary-Vancouver) is identical
// to before — this pass only removes the island rows and shrinks the tile.
//
// Isotropic scaling (equal km per hex step in every direction) is what the
// American and Canadian boards use. It does NOT work here: this board's real
// city footprint spans ~28 degrees of longitude but only ~5.1 degrees of
// latitude (was Victoria 48.43N to Edmonton 53.55N; now Batoche 52.72N to
// Edmonton 53.55N, still a long, narrow east-west corridor with almost no
// north-south depth). An isotropic scale set from the longitude spread would
// crush every prairie town into a handful of rows. So, deliberately, like
// the Canadian board's own 29% non-isotropic latitude stretch (done for the
// same reason: pulling a crowded shore apart), this projection stretches
// latitude — about 2x the isotropic rate at this latitude band — purely so
// prairie towns that sit within a few tenths of a degree of each other
// (Fort Qu'Appelle/Qu'Appelle Station, Golden/Field, Winnipeg/St. Boniface)
// land in distinguishable rows instead of the same one.
export const HEX = 38;
export const OX = 60, OY = 85;
// OY bumped 60->85 (2026-08-24, Ben's play feedback): at OY=60 a pointy-top
// hex's top vertex (row 0 center - HEX = 60-38 = 22) reached above the printed
// column-ruler strip's bottom edge (~34), visibly covering the "31-34" column
// numbers behind Victoria Settlement's hex. At OY=85 the top vertex sits at
// 47, comfortably clear.

export const PROJ = {
  lonLeft: -124.4,   // col 0  — west of the BC coast (unchanged bounds)
  lonRight: -96.4,   // col 23 — east of Selkirk, Manitoba (unchanged bounds)
  latTop: 54.3,      // row 0  — north of Edmonton (unchanged bounds)
  cols: 24,
  rows: 18,
  // 18 rows, 0-17: every remaining city sits in this range now that
  // Vancouver Island (and the 2-row buffer it needed) is gone. Isotropic
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
