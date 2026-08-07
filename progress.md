# American Rails — build progress

**Deliverable:** `american-rails.html` — a single-file, no-build browser game. Double-click to play
locally; online play connects friends peer-to-peer with a room code. Dev server for testing:
`node scripts/serve.mjs` → http://localhost:5177/american-rails.html

## Status: FUNCTIONALLY COMPLETE ✅ (design polish still to come)

| Area | State | Notes |
|---|---|---|
| Rules engine | Done | Setup auctions, action-track turn order + blocking, all 7 actions, expansion (terrain cost/adjacency/limits), city income (full/shared + dev + special connections), dividends, all end-game conditions. |
| Board | Done | **Exact import from Ben's Canva PDF** (`Pictures of the Game/meadow.pdf`): pointy-top hexes, 19×18 grid, all 39 cities + every terrain tile read from the PDF's label positions. Ben approved. |
| Local hot-seat | Done | Full game playable by clicking; verified with real clicks (lobby, action buttons, board hexes). |
| Online P2P | Done | PeerJS host/join by room code. Verified across 3 browser tabs: host starts → board syncs to all → moves sync both directions → each player only gets controls on their turn. |
| Tile art | Done | Detailed per-hex art (meadow grass, forest canopy, mountains, town skylines). (Further design polish deferred per Ben.) |

## Verification (this session, via Playwright)
- **`window.__selfTest()` → 7/7** (3p & 4p full games to 1857, company removal, bid validation).
- **Comprehensive playthrough (3, 4, 5 players): 0 errors.** Every action type exercised many times
  (expand3/expand4, fund5, develop, take2 both modes, auction, pass); all games completed to 1857
  with a winner; 3-player game correctly produced a tie.
- **UI clicks:** lobby buttons, action-bar buttons (inline onclick), and board hex clicks all work.
  Fixed a bug where the highlight overlay blocked hex clicks (added a transparent click layer).
- **Online:** host + 2 guests connected over PeerJS; game start and moves synced correctly in both
  directions across tabs.

## How to play (for Ben)
1. Double-click `american-rails.html` → opens in your browser.
2. **Local:** "Local Game", pick players, Start, pass the laptop between turns.
3. **Online:** one person clicks "Host Online Game" and shares the 4-letter code; others click
   "Join Online Game", enter the code + a name; host clicks Start when everyone's in.

## Next (after Ben returns)
- Design polish pass (tile art refinements, UI styling).
- Optional: reconnection handling for online drops; deploy to a shareable link (GitHub Pages).
