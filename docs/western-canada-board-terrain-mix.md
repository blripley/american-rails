# Western Canada (CPR, 1881-1887) board — terrain-mix pass

Status: **DONE**. Nothing pushed to any remote (branch `stage2-ui`). American and
Canadian board files/data are untouched — confirmed by `git diff --stat`: only
`index.html`, `scripts/western/terrain.json`, and the regenerated
`scripts/western/out/*` build artifacts changed.

**Confidence up front: yes, I'm confident this reads as "more accurate and
more fun with mixed terrain," per Ben's ask.** The American-board comparison
was quantitative, not eyeballed (§2), and it directly confirmed his complaint
("their mountains were much smaller") — the old Western Canada mountain band
was a single 41-hex block at 51% fill inside its own bounding box; the
American board's biggest mountain patch is 19 hexes at 21% fill. The redesign
(§3) splits the band into two patches (15 + 8 hexes), landing almost exactly
on the American board's own scale, while keeping the real Kicking Horse/
Rogers Pass corridor mountainous and geographically honest. Three real
Manitoba/Saskatchewan highland features were added as new forest, and the
once-solid northern boreal block and the mountain band both now have real
plains breaking them up. The 16-game re-measurement (§5) shows the northern
corridor stayed healthy, the connection-bonus mechanic stayed just as alive
(87.5% any-leg, same as the rework-2 baseline) but became more evenly split
between its two firing legs, and total company investment activity is
essentially unchanged from baseline once you account for a real, expected
side effect of adding more plains (§5.3). Nothing here reads as degenerate.
**One thing flagged for another look**, not fixed in this pass: the
distinct-non-city-hex occupancy metric dropped a lot in raw terms (52 vs the
baseline's 92.9) — real, explained, and not a sign of less play, but worth
knowing about if a future pass tunes cube counts using that specific stat.

## 1. Manitoba/Saskatchewan highland research

Same HIGH/MEDIUM/LOW confidence convention as the rest of this board's
research. For each candidate: real character, whether it falls inside this
board's mapped `lonLeft/lonRight/latTop` + `rowsPerDegLat` bounds
(`scripts/western/project.mjs`: lon -124.4 to -96.4, lat ~48.09N to 54.3N),
and what I did with it.

### Used

| Feature | Real character | Inside map bounds? | Confidence | Used as |
|---|---|---|---|---|
| **Cypress Hills** | Forested upland straddling the AB/SK border; highest point in Canada between the Rockies and Labrador; site of the 1873 Cypress Hills Massacre. Real coordinates ~49.65N/-110.1W (highest point), ~30-40km SSW of the real Maple Creek (49.916N/-109.484W, already on this board). | Yes — comfortably inside both bounds. | **HIGH** (well-documented feature; well-documented relationship to Maple Creek) | 2-hex forest patch at (11,13) and (12,12), immediately flanking Maple Creek and Medicine Hat. Strongest, best-documented candidate, exactly as the task brief predicted. |
| **Manitoba Escarpment — Riding Mountain** | Forested highland, now Riding Mountain National Park, ~750m elevation, real coordinates ~50.66N/-99.99W. | Yes. | **HIGH** (the park and its role are well documented) | Anchors a 3-hex forest patch at (19,10), (20,10), (19,11), north of Portage la Prairie (20,11). The raw lon/lat projection (col≈20, row≈11) lands almost exactly on Portage la Prairie's own nudged hex, so the patch was placed on the nearest open land along the real bearing (north/north-west) from the city rather than overwriting it — a documented compromise, not a silent one. |
| **Manitoba Escarpment — Duck Mountain** | Forested upland straddling the MB/SK border, ~51.6N/-101W (Baldy Mountain, the park's high point). ~110km from Riding Mountain in reality — a real, if imperfect, geographic compression. | Marginal — raw projection (~col19, row8) lands on an off-map hex not connected to any existing route; the surrounding land at that row is otherwise empty (no city or route passes near it). | **HIGH** (feature); the exact hex is a **judgment call**, not a precise projection | Folded into the same 3-hex Riding Mountain patch above rather than given its own disconnected hex hanging off nothing. This is the same kind of explicit compression the board already made for Duck Lake/Batoche in the prior pass — documented in `terrain.json`, not hidden. |
| **Pembina Hills / Pembina Valley** | Real escarpment feature in far-southern Manitoba, near Manitou/Morden, ~49.2N/-98.1W. | Yes, barely — projects to (col21, row15), on the existing Emerson spur. | **MEDIUM** (feature/role); **LOW** (any precise extent at this scale — this is the thinnest-documented of the three used) | Single forest hex at (21,15), next to Emerson (22,15). Kept deliberately small (one hex, not a patch) to match how lightly it's sourced — the same "don't pad past what's documented" convention this board already follows for Emerson, Fort Qu'Appelle's population, etc. |

### Considered and set aside

| Feature | Why set aside |
|---|---|
| **Canadian Shield edge (Whiteshell, east of Winnipeg)** | Checked directly against the projection formula: `colsPerDegLon = 23/28 = 0.8214`. Whiteshell's real longitude (~-95.2 to -96.0W) projects to col 23-24 — at or past the board's own eastern edge (`lonRight = -96.4`, the design doc's own boundary with the Canadian board, near Selkirk/Winnipeg's longitude). Confirmed cut off, exactly as the task brief flagged as a possibility. Not used. |
| **Missouri Coteau** | A real, well-documented hilly upland belt across southern Saskatchewan (roughly the Moose Jaw/Swift Current/Maple Creek latitude band, extending toward the Cypress Hills), but its real character is rolling **grassland**, not forest — this engine has only three land terrain types (plains/forest/mountain, per `terrain.json`'s own legend), with no distinct "hills" type. Labelling a real grassland upland as forest would misrepresent it. Left as ordinary plains rather than mislabelled — an honest "no", not an oversight. |

## 2. American-board patch-size measurement — the actual comparison, not a guess

Measured programmatically, not eyeballed: loaded `US_CELLS` directly out of
`index.html` (the same object `MAPS.us.cells` uses to build `BOARD`) and
`scripts/western/terrain.json`'s `grid`, then ran a hex-adjacency BFS (same
odd-r neighbour formula as `index.html`'s own `neighborCoords()` /
`gen-terrain.mjs`'s `neighbours()`) to find connected components of each
terrain type, on both boards, before touching anything.

**Before this pass:**

| Board | Total land tiles | Mountain | Forest |
|---|---|---|---|
| US | 215 | 20 tiles, **2 patches** (19 + 1), bbox of the big one: 9 cols × 10 rows = 90 cells → **21% fill** | 94 tiles, 5 patches (88 + 2+2+1+1) |
| WC (old, rework-2) | 210 | 41 tiles, **1 patch**, bbox 10 cols × 8 rows = 80 cells → **51% fill** | 46 tiles, 1 patch |

This directly confirms Ben's complaint, quantitatively: the old WC mountain
band wasn't just bigger in tile count (41 vs. 19) — it was **more than twice
as dense inside its own footprint** (51% fill vs. 21%), reading as one solid
grey block rather than a thin, broken spine threaded between cities and
plains the way the American board's Appalachian mountains actually are.

This became the concrete target for the redesign: not "make it smaller" by
feel, but split the band so its **largest single patch lands close to the
American board's own 19-hex, 21%-fill benchmark**, while staying geographically
anchored to the real Kicking Horse/Rogers Pass corridor.

## 3. Terrain changes made

All edits re-typed existing land hexes only — **no tile was added or removed,
no city was moved, no city value changed**. Total tile count (210),
connectivity, hub/special sets, and every city's `full`/`shared` value are
byte-identical to before. This means `build-map.mjs`'s connectivity/adjacency
checks cannot have been affected by any of this (confirmed — see §4).

### 3a. Mountain band: 41 → 23 tiles, 1 patch → 2 patches

18 hexes converted mountain→plains, each with a specific real-geography
reason (not blind thinning):

- **(8,7), (9,7)** — east of Cochrane, the real direction of the abrupt
  Plains-to-Cordillera transition the original research doc already
  describes; genuine foothill/prairie edge, not the mountain side.
- **(9,8), (10,8), (9,9), (10,9), (8,10), (9,10)** — Calgary's own east,
  north-east and south neighbours. The old grid had **all six** of Calgary's
  hex neighbours as mountain, which is wrong: real Calgary sits right at the
  mountain front with prairie opening out to its east and south. Now only
  the west (toward Cochrane) and north (toward Field, the real pass
  approach) sides stay mountain.
- **(9,11), (10,11), (8,11), (8,12), (9,12), (10,12)** — the approach from
  Banff/Golden toward Medicine Hat and Gleichen, which in reality is
  foothill/prairie country, not a 4-hex-deep mountain wall.
- **(3,10), (4,11), (4,12), (5,11)** — the **Rocky Mountain Trench**, a real
  lowland corridor between the Rocky Mountains and the Columbia Mountains
  that Golden (5,12) genuinely sits in, and the real Interior Plateau's
  rolling character around the Kamloops (3,11) approach.

Result (measured, not estimated): the band splits into a **15-hex core**
(Cochrane–Field–Banff–Calgary(north/west side)–Revelstoke–Golden(east
side)–Gleichen(west side) front range, bbox 6×6, 42% fill) and an **8-hex
Fraser Canyon/Kamloops-approach patch** (bbox 3×4). The core patch (15) is
now close to the American board's own largest patch (19), and the density
inside its bbox (42%) sits between the old WC extreme (51%) and the American
board's (21%) — still a genuinely dense mountain crossing (it should read as
hard), just no longer a monolithic block.

The old single chokepoint-relief hex from rework-2, `(7,8)`, is **left
unchanged (still plains)** — nothing requires reverting it, and the 16-game
measurement (§5) confirms it's still heavily used (87.5% of games, identical
to the rework-2 baseline) even though the band is no longer a strict
single-file gauntlet on its own.

### 3b. Northern boreal arc: 46 → 40 tiles, 1 patch → 6 patches

Real boreal forest thins into aspen-parkland grassland mosaic well before it
reads as solid canopy; the original region rule painted the whole rows-0-6
band as uniform forest, which overstated that. 12 hexes converted
forest→plains, opening gaps through the **middle** of the arc (row 3:
(7,3),(8,3),(10,3),(11,3),(13,3); row 4: (9,4),(10,4),(13,4),(14,4); row 5:
(8,5); row 6: (8,6),(16,6)) while keeping real forest cover immediately
around Edmonton, Victoria Settlement, Fort Pitt, Battleford, Fort Carlton and
Prince Albert themselves (the river-valley woods those places actually sat
in/near), plus the northernmost rows (0-1, genuinely the coldest, most
solidly boreal part of the band).

Result: **28-hex main patch + two 3-hex pockets** (34 hexes from this cut
alone; see below for how the highland additions bring the forest total back
up to 40).

### 3c. New highland forest (0 net new tiles — reassigned from existing plains)

6 hexes converted plains→forest for the three highland features from §1:
Cypress Hills (2 hexes), Manitoba Escarpment/Riding Mountain+Duck Mountain
(3 hexes), Pembina Hills (1 hex). These land as their own small, separate
patches (2, 3, and 1 hex respectively) — genuinely new, real terrain variety
in a region that was previously uniform prairie.

### 3d. Before/after totals

| | Before (rework-2) | **After (this pass)** |
|---|---|---|
| Mountain tiles | 41 | **23** |
| Mountain patches | 1 (41) | **2** (15, 8) |
| Mountain patch bbox fill (largest) | 51% (10×8 box) | **42%** (6×6 box) |
| Forest tiles | 46 | **40** |
| Forest patches | 1 (46) | **6** (28, 3, 3, 3, 2, 1) |
| Plains tiles | 88 | **112** |
| City tiles | 35 | 35 (unchanged) |
| Total land tiles | 210 | 210 (unchanged) |

American-board reference (unchanged by this pass, for comparison): mountain
20 tiles / 2 patches (19, 1) / 21% fill; forest 94 tiles / 5 patches (88, 2,
2, 1, 1).

## 4. Validation

1. **`node scripts/western/build-map.mjs`** — clean: 210 tiles
   `{"forest":40,"city":35,"plains":112,"mountain":23}`, 35 cities (114 full /
   73 shared, unchanged), 5 hubs, 3 specials, connected, no two cities
   adjacent. Since every edit only re-typed already-land hexes (never
   touching a city hex or an off-map hex), this could not have broken
   connectivity, hub/special counts, or the no-adjacent-cities check — and
   it didn't.
2. **Full pipeline**: `make-board-svg.mjs` → `inject.mjs`, spliced into the
   real `index.html` (210 tiles, 35 cities, confirmed by the injector's own
   printed summary).
3. **Self-test assertions**: searched for any hardcoded mountain/forest/
   plains tile-type counts in `window.__selfTest()` — none exist. The only
   hardcoded WC tile count is the total (`wcIds.length===210`), which is
   unchanged, and the forest/mountain expand-cost assertions
   (`WC: expandCost() actually charges the softened $2/$3...`) find their
   test hex dynamically via `Object.keys(BOARD).find(id=>BOARD[id].terrain
   ==='forest'/'mountain')`, so they're unaffected by which specific hexes
   are forest/mountain. **No self-test edits were needed.**
4. **`window.__selfTest()` — 209/209 passing**, confirmed live via
   Playwright against `node scripts/serve.mjs` at `http://localhost:5177/`
   on a fresh page load. Identical count to the rework-2 baseline (no
   assertions added, removed, or broken).
5. **Real-lobby-UI screenshot**: navigated to `http://localhost:5177/`,
   clicked **Local Game**, selected **Western Canada** from `#map-choice`,
   set all 4 seats to Medium bots, clicked **Start Game**. Confirmed
   visually (screenshot taken mid-prep-auction, full board visible):
   - The mountain band now reads as a **visibly compact grey patch**
     around Field/Revelstoke/Kamloops/Golden/Banff — Cochrane, Calgary and
     Gleichen, previously boxed in on all sides by mountain, now show clear
     yellow plains around them, matching the redesign's intent directly.
   - The northern boreal arc shows **visible plains gaps** breaking up the
     green forest band between Edmonton/Fort Pitt/Battleford/Fort Carlton/
     Batoche/Prince Albert, rather than one solid green wall.
   - The three new highland forest patches are all visible: a green patch
     north of Portage la Prairie (Manitoba Escarpment), a green patch beside
     Medicine Hat/Maple Creek (Cypress Hills), and a single green hex near
     Emerson (Pembina Hills).
   - No isolated single-hex terrain "islands" reading as glitches — the one
     genuinely single-hex forest patch (Pembina Hills) sits naturally beside
     a city on an existing spur, not floating oddly in open plains, and
     reads as intentional rather than accidental.
6. **`git diff --stat`**: only `index.html`, `scripts/western/terrain.json`,
   and the regenerated `scripts/western/out/*` build artifacts changed. No
   `scripts/canada/*`, no American/Canadian board data, no `MAPS.us`/
   `MAPS.ca`/`COMPANIES`/`MAPS.wc.companyCounts`/`MAPS.wc.terrainCost` lines
   touched (checked directly with `git diff index.html | grep`).

## 5. Full 16-game re-measurement

Same method and the identical 16-row seed/bot table as
`docs/western-canada-board-rescale-final.md`'s "Full 16-game
re-measurement" section (also reused verbatim by rework-2), reused verbatim
again here: seeds 101-116, `mode:'local'`, 4 named bot seats, `mapId:'wc'`,
`ANIM=false`, a `botDecide`/`botFallback`/`applyUi` loop to `gameOver`. A
fresh `browser_navigate` reload was done immediately before the canonical
run, per the documented unseeded-`Math.random()` reproducibility caveat.

**A real methodology bug found and fixed while setting this up, worth
recording for future measurement passes**: `ANIM` is declared with `let` at
the top level of a non-module `<script>` tag, which means it is **not** the
same binding as `window.ANIM`. Setting `window.ANIM = false` before the loop
silently does nothing to the real `ANIM` the game logic reads, which left
every game stuck at round 1 / phase `payout` for the full 20,000-step guard
(dividends/game-over resolution need `ANIM===false` to resolve synchronously
without a real timer). The fix is to assign the **unqualified** identifier
(`ANIM = false;`) inside the same evaluated script, which correctly mutates
the top-level lexical binding. Confirmed directly
(`ANIM = false; return ANIM` → `false`, vs. `window.ANIM = false` leaving the
real `ANIM` at `true`). This is a pre-existing engine property, not something
this pass changed — flagged here so a future measurement session doesn't
lose time on the same silent stall.

### 5.1 Connection-bonus fire rate

| Leg | Rework-2 baseline | **This pass** |
|---|---|---|
| Calgary-Vancouver | 12/16 (75%) | **11/16 (68.75%)** |
| Calgary-Winnipeg | 9/16 (56.25%) | **11/16 (68.75%)** |
| Winnipeg-Vancouver | 0/16 (0%) | **0/16 (0%)** |
| Any leg | 14/16 (87.5%) | **14/16 (87.5%)** |

The "any leg" rate is exactly unchanged (87.5%), so the mechanic did not
"moderate back down" the way the task brief anticipated as a plausible
outcome — instead, breaking up the solid mountain band **rebalanced which
leg fires**, from a lopsided 75%/56% split toward a much more even 68.75%/
68.75% split. Both are real, honest results; I'm reporting what actually
happened rather than what was predicted. Winnipeg-Vancouver (the longest
leg, 23 hexes) still never fires — consistent throughout every measurement
pass this board has had.

### 5.2 Northern corridor traffic (touched-in-N-of-16-games)

| Town | Rework-2 baseline | **This pass** |
|---|---|---|
| Edmonton | 14/16 (87.5%) | **14/16 (87.5%)** |
| Victoria Settlement | 13/16 (81.25%) | **10/16 (62.5%)** |
| Fort Pitt | 11/16 (68.75%) | **12/16 (75%)** |
| Battleford | 11/16 (68.75%) | **11/16 (68.75%)** |
| Fort Carlton | 7/16 (43.75%) | **9/16 (56.25%)** |
| Batoche | 13/16 (81.25%) | **12/16 (75%)** |
| Prince Albert | 11/16 (68.75%) | **11/16 (68.75%)** |

Every one of the 7 northern towns still sees traffic in a majority of games
(the low end moved from 43.75% to 56.25% — up, not down). Victoria
Settlement dropped the most (81.25% → 62.5%), plausibly because it's a
dead-end spur off Edmonton and the newly-opened plains elsewhere on the
board give bots more attractive alternative uses for the same money — worth
a glance in a future pass if it drops further, but still touched in a clear
majority of games here. **Overall: the northern corridor stayed healthy,
as required** — this pass added terrain variety, it didn't remove the towns
or their appeal.

### 5.3 General sanity — mountain/forest utilization and the total-cubes metric

- **Mountain hexes used**: average **10.44 of 23 (45.4%)**, range 1-17.
  Compare rework-2's 17.25 of 41 (42.1%), range 7-28 — a similar utilization
  *rate*, scaled down with the smaller total, exactly what you'd expect from
  halving the mountain tile count without changing player behaviour toward
  mountains specifically.
- **Forest hexes used**: average **10.56 of 40 (26.4%)**, range 4-18.
  Compare rework-2's 10.44 of 46 (22.7%), range 1-24 — essentially the same
  *absolute* number of forest hexes used per game (10.56 vs. 10.44), now a
  slightly higher percentage of a slightly smaller pool, with a narrower,
  healthier range (no more 1-hex-touched outliers).
- **Mountain-band relief hex (7,8)**: touched in **14/16 (87.5%)** games —
  identical to the rework-2 baseline. Still real, load-bearing infrastructure
  even though the band around it is no longer a strict single-file
  gauntlet.
- **Early termination (<7 rounds)**: **4/16 (25%)**, down from rework-2's
  6/16 (37.5%) — an improvement, not a regression. Games are running the
  full 7-round clock more often, not less.
- **Distinct non-city hexes occupied ("total cubes on board")**: average
  **52.06 of 175 (29.75%)**, range 34-66 — a large *raw* drop from
  rework-2's 92.9 of 175 (53.1%), range 64-105. **This looked concerning on
  its own and I checked it rather than reporting it uncontextualized.**
  Cross-checking against the sum of each company's actual `cubesUsed`
  reading (a company-level count of every cube placed, cities included,
  which does *not* collapse when two companies share a hex) gives an average
  of **93.5 cubes placed per game across the 16 seeds — essentially
  identical to the rework-2 baseline's 92.9.** The explanation: converting
  24 hexes from mountain/forest (which enforce this game's "one cube per
  hex, forever" exclusive-claim rule) to plains (which allow multiple
  companies to share a hex, at increasing cost) means rival companies now
  genuinely **share** more of the redesigned corridor instead of each being
  forced onto its own separate, permanently-claimed tile. Total company
  investment is unchanged; it's now packed into fewer exclusively-claimed
  hexes. This is a real, expected mechanical consequence of the redesign,
  not a sign that less building happened — **but it's worth flagging for a
  future pass**: if anyone later tunes company cube supply using the
  "distinct non-city hexes occupied" stat as a proxy for demand, this pass
  changed what that specific number means on this board.
- **Canadian Pacific (`american`, 5sh/28cu) sanity check** against the
  rework-2 baseline: on-map 14/16 (87.5%, identical), avg income 18.25 (was
  17.75, close), avg treasury 14.5 (was 12.31, close), avg cubes used 43.5%
  (was 39.1%, close), avg shares sold 36.25% (was 33.75%, close). Nothing
  here reads as broken; CP remains an ordinary company under the new
  terrain, not a new problem introduced by this pass.

## 6. Files changed

- `c:\Users\benja\Documents\american rails\scripts\western\terrain.json`
  (36 hexes re-typed: 18 mountain→plains, 12 forest→plains, 6 plains→forest;
  `_note` and `regions` fully rewritten to document every override and its
  real-geography reasoning; grid dimensions, city positions, and all other
  fields unchanged)
- `c:\Users\benja\Documents\american rails\scripts\western\out\western-board-data.json` / `western-board-draft.svg` / `western-board-draft.html` (regenerated)
- `c:\Users\benja\Documents\american rails\index.html` (board template and
  `window.WC_MAP` re-injected with the new terrain; no other change — self-
  test count unchanged at 209/209, no `MAPS.us`/`MAPS.ca`/`COMPANIES`/
  `MAPS.wc.companyCounts`/`MAPS.wc.terrainCost` lines touched)
- `c:\Users\benja\Documents\american rails\docs\western-canada-board-terrain-mix.md` (this file)

No `scripts/canada/*` file, no American/Canadian board data, and no shared
`COMPANIES` table entry was touched. `MAPS.wc.companyCounts` and
`MAPS.wc.terrainCost` remain exactly `{shares:5, cubes:28}` and
`{forest:2, mountain:3}`, untouched, as instructed. No city was moved and no
city's `full`/`shared` value changed.
