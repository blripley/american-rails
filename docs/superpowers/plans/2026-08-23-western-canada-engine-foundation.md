# Western Canada Board — Engine Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the two engine capabilities the Western Canada board's design requires but the current two-map engine doesn't support — a per-map play-year range, and per-map company share/cube counts — without changing behavior for the existing American or Canadian boards.

**Architecture:** `index.html` is a single-file vanilla-JS app with a `MAPS` registry (`MAPS.us`, `MAPS.ca`) that `setMap(id)` reads to configure module-level state (`MAP`, `HEX`, `OX`, `OY`, etc.). Both new capabilities follow that existing pattern: add an optional field to a `MAPS.<id>` entry, have `setMap()` (or a small helper) resolve it with a fallback to today's hardcoded value, and replace every hardcoded reference with the resolved value. Because both new fields are optional with fallbacks equal to today's literals, `MAPS.us` and `MAPS.ca` need only the fallback-matching values added — their runtime behavior does not change.

**Tech Stack:** Vanilla JS in `index.html` (no build step, no framework). Verification via the in-page `window.__selfTest()` suite, run in a real browser through Playwright (the app uses the DOM/SVG, so it cannot run under plain Node). `scripts/serve.mjs` serves the file at `http://localhost:5177/` (file:// is blocked by Playwright).

**Spec:** `docs/superpowers/specs/2026-08-23-western-canada-board-design.md` (§3 "Engine blocker: de-hardcoded year range" and §4 "Company asymmetry: mainline vs. subsidiaries")

## Global Constraints

- Both existing boards (`us`, `ca`) must remain behaviorally identical after this plan — every currently-passing self-test assertion must still pass with the same asserted values (e.g. `s.year===1857` for a default American game stays true).
- Do not touch bot difficulty tiers, personas, or auction/valuation algorithms (`botAction`, `EX_TUNE`, `expectedDilution`, etc.) — this plan changes the *inputs* a map can configure, never the algorithms that consume them.
- Never `git push origin stage2-ui:main` as part of this plan — commit locally only. Pushing to the live deploy happens only on Ben's explicit signal, per project convention.
- Every task ends with `window.__selfTest()` reporting `passed === total` (no failures, no thrown errors) before moving to the next task.
- This plan does **not** cover the Western Canada board's actual content (cities, terrain, board SVG, company theming, final balance numbers) — that is deliberately out of scope here (see spec §8) and proceeds separately once this foundation lands.

---

### Task 1: Per-map play-year range

**Files:**
- Modify: `index.html:9056` (module-level `let` declarations)
- Modify: `index.html:9035-9053` (`MAPS.us` / `MAPS.ca` entries)
- Modify: `index.html:9058-9087` (`setMap()`)
- Modify: `index.html:9121` (`createInitialState`)
- Modify: `index.html:9320-9325` (`beginPlayRounds`)
- Modify: `index.html:9439` (`endRound`)
- Modify: `index.html:9558` (`roundsLeft`)
- Modify: `index.html:10242` (`furnitureOverlay`'s year-marker placement)
- Modify: `index.html:11285-11287` (append a new self-test block, inside `window.__selfTest`)

**Interfaces:**
- Produces: module-level `YEAR_START` / `YEAR_END` (numbers), set by `setMap()` from `MAP.years.start` / `MAP.years.end`, readable by any later code (including Task 2's tests and future Western-board content work) the same way `HEX`/`OX`/`OY` already are.
- Produces: a `MAPS.<id>.years = {start, end}` field, optional — a map without it is not supported after this task (both current maps get it explicitly, so there is no fallback-less path).

- [ ] **Step 1: Add the failing self-test assertions**

Open `index.html`, find the end of the Canadian-board self-test block:

```
11282	  } finally {
11283	    setMap(_mapBefore);   // never leave the app on a different board than it started
11284	  }
11285	  assert('map restored after the Canadian tests', MAP.id===_mapBefore);
11286	
11287	  render(gameState);
```

Insert a new block between line 11285 and line 11286:

```js
  /* ---- per-map play-year range (engine capability for a future third map) --
     Confirms year handling reads MAP.years rather than a hardcoded 1851/1857,
     so a map with a different play window (the planned Western Canada board,
     1881-1887) works without touching game logic. */
  {
    const _mapBefore2 = MAP.id;   // restore to whatever board was active, not always 'us'
    assert('us map declares its play years', MAPS.us.years && MAPS.us.years.start===1851 && MAPS.us.years.end===1857);
    assert('ca map declares its play years', MAPS.ca.years && MAPS.ca.years.start===1851 && MAPS.ca.years.end===1857);
    const savedYears = MAPS.us.years;
    MAPS.us.years = {start:1900, end:1904};
    setMap('us');
    assert('YEAR_START/YEAR_END follow a swapped map.years', YEAR_START===1900 && YEAR_END===1904);
    const m = createInitialState({mode:'local', names:['A','B','C','D']});
    assert('a fresh game opens on its map\'s start year', m.year===1900);
    assert('roundsLeft matches the swapped window', roundsLeft(m)===5);
    m.year = 1904;
    endRound(m);
    assert('endRound ends the game at its map\'s end year', m.phase==='gameOver');
    MAPS.us.years = savedYears;
    setMap(_mapBefore2);
    assert('map years restored after the swap test', YEAR_START===1851 && YEAR_END===1857);
  }
```

- [ ] **Step 2: Run the self-test and confirm it fails**

```bash
node scripts/serve.mjs &
```

Then, via the Playwright browser tools: navigate to `http://localhost:5177/`, and evaluate `window.__selfTest()`.

Expected: a thrown error (uncaught `TypeError`, something like "Cannot read properties of undefined (reading 'start')") because `MAPS.us.years` does not exist yet — the self-test aborts partway through, proving the new assertions currently have nothing to check.

- [ ] **Step 3: Add `years` to the module-level declarations**

At `index.html:9056`:

```js
let MAP, PDF_CELLS;
```

becomes:

```js
let MAP, PDF_CELLS, YEAR_START, YEAR_END;
```

- [ ] **Step 4: Add `years` to both map registry entries**

At `index.html:9035-9053`, `MAPS.us` and `MAPS.ca`:

```js
  us: {
    id:'us', label:'American Rails', sub:'The Eastern United States',
    template:'tpl-board', cells:US_CELLS,
    hubs:['New York','Baltimore','Philadelphia','Boston','Chicago'],
    specials:['Chicago','New York','Atlanta'],
    hex:41, ox:120, oy:97, names:COMPANY_BASE,
    at:{x:1250,y:556}, yt:{x:1100,y:1046}, houseSupply:{x:1032,y:958},
  },
  ca: {
    id:'ca', label:'Canadian Rails', sub:'The Province of Canada & the Maritimes',
    template:'tpl-board-ca', cells:(window.CA_MAP||{}).cells,
    hubs:(window.CA_MAP||{}).hubs, specials:(window.CA_MAP||{}).specials,
    hex:(window.CA_MAP||{}).hex, ox:(window.CA_MAP||{}).ox, oy:(window.CA_MAP||{}).oy,
    names:CA_COMPANY_NAMES, cardNames:CA_CARD_NAMES,
    // the Canadian board relocates these printed panels to fit its land mass —
    // see PANELS in scripts/canada/make-board-svg.mjs (action table -> [1230,690],
    // year track -> [560,900], house-supply box -> delta [-438,+139]).
    at:{x:1230,y:690}, yt:{x:560,y:900}, houseSupply:{x:594,y:1097},
  },
```

becomes (add a `years` line to each, plus a comment on the registry banner):

```js
  us: {
    id:'us', label:'American Rails', sub:'The Eastern United States',
    template:'tpl-board', cells:US_CELLS,
    hubs:['New York','Baltimore','Philadelphia','Boston','Chicago'],
    specials:['Chicago','New York','Atlanta'],
    hex:41, ox:120, oy:97, names:COMPANY_BASE,
    at:{x:1250,y:556}, yt:{x:1100,y:1046}, houseSupply:{x:1032,y:958},
    years:{start:1851, end:1857},
  },
  ca: {
    id:'ca', label:'Canadian Rails', sub:'The Province of Canada & the Maritimes',
    template:'tpl-board-ca', cells:(window.CA_MAP||{}).cells,
    hubs:(window.CA_MAP||{}).hubs, specials:(window.CA_MAP||{}).specials,
    hex:(window.CA_MAP||{}).hex, ox:(window.CA_MAP||{}).ox, oy:(window.CA_MAP||{}).oy,
    names:CA_COMPANY_NAMES, cardNames:CA_CARD_NAMES,
    // the Canadian board relocates these printed panels to fit its land mass —
    // see PANELS in scripts/canada/make-board-svg.mjs (action table -> [1230,690],
    // year track -> [560,900], house-supply box -> delta [-438,+139]).
    at:{x:1230,y:690}, yt:{x:560,y:900}, houseSupply:{x:594,y:1097},
    years:{start:1851, end:1857},
  },
```

- [ ] **Step 5: Set `YEAR_START`/`YEAR_END` in `setMap()`**

At `index.html:9068` (right after `HEX = MAP.hex; OX = MAP.ox; OY = MAP.oy;`):

```js
  HEX = MAP.hex; OX = MAP.ox; OY = MAP.oy;
  HW = HEX*Math.sqrt(3); RP = HEX*1.5;
```

becomes:

```js
  HEX = MAP.hex; OX = MAP.ox; OY = MAP.oy;
  HW = HEX*Math.sqrt(3); RP = HEX*1.5;
  YEAR_START = MAP.years.start; YEAR_END = MAP.years.end;
```

- [ ] **Step 6: Replace the hardcoded year in `createInitialState`**

At `index.html:9121`:

```js
    year:1851, round:0, actionPhase:0,
```

becomes:

```js
    year:YEAR_START, round:0, actionPhase:0,
```

- [ ] **Step 7: Replace the hardcoded year in `beginPlayRounds`**

At `index.html:9320` and `9325`:

```js
function beginPlayRounds(s){ s.round=1; s.year=1851;
  // opening turn order = the order players won prep auctions; anyone who won nothing keeps seating order at the back
  const won=s.setupWinOrder.slice(), rest=s.turnOrder.filter(seat=>!won.includes(seat));
  s.turnOrder = won.concat(rest);
  pushLog(s, `Turn order (by auction wins): ${s.turnOrder.map(i=>s.players[i].name).join(', ')}.`);
  startActionPhase(s, s.turnOrder.slice()); initMarkers(s); pushLog(s,'Round 1 (1851) begins.'); }
```

becomes:

```js
function beginPlayRounds(s){ s.round=1; s.year=YEAR_START;
  // opening turn order = the order players won prep auctions; anyone who won nothing keeps seating order at the back
  const won=s.setupWinOrder.slice(), rest=s.turnOrder.filter(seat=>!won.includes(seat));
  s.turnOrder = won.concat(rest);
  pushLog(s, `Turn order (by auction wins): ${s.turnOrder.map(i=>s.players[i].name).join(', ')}.`);
  startActionPhase(s, s.turnOrder.slice()); initMarkers(s); pushLog(s,`Round 1 (${YEAR_START}) begins.`); }
```

- [ ] **Step 8: Replace the hardcoded end-year in `endRound`**

At `index.html:9439`:

```js
  if (s.year>=1857 || sharesLeft===0 || suppliesLow(s)>=threshold){ endGame(s); return; }
```

becomes:

```js
  if (s.year>=YEAR_END || sharesLeft===0 || suppliesLow(s)>=threshold){ endGame(s); return; }
```

- [ ] **Step 9: Replace the hardcoded years in `roundsLeft`**

At `index.html:9558`:

```js
function roundsLeft(s){ return Math.max(1, 1858 - (s.year||1851)); }
```

becomes:

```js
function roundsLeft(s){ return Math.max(1, (YEAR_END+1) - (s.year||YEAR_START)); }
```

- [ ] **Step 10: Replace the hardcoded years in the year-marker overlay**

At `index.html:10242`:

```js
  const yi=(s.year-1851); if(yi>=0&&yi<7){ const yc=ytCell(yi); ov+=locoSVG(yc.x, yc.y-2, '#23262e', '#0d0f13', 0.36); }
```

becomes:

```js
  const yi=(s.year-YEAR_START); if(yi>=0&&yi<(YEAR_END-YEAR_START+1)){ const yc=ytCell(yi); ov+=locoSVG(yc.x, yc.y-2, '#23262e', '#0d0f13', 0.36); }
```

- [ ] **Step 11: Run the self-test and confirm it passes**

Same as Step 2 (reuse the running server if still up; if not, `node scripts/serve.mjs &` again). Navigate to `http://localhost:5177/`, evaluate `window.__selfTest()`.

Expected: `{ passed: <N>, total: <N> }` with `passed === total` and no thrown error — the 6 new assertions from Step 1 all report `pass:true`, and every pre-existing assertion (including `'4p: game ends at 1857'` and the whole Canadian-board block) still passes, since `MAPS.us`/`MAPS.ca` both resolve to the same 1851/1857 values as before.

- [ ] **Step 12: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Make the play-year range a per-map setting

Both boards still play 1851-1857, but MAP.years is now the source of
truth instead of literals scattered across createInitialState,
beginPlayRounds, endRound, roundsLeft, and the year-marker overlay —
the Western Canada board (1881-1887) needs this before any content
work can start.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Per-map company share/cube counts

**Files:**
- Modify: `index.html:8982` (new helper functions, immediately after `COMPANY_IDS`)
- Modify: `index.html:9116` (`createInitialState`)
- Modify: `index.html:9138` (`createInitialState`'s 3-player company-removal reset)
- Modify: `index.html:10908` (self-test's `miniState()` builder)
- Modify: `index.html:9034` (registry banner comment, to document the new optional field)
- Modify: `index.html` (append a new self-test block, immediately after Task 1's block)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `companyShares(id)` / `companyCubes(id)` functions — given a company id, return that company's share count / cube supply, preferring `MAP.companyCounts[id]` when the active map defines an override for that id, otherwise falling back to the shared `COMPANIES[id].shares` / `COMPANIES[id].cubes`. Any later code that needs a company's configured share or cube count (including the Western board's content-build phase) should call these instead of reading `COMPANIES[id]` directly.
- Produces: an optional `MAPS.<id>.companyCounts` field shaped `{ [companyId]: { shares?, cubes? } }` — a map may override either or both for any subset of companies; an id or property it omits falls back to `COMPANIES`.

- [ ] **Step 1: Add the failing self-test assertions**

Immediately after Task 1's new block (which ends with `assert('map years restored after the swap test', ...)`), insert:

```js
  /* ---- per-map company share/cube counts (engine capability for a future
     third map) — confirms a map can rebalance a company's printed share and
     cube counts (e.g. Western Canada's dominant CPR Mainline company)
     without touching COMPANIES, the shared rules table both existing
     boards rely on staying untouched. */
  {
    const _mapBefore3 = MAP.id;   // restore to whatever board was active, not always 'us'
    assert('companyShares/companyCubes fall back to COMPANIES with no override',
      companyShares('liberty')===COMPANIES.liberty.shares && companyCubes('liberty')===COMPANIES.liberty.cubes);
    const savedCounts = MAPS.us.companyCounts;
    MAPS.us.companyCounts = { liberty:{shares:9, cubes:99} };
    setMap('us');
    assert('an overridden company reads the map\'s counts', companyShares('liberty')===9 && companyCubes('liberty')===99);
    assert('a non-overridden company still falls back to COMPANIES', companyShares('american')===COMPANIES.american.shares);
    const m = createInitialState({mode:'local', names:['A','B','C','D']});
    assert('createInitialState seeds the overridden supply', m.companies.liberty.sharesInSupply===9 && m.companies.liberty.cubesInSupply===99);
    assert('createInitialState leaves a non-overridden company alone', m.companies.american.sharesInSupply===COMPANIES.american.shares);
    const m3 = createInitialState({mode:'local', names:['A','B','C'], removed:'liberty'});
    assert('3-player removal records the overridden share count', m3.companies.liberty.sharesRemoved===9);
    MAPS.us.companyCounts = savedCounts;
    setMap(_mapBefore3);
    assert('company counts restored after the swap test', companyShares('liberty')===COMPANIES.liberty.shares);
  }
```

- [ ] **Step 2: Run the self-test and confirm it fails**

Via Playwright against `http://localhost:5177/` (restart `node scripts/serve.mjs &` if it's no longer running), evaluate `window.__selfTest()`.

Expected: a thrown `ReferenceError: companyShares is not defined` — the helper doesn't exist yet.

- [ ] **Step 3: Add the `companyShares`/`companyCubes` helpers**

At `index.html:8981-8982`:

```js
const COMPANY_IDS = Object.keys(COMPANIES);
```

becomes:

```js
const COMPANY_IDS = Object.keys(COMPANIES);
// A map may rebalance a company's printed share/cube counts (e.g. the Western
// Canada board's dominant CPR Mainline company) via MAP.companyCounts[id] —
// falls back to the shared rules values in COMPANIES when a map doesn't
// override, so the American and Canadian boards are unaffected.
function companyShares(id){ const o = MAP && MAP.companyCounts && MAP.companyCounts[id]; return (o && o.shares!=null) ? o.shares : COMPANIES[id].shares; }
function companyCubes(id){ const o = MAP && MAP.companyCounts && MAP.companyCounts[id]; return (o && o.cubes!=null) ? o.cubes : COMPANIES[id].cubes; }
```

- [ ] **Step 4: Use the helpers in `createInitialState`'s company setup**

At `index.html:9116`:

```js
  for (const id of COMPANY_IDS) companies[id] = { treasury:0, income:0, sharesInSupply:COMPANIES[id].shares, sharesRemoved:0, cubesInSupply:COMPANIES[id].cubes, onMap:false, bonuses:[], removed:false };
```

becomes:

```js
  for (const id of COMPANY_IDS) companies[id] = { treasury:0, income:0, sharesInSupply:companyShares(id), sharesRemoved:0, cubesInSupply:companyCubes(id), onMap:false, bonuses:[], removed:false };
```

- [ ] **Step 5: Use the helper in the 3-player removal reset**

At `index.html:9137-9139`:

```js
  if (n===3){ const rid = config.removed || COMPANY_IDS[Math.floor(Math.random()*COMPANY_IDS.length)];
    const c = companies[rid]; c.removed=true; c.cubesInSupply=0; c.sharesInSupply=0; c.sharesRemoved=COMPANIES[rid].shares;
    pushLog(state, `${COMPANIES[rid].name} removed (3-player game).`); }
```

becomes:

```js
  if (n===3){ const rid = config.removed || COMPANY_IDS[Math.floor(Math.random()*COMPANY_IDS.length)];
    const c = companies[rid]; c.removed=true; c.cubesInSupply=0; c.sharesInSupply=0; c.sharesRemoved=companyShares(rid);
    pushLog(state, `${COMPANIES[rid].name} removed (3-player game).`); }
```

- [ ] **Step 6: Use the helpers in the self-test's `miniState()` builder**

At `index.html:10908`:

```js
  function miniState(){ return { players:[{money:50,shares:[]},{money:50,shares:[]},{money:50,shares:[]}],
    companies:Object.fromEntries(COMPANY_IDS.map(id=>[id,{treasury:0,income:0,sharesInSupply:COMPANIES[id].shares,sharesRemoved:0,cubesInSupply:COMPANIES[id].cubes,onMap:false,bonuses:[],removed:false}])),
    hexes:{}, developmentSupply:12, year:1854, log:[] }; }
```

becomes:

```js
  function miniState(){ return { players:[{money:50,shares:[]},{money:50,shares:[]},{money:50,shares:[]}],
    companies:Object.fromEntries(COMPANY_IDS.map(id=>[id,{treasury:0,income:0,sharesInSupply:companyShares(id),sharesRemoved:0,cubesInSupply:companyCubes(id),onMap:false,bonuses:[],removed:false}])),
    hexes:{}, developmentSupply:12, year:1854, log:[] }; }
```

- [ ] **Step 7: Document the new field on the registry banner**

At `index.html:9030-9033`:

```js
/* ============================ 1b. MAP REGISTRY ============================ */
// Two boards, one engine. Everything map-specific lives in this table; the
// rules, the AI and the UI read the bindings below and never name a country.
// Adding a third map means adding a row here plus its <template> and cell data.
```

becomes:

```js
/* ============================ 1b. MAP REGISTRY ============================ */
// Two boards, one engine. Everything map-specific lives in this table; the
// rules, the AI and the UI read the bindings below and never name a country.
// Adding a third map means adding a row here plus its <template> and cell data.
// Optional per-entry fields: `years:{start,end}` (play-year range, required —
// see setMap) and `companyCounts:{[companyId]:{shares?,cubes?}}` (rebalances
// a company's printed share/cube counts for this map only; read via
// companyShares(id)/companyCubes(id), never COMPANIES[id] directly).
```

- [ ] **Step 8: Run the self-test and confirm it passes**

Via Playwright against `http://localhost:5177/`, evaluate `window.__selfTest()`.

Expected: `{ passed: <N>, total: <N> }` with `passed === total` — the new assertions from Step 1 all pass, and the pre-existing `'CA: company cube and share counts are unchanged'` assertion (`COMPANIES.american.cubes===31 && COMPANIES.liberty.shares===2`) still passes, since `COMPANIES` itself is never mutated — only the new helpers read an optional per-map override on top of it.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Let a map rebalance a company's share and cube counts

Both boards still use the shared COMPANIES table unchanged; a new
optional MAP.companyCounts override (read via companyShares/
companyCubes) is what the Western Canada board's dominant CPR
Mainline company will need, without disturbing the American/Canadian
balance.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
