import { describe, it, expect } from 'vitest';
import { cloneState, withCompany, withPlayer, playerById, log } from './clone';
import { GameState, COMPANY_IDS, CompanyState } from './types';

function baseState(): GameState {
  const companies = {} as Record<string, CompanyState>;
  for (const id of COMPANY_IDS) {
    companies[id] = { treasury: 0, income: 0, sharesInSupply: 1, sharesRemoved: 0, cubesInSupply: 5, onMap: false, bonuses: [] };
  }
  return {
    seed: 1,
    players: [
      { id: 'A', name: 'A', seat: 0, money: 50, shares: [] },
      { id: 'B', name: 'B', seat: 1, money: 50, shares: [] },
    ],
    companies: companies as GameState['companies'],
    hexes: {},
    developmentSupply: 12,
    year: 1851,
    turnOrder: ['A', 'B'],
    actionTrack: [],
    actionPhase: 0,
    phase: 'action',
    activePlayerId: 'A',
    auction: null,
    pendingStartCube: null,
    pendingExpand: null,
    log: [],
    winnerIds: null,
  };
}

describe('immutable helpers', () => {
  it('cloneState makes an independent copy', () => {
    const s = baseState();
    const c = cloneState(s);
    c.players[0]!.money = 999;
    expect(s.players[0]!.money).toBe(50);
  });

  it('withCompany does not mutate the original', () => {
    const s = baseState();
    const s2 = withCompany(s, 'liberty', { treasury: 99 });
    expect(s.companies.liberty.treasury).toBe(0);
    expect(s2.companies.liberty.treasury).toBe(99);
  });

  it('withPlayer patches only the named player', () => {
    const s = baseState();
    const s2 = withPlayer(s, 'B', { money: 12 });
    expect(playerById(s2, 'B').money).toBe(12);
    expect(playerById(s2, 'A').money).toBe(50);
    expect(playerById(s, 'B').money).toBe(50);
  });

  it('log appends without mutating', () => {
    const s = baseState();
    const s2 = log(s, 'hello');
    expect(s2.log).toEqual(['hello']);
    expect(s.log).toEqual([]);
  });
});
