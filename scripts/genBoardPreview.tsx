import { renderToStaticMarkup } from 'react-dom/server';
import { createElement as h } from 'react';
import { writeFileSync } from 'node:fs';
import { createGame } from '../src/engine/setup';
import { americanRailsBoard, CITY_LIST } from '../src/engine/board/americanRails';
import { Board } from '../src/ui/Board';

const OUT = process.argv[2] ?? 'board-preview.html';

const CONFIDENCE: Record<string, string> = {
  'New York': 'high',
  Buffalo: 'high',
  Atlanta: 'medium',
  Philadelphia: 'medium',
  Pittsburgh: 'medium',
};

const game = createGame({ names: ['Ben', 'Wife', 'Friend 1', 'Friend 2'], seed: 5, board: americanRailsBoard });
const svg = renderToStaticMarkup(h(Board, { board: americanRailsBoard, state: game }));

const rows = CITY_LIST.map((c) => {
  const conf = CONFIDENCE[c.name] ?? 'verify';
  const tags = [c.hub ? 'hub (no develop)' : '', c.special ? 'special connection' : ''].filter(Boolean).join(', ');
  return `<tr class="conf-${conf}">
    <td>${c.name}</td>
    <td class="val">${c.full} / ${c.shared}</td>
    <td class="conf"><span class="pill">${conf}</span></td>
    <td class="tags">${tags}</td>
  </tr>`;
}).join('\n');

const html = `<style>
:root{
  --ink:#20242b; --muted:#5c6470; --ground:#f3efe6; --panel:#ffffff;
  --rail:#b8862f; --oxblood:#7a1f14; --line:#e0d8c8; --frame:#14304a;
  --high:#2e7d52; --medium:#b8862f; --verify:#a23b2b;
}
@media (prefers-color-scheme: dark){
  :root{ --ink:#ece5d8; --muted:#a89f8c; --ground:#191713; --panel:#242019;
    --line:#3a352a; --high:#5bbf8a; --medium:#d8b25a; --verify:#e0836f; }
}
:root[data-theme="light"]{ --ink:#20242b; --muted:#5c6470; --ground:#f3efe6; --panel:#fff; --line:#e0d8c8; --high:#2e7d52; --medium:#b8862f; --verify:#a23b2b; }
:root[data-theme="dark"]{ --ink:#ece5d8; --muted:#a89f8c; --ground:#191713; --panel:#242019; --line:#3a352a; --high:#5bbf8a; --medium:#d8b25a; --verify:#e0836f; }

*{ box-sizing:border-box; }
body{ margin:0; }
.wrap{ max-width:1080px; margin:0 auto; padding:2rem 1.25rem 4rem;
  font-family:'Segoe UI',system-ui,sans-serif; color:var(--ink); background:var(--ground); }
.eyebrow{ text-transform:uppercase; letter-spacing:.18em; font-size:.72rem; color:var(--rail); font-weight:700; }
h1{ font-family:Georgia,'Times New Roman',serif; font-size:2rem; margin:.2rem 0 .4rem; letter-spacing:.02em; }
.lede{ color:var(--muted); max-width:60ch; line-height:1.55; }
.frame{ margin:1.5rem 0; background:var(--frame); border:3px solid #0d2136; border-radius:10px; padding:10px; overflow-x:auto; }
.frame svg{ width:100%; height:auto; display:block; }
h2{ font-family:Georgia,serif; font-size:1.25rem; margin:2rem 0 .5rem; }
.note{ color:var(--muted); line-height:1.55; max-width:64ch; }
table{ border-collapse:collapse; width:100%; margin-top:1rem; font-variant-numeric:tabular-nums; }
th,td{ text-align:left; padding:.45rem .6rem; border-bottom:1px solid var(--line); font-size:.92rem; }
th{ text-transform:uppercase; letter-spacing:.08em; font-size:.7rem; color:var(--muted); }
td.val{ font-weight:700; color:var(--oxblood); }
.pill{ font-size:.68rem; text-transform:uppercase; letter-spacing:.06em; padding:.12rem .5rem; border-radius:99px; border:1px solid currentColor; }
.conf-high .pill{ color:var(--high); }
.conf-medium .pill{ color:var(--medium); }
.conf-verify .pill{ color:var(--verify); }
td.tags{ color:var(--muted); font-size:.82rem; }
.legend{ display:flex; gap:1.2rem; flex-wrap:wrap; margin-top:.75rem; color:var(--muted); font-size:.85rem; }
.swatch{ display:inline-block; width:14px; height:14px; border-radius:3px; margin-right:.4rem; vertical-align:-2px; border:1px solid rgba(0,0,0,.25); }
</style>

<div class="wrap">
  <div class="eyebrow">American Rails · board check</div>
  <h1>Does this map match your board?</h1>
  <p class="lede">This is the map the game will use, drawn straight from the code. The city
  <em>names</em>, the terrain colours, and which cities are hubs or special are transcribed from
  your board photo. The two <strong>income numbers</strong> under each city (like New York 8 / 5)
  are my best reads off the photo — please check them against your physical board and tell me any
  that are wrong.</p>

  <div class="legend">
    <span><span class="swatch" style="background:#d9b84a"></span>Plains</span>
    <span><span class="swatch" style="background:#71803c"></span>Forest</span>
    <span><span class="swatch" style="background:#8b909a"></span>Mountain</span>
    <span><span class="swatch" style="background:#efe6cf"></span>City</span>
    <span><span class="swatch" style="background:#111"></span>Hub (can't be developed)</span>
    <span><span class="swatch" style="background:#b8422f"></span>Special-connection city</span>
  </div>

  <div class="frame">${svg}</div>

  <h2>City income checklist</h2>
  <p class="note">Read each city off your board and confirm the two numbers. <strong>high</strong> = from the
  rulebook (certain), <strong>medium</strong> = fairly sure, <strong>verify</strong> = my best guess, please check.
  Just tell me the ones I got wrong — e.g. “Chicago is 6/4, not 7/5.”</p>
  <table>
    <thead><tr><th>City</th><th>Full / Shared</th><th>Confidence</th><th>Notes</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>

  <p class="note" style="margin-top:1.5rem;">Also worth a glance: is any city in the <em>wrong spot</em>,
  missing, or a terrain hex the wrong colour? The layout is approximate — I can nudge it to match.</p>
</div>`;

writeFileSync(OUT, html, 'utf8');
console.log('wrote', OUT, `(${CITY_LIST.length} cities)`);
