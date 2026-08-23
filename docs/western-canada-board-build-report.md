# Western Canada (CPR, 1881-1887) board — build report

Status: **DONE**. Third map (`wc`) built end-to-end using the Canadian
board's pipeline shape, wired into `index.html`, self-tested in a real
browser, and visually sanity-checked. Nothing left uncommitted on
`stage2-ui`; nothing pushed to any remote.

## Final tile/city count and value

- 342 tiles total: 160 plains, 76 forest, 72 mountain, 34 cities.
- 34 cities exactly as specified: 5 hubs (Winnipeg, Calgary, Edmonton,
  Regina, Vancouver) + 29 developable, 3 of the hubs also special
  connection cities (Winnipeg, Calgary, Vancouver).
- **Total printed value: 111 full / 71 shared.** Target neighbourhood
  from the brief was ~115-122 full / ~74-80 shared (the Canadian board's
  own *pre-rebalance* number, itself later corrected by measurement).
  111/71 is close (within ~7% on full, ~8% on shared) with 6 fewer
  cities than the Canadian board (34 vs 40) — a reasonable first pass,
  not fine-tuned further per the brief's own "don't agonize" instruction.
- Validation (`node scripts/western/build-map.mjs`) passes clean on the
  first run after nudging: connected, uniquely named, 5 hubs, 3
  specials, no two cities adjacent.

## Value tiering reasoning

Followed the Canadian board's own rough methodology (role/population
judgment call, not precision): territorial/provincial capitals and the
largest hard population figures sit at the top (Winnipeg 7/5 — the
CPR's construction HQ and the single largest sourced population figure
on the board, 7,985 in 1881 growing past 20,000 by 1886; Calgary and
Vancouver 6/4 as hubs+specials; Regina 6/4 as the NWT's actual seat of
government despite having no hard in-era population number — valued for
administrative weight, the same logic the Canadian board used for
Fredericton). CPR divisional points and towns with real construction-era
population estimates sit in the middle (Brandon, Moose Jaw, Prince
Albert, Lethbridge, Medicine Hat, New Westminster, Nanaimo, Battleford,
all 4/3 or 5/3). Construction camps, NWMP garrisons, and thin/unsourced
places sit at the bottom (Fort Macleod, Cochrane, Banff, Gleichen, Swift
Current, Maple Creek, Kamloops, Golden, Field, Revelstoke, Esquimalt,
St. Boniface, Selkirk, Emerson — all 2/1). Two deliberate deviations from
raw population, both documented in `cities.json`'s per-city notes:

- **Victoria (5/3, developable, NOT a hub).** The research doc's own §2
  recommends Victoria as a hub (it has the single largest hard
  population figure in the whole document, 5,925 at the 1881 census) —
  but the task's locked decision overrides this in favour of
  Edmonton+Regina as the remaining two hubs. Victoria is kept as a
  high-value *developable* city instead, on the same logic the Canadian
  board used for Owen Sound/Chicoutimi/Gaspé: a remote prize has to be
  worth the cost of the spur that reaches it (here, the Vancouver Island
  crossing).
- **Edmonton (3/2, hub).** A deliberately modest value for a
  non-developable hub — lower than several developable cities — because
  the real story is that Edmonton was bypassed by the CPR mainline in
  this exact era. Flagged below for the balance phase: a hub priced
  below developable cities around it could turn out to be a hex nobody
  ever bothers to reach, the same failure mode the Canadian board's
  original Owen Sound had before its own value correction.

## Vancouver Island

Handled as a mostly-off-map water gap with one narrow, explicit land
crossing, mirroring how the Canadian board's own PEI (Charlottetown) and
Cape Breton (Sydney) crossings work — not a literal isolated landmass,
which would have made those three cities permanently unbuildable and
failed the single-connected-landmass validation `build-map.mjs` shares
with the Canadian pipeline.

