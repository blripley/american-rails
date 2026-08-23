# Western Canada (CPR, 1881-1887) board — balance measurement pass

Status: **MEASUREMENT ONLY**. No balance numbers, city values, company counts,
or terrain were changed. This is a report of what 16 real bot games on `wc`
actually did, run against `stage2-ui` at commit `81b9978` via the project's
established headless-bot-harness method (`window.startGame` +
`botDecide`/`botFallback`/`applyUi` looped to `gameOver`, `ANIM=false`,
mirroring the `playBots()` helper already embedded in `window.__selfTest`).

**Headline: the connection-bonus system does not work on this board at all.**
Across all 16 games, not one of the three legs (Winnipeg-Calgary,
Calgary-Vancouver, Winnipeg-Vancouver) ever paid, for any company. That is a
materially worse result than either existing board and the single biggest
flag from this pass — see Q1 below.

## Method

- Served via `node scripts/serve.mjs` at `http://localhost:5177/`, driven
  headlessly through the Playwright MCP browser tools (`browser_evaluate`
  against the live page), not `window.__selfTest()` (that function's own
  `playBots` is a closure, not exposed globally — it was reimplemented
  inline for this pass, calling the same `botDecide`/`botFallback`/`applyUi`
  functions the real self-test uses).
- 16 full 4-player games, seeds 101-116, `mapId:'wc'` passed to
  `window.startGame`, `ANIM=false` for synchronous resolution.
- Bot difficulty mixes rotated across all four internal keys: the single
  non-`medium` bot (`hard`) rotated through all four seats in games 1-4,
  `extreme`/`hard`/`medium`/`easy` mixes rotated through seat orders in
  games 5-8 and 13-16, plus one all-`easy`, one all-`hard`, one
  all-`extreme`, and one all-`medium` control (games 9-12).
  Internal keys, not display labels (`Training`/`Easy`/`Medium`/`Hard`), used
  throughout, per the project's own key/label split.
- Self-test suite confirmed green (204/204) immediately before this pass, so
  any oddity below is a balance/geometry finding, not a broken build.
- All numbers below are raw counts across these 16 games unless stated
  otherwise. Where a claim needed the actual connected-city graph rather
  than just a final count, one representative game was re-run and inspected
  in detail (seed 104, noted inline).

## Q1 — Connection-bonus fire rates: 0 for 3, across all 16 games

| Leg | Hex distance (BFS shortest path) | Games fired (of 16) |
|---|---|---|
| Calgary-Winnipeg | 26 | **0** |
| Calgary-Vancouver | 17 | **0** |
| Winnipeg-Vancouver | 43 | **0** |

For comparison, the equivalent shortest hex distances on the other two
boards (measured in this same session, same `BOARD[id].adj` BFS):

- American board, Chicago-Atlanta (the one leg that fires, ~7/25 games per
  project memory): **11 hexes**.
- Canadian board, Toronto-Montréal (fires ~100% per project memory):
  **8 hexes**.
- Western Canada, shortest leg (Calgary-Vancouver): **17 hexes** — more than
  double the American board's leg that only fires ~28% of the time, and
  more than double the Canadian board's leg that fires almost every game.

This is not close. The "shorter leg crosses mountains, longer leg crosses
cheap prairie" wrinkle the design doc asked about turns out to be **moot** —
it never gets tested, because no company on any of the 16 games ever built a
single contiguous chain of track spanning any of the three pairs, regardless
of terrain. Raw hex distance dominates so completely here that the terrain
question never even arises.

To see how far off "close" is, one representative game (seed 104,
`medium/medium/medium/hard`) was inspected directly via `connectedCities()`
(the same function `applySpecialConnections` calls) at game end:

| Company | Cubes used (of total) | Cities connected | Which cities |
|---|---|---|---|
| american (CP) | 6 of 38 | 3 | Regina, Moose Jaw, Indian Head |
| national | 7 of 29 | 2 | Prince Albert, Battleford |
| continental | 26 of 26 (100%) | 10 | Regina → Fort Macleod (whole south prairie lateral) |
| majestic | 20 of 22 | 6 | Winnipeg, Portage la Prairie, Brandon, St. Boniface, Selkirk, Emerson |
| liberty | 11 of 19 | 6 | Calgary, Cochrane, Field, Golden, Revelstoke, Banff |
| republic | 17 of 17 (100%) | 7 | Vancouver, Nanaimo, Victoria, Yale, Port Moody, New Westminster, Esquimalt |

Every company that built anything substantial built one *regional cluster*
around a single hub (Winnipeg, Calgary, or Vancouver) or one lateral
prairie spread (continental's 10-city run) — never a line spanning two hub
regions. `continental` and `republic` both spent every single cube they had
and still never got anywhere near a second hub. `liberty` literally owns
the entire Calgary-to-Revelstoke mountain corridor (the real route to
Vancouver) and still falls short of the coast.

This reads as a geometry problem, not a terrain-cost problem: at this
board's hex scale (40x34 grid, radius 24, stretched 5x latitude per the
build report), the special-pair cities are simply too far apart in hex
count for any single company to bridge in a 7-round game, no matter how
much of its own cube supply it commits.

