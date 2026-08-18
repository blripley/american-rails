// Draft the Canadian Rails board SVG.
//
//   node scripts/canada/make-board-svg.mjs
//
// This does NOT redraw anything. It lifts the American board's <defs> — the
// parchment and terrain patterns, the four hex tiles (hx-P/F/M/C), the skyline,
// port marker, rail ties and every action icon — and its frame, scoring track
// and printed panels VERBATIM, then regenerates only what is map-specific:
// the hex field, the city furniture, the water labels, the title and the panel
// positions. That is the whole reason the Canadian board can look like the
// American one instead of like a redrawing of it.
import fs from 'node:fs';
import path from 'node:path';
import { HERE } from './project.mjs';

const ROOT = path.resolve(HERE, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const american = src.match(/<template id="tpl-board">([\s\S]*?)<\/template>/)[1];
const L = american.split('\n');
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'canada-board-data.json'), 'utf8'));

// ---------------------------------------------------------------- section cuts
const find = (pred, from = 0) => { for (let i = from; i < L.length; i++) if (pred(L[i], i)) return i; throw new Error('section not found'); };
const has = s => l => l.includes(s);

// These panels contain nested groups, so the matching close has to be found by
// depth. Taking the first bare </g> silently truncates the action table.
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
// the first italic water label, which is where the map-specific content starts
const iLabels    = find(has('font-style="italic" font-size="18"'));

const slice = (a, b) => L.slice(a, b + 1).join('\n');

// ------------------------------------------------------------------- geometry
// The tile art in <defs> is drawn at radius 41. This map uses 34, so the field,
// the city furniture and the city labels all live inside groups scaled by 34/41
// and their coordinates are expressed in the unscaled (41-radius) space. That
// way every inherited offset — skyline +4, ties +31, portMark (+20,-13), the
// value and name baselines, the type sizes — stays exactly as the American
// board has it, and shrinks with the tile instead of needing to be re-derived.
const S = map.hexGrid.radius / 41;
const { origin, horizontalSpacing: HW, rowSpacing: RP } = map.hexGrid;
// position in unscaled space, i.e. board coordinates divided back out by S
const px = (c, r) => ({
  x: +((origin.x + c * HW + (r & 1) * HW / 2) / S).toFixed(2),
  y: +((origin.y + r * RP) / S).toFixed(2),
});
const HXREF = { plains: 'hx-P', forest: 'hx-F', mountain: 'hx-M', city: 'hx-C' };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const GARAMOND = '&#39;EB Garamond&#39;, serif';
const CINZEL = '&#39;Cinzel&#39;,serif';

