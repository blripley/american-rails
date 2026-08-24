// Draft the Western Canada (CPR, 1881-87) board SVG.
//
//   node scripts/western/make-board-svg.mjs
//
// Same approach as scripts/canada/make-board-svg.mjs: lift the American
// board's <defs> — the parchment and terrain patterns, the four hex tiles,
// the skyline, port marker, rail ties and every action icon — and its frame,
// scoring track and printed panels VERBATIM, then regenerate only what is
// map-specific: the hex field, the city furniture, the water/region labels,
// the title and the panel positions.
import fs from 'node:fs';
import path from 'node:path';
import { HERE } from './project.mjs';

const ROOT = path.resolve(HERE, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const american = src.match(/<template id="tpl-board">([\s\S]*?)<\/template>/)[1];
const L = american.split('\n');
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'western-board-data.json'), 'utf8'));

// ---------------------------------------------------------------- section cuts
const find = (pred, from = 0) => { for (let i = from; i < L.length; i++) if (pred(L[i], i)) return i; throw new Error('section not found'); };
const has = s => l => l.includes(s);

function groupEnd(start) {
  let depth = 0;
  for (let i = start; i < L.length; i++) {
    depth += (L[i].match(/<g[ >]/g) || []).length - (L[i].match(/<\/g>/g) || []).length;
    if (i > start || depth > 0) if (depth === 0) return i;
  }
  throw new Error('unclosed group at line ' + start);
}

const iDefsEnd   = find(has('</defs>'));
const iLand      = find(has('<g filter="url(#landShadow)">'));
const iFurn      = find(l => l.trim() === '<g>', groupEnd(iLand) + 1);
const iSupply    = find(has('<g stroke="#3d2e1d" fill="none">'), groupEnd(iFurn));
const iSupplyEnd = groupEnd(iSupply);
const iAction    = find(has('<g transform="translate(1250,556)">'));
const iActionEnd = groupEnd(iAction);
const iYear      = find(has('<g transform="translate(1100,1046)">'));
const iYearEnd   = groupEnd(iYear);
const iLegend    = find(has('<g transform="translate(660,1034)">'));
const iLegendEnd = groupEnd(iLegend);
const iPlates    = find(has('<g transform="translate(28,1252)">'));
const iLabels    = find(has('font-style="italic" font-size="18"'));

const slice = (a, b) => L.slice(a, b + 1).join('\n');

// ------------------------------------------------------------------- geometry
// The tile art in <defs> is drawn at radius 41. This map uses 38 (board-
// rework-2; was 40, which spilled tiles past the frame edge — see
// project.mjs's header comment for the exact margin math and why 38 fits
// cleanly). Close to, but independently computed from, the Canadian board's
// 34 — this board has fewer columns (24 vs 26) but each one spans a much
// wider real-world longitude slice, so the two boards' hex sizes land in
// the same neighbourhood without being the same number.
const S = map.hexGrid.radius / 41;
const { origin, horizontalSpacing: HW, rowSpacing: RP } = map.hexGrid;
const px = (c, r) => ({
  x: +((origin.x + c * HW + (r & 1) * HW / 2) / S).toFixed(2),
  y: +((origin.y + r * RP) / S).toFixed(2),
});
const HXREF = { plains: 'hx-P', forest: 'hx-F', mountain: 'hx-M', city: 'hx-C' };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const GARAMOND = '&#39;EB Garamond&#39;, serif';
const CINZEL = '&#39;Cinzel&#39;,serif';

// This board's names run even longer than the Canadian board's ("Qu'Appelle
// Station", "Portage la Prairie" are both 19 characters) — extend the
// shrink ladder one more step.
function nameSize(n) {
  const len = n.length;
  return len <= 8 ? 13.19 : len <= 10 ? 12.21 : len <= 12 ? 11.41 : len <= 14 ? 10.6
       : len <= 16 ? 9.9 : len <= 18 ? 9.2 : 8.4;
}

// ------------------------------------------------------------------ map field
const cells = map.cells;
const field = cells.map(c => {
  const { x, y } = px(c.col, c.row);
  return `      <use href="#${HXREF[c.terrain]}" x="${x}" y="${y}"></use>`;
}).join('\n');

const cityCells = cells.filter(c => c.terrain === 'city');
const furniture = [
  ...cityCells.map(c => { const { x, y } = px(c.col, c.row); return `      <use href="#skyline" x="${x}" y="${y + 4}"></use>`; }),
  ...cityCells.filter(c => c.start).map(c => { const { x, y } = px(c.col, c.row); return `      <use href="#ties" x="${x}" y="${y + 31}"></use>`; }),
  ...cityCells.filter(c => c.port).map(c => { const { x, y } = px(c.col, c.row); return `      <use href="#portMark" x="${x + 20}" y="${y - 13}"></use>`; }),
].join('\n');

