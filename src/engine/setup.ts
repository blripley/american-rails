import {
  GameState,
  CompanyState,
  Player,
  CompanyId,
  COMPANIES,
  COMPANY_IDS,
  STARTING_MONEY,
  TOTAL_DEV_MARKERS,
} from './types';
import { BoardDef } from './board/boardTypes';
import { makeRng, pick } from './rng';

export interface CreateGameOptions {
  names: string[];
  seed: number;
  board: BoardDef;
}

// Build the initial game state: players seated in order, each company's supply
// and treasury, income markers at 0, dev supply at 12, year 1851. In a
// 3-player game one company (chosen by the seeded rng) is removed from play.
export function createGame(opts: CreateGameOptions): GameState {
  const { names, seed, board } = opts;
  const count = names.length;
  if (count < 3 || count > 5) throw new Error('American Rails supports 3-5 players');

  const players: Player[] = names.map((name, i) => ({
    id: seatId(i),
    name,
    seat: i,
    money: STARTING_MONEY[count]!,
    shares: [],
  }));

  const companies = {} as Record<CompanyId, CompanyState>;
  for (const id of COMPANY_IDS) {
    companies[id] = {
      treasury: 0,
      income: 0,
      sharesInSupply: COMPANIES[id].shares,
      sharesRemoved: 0,
      cubesInSupply: COMPANIES[id].cubes,
      onMap: false,
      removed: false,
      bonuses: [],
    };
  }

  // 3-player: remove one random company entirely (shares + cubes to the box).
  if (count === 3) {
    const rng = makeRng(seed);
    const removed = pick(rng, COMPANY_IDS);
    const c = companies[removed];
    c.sharesRemoved = COMPANIES[removed].shares;
    c.sharesInSupply = 0;
    c.cubesInSupply = 0;
    c.removed = true;
  }

  const empties = Object.fromEntries(
    Object.keys(board.hexes).map((id) => [id, { cubes: [], developed: false }]),
  );

  return {
    seed,
    players,
    companies,
    hexes: empties,
    developmentSupply: TOTAL_DEV_MARKERS,
    year: 1851,
    turnOrder: players.map((p) => p.id),
    actionTrack: [],
    actionPhase: 0,
    phase: 'setup',
    activePlayerId: players[0]!.id,
    auction: null,
    pendingStartCube: null,
    pendingExpand: null,
    pendingAction: null,
    setup: { selectorId: players[0]!.id, auctioned: [], claimedOrder: [] },
    log: [`Game created for ${count} players.`],
    winnerIds: null,
  };
}

export function seatId(i: number): string {
  return `p${i + 1}`;
}
