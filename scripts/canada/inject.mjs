// Inject the Canadian board into index.html: the finished SVG as a second
// <template>, and the map data in the same shape the engine already uses for
// the American board (PDF_CELLS). Idempotent — re-run after regenerating either.
//
//   node scripts/canada/inject.mjs
import fs from 'node:fs';
import path from 'node:path';
import { HERE } from './project.mjs';

const ROOT = path.resolve(HERE, '..', '..');
const idx = path.join(ROOT, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
const svg = fs.readFileSync(path.join(HERE, 'out', 'canada-board-draft.svg'), 'utf8');
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'canada-board-data.json'), 'utf8'));

// --- cells, in the engine's own PDF_CELLS shape ------------------------------
const T = { plains: '.', forest: 'f', mountain: 'M', city: 'C' };
const cells = {};
for (const c of map.cells) {
  const o = { t: T[c.terrain] };
  if (c.city) { o.name = c.city; o.full = c.full; o.shared = c.shared;
                if (c.port) o.port = 1; if (c.start) o.start = 1; }
  cells[`${c.col},${c.row}`] = o;
}

const payload = {
  cells,
  hubs: map.hubs,
  specials: map.specials,
  hex: map.hexGrid.radius,
  ox: map.hexGrid.origin.x,
  oy: map.hexGrid.origin.y,
};

const dataTag = `<script>window.CA_MAP=${JSON.stringify(payload)};</script>`;
const tplTag = `<template id="tpl-board-ca">${svg}</template>`;

// --- splice both in, replacing any previous injection ------------------------
const swap = (marker, block) => {
  const re = new RegExp(`<!--CA:${marker}-->[\\s\\S]*?<!--/CA:${marker}-->`);
  const wrapped = `<!--CA:${marker}-->${block}<!--/CA:${marker}-->`;
  if (re.test(html)) { html = html.replace(re, wrapped); return 'replaced'; }
  // first time: put the template beside the American one, the data beside SCORE_CELLS
  const anchor = marker === 'tpl' ? '</template>' : '<script>window.SCORE_CELLS=';
  const at = marker === 'tpl'
    ? html.indexOf(anchor) + anchor.length
    : html.indexOf(anchor);
  if (at < 0) throw new Error('anchor not found for ' + marker);
  html = html.slice(0, at) + '\n' + wrapped + '\n' + html.slice(at);
  return 'inserted';
};

const a = swap('tpl', tplTag);
const b = swap('data', dataTag);
fs.writeFileSync(idx, html);

console.log(`board template ${a}, map data ${b}`);
console.log(`index.html is now ${(html.length / 1024).toFixed(0)} KB`);
console.log(`${Object.keys(cells).length} tiles, ${map.cells.filter(c => c.city).length} cities`);