const cityText = [
  ...cityCells.map(c => { const { x, y } = px(c.col, c.row);
    return `  <text x="${x}" y="${(y - 14.32).toFixed(2)}" text-anchor="middle" font-family="${GARAMOND}" font-size="24" font-weight="700" letter-spacing="0.24" fill="#000">${c.value}</text>`; }),
  ...cityCells.map(c => { const { x, y } = px(c.col, c.row); const s = nameSize(c.city);
    return `  <text x="${x}" y="${(y + 14.5 + s * 0.86).toFixed(2)}" text-anchor="middle" font-family="${GARAMOND}" font-size="${s}" font-weight="600" letter-spacing="${(s * 0.0152).toFixed(2)}" fill="#000">${esc(c.city)}</text>`; }),
].join('\n');

// ---------------------------------------------------------------- water labels
const water = (t, x, y, size = 18) => `  <text x="${x}" y="${y}" text-anchor="middle" font-family="&#39;EB Garamond&#39;,serif" font-style="italic" font-size="${size}" letter-spacing="2" fill="#8d6e3e" opacity=".8">${esc(t)}</text>`;
const region = (t, x, y, size = 20, sp = 8) => `  <text x="${x}" y="${y}" text-anchor="middle" font-family="${CINZEL}" font-weight="600" font-size="${size}" letter-spacing="${sp}" fill="#8d6e3e" opacity=".48">${esc(t)}</text>`;
// Craigellachie: the historic Last Spike site (7 Nov 1885), near Eagle Pass
// between Revelstoke and the Rockies — flavour-only, not a cities.json entry
// (see cities.json's own note on why: essentially zero population, ever).
// Placed just north-west of Revelstoke's hex, in open parchment.
// NOTE: this label sits in the `labels` run, which is drawn in TRUE canvas
// pixels (unlike city furniture/text, which lives inside the <g scale(S)>
// groups and uses px() — dividing by S here would misplace it by ~1/S).
const revelstoke = cityCells.find(c => c.city === 'Revelstoke');
const craigellachiePx = {
  x: +(origin.x + (revelstoke.col - 1.5) * HW + (revelstoke.row & 1) * HW / 2).toFixed(1),
  y: +(origin.y + (revelstoke.row - 1.5) * RP).toFixed(1),
};
const labels = [
  region('BRITISH COLUMBIA', 300, 210, 17, 5),
  // Moved 2026-08-24: the OY 60->85 grid shift (fixing the top-border overlap,
  // see project.mjs) pushed row0/row1 hexes down into these labels' old
  // position (x~900, y~90-123) -- confirmed 4 real hex tiles now covered that
  // spot. Re-scanned the terrain grid for a genuinely clear column range: x
  // 800-1010 has land as early as row0 (y<=47, no room at all), but x
  // 960-1210 stays clear until row2 (y<=161) -- moved here, verified against
  // the actual terrain.json data, not guessed.
  region('THE PRAIRIES', 1080, 125, 18, 6),
  region('NORTH-WEST TERRITORIES', 1080, 153, 13, 3),
  // BOARD-REWORK-2: repositioned for the 24x18 grid (HEX 38, was 40/20 rows)
  // -- the coastline sits around row 15 (Vancouver's own row), same as the
  // prior pass, just recomputed for the new pixel scale. Vancouver Island
  // and its label are gone entirely: the island (Victoria/Esquimalt/
  // Nanaimo) was removed from the board in this pass.
  water('Pacific Ocean', 45, 800, 14),
  `  <text x="${craigellachiePx.x}" y="${craigellachiePx.y}" text-anchor="middle" font-family="&#39;EB Garamond&#39;,serif" font-style="italic" font-size="10.5" letter-spacing="0.5" fill="#5d4726" opacity=".85">&#10059; Craigellachie</text>`,
].join('\n');

