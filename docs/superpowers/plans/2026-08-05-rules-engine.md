# American Rails Rules Engine — Implementation Plan (Stage 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a headless, fully test-driven TypeScript rules engine that plays a complete, rules-faithful game of American Rails with no UI and no network.

**Architecture:** A pure-function core. One `GameState` object is the single source of truth. A top-level `applyMove(state, move)` reducer validates a move, refuses illegal ones, and returns the next immutable state. All randomness (3-player company removal, nothing else in the base game) flows through a seeded RNG so tests are deterministic. The board is data (`boardData.ts`); the engine logic never hard-codes city names or geometry, so the real map can be filled in later without touching logic. Stage-1 tests use a small synthetic test board plus the real board data as it lands.

**Tech Stack:** TypeScript (strict), Vitest for tests, Node. No React, no Firebase in this stage.

## Global Constraints

- Language: **TypeScript strict mode** (`"strict": true`). No `any` except where explicitly unavoidable and commented.
- All engine functions are **pure**: they take state (+args) and return new state; they never mutate inputs. Use structural cloning helpers.
- **Determinism:** every random choice goes through the injected seeded RNG (`rng.ts`). No `Math.random()` in engine code.
- **Money math:** all money is integer dollars. Dividends and any division round **up** (`Math.ceil`).
- **Player counts:** support **3, 4, and 5** players. 3-player removes one random company. Expand-2/Take-$2 alternate-mode (Expand 2) is legal only in 4–5 player games.
- **Companies (id, color, cubes, shares):** american(white,31,5), national(grey,29,4), continental(green,26,3), majestic(yellow,22,4), liberty(red,19,2), republic(blue,17,3).
- **Non-developable hub cities:** New York, Baltimore, Philadelphia, Boston, Chicago.
- **Special-connection cities:** Chicago, New York, Atlanta. Each unordered pair connected = +$10, once. Completing the third city (two pairs at once) = +$20 that step.
- Test file convention: co-located `*.test.ts` next to the module under test.
- Commit after every green test cycle.

---

## File Structure

```
package.json                     # ts + vitest, "test" script
tsconfig.json                    # strict
vitest.config.ts
src/engine/
  rng.ts                         # seeded RNG (mulberry32)
  types.ts                       # all engine types + constants (companies)
  board/
    boardTypes.ts                # Hex, Terrain, CityInfo, BoardDef
    testBoard.ts                 # small synthetic board for unit tests
    boardData.ts                 # REAL map (filled from render; starts partial)
    board.ts                     # neighbors(), terrainOf(), isCity(), connectivity
  clone.ts                       # structural clone / immutable update helpers
  setup.ts                       # createGame(names, seed) -> GameState
  auction.ts                     # auction state machine (prep round + Auction action)
  income.ts                      # city income deltas + special-connection bonuses
  expand.ts                      # placeCube(): adjacency, terrain, cost, income
  actions.ts                     # pass, develop, fund, takeTwo, chooseAction
  turnOrder.ts                   # action-track resolution + next-phase order
  dividends.ts                   # payDividends()
  endgame.ts                     # checkGameEnd()
  game.ts                        # applyMove(state, move) reducer + Move union
  index.ts                       # public exports
```

Each file has one responsibility. `game.ts` is the only public entry point the UI will use (plus `types.ts` and `setup.ts`).

---

### Task 1: Project scaffold + seeded RNG

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`
- Create: `src/engine/rng.ts`
- Test: `src/engine/rng.test.ts`

**Interfaces:**
- Produces: `makeRng(seed: number): () => number` — returns a function yielding deterministic floats in [0,1). `pick<T>(rng, arr: T[]): T` — deterministic pick.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "american-rails-engine",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run", "test:watch": "vitest" },
  "devDependencies": { "typescript": "^5.5.0", "vitest": "^2.0.0" }
}
```

