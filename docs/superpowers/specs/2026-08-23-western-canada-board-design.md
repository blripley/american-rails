# Western Canada Board (CPR, 1881-87) — Design

**Date:** 2026-08-23
**Status:** Approved direction; board content pending
**Goal:** A third map for the existing *American Rails* online game — the Canadian Pacific Railway's transcontinental build across the Prairies and through the Rockies to the Pacific, playable inside the same `index.html` alongside the American and Canadian Rails 1851 boards.

---

## 1. Why this board, and the problem it has to solve

The CPR transcontinental build (1881-87) is the most dramatic and recognizable Western Canada rail story: BC's 1871 condition-of-Confederation promise of a rail link within 10 years, forced through Kicking Horse Pass and Rogers Pass, ending at the Last Spike at Craigellachie on 7 November 1885.

The real obstacle: the CPR was a near-monopoly by charter. Unlike 1850s New England or the Maritimes, Western Canada in 1881-87 does not have 6 genuinely competing railroads. **Decision (Ben, 2026-08-23): fictionalize the monopoly into subsidiaries** — one dominant CPR Mainline company plus 5 smaller regional divisions, the way the existing boards already give period names to real short lines. This keeps the iconic 1881-87 window and the established 6-company structure, and turns the monopoly itself into a felt gameplay asymmetry rather than a lore footnote (see §4).

## 2. Scope and non-goals

**In scope:**
- A new map registered in `MAPS` with id `wc`, following the same registry pattern Canadian Rails established.
- Real geography: Manitoba, Saskatchewan, Alberta (including Edmonton), British Columbia. Picks up immediately west of the existing Canadian board (Ontario/Quebec/Maritimes) with no territorial overlap.
- Years 1881-1887.
- 6 companies with genuinely asymmetric share counts and cube supplies (not just asymmetric names).
- Full content pipeline reuse: `cities.json` + `terrain.json` → `build-map.mjs` → `make-board-svg.mjs` → `inject.mjs`, generalized from the Canada-specific scripts.
- Self-test coverage extended to match (currently 153 checks).

**Non-goals:**
- No new UI/mechanics beyond what per-map asymmetric cube/share counts require.
- No change to bot difficulty tiers, personas, or auction logic — they already operate on whatever share/cube numbers a company has; this board changes the inputs, not the algorithms.
- Company theming/exact names, the 2 remaining hub cities, and full city list are content decisions made during the research/build pass, not locked here.

## 3. Engine blocker: de-hardcoded year range

Play years are currently hardcoded to 1851-1857 in multiple places: `beginPlayRounds` sets `s.year = 1851`; `roundsLeft(s)` computes `1858 - s.year`; various endgame/bot-tuning checks reference the literal year 1857. Neither existing map overrides this — both play 1851-1857 today.

**Change:** add `years: {start, end}` to each entry in `MAPS` (`us`/`ca` both get `{start:1851, end:1857}`, `wc` gets `{start:1881, end:1887}`). `setMap()` sets module-level `YEAR_START`/`YEAR_END` (or equivalent) from `MAP.years`; every hardcoded `1851`/`1857`/`1858` reference is replaced with the resolved values. This must land and pass a self-test **before** any Western content work starts, per the standing rule that structural/engine changes go first ([[board-game-build-process]]).

## 4. Company asymmetry: mainline vs. subsidiaries

Today, share counts already vary 2-5 per company (engine capability, no change needed) but cube supply is the **same six values, just relabeled** across both existing boards. This board needs cube supply to vary meaningfully per company, tied to the monopoly story:

- **CPR Mainline**: highest share count (above the existing 2-5 range if needed) and largest cube supply of the six — reflects its real dominance and gives one company genuine "safe, big, slow-growing" characteristics.
- **5 regional subsidiaries**: fewer shares, smaller cube supplies — genuinely scarcer, more volatile companies (echoing how Liberty's 2-share scarcity already plays differently from American's 5-share spread on the existing board, but pushed further).

Exact numbers are a content/balance decision, not fixed here — they get set during the build pass and **validated with the bot-game harness** (12+ seeds, mixed difficulty, checked for degenerate outcomes like a company nobody can ever afford into) before shipping, per [[board-game-build-process]]'s validation lesson. `MAPS.wc` needs a `companies` (or similar) table carrying per-company `shares` and `cubes`, read by whatever currently reads the shared constant.

## 5. Geography and connection cities