## Q2 — Edmonton traffic: 2 of 16 games (12.5%)

Any company ever placing a cube on the Edmonton hex, across all 16 games:

- **2/16 games** (seeds 109 — all-`extreme` — and 111 — all-`hard`) saw a
  single cube placed on Edmonton (`majestic` in 109, `national` in 111).
- **14/16 games** (87.5%) — including every game with a mixed difficulty
  roster and both the all-`easy` and all-`medium` controls — never touched
  Edmonton at all.

This confirms the build report's own flag: Edmonton (hub, 3/2, priced below
neighbouring developable cities like Calgary 6/4 and Battleford 4/3) reads
exactly like the Canadian board's pre-fix Owen Sound. It only got visited
by the two highest-difficulty all-bot controls, and even then just once
each, one cube, no follow-up development.

## Q3 — Income/value drain: games run shorter than the year cap more often than expected, and it's the cube supply, not the shares, that runs out

- **11/16 games (69%) reached the full 1887 year cap** (7 rounds played).
- **5/16 games (31%) ended early**: four stopped at 1886 (6 rounds — seeds
  113/114/115/116, all mixed-difficulty games with a full difficulty ladder
  represented on one team) and one stopped at **1884 (only 4 of 7 rounds
  played)** — seed 107, `easy/medium/hard/extreme`.
- **Every early ending was triggered by the cube-supply-exhaustion rule**
  (`suppliesLow(s)>=4` for a 4-player game — 4+ of the 6 companies, or the
  shared development supply, down to ≤2 cubes), never by
  `sharesLeft===0` (total unsold shares across all 6 companies never hit
  zero in any of the 16 games — it bottomed out at 5 remaining, seed 109).
- Winner's money at game end: average **$216.6**, range **$115 (the
  4-round-early game) to $270**.
- Average money across all 4 players at game end: **$161**.
- Shares left unsold in supply at game end: average **11.6 of 23** printed
  across the 6 companies (~50% never bought) — driven heavily by `american`
  (CP), see Q4.

