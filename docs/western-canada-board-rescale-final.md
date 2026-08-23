# Western Canada (CPR, 1881-1887) board — grid rescale, final implementation

Status: **DONE**. The committed `wc` board's grid geometry has been replaced
end-to-end (project.mjs → cities.json → terrain.json → build-map.mjs →
make-board-svg.mjs → inject.mjs → index.html), re-measured with a full
16-game bot pass, and self-tested in a real browser. Nothing pushed to any
remote. Company share/cube counts, city income values, and terrain movement
costs were **not** touched — this pass is scoped to grid geometry only, per
the task brief.

## Headline: did the connection-bonus fix hold at full scale?

**Yes, directionally — the mechanic is unambiguously alive, though the
16-game fire rate is more modest than the 6-game spike's own read.** Across
one full, clean 16-game pass (fresh page load, seeds 101-116):

- **Calgary-Vancouver fired in 4 of 16 games (25%)** — the leg this whole
  rework targeted, up from **0 of 16** on the committed board.
- **Calgary-Winnipeg fired in 1 of 16 games (6.25%)**, also up from 0/16.
- **Winnipeg-Vancouver still never fired (0/16)** — expected; it's the
  longest leg (23 hexes) and the working boards' own pattern is "one leg
  mostly fires, the others rarely or never," not all three firing evenly.
- **At least one bonus fired in 4 of 16 games (25%)** total.

This is a real, unambiguous fix to a completely dead mechanic, and it holds
up under an honest full-scale measurement — but see "A note on
reproducibility" below: a second, contaminated run of the same 16 seeds
(run without reloading the page first) produced a noticeably higher fire
rate (9/16 games with any bonus), which turned out to be a measurement
artifact, not a real result. The 4/16 number above is from a single clean
run and is the one to trust; it is still a firm, real result (any
double-digit-percent leg is worlds away from a mechanic that never once
fired across 32 combined games in two separate passes at the old scale),
just more modest than the spike's small-sample 4/6 (67%) suggested.

## Final grid

`scripts/western/project.mjs`:

| | Old (committed, pre-rescale) | Spike | **Final (this pass)** |
|---|---|---|---|
| `cols` | 40 | 24 | **24** |
| `rows` | 34 | 18 | **20** |
| `rowsPerDegLat` | 4.6 | 2.9 | **2.9** |
| `HEX` (pixel radius) | 24 | 40 | **40** |
| `OX, OY` | 60, 70 | (unset/inherited) | **60, 60** |
| lon/lat bounds | unchanged throughout | unchanged | **unchanged** |

20 rows, not the spike's 18: rows 0-17 hold every mainland city (identical
to the spike), but rows 18-19 are a deliberate 2-row buffer that exists
*only* so the Vancouver Island cluster has room to sit south of the
mainland with a real water gap, without dropping into the printed
company-plates strip at the bottom of the frame (see "Panel/frame fit"
below — the first attempt used 22 rows and Esquimalt/Victoria visibly
overlapped the plates row in the rendered board; 20 rows plus repositioning
Esquimalt fixed this cleanly). `OY` was reduced from 70 to 60 to buy back a
little more vertical headroom for the same reason.

## Hex distances achieved

Measured via `BOARD[id].adj` BFS through `cityHexByName`, same method as
both prior passes:

| Leg | Original (40x34) | Spike (24x18) | **Final (24x20)** |
|---|---|---|---|
| Calgary-Vancouver | 17 | 10 | **10** |
| Winnipeg-Calgary | 26 | 16 | **16** |
| Winnipeg-Vancouver | 43 | 23 | **23** |

Identical to the spike's numbers — the extra 2 buffer rows and the OY
change don't touch any mainland city's row, so the corridor geometry is
byte-for-byte the same shape, just with a properly worked island glued on
south of it. Calgary-Vancouver (10 hexes) sits comfortably inside the
brief's 8-14 target range, close to the American board's own working
11-hex Chicago-Atlanta leg.

