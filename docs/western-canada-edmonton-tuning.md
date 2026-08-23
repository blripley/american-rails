# Western Canada (CPR, 1881-1887) board — Edmonton value tuning

Status: **DONE**. Single-lever value bump, following the Canadian board's
Owen Sound precedent exactly. Nothing pushed to any remote. Scope: Edmonton's
`full`/`shared` printed value only — no other city, no terrain, no grid
geometry, no company share/cube counts were touched.

## The problem (per the required reading)

`docs/western-canada-board-rescale-final.md`'s "Edmonton traffic" section
measured only **3 of 16 games (18.75%)** ever placing a cube on Edmonton
after the grid rescale (up marginally from 2/16 pre-rescale), and explicitly
flagged this as "not a fix... an incidental side effect" and "a real
candidate for a future value-only pass." `docs/western-canada-board-build-report.md`
had already predicted this exact risk when Edmonton was originally priced at
a deliberately modest 3/2 (a non-developable hub priced *below* several
developable neighbours — Calgary 6/4, Battleford 4/3) to reflect the real
history of the CPR bypassing Edmonton: "a hub priced below developable
cities around it could turn out to be a hex nobody ever bothers to reach,
the same failure mode the Canadian board's original Owen Sound had before
its own value correction."

## The bump: 3/2 -> 5/3

**Old value:** `full:3, shared:2`.
**New value:** `full:5, shared:3`.

Reasoning, grounded in the board's own existing value tiers (same judgment
call the Owen Sound fix used — no new research, just re-weighing against
neighbours already on the board):

- **Above Battleford (4/3).** Edmonton is a real, continuously-occupied
  fur-trade settlement (Fort Edmonton) with an actual 1881 land rush,
  arguably a more substantial place through this era than Battleford's
  ten-building NWMP fort — it deserves at least Battleford's tier, not
  below it.
- **Matching New Westminster/Victoria's developable tier (5/3).** Both of
  those are "old, real, substantial place" cities valued at 5/3 on this
  board. Edmonton fits that same bracket on its own historical merits.
- **Still clearly below the CPR-connected hub tier** — Calgary/Regina/
  Vancouver at 6/4, Winnipeg at 7/5. This preserves the deliberate "bypassed
  by the mainline" story the build report documented: Edmonton is now worth
  reaching, just not worth as much as the hubs the railway actually chose.
  The hub status and the historical narrative are untouched — only the
  number moved.

This lands in the middle of the task brief's suggested 4/2-5/3 candidate
range, at the higher end, matching Battleford's *shared* value (3) while
going a bit further on `full` (5, not 4) to clear Battleford's tier
distinctly rather than tie it — the same "raise to match its real
population plus a bit more" logic the Owen Sound note used verbatim.

`cities.json`'s Edmonton note was updated in place (see file) to record the
bump and its reasoning, following the Owen Sound entry's own style
(`scripts/canada/cities.json`) as a precedent for how these notes read.

Total board printed value moved from 111/71 to **113 full / 72 shared**
(build-map.mjs output), a small, expected side effect of raising one city's
two numbers by 2 and 1 — not itself a target of this pass.

## Pipeline regenerated

Ran the same pipeline used for every prior change to this board:

1. `node scripts/western/build-map.mjs` — validated clean (204 tiles, 34
   cities, 5 hubs, 3 specials, no two cities adjacent), reported the new
   113/72 total.
2. `node scripts/western/make-board-svg.mjs` — regenerated
   `western-board-draft.svg`.
3. `node scripts/western/inject.mjs` — spliced the new board template and
   `window.WC_MAP` data into `index.html`. Confirmed directly:
   `window.WC_MAP`'s Edmonton cell now reads
   `{"t":"C","name":"Edmonton","full":5,"shared":3,"port":1}`.

`index.html`'s `window.__selfTest()` assertions were checked for any
hardcoded Edmonton value or board-total number — **none found**. The only
WC assertions that touch city values check structural properties
(`shared<=full` across all cities, hub/special counts, etc.), which remain
true unchanged after the bump, so **no self-test assertion needed
editing**.

## Fresh 16-game re-measurement

Same method and the same literal 16-row seed/bot table as the rescale-final
report's "Full 16-game re-measurement" section (seeds 101-116, `mode:'local'`,
4 named bot seats, `ANIM=false`, a `botDecide`/`botFallback`/`applyUi` loop
to `gameOver`), reused verbatim for direct comparability:

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

