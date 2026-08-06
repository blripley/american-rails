# American Rails Online — Design

**Date:** 2026-08-05
**Status:** Approved direction; board data pending
**Goal:** A faithful, rules-enforcing online version of the board game *American Rails* (Tim Harrison / Quined Games), for a private group of 4 friends to play live in a web browser, styled after Board Game Arena.

---

## 1. Goals and constraints

**What we're building**
- A full, rules-enforced digital version of American Rails.
- Live, real-time play: all players online at once in one sitting (~60–90 min).
- Desktop/laptop web browsers (phones out of scope for v1).
- Board Game Arena look and feel: central board, side panels for companies and players, action log, click-to-play with legal moves highlighted.

**Constraints / decisions locked in**
- **Free to host.** No always-on paid server.
- **Trusted players.** Four friends who know each other, so we do NOT need tamper-proof anti-cheat. This is what lets us skip a paid authoritative server.
- **No accounts.** Create a game → get a private link → friends open it, type a name, take a seat.
- **Faithful to the printed rules**, including the 3-player company removal, auctions, action/turn-order track, income math, special-connection bonuses, and all end-game conditions.
- Supports **3–5 players** (rules define all three), though the target group is 4.

**Non-goals for v1**
- Mobile/phone layout.
- AI/bot opponents.
- Matchmaking, public lobbies, rankings, persistent user accounts.
- In-app voice (players use Discord/Zoom on the side). A simple text chat box is in scope.

---

## 2. Architecture (Option A: no server)

The entire game runs in the browser. A free **Firebase** project provides:
- **Firestore** (cloud database) holding one shared *game state* document per game, synced live to every player's browser.
- **Anonymous Auth** to give each browser a stable identity (maps a person to a seat) without passwords.
- **Firebase Hosting** to serve the website for free.

Because American Rails is strictly turn-based (exactly one player acts at any moment, including one bidder at a time during auctions), we avoid write conflicts with a simple rule: **only the player whose turn it is may write the next game state.** Everyone else's browser reads and renders. During auctions, only the player whose turn it is to bid may write.

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│ Browser P1 │     │ Browser P2 │     │ Browser P3 │     │ Browser P4 │
│  React UI  │     │  React UI  │     │  React UI  │     │  React UI  │
│  + Rules   │     │  + Rules   │     │  + Rules   │     │  + Rules   │
│   engine   │     │   engine   │     │   engine   │     │   engine   │
└─────┬──────┘     └─────┬──────┘     └─────┬──────┘     └─────┬──────┘
      └──────────────────┴────────┬─────────┴──────────────────┘
                                   │  live sync
                          ┌────────▼─────────┐
                          │  Firebase        │
                          │  Firestore doc:  │
                          │  games/{gameId}  │
                          └──────────────────┘
