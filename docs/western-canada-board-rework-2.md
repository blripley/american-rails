# Western Canada (CPR, 1881-1887) board — rework pass 2

Status: **DONE**. All 5 of Ben's points from playing the board himself are
addressed. Nothing pushed to any remote (branch `stage2-ui`). American and
Canadian board files/data are untouched (confirmed by `git diff --stat` —
only `index.html` and `scripts/western/*` changed).

**Confidence up front:** I'm confident this addresses all 5 points solidly.
The one thing I did NOT fully solve — flagged honestly below, not hidden —
is the mountain-gauntlet monopoly-lockout problem: I applied a real,
structural, single-hex relief valve (mirroring the Canadian board's own
fix), and confirmed it gets used in play, but a 16-game sample never
happened to catch two different companies sharing it, so the "breaks a
strict monopoly" benefit is demonstrated structurally, not empirically. A
full mountain-band redesign was explicitly out of scope per the task's own
risk guidance, and I agree with that call.

## 1. Ben's 5 points — addressed how

1. **"Shrink the tiles... too big, falling off the board."** Done. `HEX`
   40 → 38 (see §2). The old grid overflowed the 1700px frame width by
   ~23px with zero margin; the new one leaves ~60px of clean margin on
   every side.
2. **"Rethink action/year/development/tile-price label positions... pieces
   should fit within the labels."** Done. All four panels repositioned
   from scratch for the new grid (see §3), verified empirically via
   Playwright screenshots at both full-board and zoomed-in scale — overlay
   locomotives, cubes and houses all land inside their printed borders.
3. **"Remove the Vancouver Island portion... add more towns in the north
   instead."** Done. Victoria/Esquimalt/Nanaimo and the whole water-gap
   apparatus are gone; 4 new real, sourced towns went into the northern
   corridor (see §4-5).
4. **"[Terrain cost] a bit more difficult is good, but not this much."**
   Done. Forest/mountain expansion cost softened from the shared $3/$5 to
   a WC-specific $2/$3 (see §6), via a new `MAP.terrainCost` field
   following the exact `years`/`companyCounts` optional-override pattern.
5. **CPR shares 7→5.** Already done in a prior commit (`552f424`);
   verified untouched — `MAPS.wc.companyCounts.american` is still
   `{shares:5, cubes:28}`.

## 2. Grid/HEX: final dimensions and why

| | Before (rescale-final) | **After (this pass)** |
|---|---|---|
| `cols` | 24 | **24** (unchanged) |
| `rows` | 20 | **18** |
| `HEX` | 40 | **38** |
| `OX, OY` | 60, 60 | **60, 60** (unchanged) |

Two independent, additive fixes, both in `scripts/western/project.mjs`:

- **Rows 20 → 18.** The old rows 18-19 existed solely as a buffer so
  Vancouver Island had room south of the mainland. With the island gone,
  every remaining city sits in rows 0-17, so the buffer is deleted
  outright rather than left as dead space.
- **HEX 40 → 38.** Computed, not guessed, and not copied from the
  Canadian board's 34 (different cols/rows, so a different number is
  expected): width fit is `cols*HEX*sqrt(3) + OX`. At HEX=40 that's
  `24*40*1.7320508 + 60 = 1722.8` — already **over** the 1700px frame
  width before any margin, which is exactly Ben's "falling off the board"
  complaint. At HEX=38: `24*38*1.7320508 + 60 = 1639.6`, leaving **60.4px**
  of clean right margin — almost exactly matching the 60px left margin
  (`OX`), a real, symmetric margin rather than a bare fit.
  Vertically: `18*38*1.5 + 60 = 1086px` against a 1400px frame, leaving
  314px of open parchment below the map — expected and useful, since this
  board reads as a long, narrow east-west band (confirmed in the original
  build report) and that vertical slack is exactly where the panels now
  live (§3).

Because `cols`, the lon/lat bounds, and `rowsPerDegLat` are **all
unchanged**, every mainland city's projected column and row is
byte-identical to the rescale-final pass — including Winnipeg, Calgary and
Vancouver, so the previously-measured hex distances (Calgary-Vancouver 10,
Winnipeg-Calgary 16, Winnipeg-Vancouver 23) are untouched by this
geometry change. Verified: zero city nudges needed to change because of
the row/HEX shrink — only the 3 island cities were removed and 4 new
northern ones added (§4-5).