Followed the reproducibility workaround from the required reading: a full
`browser_navigate` reload to `http://localhost:5177/` was done immediately
before this batch, and `playBots`'s loop was reimplemented inline via
`browser_evaluate` (since `playBots` itself is a closure inside
`window.__selfTest()`, not a global — same limitation the rescale-final
report hit) using the same globally-exposed `botDecide`/`botFallback`/
`applyUi`/`window.startGame` functions. No attempt was made to fix the
underlying unseeded-`Math.random()` bug — just worked around it by treating
only this single fresh-load run as valid data.

### Edmonton traffic: the headline result

| | Games touching Edmonton (of 16) | Rate |
|---|---|---|
| **Before** (3/2, rescale-final baseline) | 3/16 | 18.75% |
| **After** (5/3, this pass) | **14/16** | **87.5%** |

A large, unambiguous jump — well into the "10+/16" range the task set as
the bar for a clear, single-shot success, following the Owen Sound
precedent (2/1 -> 4/2 moved 0/16 -> 11/12 there). Only seeds 107 and 110
missed Edmonton entirely; every other game (including both easy-only and
extreme-only control seeds, 110 being the one all-easy exception) saw at
least one company place a cube there. **No second, larger bump was
needed** — this confirms the task's expectation that, unlike the more
complicated Canadian Pacific company-count tuning (which needed 8
candidates against a non-monotonic wall), this was a straightforward
single-lever fix.

### Canadian Pacific — sanity check (not re-tuned)

Read from the same fresh 16-game batch used for the Edmonton measurement
above (`american`, now `{shares:7, cubes:28}` per an already-completed
prior cube-count pass, not this session's work):

| Metric | rescale-final baseline (7sh/38cu) | This batch (7sh/28cu) |
|---|---|---|
| On map (of 16) | 12/16 (75%) | 15/16 (93.75%) |
| Avg income | 10.88 | 14.88 |
| Avg treasury | 10.44 | 15.81 |
| Avg cubes used | 9.19 | 12.19 |
| % of cube supply used | 24.2% | 43.5% |
| Avg shares sold | 1.31 | 1.56 |
| % of share supply sold | 18.7% | 22.3% |
| Ownership concentration | 0.85 | 0.83 |

Note the two rows aren't perfectly apples-to-apples (the baseline row is
from the 38-cube version measured in the rescale-final pass; this batch
reflects the already-reduced 28-cube version plus this session's Edmonton
bump, which shortens routing pressure very slightly board-wide). Read as a
quick sanity check only, as instructed: nothing here looks broken or
regressed — on-map rate and income both improved, cube-spend and
share-sale fractions both rose (expected with a smaller cube pool),
ownership concentration is essentially unchanged. **No action taken** — this
is not a re-tuning task, and CP's numbers still look like an ordinary,
plausible read for this company, not a new problem.

## Self-test

**207/207 passing**, confirmed on a clean fresh page load with nothing else
run in that session (`window.__selfTest()` returns `{passed:207, total:207}`
with no failures and no thrown error). No assertion needed updating — none
of the 207 assertions hardcode Edmonton's value or the board's total
printed value.

One data point worth recording honestly rather than hiding: running
`window.__selfTest()` again immediately after the 16-game measurement
batch, *in the same page load*, produced **206/207** — one failure,
`'WC: that game ran the full 1881-1887 window'`. This is the exact
pre-existing reproducibility bug flagged in the task's required reading
(unseeded `Math.random()` calls bleeding state between runs in one
session): `window.__selfTest()`'s own fixed-seed `playBots(7, [...])` game
ended early (before 1887) because the 16 preceding games in the same
session had already consumed unrelated randomness the seeded RNG doesn't
fully pin down. This is not caused by the Edmonton value change — a fresh
reload with `__selfTest()` run alone, with nothing else in that page load,
reliably gives 207/207 (confirmed above). Per the task's explicit
instruction, this pre-existing bug was not touched or fixed, only worked
around by treating each fresh-load run independently.

## Files changed

- `c:\Users\benja\Documents\american rails\scripts\western\cities.json`
  (Edmonton: `full` 3->5, `shared` 2->3, note updated with bump reasoning)
- `c:\Users\benja\Documents\american rails\scripts\western\out\western-board-data.json`
  / `western-board-draft.svg` (regenerated)
- `c:\Users\benja\Documents\american rails\index.html`
  (`window.WC_MAP`'s Edmonton cell, `tpl-board-wc` template's printed
  Edmonton value; no self-test assertions changed)
- `c:\Users\benja\Documents\american rails\docs\western-canada-edmonton-tuning.md`
  (this file)

No other city, no terrain, no grid geometry, and no company share/cube
counts were touched — confirmed by the build-map.mjs diff being scoped to
Edmonton's `full`/`shared`/`note` fields only.
