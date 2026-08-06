import { describe, it, expect } from 'vitest';
import { checkGameEnd, suppliesLow, allSharesGone } from './endgame';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { COMPANY_IDS, GameState } from './types';

function game(names = ['A', 'B', 'C', 'D']): GameState {
  return createGame({ names, seed: 1, board: testBoard });
}

describe('end game', () => {
  it('does not end mid-game', () => {
    const s = game();
    s.year = 1853;
    expect(checkGameEnd(s).phase).not.toBe('ended');
  });

  it('ends when the year reaches 1857', () => {
    const s = game();
    s.year = 1857;
    expect(checkGameEnd(s).phase).toBe('ended');
  });

  it('ends when all shares are sold or removed', () => {
    const s = game();
    for (const id of COMPANY_IDS) s.companies[id].sharesInSupply = 0;
    expect(allSharesGone(s)).toBe(true);
    expect(checkGameEnd(s).phase).toBe('ended');
  });

  it('ends when enough supplies are low (4p -> 4 supplies of <=2)', () => {
    const s = game();
    s.companies.american.cubesInSupply = 2;
    s.companies.national.cubesInSupply = 1;
    s.companies.continental.cubesInSupply = 0;
    s.developmentSupply = 2;
    expect(suppliesLow(s)).toBe(4);
    expect(checkGameEnd(s).phase).toBe('ended');
  });

  it('the 3-player removed company is not counted as a low supply', () => {
    const s = game(['A', 'B', 'C']); // one company removed at setup (cubes 0)
    s.year = 1853;
    // only the removed company is at 0; that must not, by itself, end the game
    expect(checkGameEnd(s).phase).not.toBe('ended');
  });

  it('winner is the richest player; ties share the win', () => {
    const s = game();
    s.year = 1857;
    s.players[0]!.money = 80;
    s.players[1]!.money = 80;
    s.players[2]!.money = 30;
    s.players[3]!.money = 10;
    const s2 = checkGameEnd(s);
    expect(s2.winnerIds).toHaveLength(2);
    expect(s2.winnerIds).toContain(s.players[0]!.id);
    expect(s2.winnerIds).toContain(s.players[1]!.id);
  });
});