One deliberate leftover: column 0 is now almost entirely empty (a single
plains hex at (0,15), legitimate route-padding next to Vancouver) since it
was Nanaimo/Victoria's column. I chose not to shift the whole grid left to
reclaim it — doing so would change `colsPerDegLon` and re-derive every
city's column, which risks re-perturbing the already-measured Winnipeg/
Calgary/Vancouver distances for a purely cosmetic gain. The empty column
reads as a bit of extra left margin, not a bug.

## 3. Panel redesign and how overlay-fit was verified

All 4 panels (`scripts/western/make-board-svg.mjs`'s `PANELS` array) were
redesigned from scratch, computed from the **actual land bounding box** in
true canvas pixels (`x:[93,1607], y:[60,1029]`, measured directly from
`western-board-data.json`'s cells, not eyeballed):

| Panel | Old `to` (rescale-final) | **New `to`** | Why |
|---|---|---|---|
| Action table (384×478) | `[1240,40]` | **`[1250,20]`** | Top-right corner — nothing east of col 17 sits above row 7 (boreal arc tops out at col 17; the Qu'Appelle/Winnipeg cluster's northernmost city is row 9), so the full 478-tall panel fits with real margin above every city. |
| Year track (536×114) | `[640,1010]` | **`[60,1060]`** | Full-width band below the map — rows 18-19 no longer exist at all (island removed), so everything below row 17 (`y>1029`) is now completely open, down to the printed company-plates strip at `y=1252`. Left-aligned with the map's own left edge. |
| Legend (380×130) | `[1220,1010]` | **`[616,1060]`** | Same open band, centred, 20px clear of the year track's right edge. |
| House supply (302×120) | `[640,1150]` | **`[1016,1060]`** | Same open band, right of the legend, 20px clear gap, comfortably above the plates strip (max panel bottom 1190 vs. plates at 1252). |

`MAPS.wc.at`/`.yt`/`.houseSupply` in `index.html` were updated to the
identical coordinates (`{1250,20}`, `{60,1060}`, `{1016,1060}`) — this
repo's established convention is that these engine-side coordinates equal
the panel's `to` value directly (confirmed by reading how the existing
`us`/`ca`/prior-`wc` entries already do it), so overlay pieces are
guaranteed by construction to use the same origin as the printed panel art.

**A real bug found and fixed in this pass, not just repositioned:** the
printed terrain-cost legend (`$3` forest / `$5` mountain) is copied
verbatim from the American board's template and was never parameterized
per map. After softening WC's actual cost to $2/$3 (§6), the printed
legend still showed the old numbers — a real mismatch, not a cosmetic one,
and exactly the kind of thing Ben's "tile price labels... not looking
right" complaint was pointing at. Fixed with a targeted text substitution
in `make-board-svg.mjs` (`WC_TERRAIN_COST`, kept in sync with
`MAPS.wc.terrainCost` by comment, same duplication the company short-names
already require between build script and engine).

**Verification, not assumption:** rendered the board through the real
lobby UI (see §7), played a game forward via the bot loop until pieces
were on the board (33-105 cubes across various checks), and took targeted
screenshots:

- Zoomed into the action table (`wc-rework2-actiontable-zoom.png`
  equivalent, see transcript): all 5 locomotive markers sit inside the
  panel's printed left column, none spilling onto the map.
- Zoomed into the year track / legend / house-supply band: the 1881
  locomotive sits inside the year-track box; the $2/$2/$2/$3 legend icons
  sit inside their own box with a clear gap to both neighbours; the
  house-supply dashed box and its house icons sit inside their own
  boundary, not overlapping the legend.
- Company plate cubes (bottom strip) sit inside each plate's own black
  box, unaffected by any of this (that strip was not moved).

No spillover found anywhere. This is the same category of bug the
rescale-final pass caught with Esquimalt's label — checked directly this
time, not assumed clean because the math looked right.

## 4. Vancouver Island: exactly what was removed

- **`cities.json`**: Victoria, Esquimalt, Nanaimo entries deleted outright
  (were rows/cols (0,19), (2,19), (0,17)).
- **`terrain.json`**: the entire hand-carved water-gap apparatus is gone —
  the single bridge hex, the two deliberate off-map "back door" cuts, and
  the 2 buffer rows that held the island's terrain. The `_note` and
  `regions` documentation were rewritten to match (no more "Vancouver
  Island water gap" region entry).
- **`gen-terrain.mjs`**: the `Victoria-Esquimalt`, `Victoria-Nanaimo`,
  `Nanaimo-Vancouver` route edges and the `BRIDGE` special-case set are
  gone from `EDGES`. The terrain-type rules for "Vancouver Island (near
  shore)" and "(further south)" were deleted from `terrainFor()`.
- **`make-board-svg.mjs`**: the `water('Vancouver Island', ...)` label
  line is gone; the `Pacific Ocean` label was recomputed for the new
  frame (it doesn't depend on the island, just needed its y-coordinate
  refreshed for the HEX/row change).
- **`index.html` self-test**: the 3 water-gap regression assertions (the
  bridge-hex-is-real-land check, the Vancouver/Nanaimo-not-adjacent check,
  and the remove-the-bridge-disconnects-the-island check) are deleted —
  there's nothing left for them to guard. The "Victoria is developable,
  not a hub" assertion is also deleted (Victoria doesn't exist any more).
  Two new assertions take their place: one confirming
  Victoria/Esquimalt/Nanaimo are gone, one confirming the 4 new towns are
  present and developable.
- **Hub set**: unchanged, as expected — Victoria was never a hub (the
  design doc's own decision, predating this pass), so removing it doesn't
  touch Winnipeg/Calgary/Edmonton/Regina/Vancouver.

**Nothing else needed reworking as a result.** New Westminster and Port
Moody (real mainland cities) were untouched, as instructed. No other
city's nudge needed to change (confirmed: the only `cities.json` diff
outside the removed/added cities is the 3 mountain-corridor value bumps,
§6).

## 5. Northern towns added

Four real, individually-sourced 1861-87 settlements, chosen for genuine
geographic spread along the corridor (see
`docs/western-canada-board-research.md`'s new §7 addendum for full sourcing
and the two candidates — Duck Lake, St. Albert — set aside and why):

| Town | Role | Value | Confidence |
|---|---|---|---|
| Victoria Settlement | 1862 Methodist mission, east of Edmonton | 2/1 | HIGH role, MEDIUM era population |
| Fort Pitt | HBC post, 1885 Rebellion site (Big Bear's siege) | 2/1 | HIGH role/dates, no population claim |
| Fort Carlton | HBC post, NWMP base, Battle of Duck Lake aftermath | 2/1 | HIGH role/dates, no population claim |
| Batoche | Métis settlement, Riel's provisional government, 1885's climactic battle | 3/2 | HIGH — the best-documented of the four, hard 1885 population figure (500) |

Route: spliced into the real Carlton Trail order — Edmonton → Fort Pitt →
Battleford → Fort Carlton → Batoche → Prince Albert → Regina, plus a
dead-end spur Edmonton → Victoria Settlement (never a through-route in
reality). All four project cleanly with the existing formula; only small
(1-2 hex), bearing-constrained nudges were needed for 3 of the 4 (Fort
Pitt needed none), documented in each `nudgeWhy`.

**Board totals**: 35 cities (was 34: -3 island, +4 north), 210 tiles (was
204), total printed value 114 full / 73 shared (was 113/72 before this
pass, +2/+2 from the 4 new towns' 2+2+2+3/1+1+1+2, -11/-7 from the 3
removed, +3/+3 from the mountain-city value bump in §6 — net +1/+1... the
exact arithmetic is in `build-map.mjs`'s own printed summary, reproduced
above).

## 6. Terrain cost softened, and the mountain-gauntlet problem

### Cost: $3/$5 → $2/$3

New optional `MAPS.wc.terrainCost = {forest:2, mountain:3}` field, read by
`expandCost()` with a fallback to the existing hardcoded 3/5 — exactly the
same "optional field, falls back to today's behaviour" pattern
`years`/`companyCounts` already use. `us`/`ca` don't set this field, so
`expandCost` is provably byte-identical for them (confirmed by a new
self-test assertion plus the pre-existing `cost: forest flat $3`/
`cost: mountain flat $5` assertions, which run against the default map and
still pass unchanged).

**Why $2/$3, not something else:** Ben's ask was explicit on both ends —
"$3/$5 is way too expensive," but "a bit more difficult... is a good idea,
just too much right now" (i.e. don't eliminate the premium). $2/$3 keeps
mountain pricier than forest and both pricier than the $2 base plains cost,
while cutting the premium over plains from +$1/+$3 to +$0/+$1 — a real,
felt softening without erasing the "mountains are hard" story. This is a
judgment call, not a formula; the 16-game measurement (below) confirms it
didn't produce a degenerate outcome.

### The mountain-gauntlet single-file-monopoly problem

The real concern: the whole Field-Cochrane-Banff-Calgary-Revelstoke-Golden-
Kamloops-Gleichen mountain corridor is a strict single-file chain, and the
forest/mountain "one cube per hex, forever" rule (intentional, shared by
all 3 boards, not touched) means one company claiming the whole chain
early can permanently wall off every rival from the Pacific.

**What I did:** one hex, `(7,8)` — directly between Cochrane and Field/
Calgary, at the single busiest hinge of the whole corridor (the build
report's own measurement found one company owning "Calgary, Cochrane,
Field, Golden, Revelstoke, Banff" in a single 16-game pass) — was
hand-converted from mountain to plains in `terrain.json`. This mirrors the
Canadian board's own fix for the same shape of problem (one forest hex
turned to plains at its chokepoint). Because plains hexes have no
per-company cube limit, a second company can now route
`Calgary → (8,8) [its own mountain cube] → (7,8) [shared plains] →
Cochrane/Field`, alongside whatever the first company already claimed on
the strict main line — a real structural bypass, not a cosmetic change.

**Honest scope of what this does and doesn't prove:** the hex was actively
used in **14 of 16** measured games (§8) — so it's a real, load-bearing
part of normal play, not a decorative unused tile. However, in every one
of those 14 games it held only **1** cube, never 2 — meaning this 16-game
sample never happened to catch two different companies sharing it, which
would be the direct proof that it broke up an attempted monopoly. I'm
reporting this plainly rather than overclaiming: the fix is structurally
real and gets used, but this pass didn't observe the specific "two rivals
share the chokepoint" event that would fully confirm it solves the
lockout scenario. A full mountain-band redesign (widening the corridor to
give 2 genuinely parallel paths at more than one point) was considered and
explicitly not attempted — the task's own guidance was to skip a risky
geometry change if not confident combining it with everything else in this
pass, and I agree that's the right call here; this is flagged as a
reasonable follow-up for a future, narrowly-scoped pass if the lockout
scenario is ever observed in real play.

### Modest city-value bump in the mountain corridor

Per Ben's "higher priced cities as the reward is a good idea, but not too
much": **Field, Golden and Revelstoke** — the three central stops of the
actual Kicking Horse/Rogers Pass sequence — were bumped **2/1 → 3/2**
(+1/+1 each). Cochrane, Banff, Kamloops and Gleichen were deliberately
left at 2/1: a modest bump to 3 of 7 mountain-corridor cities, not a
blanket re-tier of the whole band.

## 7. Validation

1. **`node scripts/western/build-map.mjs`** — clean: 210 tiles, 35 cities,
   5 hubs, 3 specials, no two cities adjacent, one connected landmass
   (there's no separate island to keep reachable any more — just one
   ordinary connectivity check).
2. **Full pipeline**: `make-board-svg.mjs` → `inject.mjs`, spliced into the
   real `index.html`.
3. **Self-test: 209/209 passing**, confirmed live via Playwright against
   `node scripts/serve.mjs` at `http://localhost:5177/` on a fresh page
   load (`window.__selfTest()` → `{passed:209, total:209}`, no thrown
   error). Was 207/207 before this pass: -3 (deleted water-gap
   assertions) -1 (deleted Victoria-is-not-a-hub assertion) +6 (new tile/
   city-count comments aside, the real new assertions: Vancouver-Island-
   is-gone, the-4-new-towns-are-present, WC-terrain-cost-config,
   US/CA-terrain-cost-unmodified, WC-expandCost-actually-charges-$2-forest,
   WC-expandCost-actually-charges-$3-mountain) = 207-4+6=209. ✓.
4. **Real-lobby-UI test** (not just `window.startGame()`): navigated to
   `http://localhost:5177/`, clicked **Local Game**, selected **Western
   Canada — the Canadian Pacific Railway, 1881-1887** from the `#map-choice`
   dropdown (confirmed present — the `b318799` map-picker gap from the
   prior pass has not regressed), set 3 seats to Medium bots, clicked
   **Start Game**. Screenshot confirmed: the board renders at the new,
   smaller hex size with clean margins on every side, the terrain-cost
   legend correctly reads `$2 / $2 / $2 / $3`, and all 4 panels sit in
   their new positions without visual clash.
5. **Overlay-piece verification**: played the bot loop forward (`ANIM=false`,
   `botDecide`/`botFallback`/`applyUi`) into round 1 with 33 cubes on the
   board, then zoomed screenshots of the action table and the bottom panel
   band (see §3) — every locomotive/cube/house sits inside its panel's
   printed border.
6. **`git diff --stat`**: only `index.html` and `scripts/western/*`
   changed. No `scripts/canada/*`, no American/Canadian data files.
   `expandCost`'s `us`/`ca` behaviour is provably unchanged (new explicit
   self-test assertion, plus the pre-existing `cost: forest flat $3`/
   `cost: mountain flat $5` assertions still pass against the default map).

## 8. Full 16-game re-measurement

Same method and the identical 16-row seed/bot table as
`docs/western-canada-board-rescale-final.md`'s "Full 16-game
re-measurement" section, reused verbatim (seeds 101-116, `mode:'local'`,
4 named bot seats, `mapId:'wc'`, `ANIM=false`, a
`botDecide`/`botFallback`/`applyUi` loop to `gameOver`). A fresh
`browser_navigate` reload was done immediately before the canonical run,
per the known unseeded-`Math.random()` reproducibility caveat documented
in every prior measurement pass on this board (not fixed here — out of
scope, flagged again for a future session).

