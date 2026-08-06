import { describe, it, expect } from 'vitest';
import { payDividends, sharesHeldByPlayers } from './dividends';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { GameState } from './types';

function game(): GameState {
  return createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
}

describe('dividends', () => {
  it('rulebook example: Majestic income 19, Rick 2 shares, Mary 1 share -> $7/share', () => {
    const s = game();
    // Rick = player A (2 majestic), Mary = player B (1 majestic)
    s.players[0]!.shares.push('majestic', 'majestic');
    s.players[1]!.shares.push('majestic');
    s.companies.majestic.income = 19;
    expect(sharesHeldByPlayers(s, 'majestic')).toBe(3);
    const s2 = payDividends(s);
    expect(s2.players[0]!.money).toBe(50 + 14); // 2 shares * $7
    expect(s2.players[1]!.money).toBe(50 + 7); // 1 share * $7
  });

  it('a company with no player-held shares pays nothing', () => {
    const s = game();
    s.companies.liberty.income = 20; // all shares still in supply
    const s2 = payDividends(s);
    expect(s2.players.every((p) => p.money === 50)).toBe(true);
  });

  it('dividends round up', () => {
    const s = game();
    s.players[0]!.shares.push('republic');
    s.players[1]!.shares.push('republic');
    s.companies.republic.income = 7; // ceil(7/2) = 4
    const s2 = payDividends(s);
    expect(s2.players[0]!.money).toBe(54);
    expect(s2.players[1]!.money).toBe(54);
  });
});
