# American Rails — build progress

**Deliverable:** `american-rails.html` — a single-file, no-build browser game built with the
`develop-board-game` skill. Open it in a browser (or serve the folder and visit it). Also runnable
via the small dev server: `node scripts/serve.mjs` → http://localhost:5177/american-rails.html

## Status: PLAYABLE (local hot-seat). Online P2P built, needs a real 2-device test. Board layout art-complete; exact tile placement still approximate.

| Area | State | Grade | Notes |
|---|---|---|---|
| Rules engine | Done | A | Setup auctions, action-track turn order + blocking, all 7 actions, expansion (cost/adjacency/terrain limits), city income (full/shared + dev + special connections), dividends, all end-game conditions. |
| Local hot-seat | Done | A | Full game playable by clicking. Verified in-browser. |
| Board tile art | Done | A- | Engraved antique-map style (frontend-design): wheat plains, forest canopy, mountain peaks, parchment city tiles w/ rooftops, ocean ground, paper grain, vignette. |
| Board tile *layout* | Approximate | C | City names/values are correct (from photo IMG_0728). Exact per-hex terrain/positions are a best-effort reconstruction, not pixel-matched. Data-only (`CITY_AT` + terrain fns) so refinable without touching logic. |
| Online P2P | Built | B- | PeerJS host/join with room code, host-authoritative broadcast. Not yet tested across two real devices. |
| AI opponents | Not built | — | Out of scope for now (American Rails AI is hard; group is 4 humans). |

## Verification (via Playwright MCP browser)
`window.__selfTest()` → **7/7 pass**:
- 4-player: setup reaches action phase; all companies placed; game ends at 1857; winner declared.
- 3-player: exactly one company removed.
- Auctions: $5 bid rejected (min $10); $10 accepted.
Plus manual scripted checks: expansion places cubes with correct cost/adjacency/terrain limits;
income adjusts on shared cities; dividends pay out; a full game runs setup → 1857 → winner.

## Golden-rules self-review
- **State is truth / render(state):** yes. `render_game_to_text()` and UI read from `gameState`.
- **Rules validated at boundaries:** yes (`chooseAction` blocking, `canPlaceCube`, bid validation, turn gating).
- **Hidden info:** American Rails has none (money/shares public); `makeView` sends full state by design.
- **Boring tech:** vanilla JS + PeerJS from CDN; no build step.
- **Deviation (conscious):** engine functions mutate `gameState` in place rather than returning a new
  state. Safe here because play is host-authoritative and there is no undo; the host broadcasts full
  state after each move. Revisit if we add undo/replay.

## Next steps (priority order)
1. **Exact tile-by-tile layout** — finish matching the physical board (needs Ben's eye or the
   colour-sampler on a clean top-down photo). Highest remaining fidelity gap.
2. **Online 2-device test** — host on one machine, join from another; confirm PeerJS signalling works
   on the group's networks; add reconnect polish.
3. **Turn log/UX polish** — surface illegal-move reasons, animate cube placement, highlight the active
   action-track row, optional in-app text chat.
4. **Deploy** — it's a static file; can be hosted free (e.g. GitHub Pages) so friends just open a link.
