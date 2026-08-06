import { describe, it, expect } from 'vitest';
import { doPass, doFund5, doTake2, canDevelop, doDevelop } from './actions';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { GameState } from './types';

function game(): GameState {
  return createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
}

describe('simple actions', () => {
  it('pass leaves money and companies unchanged', () => {
    const s = game();
    const s2 = doPass(s);
    expect(s2.players.map((p) => p.money)).toEqual(s.players.map((p) => p.money));
  });

  it('fund5 adds $5 from the bank to a company treasury', () => {
    const s = game();
    expect(doFund5(s, 'liberty').companies.liberty.treasury).toBe(s.companies.liberty.treasury + 5);
  });

  it('take2 (take) gives the active player $2', () => {
    const s = game();
    const s2 = doTake2(s, s.players[0]!.id, 'take');
    expect(s2.players[0]!.money).toBe(52);
  });

  it('take2 (fromEach) drains $2 from every other player to the bank; active unchanged', () => {
    const s = game();
    const a = s.players[0]!.id;
    const s2 = doTake2(s, a, 'fromEach');
    expect(s2.players.find((p) => p.id === a)!.money).toBe(50); // gains nothing
    expect(s2.players.filter((p) => p.id !== a).every((p) => p.money === 48)).toBe(true);
  });

  it('develop requires a developable city with a cube; hubs and empty cities are refused', () => {
    const s = game();
    expect(canDevelop(s, testBoard, 'ATL').ok).toBe(false); // no cube yet
    s.hexes.ATL!.cubes.push('republic');
    expect(canDevelop(s, testBoard, 'ATL').ok).toBe(true);
    s.hexes.NYC!.cubes.push('republic');
    expect(canDevelop(s, testBoard, 'NYC').ok).toBe(false); // hub, non-developable
  });

  it('develop places a marker, decrements supply, and marks the city developed', () => {
    const s = game();
    s.hexes.ATL!.cubes.push('republic');
    const s2 = doDevelop(s, testBoard, s.players[0]!.id, 'ATL');
    expect(s2.developmentSupply).toBe(11);
    expect(s2.hexes.ATL!.developed).toBe(true);
    expect(s2.companies.republic.income).toBe(2); // solo dev bonus +2
  });
});