// --------------------------------------------------------------------- panels
// BOARD-REWORK-2: redesigned from scratch for the new 24x18/HEX-38 grid
// (Ben's feedback: the old panel placement "wasn't looking right" and
// overlay pieces needed to visibly stay inside their printed borders).
// The land's true-pixel bounding box on this grid is x:[93,1607], y:[60,1029]
// (measured directly from western-board-data.json's cells, not eyeballed) --
// two genuinely land-free rectangles exist:
//   1. Top-right corner, x:[1244,1640] y:[0,630] -- nothing east of col 17
//      sits above row 7 (checked cell-by-cell: the boreal arc's forest tops
//      out at col 17, the Qu'Appelle/Winnipeg cluster's northernmost city is
//      row 9). The 384x478 action table fits here with real margin on every
//      side.
//   2. The FULL width below the map, y:[1029,1400] -- with Vancouver Island
//      gone, nothing sits below row 17 at all any more (the old grid's rows
//      18-19 no longer exist), so this band is entirely open, bounded only
//      by the printed company-plates strip starting at y=1252. Year track,
//      legend and house-supply box are laid out side by side here, all
//      top-aligned at y=1060 (30px clear of the land, 60-90px clear of the
//      plates strip depending on each panel's own height).
// - Action table -> [1250, 20] (top-right corner, above every city).
// - Year track -> [60, 1060] (bottom band, left-aligned with the map).
// - Legend -> [616, 1060] (bottom band, centre).
// - House-supply box -> [1016, 1060] (bottom band, right of legend).
const move = (block, dx, dy, scale) =>
  `  <g transform="translate(${dx},${dy})${scale ? ` scale(${scale})` : ''}">\n${block}\n  </g>`;
const retranslate = (block, x, y) => block.replace(/translate\(\d+,\d+\)/, `translate(${x},${y})`);

const titleBlock = [
  `  <g transform="translate(300,110)">`,
  `    <text y="0" text-anchor="middle" font-family="${CINZEL}" font-weight="900" font-size="38" letter-spacing="1" fill="#2b2013">WESTERN CANADA</text>`,
  `    <line x1="-190" y1="14" x2="190" y2="14" stroke="#5d4726" stroke-width="1.6"></line>`,
  `    <text y="38" text-anchor="middle" font-family="&#39;EB Garamond&#39;,serif" font-style="italic" font-size="19" letter-spacing="0.5" fill="#5d4726">The Canadian Pacific Railway, 1881-1887</text>`,
  `    <line x1="-190" y1="50" x2="190" y2="50" stroke="#5d4726" stroke-width="0.9"></line>`,
  `    <text y="66" text-anchor="middle" font-family="${CINZEL}" font-weight="500" font-size="11" letter-spacing="2.6" fill="#5d4726">AFTER TIM HARRISON &#183; ARTWORK ALEXANDRE ROCHE</text>`,
  `  </g>`,
].join('\n');

const compass = `  <g transform="translate(90,330)" opacity=".55">
    <circle r="36" fill="none" stroke="#5d4726" stroke-width="1.2"></circle>
    <circle r="26" fill="none" stroke="#5d4726" stroke-width="0.7"></circle>
    <path d="M0 -34 L8 0 L0 34 L-8 0 Z" fill="#5d4726"></path>
    <path d="M-34 0 L0 -7 L34 0 L0 7 Z" fill="none" stroke="#5d4726" stroke-width="1"></path>
    <text y="-41" text-anchor="middle" font-family="${CINZEL}" font-weight="700" font-size="13" fill="#5d4726">N</text>
  </g>`;

// Repositioned 2026-08-24 (Ben's play feedback), FOUR times — the last move
// (x1=1312,y1=60, chasing a position with zero overlap anywhere) traded the
// top-ruler overlap for covering the board's OTHER numbering: the parchment
// area only extends to x=1656 (not the full 1700px frame), and the gap
// between the nearest hex (right edge ~1277) and where the perimeter's
// 0-99 loop numbers resume on the right (~1608) is only ~330px — less than
// this panel's 384px width. There is NO position in this corner that clears
// hexes, the top ruler, AND the right-side numbering all at once; proved
// this with a full column-by-column scan rather than guessing a 5th time,
// and asked Ben to pick the tradeoff. His call: touch the top ruler, not a
// hex or the right-side numbers. x1=1264,y1=25 clears every hex tile and
// stays left of where the right-side perimeter numbers resume (~1608 at
// this height) — the only cost is the bottom ~9px of ruler columns 43-49's
// glyphs sitting behind the table's own top edge.
const PANELS = [
  { name: 'action table', box: [1250, 556, 1634, 1034], to: [1264, 45] },
  { name: 'year track',   box: [1100, 1046, 1636, 1160], to: [460, 1060] },
  { name: 'legend',       box: [660, 1034, 1040, 1164], to: [60, 1060] },
  { name: 'house supply', box: [998, 906, 1300, 1026], to: [1004, 1060], absolute: true },
];
const deltaOf = p => [p.to[0] - p.box[0], p.to[1] - p.box[1]];