## Nudges: how they were re-derived properly

A bearing-constrained smallest-nudge solver was written for this pass
(scratch file, not committed — see "Files" below), explicitly built to
avoid the spike's "blind ring search in all directions" shortcut:

1. For each conflicting pair (same-hex clash or hex-adjacency), the
   **lower-importance city moves** (hubs and the three frozen cities score
   `Infinity`; everything else scores by hub/special flags plus printed
   value) — mirroring the original board's own logic of protecting anchor
   cities and moving their satellites.
2. Winnipeg, Calgary and Vancouver — the three cities this whole exercise
   measures — were kept at their raw projected positions throughout, never
   nudged, so the reported hex distances are the real output of the grid
   choice, not of an arbitrary nudge.
3. The mover's real-world bearing (from the city it collided with) is
   converted to hex-cube coordinates and used to rank the 6 hex directions
   by how well they match that bearing. The solver tries the **3
   best-matching directions first**, at increasing distance (1 hex, then
   2, then 3...) — never widening to a worse-matching direction until every
   distance up to 8 hexes has been exhausted in the better cone. Only if a
   real geographic direction is flatly unavailable (see Winnipeg/Selkirk
   below) does it fall back to the next 2 directions.
4. Vancouver Island (Victoria/Esquimalt/Nanaimo) was deliberately **excluded**
   from the automatic solver and hand-placed instead, together with the
   water-gap carving (see below) — the two problems are the same problem
   at this density and needed to be solved together, not sequentially.

Every nudge, with its real-world reasoning, is documented inline in
`cities.json`'s `nudgeWhy` fields (all rewritten for this pass, prefixed
`RESCALE:`). The two largest nudges and why they're legitimately large, not
solver laziness:

- **Golden (3 hexes)**: real bearing from Field is due west-southwest, but
  the immediate 1- and 2-hex cells in that direction are already occupied
  by Revelstoke and Banff (themselves pushed in from the same mountain
  pileup) — verified by hand-tracing the solver's rejected candidates, the
  3-hex placement is the *first* one that clears Field, Revelstoke **and**
  Banff simultaneously, not an arbitrary distance.
- **St. Boniface / Winnipeg (3 hexes)**: in reality St. Boniface is
  essentially touching Winnipeg (across the Red River, ~1km). At this
  grid's resolution the map's own east edge (`lonRight`, chosen in the
  original build to sit "east of Selkirk") lands *at* Winnipeg's column,
  so the real-world direction (due east) simply isn't available at any
  distance — this is a genuine structural consequence of compression (the
  fixed real-world margin east of Selkirk, ~0.5 degrees, maps to under one
  hex-column at this density regardless of how the exact column count is
  tuned; reaching a full spare column there would require a grid close to
  the original's 40-column scale, defeating the point of this rework). The
  solver's fallback correctly found the nearest still-available direction
  (south-southwest) rather than forcing an impossible eastward placement.

By contrast, most other nudges (Cochrane, Selkirk, Fort Qu'Appelle, Indian
Head, Gleichen, Yale) are 1 hex, and the rest are 2 — a real, if expected,
increase from the original board's nudges (mostly 0-1 hex) given city
density roughly doubled (34 cities in 204 tiles here vs. 342 there), but
nothing near the spike's worst offender (Esquimalt's ~5.3-hex drift).
Esquimalt in this pass needed only a 2-hex nudge (to a hex 2 columns east
of Victoria, same row) once it was designed together with the water gap
rather than solved blind.

## The Vancouver Island water gap — exactly how it was carved