- [ ] **Step 2: Write `tsconfig.json`** (strict) and `vitest.config.ts` (defaults; environment node).

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "strict": true, "noUncheckedIndexedAccess": true, "esModuleInterop": true,
    "skipLibCheck": true, "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Run `npm install`**, then write the failing test `src/engine/rng.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeRng, pick } from './rng';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42), b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('pick chooses deterministically from an array', () => {
    const rng = makeRng(1);
    expect(pick(rng, ['x', 'y', 'z'])).toBe(pick(makeRng(1), ['x', 'y', 'z']));
  });
});
```

- [ ] **Step 4: Run `npx vitest run src/engine/rng.test.ts`** — expect FAIL (module missing).

- [ ] **Step 5: Implement `src/engine/rng.ts`** (mulberry32):

```ts
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
```

- [ ] **Step 6: Run the test** — expect PASS.

- [ ] **Step 7: Commit** `git add -A && git commit -m "feat(engine): scaffold + seeded rng"`

---

### Task 2: Core types + company constants

**Files:**
- Create: `src/engine/types.ts`
- Test: `src/engine/types.test.ts`

**Interfaces:**
- Produces: `CompanyId` union; `COMPANIES: Record<CompanyId, {color; cubes; shares}>`; `GameState`, `Player`, `CompanyState`, `Phase`, `ActionType` types; `TOTAL_DEV_MARKERS = 12`.

- [ ] **Step 1: Write failing test** asserting the six companies exist with correct cube/share counts and total cubes = 144, total shares = 21:

```ts
import { describe, it, expect } from 'vitest';
import { COMPANIES, CompanyId } from './types';