Concretely: Nanaimo, Victoria and Esquimalt sit at rows 26/29/31 in a
column band (0-2) that is almost entirely off-map (`O`) at rows 24-26 —
the Strait of Georgia. The only land tiles in that gap are two plain
(non-city) hexes at (1,24) and (1,25), forming a two-hex bridge that
connects Vancouver's own neighbour hex through to Nanaimo's. This keeps
the whole map one connected landmass (required for the connectivity
check) while still reading as "you have to cross a real water gap to
reach the island" rather than a normal overland stretch. It's a
deliberate liberty, not a hidden one — documented in both
`cities.json` (Nanaimo's `nudgeWhy`) and `terrain.json`'s own `regions`
notes, and in `gen-terrain.mjs`'s route-network comment (the
`Nanaimo|Vancouver` edge is explicitly flagged as `BRIDGE` and skips the
usual radius-1 corridor padding every other edge gets, specifically so
it stays a narrow crossing rather than a wide land bridge).

The self-test suite checks this explicitly: the full-board connectivity
BFS assertion is annotated "(incl. Vancouver Island across the strait)"
and would fail if the crossing were ever accidentally severed.

## Grid sizing and projection

`scripts/western/project.mjs`'s header comment covers this in full, but
briefly: this board's real city footprint spans ~28 degrees of longitude
(Nanaimo to Selkirk) but only ~5.1 degrees of latitude (Victoria to
Edmonton) — a much more elongated, corridor-like shape than the Canadian
board's ~24.5 x ~6.65-degree footprint. An isotropic projection (equal
km per hex step in both directions, which both existing boards use)
would crush the whole prairie corridor into a handful of rows and make
several genuinely close real-world pairs (Fort Qu'Appelle/Qu'Appelle
Station, Golden/Field, Winnipeg/St. Boniface, Victoria/Esquimalt, the
Lower Mainland triangle) collide outright. So this board deliberately
stretches latitude to ~4.6 rows/degree — roughly 5x the isotropic rate
at this latitude band, far more aggressive than the Canadian board's own
29% stretch — purely so those clusters land in distinguishable rows.
Grid is 40 cols x 34 rows, hex radius 24 (vs the Canadian board's 34,
needed to fit the wider corridor into the same 1700x1400 frame).

Even with that stretch, four real-world clusters still collided or were
directly hex-adjacent on first projection and needed manual nudges
(resolved with a small throwaway adjacency checker,
`scripts/western/check-adj.mjs`, before ever running the full
terrain/build pipeline — faster than iterating through `build-map.mjs`
failures one at a time): Winnipeg/St. Boniface/Selkirk, the
Regina/Fort Qu'Appelle/Qu'Appelle Station/Indian Head cluster,
Calgary/Cochrane/Banff/Field, and the whole Lower Mainland + Vancouver
Island group. All nudges and their reasoning are recorded in
`cities.json`'s `nudgeWhy` fields. `scripts/canada/space-cities.mjs`'s
automated move/cut pass was not needed — all four clusters resolved with
direct, reasoned nudges in one pass each, so no `scripts/western/
space-cities.mjs` was written.

## Panel positions

This board's real shape (a long, narrow east-west band through the
middle third of the frame) leaves the Canadian board's usual "stack
panels below a tall landmass" approach wasteful — there's very little
open space below the corridor, but huge open blocks top-right (rows 0-9,
cols 20+, above the prairie corridor) and bottom-right/bottom-centre
(rows 26+, cols 8+, below the mountain belt and east of Vancouver
Island). Panels were placed in those blocks instead:

- **Action table** → `[1240, 40]` (top-right, above the prairie corridor).
- **Year track** → `[640, 1010]` (open area below the mountain belt).
- **Legend** → `[1220, 1010]` (beside the year track).
- **House-supply box** → `[640, 1150]` (below the year track).

## Company naming (6 companies)

The CPR's real near-monopoly, fictionalized per the design brief into
one dominant company + 5 subsidiaries, using the research doc's §3
recommendation (3 real chartered colonization railways + 2 real
construction contractors, since the record does not support 5
genuinely separate operating companies in this region/era):

