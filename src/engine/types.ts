// Core engine types and constant game data.

export type CompanyId =
  | 'american'
  | 'national'
  | 'continental'
  | 'majestic'
  | 'liberty'
  | 'republic';

export const COMPANIES: Record<CompanyId, { name: string; color: string; cubes: number; shares: number }> = {
  american: { name: 'American', color: '#f4f4f4', cubes: 31, shares: 5 },
  national: { name: 'National', color: '#4a4a4a', cubes: 29, shares: 4 },
  continental: { name: 'Continental', color: '#2e8b57', cubes: 26, shares: 3 },
  majestic: { name: 'Majestic', color: '#e8c30b', cubes: 22, shares: 4 },
  liberty: { name: 'Liberty', color: '#c0392b', cubes: 19, shares: 2 },
  republic: { name: 'Republic', color: '#2f6fb0', cubes: 17, shares: 3 },
};

export const COMPANY_IDS = Object.keys(COMPANIES) as CompanyId[];

export const TOTAL_DEV_MARKERS = 12;

// The three cities that grant special-connection bonuses.
export const SPECIAL_CITIES = ['Chicago', 'New York', 'Atlanta'] as const;

export type Terrain = 'city' | 'plains' | 'forest' | 'mountain' | 'water';

export type Phase = 'setup' | 'action' | 'dividend' | 'ended';

export type ActionType =
  | 'pass'
  | 'develop'
  | 'fund5'
  | 'take2'
  | 'expand2'
  | 'expand3'
  | 'expand4'
  | 'auction';

// Rows of the action track, top-to-bottom. Vertical position sets turn-order
// priority for the following phase. (Order is MEDIUM confidence from research;
// confirm against the board render before Stage 2.)
export const ACTION_ROWS: ActionType[] = [
  'pass',
  'develop',
  'fund5',
  'take2',
  'expand3',
  'auction',
  'expand4',
];

export interface Player {
  id: string;
  name: string;
  seat: number; // 0-based seating order (clockwise)
  money: number;
  shares: CompanyId[];
}

export interface CompanyState {
  treasury: number;
  income: number;
  sharesInSupply: number;
  sharesRemoved: number;
  cubesInSupply: number;
  onMap: boolean;
  removed: boolean; // true only for the company removed during 3-player setup
  bonuses: string[]; // e.g. 'Chicago|New York' special-connection keys already awarded
}

export interface HexState {
  cubes: CompanyId[];
  developed: boolean;
}

export interface AuctionState {
  companyId: CompanyId;
  sellerId: string;
  // true when winning triggers a starting-cube placement (prep round, or a
  // share bought for a company not yet on the map).
  startingCity: boolean;
  currentBid: number;
  highBidderId: string | null;
  order: string[]; // clockwise bidding order, seller first
  passed: string[];
  toAct: string | null; // whose turn to bid/pass; null once resolved
  resolved: boolean;
}

export interface PendingExpand {
  action: ActionType; // expand2 | expand3 | expand4
  remaining: number;
}

export interface GameState {
  seed: number;
  players: Player[];
  companies: Record<CompanyId, CompanyState>;
  hexes: Record<string, HexState>;
  developmentSupply: number;
  year: number; // 1851..1857
  turnOrder: string[]; // player ids; index 0 == seat #1 on the turn-order track
  actionTrack: (string | null)[][]; // [row][phaseColumn] = playerId | null
  actionPhase: number; // 0..2 within the current round
  phase: Phase;
  activePlayerId: string | null;
  auction: AuctionState | null;
  // set when a player must place a starting cube after winning a company's
  // first share (prep round or new-company purchase).
  pendingStartCube: { playerId: string; companyId: CompanyId } | null;
  pendingExpand: PendingExpand | null;
  log: string[];
  winnerIds: string[] | null;
}

export const STARTING_MONEY: Record<number, number> = { 3: 50, 4: 50, 5: 40 };

// Number of low supplies (<=2 remaining) that ends the game, by player count.
export const END_LOW_SUPPLIES: Record<number, number> = { 3: 3, 4: 4, 5: 5 };