it('has six companies with correct supplies', () => {
  const ids = Object.keys(COMPANIES) as CompanyId[];
  expect(ids).toHaveLength(6);
  const cubes = ids.reduce((s, id) => s + COMPANIES[id].cubes, 0);
  const shares = ids.reduce((s, id) => s + COMPANIES[id].shares, 0);
  expect(cubes).toBe(144);
  expect(shares).toBe(21);
  expect(COMPANIES.american.shares).toBe(5);
  expect(COMPANIES.liberty.cubes).toBe(19);
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement `types.ts`** with the `COMPANIES` constant (values from Global Constraints) and the state interfaces:

```ts
export type CompanyId = 'american'|'national'|'continental'|'majestic'|'liberty'|'republic';
export const COMPANIES: Record<CompanyId, { color: string; cubes: number; shares: number }> = {
  american:   { color: '#f4f4f4', cubes: 31, shares: 5 },
  national:   { color: '#4a4a4a', cubes: 29, shares: 4 },
  continental:{ color: '#2e8b57', cubes: 26, shares: 3 },
  majestic:   { color: '#e8c30b', cubes: 22, shares: 4 },
  liberty:    { color: '#c0392b', cubes: 19, shares: 2 },
  republic:   { color: '#2f6fb0', cubes: 17, shares: 3 },
};
export const TOTAL_DEV_MARKERS = 12;
export type Terrain = 'city'|'plains'|'forest'|'mountain'|'water';
export type Phase = 'setup'|'action'|'dividend'|'ended';
export type ActionType = 'pass'|'develop'|'fund5'|'take2'|'expand2'|'expand3'|'expand4'|'auction';
export interface Player { id: string; name: string; seat: number; money: number; shares: CompanyId[]; }
export interface CompanyState { treasury: number; income: number; sharesInSupply: number; sharesRemoved: number; cubesInSupply: number; onMap: boolean; bonuses: string[]; }
export interface HexState { cubes: CompanyId[]; developed: boolean; }
export interface AuctionState { companyId: CompanyId; sellerId: string; startingCity: boolean; currentBid: number; highBidderId: string | null; inOrder: string[]; passed: string[]; toAct: string; }
export interface GameState {
  seed: number;
  players: Player[];
  companies: Record<CompanyId, CompanyState>;
  hexes: Record<string, HexState>;
  developmentSupply: number;
  year: number;                 // 1851..1857
  turnOrder: string[];          // player ids, index 0 = seat #1
  actionTrack: (string | null)[][]; // [row][phaseCol] = playerId or null
  actionPhase: number;          // 0,1,2 within a round
  phase: Phase;
  activePlayerId: string | null;
  auction: AuctionState | null;
  pendingExpand: { action: ActionType; remaining: number } | null;
  log: string[];
  winnerIds: string[] | null;
}
export const ACTION_ROWS: ActionType[] = ['pass','develop','fund5','take2','expand3','auction','expand4'];
```

- [ ] **Step 4: Run — expect PASS. Step 5: Commit** `feat(engine): core types and company constants`.

> Note: `take2` row doubles as Expand-2 in 4–5p (handled in actions). `ACTION_ROWS` order is MEDIUM-confidence from research; confirm against the board render before Stage 2.

---

### Task 3: Board types, test board, and board helpers

**Files:**
- Create: `src/engine/board/boardTypes.ts`, `src/engine/board/testBoard.ts`, `src/engine/board/board.ts`
- Test: `src/engine/board/board.test.ts`

**Interfaces:**
- Consumes: `Terrain`, `CompanyId` from types.
- Produces: `BoardDef { hexes: Record<string, HexDef>; }`, `HexDef { terrain: Terrain; city?: CityInfo; adjacent: string[]; }`, `CityInfo { name: string; full: number; shared: number; developable: boolean; }`. Helpers: `neighbors(board, id): string[]`, `hexDef(board, id): HexDef`, `isCity(board, id): boolean`, `connectedCities(board, hexes, companyId): Set<string>` (BFS over a company's cubes returning the set of city names its network touches).

- [ ] **Step 1: Write `boardTypes.ts`** with the interfaces above.

- [ ] **Step 2: Write `testBoard.ts`** — a small deliberate board: two cities `NYC`(full 8/shared 5, non-dev) and `ATL`(5/3, dev), a `plains1`, a `forest1`, a `mtn1`, wired with a known adjacency so tests can reason about it. Example:

```ts
export const testBoard: BoardDef = { hexes: {
  NYC:    { terrain: 'city',  city: { name: 'New York', full: 8, shared: 5, developable: false }, adjacent: ['plains1'] },
  plains1:{ terrain: 'plains', adjacent: ['NYC','forest1','ATL'] },
  forest1:{ terrain: 'forest', adjacent: ['plains1','mtn1'] },
  mtn1:   { terrain: 'mountain', adjacent: ['forest1'] },
  ATL:    { terrain: 'city',  city: { name: 'Atlanta', full: 5, shared: 3, developable: true }, adjacent: ['plains1'] },
}};
```

- [ ] **Step 3: Write failing tests** for `neighbors`, `isCity`, and `connectedCities`:

```ts
it('neighbors are symmetric in the test board', () => {
  expect(neighbors(testBoard,'plains1')).toContain('NYC');
  expect(neighbors(testBoard,'NYC')).toContain('plains1');
});
it('connectedCities follows a company cube chain', () => {
  const hexes = { NYC:{cubes:['republic'],developed:false}, plains1:{cubes:['republic'],developed:false} };
  expect(connectedCities(testBoard, hexes as any, 'republic')).toEqual(new Set(['New York']));
});
```

- [ ] **Step 4: Run — FAIL. Step 5: Implement `board.ts`** (BFS over hexes where `cubes.includes(companyId)`, collecting `city.name`). **Step 6: Run — PASS. Step 7: Commit** `feat(engine): board types, test board, helpers`.

---

### Task 4: Immutable update helpers

**Files:**
- Create: `src/engine/clone.ts`
- Test: `src/engine/clone.test.ts`

**Interfaces:**
- Produces: `cloneState(s: GameState): GameState` (deep clone via `structuredClone`); `withCompany(s, id, patch): GameState`; `withPlayer(s, id, patch): GameState`. All return new objects, never mutate.

- [ ] **Step 1: Failing test** — mutating a clone doesn't touch the original; `withCompany` changes only the named company.

```ts
it('withCompany does not mutate original', () => {
  const s = cloneState(base);
  const s2 = withCompany(s, 'liberty', { treasury: 99 });
  expect(s.companies.liberty.treasury).not.toBe(99);
  expect(s2.companies.liberty.treasury).toBe(99);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement** using `structuredClone`. **Step 4: PASS → Step 5: Commit** `feat(engine): immutable helpers`.

---

### Task 5: Game setup (createGame)

**Files:**
- Create: `src/engine/setup.ts`
- Test: `src/engine/setup.test.ts`

**Interfaces:**
- Consumes: `makeRng`, `pick`, `COMPANIES`, types, a `BoardDef`.
- Produces: `createGame(opts: { names: string[]; seed: number; board: BoardDef }): GameState`.

- [ ] **Step 1: Failing tests:**

```ts
it('4-player game: all six companies, income 0, correct money', () => {
  const s = createGame({ names:['A','B','C','D'], seed:1, board:testBoard });
  expect(s.players).toHaveLength(4);
  expect(s.players.every(p => p.money === 50)).toBe(true);
  expect(Object.values(s.companies).every(c => c.income === 0)).toBe(true);
  expect(s.developmentSupply).toBe(12);
  expect(s.year).toBe(1851);
  expect(s.phase).toBe('setup');
});
it('3-player game removes exactly one company (deterministic by seed)', () => {
  const s = createGame({ names:['A','B','C'], seed:7, board:testBoard });
  const removed = Object.values(s.companies).filter(c => c.sharesRemoved > 0 && !c.onMap && c.cubesInSupply === 0);
  expect(removed).toHaveLength(1);
  expect(s.players.every(p => p.money === 50)).toBe(true);
});
it('5-player game gives $40 each', () => {
  const s = createGame({ names:['A','B','C','D','E'], seed:1, board:testBoard });
  expect(s.players.every(p => p.money === 40)).toBe(true);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement `createGame`:** build players with seat/money by count ($50/$50/$40 for 3/4/5), companies from `COMPANIES` (treasury 0, income 0, sharesInSupply=shares, cubesInSupply=cubes, onMap=false, bonuses=[]), empty hexes, dev supply 12, year 1851, phase 'setup'. For 3 players, `pick` one company via seeded rng and zero its cubes/shares (mark removed). **Step 4: PASS → Step 5: Commit** `feat(engine): game setup`.

---

### Task 6: Auction state machine

**Files:**
- Create: `src/engine/auction.ts`
- Test: `src/engine/auction.test.ts`

**Interfaces:**
- Consumes: types, clone helpers, board helpers.
- Produces: `openAuction(s, { companyId, sellerId, startingCity }): GameState` (sets `s.auction`, seller must first bid/pass), `placeBid(s, playerId, amount): GameState`, `passBid(s, playerId): GameState`, `isAuctionResolved(s): boolean`. On resolution: winner gains share, pays bid into company treasury; if no bidder, share removed. `startingCity`/company-not-on-map cube placement is triggered but the actual city choice is a separate move (`placeStartingCube`) recorded in `pendingExpand`-like state or a `pendingStartCube` field.

- [ ] **Step 1: Failing tests** covering: min bid $10 enforced; clockwise order; a passed player cannot bid again; last remaining bidder wins and pays into treasury; no-bid removes the share (`sharesInSupply--`, `sharesRemoved++`).

```ts
it('winner pays final bid into company treasury', () => {
  let s = openAuction(setupWith(['A','B','C']), { companyId:'liberty', sellerId:'A', startingCity:true });
  s = placeBid(s, 'A', 10); s = passBid(s, 'B'); s = passBid(s, 'C');
  expect(isAuctionResolved(s)).toBe(true);
  expect(playerById(s,'A').shares).toContain('liberty');
  expect(playerById(s,'A').money).toBe(40);           // 50 - 10
  expect(s.companies.liberty.treasury).toBe(10);
});
it('rejects a bid below the current bid + minimum', () => {
  let s = openAuction(...); s = placeBid(s,'A',10);
  expect(() => placeBid(s,'B',10)).toThrow();          // must exceed 10
});
it('no bids removes the share from the game', () => {
  let s = openAuction(...); s = passBid(s,'A'); s = passBid(s,'B'); s = passBid(s,'C');
  expect(s.companies.liberty.sharesInSupply).toBe(1);  // was 2
  expect(s.companies.liberty.sharesRemoved).toBe(1);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement** the machine (track `inOrder`, `passed`, `toAct`, `currentBid`, `highBidderId`; resolve when only one non-passed remains or all pass). Illegal bids `throw new Error(...)`. **Step 4: PASS → Step 5: Commit** `feat(engine): auction state machine`.

---

### Task 7: City income + special-connection bonuses

**Files:**
- Create: `src/engine/income.ts`
- Test: `src/engine/income.test.ts`

**Interfaces:**
- Consumes: board helpers, types, clone helpers.
- Produces: `applyCityEntry(s, board, hexId, companyId): GameState` — call AFTER a cube is added to a city hex; adjusts all affected companies' incomes per the full/shared rules and development marker. `applyDevelopment(s, board, hexId): GameState` — adds a dev marker's income. `applySpecialConnections(s, board, companyId): GameState` — grants +$10/+$20 bonuses not yet awarded.

- [ ] **Step 1: Failing tests** — the exact rulebook examples:

```ts
it('first company in a city gains full value', () => {
  // republic enters Atlanta (5/3), dev=false
  const s2 = applyCityEntry(afterCube(s,'ATL','republic'), testBoard,'ATL','republic');
  expect(s2.companies.republic.income).toBe(5);
});
it('second company: newcomer gets shared, incumbent drops to shared', () => {
  // republic already in Atlanta at full 5; majestic enters -> both at shared 3
  let s2 = /* republic at full 5 */;
  s2 = applyCityEntry(afterCube(s2,'ATL','majestic'), testBoard,'ATL','majestic');
  expect(s2.companies.republic.income).toBe(3);  // 5 -> 3 (minus full-shared)
  expect(s2.companies.majestic.income).toBe(3);
});
it('developed city: solo company gains full + $2; a second company reduces dev bonus to $1', () => {
  // Buffalo 4/3 developed, National solo: +4 +2 = 6; Liberty enters: liberty +3 +1=4, national -1(4-3) -1(dev 2->1) = 6-2=4
  ...
});
it('special connection: connecting NYC and Chicago grants +$10 once', () => {
  const s2 = applySpecialConnections(networkConnecting('New York','Chicago','continental'), board,'continental');
  expect(s2.companies.continental.income).toBeGreaterThanOrEqual(prev + 10);
  const s3 = applySpecialConnections(s2, board, 'continental'); // idempotent
  expect(s3.companies.continental.income).toBe(s2.companies.continental.income);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement.** `applyCityEntry`: count companies now in the city; if this is the 2nd company, reduce each prior company by (full−shared) and (if developed) reduce the dev bonus contribution from $2 to $1 for priors; newcomer gains shared (+$1 if developed) when 2+, else full (+$2 if developed). Track per-company bonuses in `company.bonuses` (e.g. `'CHI-NY'`) to keep special connections idempotent; award +$10 per newly-completed unordered pair among {Chicago,New York,Atlanta} that the company's `connectedCities` now includes. **Step 4: PASS → Step 5: Commit** `feat(engine): city income and special connections`.

> These are the highest-bug-risk rules — add a test per rulebook example (Buffalo/National/Liberty; the third-city +$20 case).

---

### Task 8: Expansion (placeCube)

**Files:**
- Create: `src/engine/expand.ts`
- Test: `src/engine/expand.test.ts`

**Interfaces:**
- Consumes: board helpers, income (`applyCityEntry`, `applySpecialConnections`), types, clone.
- Produces: `expandCost(board, hexes, hexId): number`; `canPlaceCube(s, board, playerId, companyId, hexId): { ok: boolean; reason?: string }`; `placeCube(s, board, playerId, companyId, hexId): GameState`.

- [ ] **Step 1: Failing tests** for cost and legality:

```ts
it('plains cost is $2 + $2 per existing cube', () => {
  expect(expandCost(testBoard, { plains1:{cubes:[],developed:false} }, 'plains1')).toBe(2);
  expect(expandCost(testBoard, { plains1:{cubes:['liberty'],developed:false} }, 'plains1')).toBe(4);
});
it('city cost adds $2 per cube AND per development marker', () => {
  // ATL with one cube + developed -> 2 + 2(cube) + 2(dev) = 6
  expect(expandCost(testBoard, { ATL:{cubes:['republic'],developed:true} }, 'ATL')).toBe(6);
});
it('forest is $3 and holds only one cube', () => {
  expect(expandCost(testBoard, { forest1:{cubes:[],developed:false} }, 'forest1')).toBe(3);
  const bad = canPlaceCube(stateWith('forest1',['liberty']), testBoard,'A','republic','forest1');
  expect(bad.ok).toBe(false);                       // forest full
});
it('rejects a second same-color cube in a hex', () => {
  expect(canPlaceCube(stateWith('plains1',['liberty']),testBoard,'A','liberty','plains1').ok).toBe(false);
});
it('rejects placement not adjacent to a same-color cube (except first/starting)', () => {
  expect(canPlaceCube(freshState,testBoard,'A','liberty','mtn1').ok).toBe(false);
});
it('rejects when the company cannot afford the cost', () => {
  const s = companyTreasury('liberty', 1);           // needs $2
  expect(canPlaceCube(s,testBoard,'A','liberty','plains1').ok).toBe(false);
});
it('player must own a share in the company to expand it', () => {
  expect(canPlaceCube(playerHasNoShares,testBoard,'A','liberty','plains1').ok).toBe(false);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement.** `expandCost`: city/plains `2 + 2*existingCubes (+2*devMarker for city)`, forest 3, mountain 5. `canPlaceCube` checks: player owns ≥1 share of company; hex has no same-color cube; forest/mountain not already occupied; adjacency to a same-color cube (unless this is the company's very first cube / starting placement); treasury ≥ cost. `placeCube`: pay cost from treasury to (implicit) bank, push cube, then `applyCityEntry` if city, then `applySpecialConnections`. **Step 4: PASS → Step 5: Commit** `feat(engine): expansion and cost`.

---

### Task 9: Simple actions (pass, develop, fund5, take2)

**Files:**
- Create: `src/engine/actions.ts`
- Test: `src/engine/actions.test.ts`

**Interfaces:**
- Consumes: income (`applyDevelopment`), clone, types.
- Produces: `doPass(s)`, `doFund5(s, companyId)`, `doTake2(s, playerId, mode: 'take'|'fromEach')`, `doDevelop(s, board, playerId, hexId)`, `canDevelop(s, board, hexId)`.

- [ ] **Step 1: Failing tests:**

```ts
it('fund5 adds $5 from bank to a company treasury', () => {
  expect(doFund5(s,'liberty').companies.liberty.treasury).toBe(s.companies.liberty.treasury + 5);
});
it('take2 (take) gives the player $2', () => {
  expect(doTake2(s,'A','take').players[0].money).toBe(s.players[0].money + 2);
});
it('take2 (fromEach) collects $2 from every other player', () => {
  const s2 = doTake2(s,'A','fromEach');
  expect(s2.players.find(p=>p.id==='A')!.money).toBe(50 + 2*(s.players.length-1));
  expect(s2.players.filter(p=>p.id!=='A').every(p=>p.money===48)).toBe(true);
});
it('develop requires a city with a cube and not a hub; adds income', () => {
  expect(canDevelop(cityNoCube,board,'ATL').ok).toBe(false);
  expect(canDevelop(hubCity,board,'NYC').ok).toBe(false);
  const s2 = doDevelop(cityWithCube,board,'A','ATL');
  expect(s2.developmentSupply).toBe(11);
  expect(s2.hexes.ATL.developed).toBe(true);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement** each. `doDevelop` validates developable+has cube+supply>0, sets developed, decrements supply, calls `applyDevelopment`. **Step 4: PASS → Step 5: Commit** `feat(engine): simple actions`.

---

### Task 10: Action track + turn order resolution

**Files:**
- Create: `src/engine/turnOrder.ts`
- Test: `src/engine/turnOrder.test.ts`

**Interfaces:**
- Consumes: types, clone.
- Produces: `placeActionMarker(s, playerId, actionRow): GameState` (occupies the current phase column at that row; refuses an occupied slot), `nextToAct(s): string | null` (by turn order within a phase), `resolvePhase(s): GameState` (advance to next phase; order for phases 2–3 = top-to-bottom on the action track), `endRound(s): GameState` (return markers from the last column to the turn-order track preserving relative order; advance year).

- [ ] **Step 1: Failing tests:**

```ts
it('rejects choosing an action slot already taken this phase', () => {
  let s = placeActionMarker(fresh,'A','develop');
  expect(() => placeActionMarker(s,'B','develop')).toThrow();
});
it('phase 2 order follows top-to-bottom action-track position from phase 1', () => {
  // A took 'expand4'(bottom), B took 'pass'(top) in phase 1 -> phase 2 first actor = B
  let s = /* after phase 1 */;
  s = resolvePhase(s);
  expect(nextToAct(s)).toBe('B');
});
it('endRound returns markers to turn order preserving relative track order and advances the year', () => {
  const s = endRound(afterThreePhases);
  expect(s.year).toBe(1852);
  expect(s.turnOrder[0]).toBe(/* whoever was highest on the last column */);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement** using `ACTION_ROWS` index as vertical priority. **Step 4: PASS → Step 5: Commit** `feat(engine): action track and turn order`.

---

### Task 11: Dividends + end-game

**Files:**
- Create: `src/engine/dividends.ts`, `src/engine/endgame.ts`
- Test: `src/engine/dividends.test.ts`, `src/engine/endgame.test.ts`

**Interfaces:**
- Produces: `payDividends(s): GameState` (per share held by players: `ceil(income / sharesHeldByPlayers)`; unsold/removed excluded; skip companies with 0 player-held shares). `checkGameEnd(s): GameState` (sets phase 'ended' + `winnerIds` when a condition is met, else unchanged). `suppliesLow(s): number`.

- [ ] **Step 1: Failing tests** — the rulebook dividend example (Majestic income 19, Rick 2 shares, Mary 1 share → $7/share, Rick $14, Mary $7) and each end condition:

```ts
it('dividend is income / player-held shares, rounded up', () => {
  // majestic income 19, 3 shares held by players
  const s2 = payDividends(majestic19);
  expect(playerShareIncome(s2)).toBe(7);           // ceil(19/3)
});
it('game ends when the year passes 1857', () => {
  expect(checkGameEnd(yearIs1857AfterDividend).phase).toBe('ended');
});
it('game ends when all shares are sold or removed', () => {
  expect(checkGameEnd(noSharesLeft).phase).toBe('ended');
});
it('game ends when enough supplies are at <=2 (4p -> 4 supplies)', () => {
  expect(checkGameEnd(fourSuppliesLow4p).phase).toBe('ended');
});
it('winner is the player with the most money; ties share', () => {
  expect(checkGameEnd(tied).winnerIds!.length).toBe(2);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement.** `suppliesLow` counts supplies (each company's cube supply + the dev-marker supply) with ≤2 remaining; threshold 3/4/5 by player count. **Step 4: PASS → Step 5: Commit** `feat(engine): dividends and endgame`.

---

### Task 12: Top-level reducer (applyMove) + Move union

**Files:**
- Create: `src/engine/game.ts`, `src/engine/index.ts`
- Test: `src/engine/game.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `Move` discriminated union (`{type:'chooseAction', playerId, action}`, `{type:'placeCube', playerId, companyId, hexId}`, `{type:'placeDevelopment', playerId, hexId}`, `{type:'fund5', playerId, companyId}`, `{type:'take2', playerId, mode}`, `{type:'bid', playerId, amount}`, `{type:'passBid', playerId}`, `{type:'placeStartingCube', playerId, hexId}`, `{type:'endExpand', playerId}`). `applyMove(s, board, move): GameState` — validates the mover is allowed to act now and dispatches; illegal moves throw. `legalMoves(s, board, playerId): Move[]` — used by the UI to highlight options.

- [ ] **Step 1: Failing tests** — reducer wiring and guards:

```ts
it('rejects a move from a player who is not active', () => {
  expect(() => applyMove(sActiveA, board, { type:'fund5', playerId:'B', companyId:'liberty' })).toThrow();
});
it('chooseAction(expand3) sets pendingExpand with 3 cubes', () => {
  const s2 = applyMove(sActiveA, board, { type:'chooseAction', playerId:'A', action:'expand3' });
  expect(s2.pendingExpand).toEqual({ action:'expand3', remaining:3 });
});
it('placeCube during an expand decrements remaining; endExpand ends the action early', () => {
  let s2 = applyMove(expandingState, board, { type:'placeCube', playerId:'A', companyId:'liberty', hexId:'plains1' });
  expect(s2.pendingExpand!.remaining).toBe(2);
  s2 = applyMove(s2, board, { type:'endExpand', playerId:'A' });
  expect(s2.pendingExpand).toBeNull();
});
it('legalMoves for an active player about to choose includes only free action rows', () => {
  const moves = legalMoves(sActionPhase, board, 'A');
  expect(moves.some(m => m.type==='chooseAction' && m.action==='pass')).toBe(true);
});
```

- [ ] **Step 2: FAIL → Step 3: Implement** `applyMove` as a switch dispatching to the module functions, plus `legalMoves`. Export the public API from `index.ts`. **Step 4: PASS → Step 5: Commit** `feat(engine): applyMove reducer and legalMoves`.

---

### Task 13: Full-game integration test (a whole game on paper)

**Files:**
- Test: `src/engine/fullGame.test.ts`

**Interfaces:** Consumes the public API only (`createGame`, `applyMove`, `legalMoves`).

- [ ] **Step 1: Write an integration test** that drives a scripted 3-player game from setup through the preparation auction, three action phases across at least two rounds, a dividend, and an end-game trigger — asserting money conservation (total money in the system changes only via bank interactions as expected) and that the game reaches `phase:'ended'` with a winner.

```ts
it('plays a scripted 3-player game to completion', () => {
  let s = createGame({ names:['A','B','C'], seed:3, board:realOrTestBoard });
  // ...drive setup auctions, actions, dividends via applyMove using legalMoves...
  expect(s.phase).toBe('ended');
  expect(s.winnerIds!.length).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 2: Run — iterate** until the scripted game completes. This test is the acceptance gate for Stage 1. **Step 3: Commit** `test(engine): full-game integration`.

---

## Self-Review (completed)

- **Spec coverage:** setup/removal (T5), prep auction (T6), action track + turn order (T10), all six actions (T8/T9), expansion cost + terrain limits (T8), city income full/shared + dev markers (T7), special connections (T7), dividends (T11), all three end conditions + tie (T11), reducer + legal-move surface for the UI (T12), whole-game acceptance (T13). Board data is data-only (T3) and filled from the render before Stage 2.
- **Placeholders:** none; each task carries concrete test code and implementation direction.
- **Type consistency:** `GameState`, `CompanyId`, `Move`, `BoardDef`, `applyMove`, `legalMoves`, `applyCityEntry`, `placeCube` names are used consistently across tasks.
- **Known MEDIUM-confidence items to confirm against the render before Stage 2:** the exact `ACTION_ROWS` ordering and the real city income values (engine logic is independent of both).

## Out of scope for this plan (later stages/plans)
- Real board `boardData.ts` transcription from the render (small data task, done before Stage 2).
- Stage 2 (hotseat React UI), Stage 3 (Firebase multiplayer + lobby), Stage 4 (log, chat, BGA polish).