**Headline comparison to the last full measurement (rescale-final.md)**:

| Metric | Last baseline | **This pass** |
|---|---|---|
| Calgary-Vancouver fires | 4/16 (25%) | **12/16 (75%)** |
| Calgary-Winnipeg fires | 1/16 (6.25%) | **9/16 (56.25%)** |
| Winnipeg-Vancouver fires | 0/16 (0%) | **0/16 (0%)** |
| Any leg fires | 4/16 (25%) | **14/16 (87.5%)** |
| Edmonton traffic | 3/16 (18.75%, pre-bump) / 14/16 (87.5%, edmonton-tuning.md) | **14/16 (87.5%)** |
| Early termination (<7 rounds) | 1/16 (6.25%) | **6/16 (37.5%)** |

**The connection-bonus jump is real and large, and I'm flagging it plainly
rather than burying it in a table.** The grid geometry (hex distances)
didn't change at all in this pass — the entire jump is attributable to the
softened terrain cost (§6): with mountains at $3 instead of $5 and forest
at $2 instead of $3, companies can lay the same money further, and the
Calgary-Vancouver leg crosses the mountain band almost its whole length.
This isn't obviously a *problem* — the fantasy of actually completing the
transcontinental link firing more often is arguably a good outcome, and
Winnipeg-Vancouver (the longest leg) still never fires, so it's not a
flat "everything always pays" degenerate case — but going from a modest
25% to 75%/56% is a big enough behavioural shift that Ben should know it
happened as a side effect of the cost change, not something separately
tuned. **No action taken on this** — it wasn't part of the 5 requested
fixes, and pulling it back down would mean re-hardening the exact cost
Ben asked to soften.

