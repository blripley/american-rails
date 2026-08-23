# Western Canada — grid-rescale prototype (spike)

Status: **PROTOTYPE / SPIKE, not committed to the board.** Nothing in
`scripts/western/*` or `index.html` in this repo was touched. All work
happened in a throwaway copy at
`C:\Users\benja\AppData\Local\Temp\claude\wc-rescale-prototype\`, which is
outside the repo and safe to delete at any time. `git status` in this repo
shows no changes from this work other than this report and its screenshot.

## The question

The balance-measurement pass (`docs/western-canada-board-balance-measurement.md`,
Q1) found the connection-bonus mechanic completely dead on the `wc` board —
0 of 16 bot games ever paid any of the three legs — because the hex grid is
too generous: Calgary-Vancouver (the shortest leg) is 17 hexes, Winnipeg-
Calgary 26, Winnipeg-Vancouver 43. The working equivalents on the other two
boards are 8 hexes (fires ~100%) and 11 hexes (fires ~28%). This spike asks:
if the grid is compressed (fewer columns/rows spanning the same real lon/lat
range), does Calgary-Vancouver land in a workable range, and does the board
still hold together?

## What was changed

Only `PROJ` in `project.mjs` (same real bounds, fewer grid cells) and `HEX`
(rendering size only, no effect on hex-distance):

| | Original (committed) | Prototype |
|---|---|---|
| `cols` | 40 | **24** |
| `rows` | 34 | **18** |
| `rowsPerDegLat` | 4.6 | **2.9** |
| `HEX` (hex pixel radius) | 24 | **40** (bumped only so the smaller grid still fills the 1700x1400 frame — purely cosmetic) |
| `lonLeft/lonRight/latTop` | unchanged | unchanged |

A short automated sweep (cube-distance estimate, not full BFS) was run
first across several candidate `cols`/`rows` pairs before settling on
24x18 — it landed Calgary-Vancouver at 10 hexes, comfortably inside the
8-14 target and close to the American board's own working 11-hex leg.
Other candidates tried (for reference): 26x20 → CV 11, 22x18 → CV 10,
20x16 → CV 10, 18x16 → CV 9. 24x18 was picked as a middle-of-the-brief
value (the task suggested 22-26 cols / 18-20 rows) rather than the most
aggressive option, to leave some margin before iterating further if needed.

## Resulting hex distances (measured two ways — they agree)

Both a standalone cube-coordinate estimate and the actual in-game
`BOARD[id].adj` BFS (via `cityHexByName` + a breadth-first search run live
in the injected prototype page, same method the original measurement pass
used) were checked; they matched to within routing slack:

| Leg | Original (committed board) | Prototype (24x18 grid) |
|---|---|---|
| Calgary-Vancouver (shortest) | 17 | **10** |
| Winnipeg-Calgary | 26 | **16** |
| Winnipeg-Vancouver | 43 | **23** |

Calgary-Vancouver landed at 10 — inside the 8-14 target range and close to
the American board's Chicago-Atlanta (11 hexes, fires ~28% of games). The
other two legs scaled down proportionately and remain longer, which the
task brief called expected and fine (the pattern on both working boards is
one leg that mostly fires and others that rarely do, not all three firing
evenly).

## Nudges/cuts needed to validate clean

Compressing the grid roughly **tripled city density** (34 cities in
24x18=432 hexes vs. the original 40x34=1,360 hexes — 7.9% vs. 2.5% of the
board). Where the original build needed nudges for exactly 4 flagged
clusters, the compressed grid produced **11 new adjacent-city pairs** on
first projection, well beyond those 4 clusters — including several that
were never a problem before: Calgary-Gleichen, Golden-Field-Cochrane-Banff
(a 4-way pileup, not the original 2-city collision), Regina-Fort Qu'Appelle,
Regina-Moose Jaw, Winnipeg-Portage la Prairie-Brandon (a 3-city chain),
Fort Macleod-Lethbridge, and Vancouver-Yale.

This was resolved with a small greedy nudge solver (written for this spike,
not part of the reusable pipeline) that tries increasingly large nudges on
the least-important city in each conflicting pair until the whole set
validates clean, keeping Winnipeg/Calgary/Vancouver's positions untouched
throughout (they're the three cities the whole exercise is measuring). It
converged in 15 nudge steps with **no city needing to be dropped**, but the
nudges needed are visibly larger than the original build's — several cities'
drift-from-natural-position more than doubled (Esquimalt's final nudge
moved it ~5.3 hexes off its raw projected position, vs. the largest nudge
in the committed board being closer to 2-3 hexes). All final positions stay
in-bounds (cols 0-23, rows 2-17) and the resulting board still validates
clean via `build-map.mjs`: connected, uniquely named, 5 hubs, 3 specials, no
two cities touching.

Terrain (`terrain.json`'s grid and `gen-terrain.mjs`'s region thresholds)
had to be fully re-derived, not just resized — the original thresholds were
row/col cutoffs tuned to the 34-row/40-col grid and produced nonsense at
18x24 (a first attempt gave 88 mountain / 22 plains hexes, i.e. most of the
southern two-thirds of the board reading as mountain). Re-deriving the
cutoffs from the new cities' actual rows/cols fixed this (46 mountain / 100
plains / 42 forest in the final version) — still a hand-tuned approximation
for a spike, not a precision terrain pass.

## A real problem the compression surfaced: the Vancouver Island water gap is gone

The committed board deliberately represents the Strait of Georgia as
off-map water with one narrow land crossing (documented in the build
report). At 24x18, the whole coastal cluster (Vancouver, Victoria, Port
Moody, New Westminster, Esquimalt, Nanaimo) is packed into roughly a 7x5
hex box — tight enough that the route-network terrain generator's normal
neighbour-padding merges the mainland and the island into solid contiguous
land with no off-map strait at all. The screenshot below shows this
directly: there's no water gap visible between Vancouver/Victoria and
Nanaimo/Esquimalt, just continuous yellow/green hexes. This isn't a
validation failure (nothing requires a water gap to exist) and doesn't
block the connection-bonus question this spike was about, but it is a
genuine loss of a documented design feature that would need deliberate
hand-carving (forcing specific cells back to off-map while preserving
connectivity) if this compression were ever adopted for real — not
attempted here, flagged as a known gap in this prototype.

## Does it still look like a legible board?

Yes. See `docs/western-canada-rescale-prototype.png` (full board,
screenshotted via Playwright against the rendered standalone SVG/HTML).
All 34 city labels are readable at their printed size, no overlapping text,
the mountain belt (grey) and boreal arc (green) and prairie (yellow) read
clearly as distinct regions, and the action table / year track / legend /
company plates all render correctly (this is the same `make-board-svg.mjs`
pipeline, unmodified, run against the compressed grid — it only needed the
larger `HEX` value to keep filling the frame). The board is visually denser
than the original — cities sit closer together on the page, which is the
whole point — but nothing looks cramped or illegible at this size.

## Bot-game read (small batch, 6 games)

Ran because time allowed. Injected the compressed board into a **separate,
untracked copy** of `index.html` in the scratch folder (via the existing
`inject.mjs`, run against that copy only) and served it on port 5178 — the
real repo's `index.html` was never touched (confirmed by `git status`
before and after). 6 games, seeds 201-206, mixed bot-difficulty rosters
(one all-medium, one all-hard, one all-extreme, three mixed-ladder), driven
headlessly the same way the original balance pass did (`botDecide`/
`botFallback`/`applyUi` looped to `gameOver`, `ANIM=false`).

| Seed | Bots | Year reached | Bonus fired |
|---|---|---|---|
| 201 | medium/medium/medium/medium | 1887 | none |
| 202 | hard/hard/hard/hard | 1887 | **liberty: Calgary-Vancouver** |
| 203 | extreme/extreme/extreme/extreme | 1887 | **american: Calgary-Winnipeg** |
| 204 | easy/medium/hard/extreme | 1887 | **continental: Calgary-Vancouver** |
| 205 | medium/hard/easy/medium | 1887 | **national + liberty: Calgary-Vancouver** (two different companies) |
| 206 | hard/extreme/medium/easy | 1886 (early end) | none |

**4 of 6 games (67%) saw at least one connection bonus fire**, vs. 0 of 16
at the original scale — Calgary-Vancouver (the leg this spike specifically
targeted) fired in 4 separate companies across 4 different games, and even
the much-longer Winnipeg-Calgary leg (16 hexes) fired once, in the
all-extreme control. This is a 6-game sample, not a full 16-game
measurement pass, so the exact fire-rate percentage shouldn't be taken as
final — but the qualitative result (dead mechanic → clearly-live mechanic)
is a strong, unambiguous signal in the direction the compression was meant
to produce.

The self-test suite was also run against the injected prototype:
**202/204 passing**. The 2 failures are both expected and not bugs: `WC:
board has tiles` and `WC: tile geometry is the Western board's, and pieces
scale with it` check the committed board's exact tile count (342) and hex
radius (24) — both intentionally different in this prototype (222 tiles,
radius 40). Every structural/gameplay assertion (connectivity, no-adjacent-
cities, 5 hubs, 3 specials, connection bonus firing and not double-paying,
a full bot game reaching `gameOver`) passed.

## Honest assessment

**Viable, worth pursuing** — with two things to plan for, not blockers:

1. **The nudging work is real and bigger than the original pass.** Tripling
   city density from compression means roughly 3x as many adjacency
   conflicts to resolve by hand (or by a solver like the one written for
   this spike) if this were promoted to the committed board. It's
   mechanical, bounded work (nothing got stuck needing a dropped city here),
   but it's not free.
2. **The Vancouver Island water-gap feature needs deliberate rework**, not
   automatic regeneration, if compression is adopted — the existing
   generator's neighbour-padding logic doesn't leave room for it at this
   density and it would need hand-carved off-map cells plus probably a
   dedicated regression check (the self-test suite already has one
   assertion for this exact feature, `WC: every tile is reachable... (incl.
   Vancouver Island across the strait)` — it still passes here only because
   "reachable via solid land" trivially satisfies "reachable," not because
   the water-gap abstraction survived).

Everything else came back clean: no city needed dropping, the board is
still legible, `build-map.mjs` validates without complaint, the self-test
suite is green apart from two assertions that were supposed to change, and
the actual question this spike was testing — does compression make the
connection bonus fire? — came back with a clear yes (0/16 → 4/6 in a quick
read). Recommend treating 24 cols x 18 rows as a solid starting point for a
real implementation pass, not a final number — the task brief itself framed
this as an estimate to iterate from, and a real pass should re-run the
full 16-game measurement (not just this spike's 6) once the water-gap and
nudge work is done properly rather than greedily.

## Shortcuts taken (spike, not production)

- Terrain region boundaries were re-derived by eye from the new cities'
  rows/cols, not recomputed from any principled rule — good enough to read
  as "prairie/mountain/boreal/coast" at a glance, not fine-tuned.
- The nudge solver is a blunt greedy search (try nudges in expanding rings,
  take the first improvement) — it produces *a* clean layout, not
  necessarily the most geographically sympathetic one. Several cities
  (Esquimalt especially) ended up further from their real-world neighbours
  than a human doing this by hand likely would have chosen.
- The Vancouver Island water gap was not hand-fixed (see above) — explicitly
  left as a known gap rather than spending spike time on it.
- The bot-game batch was 6 games, not the full 16-game measurement-pass
  protocol — a fast directional read, not a final balance number.
- Company values/counts/terrain costs were left completely untouched (out
  of scope for this spike, which was only testing the grid-distance
  question).

## Files (all in the scratch folder, NOT this repo, except the two named above)

- `C:\Users\benja\AppData\Local\Temp\claude\wc-rescale-prototype\scripts\western\project.mjs` (rescaled grid)
- `C:\Users\benja\AppData\Local\Temp\claude\wc-rescale-prototype\scripts\western\cities.json` (re-nudged)
- `C:\Users\benja\AppData\Local\Temp\claude\wc-rescale-prototype\scripts\western\terrain.json` (regenerated at 24x18)
- `C:\Users\benja\AppData\Local\Temp\claude\wc-rescale-prototype\scripts\western\resolve.mjs` (the greedy nudge solver written for this spike)
- `C:\Users\benja\AppData\Local\Temp\claude\wc-rescale-prototype\scripts\western\out\western-board-draft.svg` / `.html` (rendered prototype board)
- `C:\Users\benja\AppData\Local\Temp\claude\wc-rescale-prototype\index.html` (a copy of the repo's `index.html`, with the prototype board injected — the repo's own copy was never touched)
- `c:\Users\benja\Documents\american rails\docs\western-canada-rescale-prototype.png` (screenshot, committed)
- `c:\Users\benja\Documents\american rails\docs\western-canada-rescale-prototype.md` (this file, committed)