| Internal id | Display name (`WC_COMPANY_NAMES`) | Short/card/plate form | Why |
|---|---|---|---|
| `american` | Canadian Pacific | CANADIAN PACIFIC | The dominant company — the real CPR itself, appropriate since it *is* the entity the other five are fictionalized around. Gets the `companyCounts` override. |
| `national` | Manitoba & North Western | MANITOBA N.W. | Real chartered colonization railway, Portage la Prairie toward Yorkton, 1881. |
| `continental` | Manitoba South Western | MANITOBA S.W. | Real chartered colonization railway, Winnipeg toward Gretna/Manitou, 1881; CPR-leased almost immediately. |
| `majestic` | Qu'Appelle, Long Lake & Saskatchewan | Q.L.&S. | Real chartered railway, Regina toward Prince Albert, 1883. Shortened to its common historical abbreviation — the full name (37 characters) does not fit a plate or card this size, the same reasoning the Canadian board used to shorten "St Lawrence & Atlantic" to "ST LAWRENCE". |
| `liberty` | Onderdonk | ONDERDONK | Real contractor (Andrew Onderdonk), Fraser Canyon/mountain section, 1880-85 — not a chartered company, flagged as such in the research doc and in the in-code comment above `WC_COMPANY_NAMES`. |
| `republic` | Langdon & Shepard | LANGDON & SHEPARD | Real contracting firm, the 1882 prairie-section contract under Van Horne. Also a contractor, not a company. |

`Q.L.&S.` and `LANGDON & SHEPARD` are written with `&amp;` (not a bare
`&`) in both `WC_CARD_NAMES`/`WC_COMPANY_NAMES` in `index.html` and
`PLATE_NAMES` in `make-board-svg.mjs`, matching the defensive
`&amp;`-stripping already present in the Canadian script's `plateSize()`
helper — these two names are the first on either board to actually
exercise that code path.

## Company asymmetry

