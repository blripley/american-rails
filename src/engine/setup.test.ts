import { describe, it, expect } from 'vitest';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { COMPANY_IDS } from './types';

describe('createGame', () => {
  it('4-player game: six companies, income 0, $50 each, 12 dev markers, year 1851', () => {
    const s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
    expect(s.players).toHaveLength(4);
    expect(s.players.every((p) => p.money === 50)).toBe(true);
    expect(COMPANY_IDS.every((id) => s.companies[id].income === 0)).toBe(true);
    expect(COMPANY_IDS.every((id) => s.companies[id].sharesInSupply > 0)).toBe(true);
    expect(s.developmentSupply).toBe(12);
    expect(s.year).toBe(1851);
    expect(s.phase).toBe('setup');
    expect(Object.keys(s.hexes)).toContain('NYC');
    expect(s.hexes.NYC!.cubes).toEqual([]);
  });

  it('3-player game removes exactly one company (deterministic by seed)', () => {
    const s = createGame({ names: ['A', 'B', 'C'], seed: 7, board: testBoard });
    const removed = COMPANY_IDS.filter(
      (id) => s.companies[id].sharesInSupply === 0 && s.companies[id].cubesInSupply === 0,
    );
    expect(removed).toHaveLength(1);
    expect(s.companies[removed[0]!].sharesRemoved).toBeGreaterThan(0);
    expect(s.players.every((p) => p.money === 50)).toBe(true);
  });

  it('3-player removal is reproducible for the same seed', () => {
    const a = createGame({ names: ['A', 'B', 'C'], seed: 7, board: testBoard });
    const b = createGame({ names: ['A', 'B', 'C'], seed: 7, board: testBoard });
    const removedOf = (s: typeof a) => COMPANY_IDS.find((id) => s.companies[id].cubesInSupply === 0);
    expect(removedOf(a)).toBe(removedOf(b));
  });

  it('5-player game gives $40 each', () => {
    const s = createGame({ names: ['A', 'B', 'C', 'D', 'E'], seed: 1, board: testBoard });
    expect(s.players.every((p) => p.money === 40)).toBe(true);
  });

  it('rejects out-of-range player counts', () => {
    expect(() => createGame({ names: ['A', 'B'], seed: 1, board: testBoard })).toThrow();
    expect(() => createGame({ names: ['A', 'B', 'C', 'D', 'E', 'F'], seed: 1, board: testBoard })).toThrow();
  });
});