// The American board shrinks long city names in three steps. Canadian names run
// longer ("Sault Ste. Marie", "Saint-Hyacinthe"), so the ladder is extended.
function nameSize(n) {
  const len = n.length;
  return len <= 8 ? 13.19 : len <= 10 ? 12.21 : len <= 12 ? 11.41 : len <= 14 ? 10.6 : len <= 16 ? 9.9 : 9.2;
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
const water = (t, x, y) => `  <text x="${x}" y="${y}" text-anchor="middle" font-family="&#39;EB Garamond&#39;,serif" font-style="italic" font-size="18" letter-spacing="2" fill="#8d6e3e" opacity=".8">${esc(t)}</text>`;
const region = (t, x, y, size = 20, sp = 8) => `  <text x="${x}" y="${y}" text-anchor="middle" font-family="${CINZEL}" font-weight="600" font-size="${size}" letter-spacing="${sp}" fill="#8d6e3e" opacity=".48">${esc(t)}</text>`;
// Positions are chosen to sit in the actual open parchment, clear of both the
// hex field and the panels — see the layout map in README-canada-board.md.
const labels = [
  water('Lake Superior', 200, 292),
  water('Lake Huron', 165, 470),
  water('Lake Ontario', 660, 645),
  water('Lake Erie', 450, 832),
  `  <text x="1303" y="506" text-anchor="middle" font-family="&#39;EB Garamond&#39;,serif" font-style="italic" font-size="13" letter-spacing="1" fill="#8d6e3e" opacity=".8">Bay of Fundy</text>`,
  // the Gulf is only three columns of clear parchment, so the label stacks
  region('GULF OF', 1512, 300, 15, 3),
  region('ST. LAWRENCE', 1512, 323, 15, 3),
  region('UNITED STATES', 800, 762),
  region('ATLANTIC OCEAN', 1050, 872, 16, 6),
].join('\n');

// --------------------------------------------------------------------- panels
// Same panels, repositioned for a land mass that runs as a wide diagonal band.
// The bottom strip is Lake Erie and the United States; the bottom-right corner
// is the open Atlantic, which is the only block big enough for the action table.
const move = (block, dx, dy, scale) =>
  `  <g transform="translate(${dx},${dy})${scale ? ` scale(${scale})` : ''}">\n${block}\n  </g>`;
const retranslate = (block, x, y) => block.replace(/translate\(\d+,\d+\)/, `translate(${x},${y})`);

const titleBlock = [
  `  <g transform="translate(325,145)">`,
  `    <text y="0" text-anchor="middle" font-family="${CINZEL}" font-weight="900" font-size="42" letter-spacing="1" fill="#2b2013">CANADIAN RAILS</text>`,
  `    <line x1="-186" y1="14" x2="186" y2="14" stroke="#5d4726" stroke-width="1.6"></line>`,
  `    <text y="40" text-anchor="middle" font-family="&#39;EB Garamond&#39;,serif" font-style="italic" font-size="22" letter-spacing="0.5" fill="#5d4726">The Province of Canada &amp; the Maritimes, 1851</text>`,
  `    <line x1="-186" y1="52" x2="186" y2="52" stroke="#5d4726" stroke-width="0.9"></line>`,
  `    <text y="70" text-anchor="middle" font-family="${CINZEL}" font-weight="500" font-size="12" letter-spacing="3" fill="#5d4726">AFTER TIM HARRISON &#183; ARTWORK ALEXANDRE ROCHE</text>`,
  `  </g>`,
].join('\n');

// Compass rose in the Gulf, where the period maps put theirs.
const compass = `  <g transform="translate(1500,170)" opacity=".55">
    <circle r="42" fill="none" stroke="#5d4726" stroke-width="1.2"></circle>
    <circle r="30" fill="none" stroke="#5d4726" stroke-width="0.7"></circle>
    <path d="M0 -40 L9 0 L0 40 L-9 0 Z" fill="#5d4726"></path>
    <path d="M-40 0 L0 -8 L40 0 L0 8 Z" fill="none" stroke="#5d4726" stroke-width="1"></path>
    <text y="-48" text-anchor="middle" font-family="${CINZEL}" font-weight="700" font-size="15" fill="#5d4726">N</text>
  </g>`;

// Where each panel moves to. `box` is its ORIGINAL footprint on the American
// board: several panels have their labels in the trailing absolute-coordinate
// text run rather than inside the group (the year track's 1851-1857 are), so
// anything sitting in the old box has to travel by the same delta or it is left
// stranded where the panel used to be.
const PANELS = [
  { name: 'action table', box: [1250, 556, 1634, 1034], to: [1230, 690] },
  { name: 'year track',   box: [1100, 1046, 1636, 1160], to: [560, 900] },
  { name: 'legend',       box: [660, 1034, 1040, 1164], to: [120, 900] },
  { name: 'house supply', box: [998, 906, 1300, 1026], to: [560, 1045], absolute: true },
];
const deltaOf = p => [p.to[0] - p.box[0], p.to[1] - p.box[1]];

const byName = n => PANELS.find(p => p.name === n);
const supplyBlock = move(slice(iSupply, iSupplyEnd), ...deltaOf(byName('house supply')));
const actionBlock = retranslate(slice(iAction, iActionEnd), ...byName('action table').to);
const yearBlock   = retranslate(slice(iYear, iYearEnd), ...byName('year track').to);
const legendBlock = retranslate(slice(iLegend, iLegendEnd), ...byName('legend').to);

// ------------------------------------------------------------- company plates
const PLATE_NAMES = {
  AMERICAN: 'GRAND TRUNK', NATIONAL: 'GREAT WESTERN', CONTINENTAL: 'NORTHERN',
  MAJESTIC: 'ST LAWRENCE', LIBERTY: 'EUROPEAN', REPUBLIC: 'NOVA SCOTIA',
};
// A plate name is centred between the cube count on the left and the share count
// on the right, leaving roughly 145 units of clear width.
const plateSize = plain => Math.min(15.5, 112 / (plain.length * 0.62));
// Plates + scoring numbers + the American city labels, all interleaved. Drop only
// the city labels: they are the <text> elements in plain black. Everything else
// in this run — scoring numbers (#f4ead0), plate faces, and the black cube
// shading <path>s — is map-independent and stays exactly as it is.
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

// Move any label that belonged to a panel along with its panel.
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
fs.writeFileSync(path.join(HERE, 'out', 'canada-board-draft.svg'), out);

const page = `<!doctype html><meta charset="utf-8"><title>Canadian Rails 1851 — draft board</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet">
<body style="margin:0;background:#171410">${out}</body>`;
fs.writeFileSync(path.join(HERE, 'out', 'canada-board-draft.html'), page);

console.log('wrote canada-board-draft.svg  (%d KB, %d tiles, %d cities)',
  Math.round(out.length / 1024), cells.length, cityCells.length);