**Provinces:** Manitoba, Saskatchewan, Alberta (incl. Edmonton), British Columbia.

**Connection-bonus cities (3, analog to Chicago/NY/Atlanta and Toronto/Montréal/Halifax): Winnipeg, Calgary, Vancouver** — confirmed 2026-08-23 after researching real distances:

| Pair | Straight-line distance |
|---|---|
| Winnipeg – Calgary | ~1,203 km |
| Calgary – Vancouver | ~676 km |
| Winnipeg – Vancouver | ~1,865 km |

Calgary sits almost exactly on the great-circle line between the other two (1,203 + 676 = 1,879 km vs. an actual 1,865 km, ~1% off) — this is a corridor with a waypoint, not a triangle. Checked swapping in Edmonton as an alternate third city: also nearly collinear with the others (doesn't fix the geometry). **Decision: keep Winnipeg/Calgary/Vancouver anyway** — they're the three genuinely iconic waypoints of the real mainline, the near-linear geometry is consistent with (if more pronounced than) the already-measured "bonus fires mostly on the shortest leg" pattern on both existing boards, and it fits the single-corridor framing that makes the monopoly story make sense in the first place.

**Open wrinkle, flag for the build/measurement pass:** Calgary–Vancouver is the shorter leg in real km, but it crosses the Rockies (expensive mountain terrain in-game), while the longer Winnipeg–Calgary leg crosses cheap prairie the whole way. Real terrain cost may partly offset the raw distance imbalance in a way the existing boards' connection pairs don't exhibit. **Do not assume either way — measure actual fire rates with the bot harness once the board is built**, same as the Canadian board's Toronto–Montréal/Chicago–Atlanta measurements.

**5 non-developable hub cities:** Winnipeg, Calgary, and Vancouver are certain; the remaining 2 are a research-phase decision (candidates: Edmonton, Regina, Victoria), not locked here.

**Terrain:** prairie-dominant east of Calgary, a mountain belt through the Rockies/Selkirks as the signature chokepoint (Kicking Horse Pass / Rogers Pass), boreal forest belt in the north. Terrain quality (does it produce interesting chokepoints, dead zones, adjacency issues) gets validated with the bot harness exactly as the Canadian board's north/west rebalance was — not eyeballed from the printed map.

## 6. Content pipeline

Reuse the Canadian board's pipeline pattern, generalized past the `scripts/canada/` naming:
- `cities.json`: real 1880s names, lat/lon, population/economic notes, verified via research (candidates already surfaced: Winnipeg, Calgary, Regina, Vancouver, Victoria, Brandon, Portage la Prairie, Medicine Hat, Moose Jaw, Kamloops, New Westminster, Port Moody, Banff, Field, Golden, Revelstoke, Yale — expect trimming/nudging the way the Canadian city list was).
- `terrain.json`: ASCII terrain grid sized for this board's geography.
- `build-map.mjs` / `make-board-svg.mjs` / `inject.mjs`: same validation contract as today (connectivity, unique names, no-two-cities-touching, hub/special counts) — reused, not rewritten, unless the per-company cube/share table needs a new validation step.
- A parallel `docs/western-canada-board-research.md` (matching `docs/canada-board-research.md`'s convention: every claim tagged HIGH/MEDIUM/LOW confidence) captures the historical grounding for city names, populations, and the 1881-87 dating — written during the research pass, not part of this design doc.

## 7. Testing

Extend the self-test suite (currently 153 cases) with Western-specific checks mirroring the Canadian board's additions: map registry swap, city-name uniqueness, no-two-cities-adjacent, hub/special counts, tile geometry + piece scaling, company-name propagation across every render path (plates, share cards, action-bar tags, log lines, game-report text — per the "names live in 2+ templates" lesson), **plus two genuinely new cases this board introduces**: the year range (`roundsLeft`/`beginPlayRounds` honor `MAP.years` for both existing boards and this one) and per-company share/cube asymmetry (each company's printed supply matches its configured table entry, and the dominant company is verifiably bigger than the subsidiaries).

## 8. Open items (research/content phase, not blocking this design)

- Exact company names/theming for CPR Mainline + 5 subsidiaries (real period names where possible, same rigor as Canadian board renames).
- Final 2 of the 5 hub cities.
- Full city list, terrain grid, and the resulting board SVG.
- Exact share/cube numbers per company (bounded by §4's direction, set and measured during the build pass).