**Early termination (37.5%) is also elevated** relative to the
most-recent 6.25% baseline, though it's in the same range as the very
first balance-measurement pass's 31% (a different board geometry
entirely). The plausible mechanism: cheaper terrain lets companies build
more track for the same treasury, so their fixed cube piles run out
faster relative to the 7-round clock. Not flagged as broken — cube
exhaustion (not `sharesLeft===0`) was the trigger in the earlier baselines
too, and no game ended absurdly early (worst case this pass: round 5 of
7, same floor as the original board ever showed).

**Northern corridor traffic — this directly tests the fix for Ben's "no
benefit to building up that direction" complaint:**

| Town | Games touching it (of 16) |
|---|---|
| Edmonton | 14/16 (87.5%) |
| Victoria Settlement | 13/16 (81.25%) |
| Fort Pitt | 11/16 (68.75%) |
| Battleford | 11/16 (68.75%) |
| Fort Carlton | 7/16 (43.75%) |
| Batoche | 13/16 (81.25%) |
| Prince Albert | 11/16 (68.75%) |

Every one of the 7 northern-corridor cities sees traffic in a comfortable
majority of games — a dramatic change from the pre-bump baseline's 18.75%
Edmonton-only figure, and clearly reads as "there is now benefit to
building up that direction." (Only the all-easy control, seed 110, and one
mixed game, seed 114, saw essentially no northern traffic at all.)