This was the task's central requirement, and the one place a purely
mechanical solver could not be trusted (confirmed by testing: the first
automated terrain generation pass, before any hand-carving, produced a
**solid, unbroken land connection** — row 16 read `PPPPP` across the whole
coastal band, and removing any single hex from it changed total
connectivity by only 1 tile. There was no bottleneck at all; the water gap
was gone exactly as the spike's report warned.).

**Final layout** (`scripts/western/terrain.json`, rows 15-19, cols 0-4):

```
row15: P C P C P     Vancouver(col1) / Port Moody(col3) -- mainland
row16: O P O P O     col1 = THE BRIDGE.  col3 = a separate, unrelated
                     mainland-only connector (Port Moody <-> New Westminster)
row17: C O C O O     Nanaimo(col0) / New Westminster(col2) -- col1 off-map
row18: P P O O O     island interior (Nanaimo -> Victoria), leak at col2-3 cut
row19: C P C P O     Victoria(col0) / Esquimalt(col2) -- island, south end
```

- **The bridge is exactly one hex: (1,16).** It is directly hex-adjacent to
  *both* Vancouver (1,15) and Nanaimo (0,17) — the same "narrow two-hex
  crossing" concept the original 40x34 board used (there: two land hexes
  between Vancouver's neighbour and Nanaimo; here, one, because the whole
  gap has compressed to 2 hexes point-to-point). It carries no city, no
  special value — it's a plain hex whose only job is to exist.
- **(3,16)** carries something unrelated: it's the only way Port Moody and
  New Westminster stay connected to each other and to Vancouver's cluster
  at this density (their own real-world triangle collapsed almost onto one
  hex). It does not touch the island at any distance and was verified not
  to.
- **Two deliberate cuts** closed a "back door" the automatic generator's
  route-padding produced on the first pass: New Westminster's own approach
  route originally continued south through (2,18)/(3,18) into the island's
  interior without ever touching the bridge. Forcing (17,1), (18,2) and
  (18,3) off-map (see the grid above) closed this without affecting any
  other city's connectivity.

**Verification that this is a real, load-bearing chokepoint** (not just an
unused decorative hex, which is exactly what the spike's report warned the
existing self-test assertion would let slip through unnoticed):

- Standalone BFS check (`scripts/western/*` scratch script, not committed):
  removing hex `1,16` from the 204-tile board's adjacency graph drops
  reachability from Vancouver's side by **exactly 8 tiles** (196 remain
  reachable, vs. 204 total minus the removed node) — those 8 are precisely
  Nanaimo, Victoria, Esquimalt and their connecting tiles. No other route
  exists.
- This exact check is now baked into `index.html`'s `window.__selfTest()`
  as three new assertions (see below) — it would fail immediately if the
  gap were ever silently filled back in, which the spike's own single
  "reachable from every other" assertion admittedly would not have caught.

## Terrain regions — re-derived from actual city positions, not eyeballed

`scripts/western/gen-terrain.mjs`'s `terrainFor()` was rewritten from
scratch against the *rescaled* cities' real rows/cols (not resized
thresholds from the 40x34 grid, and not an eyeballed re-guess):

- **Northern boreal arc** (forest, rows 0-6): catches Edmonton (row 2),
  Battleford (row 5), Prince Albert (row 3) with a small margin.
- **Rockies/Selkirks chokepoint** (mountain, cols 3-10 × rows 7-12): every
  one of Cochrane, Field, Calgary, Revelstoke, Gleichen, Banff, Kamloops
  and Golden lands inside this exact box — checked directly against each
  city's final projected position, not assumed. Fort Macleod and
  Lethbridge (both row 13) sit deliberately just outside it, matching the
  build report's own city-role list (prairie/foothills towns, not mountain
  towns).
- **Fraser Canyon** (mountain, cols 0-3 × rows 11-14): catches Yale.
- **Lower Mainland lowlands** (plains, cols 0-3 × rows 15-17): Vancouver,
  Port Moody, New Westminster, the near shore.
- **Vancouver Island** (cols 0-3 × rows 17-19): Nanaimo at the crossing
  itself, Victoria/Esquimalt one row further south.
