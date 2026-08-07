# American Rails — UI/UX & build analysis (2026-08-07)

A pass through the whole game (played 3/4/5-player games start-to-finish, 0 errors) plus a
Lighthouse audit and a design review. What follows is what's solid, what's missing vs. the real
board, and a prioritized list of improvements.

## Lighthouse (headless Chrome)
| Category | Score | Read |
|---|---|---|
| Performance | 71 | The board is a large hand-drawn SVG (~5–6k nodes). Now only the small overlay re-renders each move (fixed this pass). Remaining cost is the one-time parse of the tile art. To raise it: reduce per-hex art density, or bake the static board to a single embedded image. |
| Accessibility | 96 | Strong. Gaps below. |
| Best practices | 100 | Was 96; adding a favicon removed the only console error. |

## Added this pass (making it feel real)
- **Action track** — turn-order column (1–5) + three phase columns × seven action rows with icons, and **player train markers that move to each chosen action** so you can see who goes first next phase.
- **Year track** 1851–1857 with the train on the current year.
- **Development houses** rendered on developed cities + a house-supply indicator.
- **3D isometric cubes** for track (was flat squares).
- **Redesigned company panel** (colored train icons, treasury/income/cubes/shares) and **per-player share certificate cards** instead of bare cubes.
- **World decorations** — Atlantic Ocean / Gulf of Mexico labels, title cartouche, terrain-cost legend.

## Still missing vs. the physical board (fidelity)
1. **Company supply boxes** with the little train illustrations along the bottom of the real board (currently summarized in the side panel).
2. **Income track (0–99 border)** — income is shown as a number, not as a marker traveling the board edge.
3. **Coastline & geography detail** — rivers, capes, lakes, faint town names that give the map character.
4. **Special-connection cue** — the Chicago/New York/Atlanta +$10 bonus only appears in the log; no on-board highlight when a company links them.

## UI/UX improvements, prioritized
**High impact**
1. **Action-track legibility** — the icons are small; add short labels + hover tooltips, and a one-line legend. New players can't tell Expand 3 from Expand 4 at a glance.
2. **Active-player prominence** — make "whose turn it is" unmistakable (glow on their panel + a name banner over the action bar).
3. **In-game rules help** — a "?" that explains each action and the flow; a first-time hint. Right now you need the rulebook open.
4. **Auction clarity** — show every bidder, who's still in, and the standing high bid, during a share auction.
5. **Hot-seat hand-off** — a small "Pass the device to <name>" beat so players don't accidentally act for each other.

**Medium**
6. **Motion** — subtle animations for cube placement, dividends, the year advancing, and markers moving.
7. **Zoom / pan** controls for the large board.
8. **Colorblind-safe pieces** — add a company initial or pattern on cubes (red/green are close for some players).
9. **Log** — group by round, make it collapsible, and bold your own actions.
10. **Responsive/mobile** — currently desktop-first; phones would be cramped.

**Robustness / nice-to-have**
11. **Online reconnection** — handle a dropped player gracefully (pause + rejoin).
12. **Undo** (host-authoritative) for misclicks.
13. **Save/resume** a game to localStorage.
14. **Sound** — light audio cues for turns and dividends.

## Recommendation
The game is functionally complete and now looks like a real board. If we do one more focused pass,
the highest return is **#1–#3 (legibility + active-player clarity + in-game help)** — they make the
game teachable and playable without the rulebook, which matters most for game night with friends.