`MAPS.wc.companyCounts = { american: { shares: 7, cubes: 38 } }`. The
other five ids are omitted and correctly fall back to the shared
`COMPANIES` table (29/26/22/19/17 cubes, matching `national`/
`continental`/`majestic`/`liberty`/`republic`'s existing values) via
`companyShares()`/`companyCubes()`. 7 shares and 38 cubes is visibly
bigger than any existing company on either board (today's max is 5
shares / 31 cubes) — a real, first-pass asymmetry per the brief, to be
corrected by the bot-harness measurement phase, not a token difference.
Confirmed rendering correctly in both the live game's company sidebar
and the standalone board SVG's plates.

## Self-test count

**204/204 passing** (167 baseline + 37 new `wc` assertions — confirmed
by `grep -c "assert('WC:" index.html` = 36, plus one restoration
assertion outside the `WC:`-prefixed set = 37). Coverage: map registry
switch, template presence, tile/city count and uniqueness, no-two-
cities-adjacent (explicitly including the Vancouver Island crossing),
hub/special counts and membership, the Victoria-is-not-a-hub design
override, geometry/piece scaling, company-name propagation across three
render paths (the `COMPANIES` table, the board plate baked into the SVG
template, and the share-card art via `miniStack`), the default
all-three-pairs connection-bonus behaviour, a special-pair connection
paying once, the 1881-1887 year window (`MAPS.wc.years`,
`YEAR_START`/`YEAR_END`, a fresh game's starting year, `roundsLeft`),
the dominant company's overridden share/cube counts plus the five
un-overridden subsidiaries reading the shared table correctly, a fresh
game seeding the overridden supply, and a full bot game reaching
`gameOver` with `s.year===1887`. Verified live via Playwright against
`node scripts/serve.mjs` at `http://localhost:5177/` — `window
.__selfTest()` returns `{passed:204, total:204}` with no thrown error
on a fresh page load.

## Screenshot observations

Rendered via `window.startGame({mode:'local', names:['A','B','C','D'],
mapId:'wc'})` in the live app, and separately via the standalone
`scripts/western/out/western-board-draft.html`. Two real bugs were
caught and fixed during this check, both worth flagging as a lesson for
future third-map work:

1. **The year-track panel was still printing 1851-1857.** The engine's
   `YEAR_START`/`YEAR_END` only move the locomotive marker
   (`index.html`'s `ytCell()`); they never touch the seven year numbers
   baked as static SVG text into the American board's template, and
   neither existing map had ever exercised this path since both play
   1851-1857. Fixed in `make-board-svg.mjs` with a targeted text-content
   substitution (baked `1851..1857` → `map.years[i]`), verified by
   screenshot showing `1881 1882 1883 1884 1885 1886 1887`.
2. **The Craigellachie flavour label was badly mispositioned** (it used
   `px()`, the *scaled* coordinate helper meant for content inside the
   `<g transform="scale(S)">` groups, for a label drawn *outside* that
   group) — it rendered roughly 1/S times too far from the origin,
   landing well off to the northeast of Revelstoke instead of beside it.
   Fixed by computing its position directly in true canvas pixels; it
   now sits correctly at the edge of the mountain cluster near
   Revelstoke/Golden.

After both fixes, the board reads cleanly at both full-page and
in-game zoom: no overlapping city text, no off-map holes inside the
landmass, terrain colouring reads sensibly (green boreal arc across the
top for Edmonton/Battleford/Prince Albert, grey mountain belt through
Field/Golden/Revelstoke/Banff/Cochrane/Calgary/Kamloops/Gleichen, yellow
prairie/lowland everywhere else, a small patch of forest-green on
Vancouver Island itself), and all six company plates and the company
sidebar show the correct names and cube counts.

## Flags for the balance-measurement phase

1. **Edmonton (hub, 3/2) may be underpowered relative to its
   surroundings.** It's a non-developable hub priced below several
   nearby developable cities (Calgary 6/4, Battleford 4/3). If bot games
   show nobody ever bothers building the spur to it, this is the
   board's version of the Canadian board's original Owen Sound problem
   and should get the same treatment (a value bump), not a design change
   — the hub status and the historical "bypassed" story should stay.
2. **Calgary-Vancouver vs. Winnipeg-Calgary connection-bonus legs.**
   Per the design doc's own open wrinkle: Calgary-Vancouver is the
   shorter real-world leg but crosses the entire mountain chokepoint,
   while Winnipeg-Calgary is the longer leg over cheap prairie the whole
   way. This board's terrain (72 mountain tiles concentrated almost
   entirely on that one corridor) may swing the fire-rate balance
   further than either existing board's connection triangle does —
   worth an explicit measurement rather than an assumption either way,
   exactly as the design doc asks.
3. **111/71 total value is ~7-8% below the stated target neighbourhood**
   (115-122/74-80), with 34 cities instead of 40. Not a defect per se
   (per-city average value is close to the Canadian board's own), but
   if bot games show income running dry faster than the other two
   boards, this is the first lever to check.
4. **The dominant company's 7 shares / 38 cubes is a first-pass number
   with no play-balance validation** (explicitly out of scope for this
   task) — it is visibly bigger than anything else, per the brief, but
   whether 7/38 specifically produces "safe, big, slow-growing" play
   rather than a degenerate always-buy-in or never-buy-in outcome is
   unverified.
5. **Northern boreal arc (Edmonton/Battleford/Prince Albert) is a
   single-file branch**, not a loop or a redundant-path network — same
   shape as the Canadian board's Shield interior, and expected to see
   similarly low traffic. Worth confirming with the bot harness rather
   than assuming.

## Files

- `c:\Users\benja\Documents\american rails\scripts\western\cities.json`
- `c:\Users\benja\Documents\american rails\scripts\western\terrain.json`
- `c:\Users\benja\Documents\american rails\scripts\western\project.mjs`
- `c:\Users\benja\Documents\american rails\scripts\western\build-map.mjs`
- `c:\Users\benja\Documents\american rails\scripts\western\make-board-svg.mjs`
- `c:\Users\benja\Documents\american rails\scripts\western\inject.mjs`
- `c:\Users\benja\Documents\american rails\scripts\western\gen-terrain.mjs` (one-off terrain generator, kept for reference/regeneration)
- `c:\Users\benja\Documents\american rails\scripts\western\check-adj.mjs` (one-off city-adjacency checker used to resolve nudges before running the full pipeline)
- `c:\Users\benja\Documents\american rails\scripts\western\out\western-board-data.json`
- `c:\Users\benja\Documents\american rails\scripts\western\out\western-board-draft.svg`
- `c:\Users\benja\Documents\american rails\index.html` (MAPS.wc, WC_COMPANY_NAMES, WC_CARD_NAMES, tpl-board-wc template, window.WC_MAP data, 37 new self-test assertions)
- `c:\Users\benja\Documents\american rails\docs\western-canada-board-research.md`
- `c:\Users\benja\Documents\american rails\docs\western-canada-board-build-report.md` (this file)