- **Prairie corridor**: everything else still standing.

Final tile mix: **204 tiles total — 34 city, 83 plains, 45 forest, 42
mountain** (`node scripts/western/build-map.mjs` output). Total printed
value unchanged at 111 full / 71 shared (city values were not touched).

## Panel/frame fit — a real mid-pass correction

The first full render (22-row grid, Esquimalt at row 21) visibly clipped
into the printed company-plates strip at the bottom of the 1700x1400
frame — Esquimalt's label text overlapped the "CANADIAN PACIFIC" plate.
Fixed by: reducing `rows` from 22 to 20, reducing `OY` from 70 to 60, and
moving Esquimalt from `(1,21)` to `(2,19)` (same row as Victoria, 2 columns
east, rather than 2 rows further south) — this fit the whole island cluster
into 3 rows (17-19) instead of 5, without changing any mainland city's
position. Re-rendered and re-screenshotted to confirm the fix (see
Screenshot section).

The two water-flavour labels ("Pacific Ocean", "Vancouver Island") also
needed repositioning in `make-board-svg.mjs` — their old fixed pixel
coordinates were tuned for the 40x34 board's much larger frame and landed
either at the wrong latitude (row 10ish instead of row 15ish) or directly
underneath opaque land-hex art (labels are drawn before the hex field in
the SVG's paint order, so anything landing under a hex tile is invisible).
Both were moved to confirmed-blank parchment coordinates and verified
visually.

## Self-test

**207/207 passing** (was 204/204 before this pass — 3 new assertions
added, 2 existing assertions updated for the new geometry, one dropped
along with its now-inapplicable comparison). Confirmed live via Playwright
against `node scripts/serve.mjs` at `http://localhost:5177/` on a fresh
page load — `window.__selfTest()` returns `{passed:207, total:207}` with no
thrown error.

Changes in `index.html`'s `window.__selfTest()`:

- `'WC: board has tiles'` now asserts the exact real count (**204**), not
  the old loose `>300` threshold (which was written for a 342-tile board
  and would have silently passed at almost any reasonable size).
- `'WC: tile geometry is the Western board's...'` now asserts `HEX===40`
  and `PIECE_SC===40/41` (was 24 / 24/41).
- **Three new assertions**, specifically written so a regression that
  silently fills the water gap back in would fail immediately (the exact
  gap the spike's report flagged: its one water-gap assertion "still
  passes here only because 'reachable via solid land' trivially satisfies
  'reachable'"):
  1. The bridge hex `1,16` is real land, directly adjacent to *both*
     Vancouver and Nanaimo.
  2. Vancouver and Nanaimo are close but **not** directly hex-adjacent (a
     strait, not solid land).
  3. Removing the bridge hex from a BFS starting at Vancouver leaves
     Nanaimo, Victoria and Esquimalt **all** unreachable — i.e. the bridge
     is a genuine, provable single point of failure, not an incidental
     unused tile.

## Screenshot observations

Rendered via `window.startGame({mode:'local', names:['A','B','C','D'],
mapId:'wc'})` in the live app (screenshot taken at the game's opening
Canadian Pacific auction, board fully visible). Confirmed directly:

- All 34 city labels legible at their printed size, no overlapping text,
  no clipping into the company-plates strip after the panel-fit
  correction.
- Terrain reads sensibly at a glance: green boreal arc top-centre
  (Edmonton/Battleford/Prince Albert), grey mountain belt through the
  Field-Calgary-Gleichen corridor, yellow prairie/lowland everywhere else,
  a small tan patch for Vancouver Island itself.
- **A real, visible water gap** between the mainland coastal cluster
  (Vancouver/Port Moody/New Westminster) and Vancouver Island
  (Nanaimo/Victoria/Esquimalt): blank parchment with exactly one visible
  connecting hex bridging Vancouver down to Nanaimo, and New Westminster
  sitting in its own small pocket connected back to Port Moody rather than
  across the gap. This was directly compared against a zoomed crop of the
  same region and confirmed legible at both full-board and zoomed-in scale.
- Company sidebar and board plates show the correct six company names and
  cube counts (Canadian Pacific 38 cubes, the other five unchanged),
  confirming the injection didn't disturb the company-naming/asymmetry
  work from the original build pass.

## Full 16-game re-measurement — method and a reproducibility caveat

Same method as the original pass: `node scripts/serve.mjs`, Playwright
`browser_evaluate` against the live page (not `window.__selfTest()`,
same reason as before — `playBots` is a closure), `setMap('wc')` +
`ANIM=false` + a `botDecide`/`botFallback`/`applyUi` loop to `gameOver`,
seeds 101-116, `mode:'local'`, 4 named bot seats.

**Bot difficulty assignment**: the original measurement doc's prose gives
the full rotation *scheme* (hard rotated through all 4 seats in 101-104;
an extreme/hard/medium/easy mix rotated through seat orders across
105-108 and 113-116; one all-easy/all-hard/all-extreme/all-medium control
each in 109-112) but only publishes 2-3 example rows verbatim, not the
full 16-row table. This pass reconstructed the same structure, confirmed
against every example the original doc does give (seed 104 =
medium/medium/medium/hard; seed 107 = easy/medium/hard/extreme; seed 109 =
all-extreme; seed 111 = all-hard; seed 112 = all-medium, 0 cubes), and
filled in the remaining rows with a documented, consistent rotation rule
(cyclic rotation of a base 4-tuple; the 4-controls block filled in by
elimination against the confirmed rows). **This is a faithful
reconstruction of the same protocol, not a byte-exact replay of an
unpublished table** — flagged honestly rather than presented as more exact
than it is. The exact 16-row table used:

| Seed | Bots (seat order) |
|---|---|
| 101 | hard/medium/medium/medium |
| 102 | medium/hard/medium/medium |
| 103 | medium/medium/hard/medium |
| 104 | medium/medium/medium/hard |
| 105 | hard/extreme/easy/medium |
| 106 | extreme/easy/medium/hard |
| 107 | easy/medium/hard/extreme |
| 108 | medium/hard/extreme/easy |
| 109 | extreme/extreme/extreme/extreme |
| 110 | easy/easy/easy/easy |
| 111 | hard/hard/hard/hard |
| 112 | medium/medium/medium/medium |
| 113 | medium/easy/extreme/hard |
| 114 | easy/extreme/hard/medium |
| 115 | extreme/hard/medium/easy |
| 116 | hard/medium/easy/extreme |

**A genuine reproducibility finding, worth flagging on its own merits**:
running this exact 16-seed harness twice in the *same* browser session
(without reloading the page between runs) produced measurably different
results each time — e.g. one contaminated run showed 9/16 games firing at
least one connection bonus, another showed 6/16, while a **fresh page
load** followed by a single run gave 4/16. This means some part of the
bot/game logic calls unseeded `Math.random()` in addition to the seeded
per-game RNG, so results depend on how much unrelated randomness has
already been consumed earlier in the page's life (e.g. by a prior
`window.__selfTest()` run) — the `seed` parameter does not fully pin down
a game's outcome across repeated invocations in one session. **The numbers
below are from a single run immediately after a fresh page load**,
matching the safest, most standard interpretation of the original
protocol, and the one this report treats as canonical. This
non-determinism is a pre-existing engine property (not something this
geometry-scoped pass introduced or should fix), flagged here as a finding
for a future session, not fixed in this pass.

## Full 16-game results — direct comparison to the original baseline

### 1. Connection-bonus fire rate (the headline metric)

| Leg | Hex distance | Original (0/16 all three) | **This pass** |
|---|---|---|---|
| Calgary-Vancouver | 10 | 0/16 (0%) | **4/16 (25%)** |
| Calgary-Winnipeg | 16 | 0/16 (0%) | **1/16 (6.25%)** |
| Winnipeg-Vancouver | 23 | 0/16 (0%) | **0/16 (0%)** |
| Any leg | — | 0/16 (0%) | **4/16 (25%)** |

Fixed. Not fully "healthy" by the standard of the Canadian board's ~100%
Toronto-Montréal leg, but the mechanic went from provably, structurally
impossible (distances 2-4x the working boards' own legs) to firing on a
real, repeatable fraction of games — the entire point of this rework.

### 2. Edmonton traffic

**3 of 16 games (18.75%)** saw any cube placed on Edmonton (seeds 109, 111,
113), vs. the original **2 of 16 (12.5%)**. A modest improvement, not a
fix — Edmonton is still touched in a small minority of games, still mostly
by higher-difficulty bots. This is an incidental side effect of shorter
overall routing distances board-wide (nobody touched Edmonton's price),
**not evidence the Owen-Sound-style value problem is solved** — per the
task's constraints, city values were not changed in this pass, and if
Edmonton traffic still looks this thin, that remains a real candidate for
a future value-only pass, exactly as the original build report flagged.

### 3. Income/value drain (early-termination rate)

**1 of 16 games (6.25%) ended before 1887** (seed 115, stopped at 1885 —
5 of 7 rounds played), vs. the original **5 of 16 (31%)**. A large,
genuine improvement. The likely mechanism (not proven, offered as the most
plausible explanation): the same total printed city value (111/71) is now
reachable with far less track-laying distance between cities (204 tiles
vs. 342 for the same city count), so companies can develop a comparable
amount of value while consuming a smaller fraction of their fixed cube
supply — meaning the board's price-to-distance ratio effectively improved
even though no price or cube count was touched. Worth confirming
deliberately if a future pass revisits city values.

### 4. Canadian Pacific (`american`, 7 shares / 38 cubes)

Same table shape as the original, all 6 companies from the same 16-game
pass:

| Company | On map (of 16) | Avg income | Avg treasury | Avg cubes used | % of cube supply used | Avg shares sold | % of share supply sold | Ownership concentration |
|---|---|---|---|---|---|---|---|---|
| **american (CP, 7sh/38cu)** | **12/16** | **10.88** | **10.44** | **9.19** | **24.2%** | **1.31** | **18.7%** | **0.85** |
| national (4sh/29cu) | 16/16 | 25.44 | 3.19 | 14.88 | 51.3% | 1.94 | 48.4% | 0.79 |
| continental (3sh/26cu) | 16/16 | 27.63 | 1.13 | 17.31 | 66.6% | 2.44 | 81.3% | 0.61 |
| majestic (4sh/22cu) | 16/16 | 18.75 | 5.44 | 15.44 | 70.2% | 1.94 | 48.4% | 0.80 |
| liberty (2sh/19cu) | 16/16 | 24.63 | 2.69 | 14.69 | 77.3% | 1.81 | 90.6% | 0.63 |
| republic (3sh/17cu) | 16/16 | 24.13 | 6.31 | 14.25 | 83.8% | 2.31 | 77.1% | 0.68 |

Compared directly to the original's own table (income 8.75/$1.00
treasury/17.9%/16.1%/0.97): **the geometry fix incidentally helped on
every one of the original's specific complaints except founding rate,
which got slightly worse** (CP now fails to get founded at all in 4 of 16
games — seeds 105, 106, 108, 112 — vs. the original's 1 of 16). Income,
cube-spend fraction and share-sale fraction all rose; ownership
concentration fell (shares that do sell are less likely to all go to one
hoarding bot). **But CP is still worst-in-class on every column except
treasury**, where it flipped from lowest ($1, "always broke") to *highest*
(10.44) — a different-flavoured version of the same underlying problem:
instead of a company nobody buys shares of, it's now more often a company
that gets bought into a little, then its cash just sits there unspent
because its own 38-cube pile is still too large relative to what a 7-round
game can use. **Per the task's constraint, share/cube counts were not
touched in this pass — this is reported as unfinished business for a
future pass, exactly as flagged**, not fixed here. The rescale did not
solve Canadian Pacific; it changed which specific symptom shows up worst.

### 5. Northern boreal branch traffic

| | Path length (hexes) | Avg cubes placed | Range | Avg hexes touched (of path) |
|---|---|---|---|---|
| Boreal branch (Edmonton-Battleford-Prince Albert) | 10 | **3.0** | 0-7 | 3.0/10 (30%) |
| Main corridor (Winnipeg-Calgary-Vancouver) | 27 | **17.44** | 11-25 | 14.81/27 (54.8%) |

Compared to the original (boreal: 14-hex path, avg 2.9 cubes, range 0-10,
2.8/14 ≈ 20% touched; corridor: 44-hex path, avg 12.0 cubes, range 7-15,
11.7/44 ≈ 27% touched): the boreal branch's absolute traffic is
essentially unchanged (2.9 → 3.0 avg cubes, same 4-of-16-games-untouched
rate as before), while the main corridor's per-hex touch rate roughly
doubled (27% → 54.8%) now that it's a much shorter, more attractive
target relative to the branch. The branch reads as *relatively* more
starved than before by this specific ratio (30% vs. 54.8%, a ~1.8x gap,
versus the original's ~1.3x gap), though its absolute traffic level is
unchanged — consistent with, not contradicting, the original build
report's prediction that this single-file branch would see comparatively
low traffic, same pattern as the Canadian board's Shield interior.

## Constraints honoured

No company share/cube counts, city income values, or terrain movement
costs were changed anywhere in this pass — confirmed by diff: `cities.json`
changes are `nudge`/`nudgeWhy` fields only (`full`/`shared`/`hub`/`special`
untouched), and `MAPS.wc.companyCounts` in `index.html` is byte-identical
to before. Edmonton and Canadian Pacific both remain real, open problems
for a future value/company-count-focused pass, reported clearly above
rather than fixed here.

## Files

- `c:\Users\benja\Documents\american rails\scripts\western\project.mjs` (rescaled grid: 24x20, HEX 40, OX/OY 60/60)
- `c:\Users\benja\Documents\american rails\scripts\western\cities.json` (all nudges re-derived; Vancouver Island hand-placed)
- `c:\Users\benja\Documents\american rails\scripts\western\terrain.json` (grid regenerated + hand-carved water gap; regions re-authored)
- `c:\Users\benja\Documents\american rails\scripts\western\gen-terrain.mjs` (terrainFor() rewritten for the new grid; kept for reference/regeneration)
- `c:\Users\benja\Documents\american rails\scripts\western\make-board-svg.mjs` (water-label positions fixed for the new frame fit)
- `c:\Users\benja\Documents\american rails\scripts\western\build-map.mjs` (unchanged — validated the new data clean)
- `c:\Users\benja\Documents\american rails\scripts\western\inject.mjs` (unchanged — spliced the new board into index.html)
- `c:\Users\benja\Documents\american rails\scripts\western\out\western-board-data.json` / `western-board-draft.svg` / `western-board-draft.html` (regenerated)
- `c:\Users\benja\Documents\american rails\index.html` (`window.WC_MAP`, `tpl-board-wc`, 3 new + 2 updated self-test assertions)
- `c:\Users\benja\Documents\american rails\docs\western-canada-board-rescale-final.md` (this file)

The bearing-constrained nudge solver, the water-gap connectivity checker,
and the 16-game measurement harness were all written as throwaway scratch
scripts for this session (outside the repo) and are not committed —
their output is fully captured in `cities.json`'s `nudgeWhy` fields,
`terrain.json`'s region notes, and this report.