```

**Tech stack**
- **React + TypeScript + Vite** — the app.
- **SVG** for the hex map — crisp, clickable, scalable, matches the BGA look.
- **Firebase** (Firestore + Anonymous Auth + Hosting) — free tier, real-time, no server to maintain.
- **Vitest** — unit tests for the rules engine.

---

## 3. The rules engine (the heart of the project)

A self-contained TypeScript module with **no UI and no Firebase dependency** — pure functions over a game-state object. This is where correctness lives, and it is built and tested first.

### 3.1 Game state (data model, sketch)
```
GameState {
  gameId
  players: [{ id, name, seat, money, shares: [companyId], actionMarkerPosition }]
  companies: {
    [companyId]: { color, treasury, income, sharesInSupply, sharesRemoved, cubesInSupply }
  }
  board: {
    hexes: { [hexId]: { terrain, cityName?, fullValue?, sharedValue?, developable?, cubes: [companyId], developed: bool } }
    adjacency: { [hexId]: [hexId...] }   // from board data
  }
  developmentSupply: number               // starts at 12
  yearTrack: 1851..1857
  turnOrderTrack: [playerId...]           // the '#1..#5' seats
  actionTrack: [[cell per phase]...]      // rows = actions, cols = 3 phases
  phase: 'setup-auction' | 'action' | 'dividend' | 'ended'
  activePlayer
  auction?: { shareCompanyId, seller, currentBid, highBidder, bidders: [...], passed: [...] }
  log: [events...]
}
```

### 3.2 Moves the engine exposes
Each move validates legality first and refuses illegal moves; it also performs all money and income math.
- **Setup / auction:** `startAuction(share)`, `bid(amount)`, `passBid()`, then winner's `placeStartingCube(city)`.
- **Action phase:** `chooseAction(action)` (Pass, Develop, Fund $5, Take $2 / Expand, Auction a share, Expand 2/3/4), then the follow-up moves that action requires:
  - `placeCube(companyId, hexId)` — validates adjacency, terrain limits, "no two same-color cubes in a hex", pays the correct cost from the company treasury; updates city income; awards special-connection bonuses.
  - `placeDevelopment(cityHexId)` — validates developable + has a cube; adjusts income.
  - `fund(companyId)`, `takeTwo(mode)`, etc.
- **End of phase/round:** `resolveActionOrder()`, `payDividends()`, `checkGameEnd()`, `advanceRound()`.

### 3.3 Rules the engine must get right (checklist for tests)
- 3-player setup removes one random company.
- Preparation-round auction: min bid $10, clockwise, pass-is-out, no-bid removes share, starting cube + income set to city full value, no-empty-city edge case removes the company.
- Action track: one player per action slot per phase (blocking); position in the track sets next phase's turn order; markers return to turn order track after the round.
- Expansion costs by terrain, including "+$2 per existing cube/dev marker" in cities/plains, forest/mountain single-cube limit, no two same-color cubes per hex, company-must-afford rule.
- City income: full vs shared switch when a 2nd company enters; reducing the first company's income by (full − shared); development markers (+2 full / +1 shared) and their reduction when a city becomes shared.
- Special connections (Chicago↔NY, Chicago↔Atlanta, NY↔Atlanta): +$10 each, once per connection, +$20 when the third city completes two at once.
- Non-developable cities: New York, Baltimore, Philadelphia, Boston, Chicago.
- Dividends: income ÷ (shares held by players), rounded up; unsold/removed shares excluded.
- End-game: 1857 reached, OR all shares gone, OR the player-count-dependent number of supplies at ≤2 cubes/markers. Most money wins; ties shared.

---

## 4. The board data (dependency — see §7)

The rulebook explains the rules but not the full map. The engine reads a **board definition file** describing:
- Every hex: terrain (city / plains / forest / mountain) and position.
- Every city: name, full value, shared value, developable (yes/no).
- Hex adjacency (which hexes touch which).
- The **action track layout**: which action occupies each row and their top-to-bottom order (this drives turn-order priority).

This file is produced by: (a) online research for a first draft, then (b) verification/correction against clear photos of the physical board. The engine and UI are built to read this file, so the map can be filled in and corrected without changing code.

---

## 5. User interface (Board Game Arena style)

- **Center:** SVG hex map. Legal target hexes highlight during your turn; click to place cubes / develop / choose a starting city.
- **Right panels:**
  - One card per company: color, treasury $, current income, shares (held by whom / in supply / removed), cubes left in supply.
  - One card per player: name, money, shares owned, and a "you" marker.
- **Top bar:** year (1851–1857), the action track with player markers, the turn-order track, and a clear "It's Alice's turn — choosing an action" status.
- **Auctions:** a focused panel showing the share up for bid, current high bid, and Bid / Pass buttons for whoever must act.
- **Bottom / side:** scrolling action log ("Alice expanded Republic into St. Louis, paid $2") and a text chat box.
- **Turn safety:** the UI only offers buttons for legal moves and only to the player who may act; everyone else sees a read-only, live-updating board.

---

## 6. Lobby and multiplayer flow

1. Host opens the site, clicks **New Game**, picks player count (3–5), gets a **private link**.
2. Host sends the link to friends (Discord/text).
3. Each friend opens the link, types a **name**, takes an open **seat**. Anonymous Auth ties that browser to that seat so a refresh keeps their identity.
4. When all seats are filled, host clicks **Start**; the app runs setup (company removal if 3p, starting money) and the preparation-round auction.
5. Play proceeds; the shared Firestore doc keeps all four screens in sync. A disconnect/refresh reloads the current state and the player continues.

---

## 7. What I need from you (blocking accurate board data)

To make the map faithful I need, from your physical board, clear straight-on photos of:
1. **The whole map** (or overlapping halves) so I can read every city and hex.
2. **Close-ups of each city hex** showing its two income numbers (e.g. New York 8/5) and its name — corners/edges of the map especially.
3. **The terrain colors** clearly enough to tell plains vs forest vs mountain for every hex.
4. **The action track** (the column of actions on the right of the board) so I capture each action row and its order.

I'll research an online first draft in parallel, then use your photos to verify and correct it. Until the board data is confirmed, I can build everything that doesn't depend on the exact map (the engine's turn/auction/money/action machinery, the app shell, the multiplayer sync, and the UI framework), filling the verified map in as it arrives.

---

## 8. Build stages (each stage is usable)

1. **Rules engine, headless & test-first.** Full game logic, validated by tests that play complete games on paper. Uses a placeholder/draft board until real data lands.
2. **One-screen (hotseat) UI.** Click through an entire game in a single browser. Proves the board rendering and every action.
3. **Multiplayer.** Firebase sync, New Game → private link → type-name-and-seat, live updates across four browsers.
4. **Polish.** Action log, chat, animations, and the Board-Game-Arena styling pass.

---

## 9. Risks and mitigations

- **Board-data accuracy** → build code to read a data file; verify against photos; playtest against the physical board.
- **Rules complexity (income/auction edge cases)** → test-first engine, whole-game simulations, explicit edge-case tests.
- **Firestore free-tier limits** → tiny data (one small document per game, occasional writes) sits far inside the free tier for a handful of private games.
- **Sync race conditions** → turn-based "only the active player writes" rule removes contention by design.