const byName = n => PANELS.find(p => p.name === n);
const supplyBlock = move(slice(iSupply, iSupplyEnd), ...deltaOf(byName('house supply')));
const actionBlock = retranslate(slice(iAction, iActionEnd), ...byName('action table').to);
const yearBlock   = retranslate(slice(iYear, iYearEnd), ...byName('year track').to);
// This board's forest/mountain expansion cost is softened from the shared
// $3/$5 default (see MAPS.wc.terrainCost in index.html, read by expandCost())
// -- the printed legend is otherwise copied verbatim from the American
// template, which would silently keep showing the wrong price. Keep these
// two numbers in sync with MAPS.wc.terrainCost by hand (same duplication
// the company short-names below already require between build script and
// engine).
const WC_TERRAIN_COST = { forest: 2, mountain: 3 };
let legendBlock = retranslate(slice(iLegend, iLegendEnd), ...byName('legend').to);
{ const before = legendBlock;
  legendBlock = legendBlock
    .replace('>$3</text>', `>$${WC_TERRAIN_COST.forest}</text>`)
    .replace('>$5</text>', `>$${WC_TERRAIN_COST.mountain}</text>`);
  if (legendBlock === before) throw new Error('legend forest/mountain price text not found — the legend markup changed'); }

// ------------------------------------------------------------- company plates
// Short forms for the six board plates — see the build report for the full
// name -> id mapping and the reasoning behind each short form.
const PLATE_NAMES = {
  AMERICAN: 'CANADIAN PACIFIC', NATIONAL: 'MANITOBA N.W.', CONTINENTAL: 'MANITOBA S.W.',
  MAJESTIC: "Q.L.&amp;S.", LIBERTY: 'CASCADE DIVISION', REPUBLIC: 'LANGDON &amp; SHEPARD',
};
const plateSize = plain => Math.min(15.5, 112 / (plain.length * 0.62));
let tail = slice(iPlates, L.length - 2)
  .split('\n')
  .filter(l => !(l.includes('<text') && l.includes('fill="#000"')))
  .join('\n');
for (const [from, to] of Object.entries(PLATE_NAMES)) {
  const size = plateSize(to.replace(/&amp;/g, '&')).toFixed(2);
  const before = tail;
  tail = tail.replace(
    new RegExp(`(font-size=")15\\.5(" font-weight="700" letter-spacing=")1\\.55("[^>]*>)${from}(</text>)`),
    `$1${size}$2${(size / 10).toFixed(2)}$3${to}$4`);
  if (tail === before) throw new Error(`company plate "${from}" not found — the plate markup changed`);
}

// The year-track panel's seven year numbers ("1851".."1857") are static text
// baked into the American board's template — the engine's YEAR_START/YEAR_END
// only move the locomotive marker (see index.html's ytCell()), they don't
// rewrite this printed art. Every other map so far played 1851-1857 too, so
// this never showed up as a bug until this board's 1881-1887 window.
const BASE_YEARS = [1851, 1852, 1853, 1854, 1855, 1856, 1857];
for (let i = 0; i < BASE_YEARS.length; i++) {
  const re = new RegExp(`(<text[^>]*>)${BASE_YEARS[i]}(</text>)`);
  const before = tail;
  tail = tail.replace(re, `$1${map.years[i]}$2`);
  if (tail === before) throw new Error(`year label ${BASE_YEARS[i]} not found — the year-track markup changed`);
}

tail = tail.split('\n').map(line => {
  const m = line.match(/<text x="([\d.]+)" y="([\d.]+)"/);
  if (!m) return line;
  const x = +m[1], y = +m[2];
  const p = PANELS.find(q => x >= q.box[0] && x <= q.box[2] && y >= q.box[1] && y <= q.box[3]);
  if (!p) return line;
  const [dx, dy] = deltaOf(p);
  return line.replace(m[0], `<text x="${(x + dx).toFixed(2)}" y="${(y + dy).toFixed(2)}"`);
}).join('\n');

// ------------------------------------------------------------------- assemble
const out = [
  L[0],
  slice(1, iDefsEnd),
  slice(iDefsEnd + 1, iLabels - 1),
  labels,
  '',
  `  <g filter="url(#landShadow)" transform="scale(${S.toFixed(5)})">`,
  field,
  '  </g>',
  `  <g transform="scale(${S.toFixed(5)})">`,
  furniture,
  '  </g>',
  '',
  supplyBlock,
  '',
  titleBlock,
  compass,
  '',
  actionBlock,
  yearBlock,
  legendBlock,
  tail,
  `  <g transform="scale(${S.toFixed(5)})">`,
  cityText,
  '  </g>',
  '</svg>',
].join('\n');

fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'western-board-draft.svg'), out);

const page = `<!doctype html><meta charset="utf-8"><title>Western Canada 1881-87 — draft board</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet">
<body style="margin:0;background:#171410">${out}</body>`;
fs.writeFileSync(path.join(HERE, 'out', 'western-board-draft.html'), page);

console.log('wrote western-board-draft.svg  (%d KB, %d tiles, %d cities)',
  Math.round(out.length / 1024), cells.length, cityCells.length);