Read together: this board's lower total printed value (111/71 vs the
Canadian board's 122/80) does appear to show up as *faster cube-supply
exhaustion* rather than as shorter games via the year track — a 31% early-end
rate, with one game losing 3 of 7 rounds entirely, is a real and fairly
large effect. This session did not re-run the American or Canadian boards to
get a directly comparable early-end percentage for them (out of scope, and
those boards' own historical measurement notes referenced in project memory
don't include this specific rate), so this is reported as an absolute
number, not a verified relative one — but a 31% early-termination rate
losing up to 3 of 7 rounds is high enough to be worth checking regardless of
what the baseline turns out to be.

## Q4 — Canadian Pacific (7 shares / 38 cubes): reads as "nobody bothers," not "big, safe, slow-growing"

Aggregated across all 16 games, `american` (Canadian Pacific) vs. the other
five companies:

| Company | On map (of 16) | Avg income | Avg treasury | Avg cubes used | % of cube supply used | Avg shares sold | % of share supply sold | Ownership concentration* |
|---|---|---|---|---|---|---|---|---|
| **american (CP, 7sh/38cu)** | **15/16** | **8.75** | **$1.00** | **6.8** | **17.9%** | **1.1** | **16.1%** | **0.97** |
| national (4sh/29cu) | 15/16 | 14.06 | $6.44 | 13.7 | 47.2% | 1.6 | 40.6% | 0.83 |
| continental (3sh/26cu) | 16/16 | 25.94 | $7.50 | 18.1 | 69.5% | 2.25 | 75.0% | 0.68 |
| majestic (4sh/22cu) | 16/16 | 17.75 | $18.81 | 14.1 | 64.2% | 1.9 | 48.4% | 0.74 |
| liberty (2sh/19cu) | 16/16 | 23.63 | $9.13 | 13.6 | 71.7% | 1.8 | 90.6% | 0.63 |
| republic (3sh/17cu) | 16/16 | 22.69 | $18.06 | 15.7 | 92.3% | 2.5 | 83.3% | 0.60 |

*Ownership concentration = average, across games where the company sold at
least one share, of (that game's single largest shareholder's share count
÷ total shares sold in that game). 1.0 would mean every share sold always
went to the same one player.

CP is last or tied-last on every single column: lowest income by a wide
margin (8.75 vs. the next-lowest 14.06 and the highest 25.94), lowest
treasury ($1 — essentially always broke), by far the smallest fraction of
its own oversized cube pile ever spent (17.9%, next-lowest is national at
47.2%), the smallest fraction of its shares ever sold (16.1% — literally
about 1 of its 7 shares, on average), the one company that failed to get
founded at all in one game (seed 112, all-`medium` bots — 0 cubes ever
placed), and the highest ownership concentration (0.97 — on the rare
occasion someone buys a CP share, it's almost always the same single bot
buying all of them, not a spread of owners).

This does not read as "big, safe, slow-growing." It reads as bots
correctly judging that a 38-cube company is structurally incapable of
spending down its own pile fast enough to matter in a 7-round game (mirrors
the Q1 finding — the same geometry problem shows up here as "this company's
share is a bad buy" from the valuation math), so it gets bid on once or
twice out of curiosity/denial and then ignored. It is the opposite of a
degenerate always-buy-in outcome — it's closer to a company nobody wants.

## Q5 — Northern boreal branch (Edmonton-Battleford-Prince Albert): starved, comparable to the Canadian Shield pattern

BFS shortest-path union of Edmonton→Battleford (part of the branch) and
Battleford→Prince Albert is **14 hexes**; the main Winnipeg→Calgary→Vancouver
corridor's equivalent union is **44 hexes** (so the boreal branch is much
shorter as a raw path, making its low absolute cube count more telling, not
less).

| | Avg cubes placed | Range | Avg distinct hexes touched (of path length) |
|---|---|---|---|
| Boreal branch (Edmonton-Battleford-PA, 14-hex path) | **2.9** | 0-10 | 2.8 of 14 |
| Main corridor (Winnipeg-Calgary-Vancouver, 44-hex path) | **12.0** | 7-15 | 11.7 of 44 |
| Whole board | **82.0** | 58-127 | — |

The boreal branch saw **zero cubes at all in 2 of 16 games** (seeds 107 and
108) and never exceeded 10 cubes in any game (that 10-cube outlier occurred
twice, seeds 109 and 111 — the same two all-extreme/all-hard control games
that were also the only ones to ever touch Edmonton at all in Q2). On a
per-hex-of-path basis the boreal branch gets about 4x less traffic than the
main corridor (2.8/14 ≈ 20% of its path touched vs. 11.7/44 ≈ 27% for the
corridor — actually fairly close by that specific ratio, but the corridor
carries more than 4x the absolute cube count for only 3x the path length).
This is consistent with — not obviously worse or better than — the "single-
file branch gets low traffic" pattern the build report predicted by analogy
to the Canadian board's Shield interior.

## What did NOT look healthy — summary

1. **The connection-bonus mechanic is effectively dead on this board.**
   0/16 games, all three legs. This is a bigger problem than the "which leg
   wins" question the build report asked about — the legs are structurally
   too far apart in hex terms (17-43 hexes vs. 8-11 on the other two boards)
   for any single company to ever bridge in 7 rounds, regardless of
   terrain. The mountain-crossing wrinkle never gets exercised because
   nothing gets close enough to either leg to make terrain matter.
2. **Canadian Pacific (7 shares/38 cubes) is a company nobody wants**, not
   a "big, safe" one — worst-in-class on income, treasury, cube spend-down,
   and shares sold, and failed to even get founded in 1 of 16 games.
3. **Edmonton is barely touched** (2/16 games, one cube each, both only in
   the two toughest all-bot control games) — the Owen-Sound-style risk the
   build report flagged is real.
4. **31% of games (5/16) ended before 1887**, one by a full 3 of 7 rounds,
   always via cube-supply exhaustion rather than shares running out —
   consistent with, though not proven against a same-session baseline to
   be *caused by*, the board's lower total printed value.
5. **The boreal branch is low-traffic** but not obviously more starved than
   the main corridor once path length is accounted for — this one item
   looks roughly in line with expectations rather than a new problem.

## Recommended next steps (not made here — measurement pass only)

- Investigate whether the connection-bonus geometry is fixable by
  shortening the hex distances between Winnipeg/Calgary/Vancouver (grid
  rescale) or whether the bonus needs a different mechanism on this board
  (e.g., a lower distance threshold, or per-leg bonuses that don't require
  one company to hold the whole contiguous chain) — 0/16 is a strong
  enough signal that "wait and see" is not a safe option here the way it
  might be for a leg that fires occasionally.
- Reconsider Canadian Pacific's 7/38 split — the build report already
  flagged this as unvalidated; this pass suggests the ratio (or the
  absolute cube count relative to a 7-round game) needs to come down, not
  just the share count.
- Confirm whether Edmonton's 3/2 value needs the same bump the Canadian
  board gave Owen Sound, per the build report's own suggested fix.
- If early-termination-by-cube-exhaustion turns out to matter, the total
  printed value (111/71) or per-company cube counts are the first levers
  to check, per the build report's own flag #3 — this pass found a 31%
  early-end rate but did not establish a baseline from the other two boards
  in the same session to compare against.