**Mountain-gauntlet relief hex** `(7,8)`: touched in **14/16 (87.5%)**
games, confirming it's a real, actively-used part of the board rather than
a decorative tile — see §6 for the honest caveat that no game in this
sample happened to show two companies sharing it.

**General sanity — no degenerate outcome from the softened cost:**

- Mountain hexes used: average **17.25 of 41 (42.1%)**, range 7-28 —
  meaningful increase in mountain development (expected, since it's
  cheaper now) but nowhere near saturating every mountain hex every game.
- Forest hexes used: average **10.44 of 46 (22.7%)**, range 1-24 — lower
  than mountains despite being cheaper, because forest hexes sit mostly on
  the optional northern branch rather than the only route to the coast.
- Total cubes on board: average **92.9 of 175 non-city tiles (53.1%)**,
  range 64-105 — a healthy, non-saturating utilization rate.
- Canadian Pacific (`american`, 5sh/28cu) sanity check against the last
  measured baseline (edmonton-tuning.md, 7sh/28cu — share count differs
  slightly since Ben's later 7→5 change, not re-tuned in this pass):
  on-map 14/16 (87.5%, was 93.75%), avg income 17.75 (was 14.88, up — CP
  did *not* get worse), avg treasury 12.31 (was 15.81, less idle cash, an
  improvement), avg cubes used 39.1% (was 43.5%, close), avg shares sold
  33.75% (was 22.3%, higher — expected, smaller share pool). Nothing here
  reads as broken; CP remains an ordinary, plausible company under the new
  terrain cost, not a new problem.

## 9. Files changed

- `c:\Users\benja\Documents\american rails\scripts\western\project.mjs`
  (grid: 24x18, HEX 38, rescale rationale rewritten)
- `c:\Users\benja\Documents\american rails\scripts\western\cities.json`
  (Victoria/Esquimalt/Nanaimo removed; Victoria Settlement/Fort Pitt/Fort
  Carlton/Batoche added; Field/Golden/Revelstoke bumped 2/1→3/2)
- `c:\Users\benja\Documents\american rails\scripts\western\gen-terrain.mjs`
  (route network and terrain-type rules updated for the above)
- `c:\Users\benja\Documents\american rails\scripts\western\terrain.json`
  (regenerated 24x18 grid; one hand-carved mountain→plains chokepoint
  relief hex at (7,8); water-gap apparatus and its documentation removed)
- `c:\Users\benja\Documents\american rails\scripts\western\make-board-svg.mjs`
  (Vancouver Island label removed, Pacific Ocean label repositioned, all 4
  `PANELS` positions redesigned, legend forest/mountain price text
  parameterized to `WC_TERRAIN_COST`)
- `c:\Users\benja\Documents\american rails\scripts\western\out\western-board-data.json` / `western-board-draft.svg` / `western-board-draft.html` (regenerated)
- `c:\Users\benja\Documents\american rails\index.html`
  (`MAPS.wc.at`/`.yt`/`.houseSupply` repositioned; new
  `MAPS.wc.terrainCost`; `expandCost()` reads `MAP.terrainCost` with a
  3/5 fallback; `window.WC_MAP` and `tpl-board-wc` re-injected; self-test
  updated — see §7)
- `c:\Users\benja\Documents\american rails\docs\western-canada-board-research.md`
  (new §7 addendum: Vancouver Island removal note, 4 new towns' full
  sourcing, Duck Lake/St. Albert set-aside reasoning)
- `c:\Users\benja\Documents\american rails\docs\western-canada-board-rework-2.md`
  (this file)

No `scripts/canada/*` file, no American/Canadian board data, and no shared
`COMPANIES` table entry was touched. `MAPS.wc.companyCounts.american`
remains `{shares:5, cubes:28}`, untouched, as instructed.
