import { describe, it, expect } from 'vitest';
import { applyCityEntry, applyDevelopment, applySpecialConnections } from './income';
import { createGame } from './setup';
import { testBoard, specialBoard } from './board/testBoard';
import { CompanyId, GameState } from './types';

function game(board = testBoard): GameState {
  return createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board });
}

// Push a cube onto a hex (mutating a fresh clone) and return the new state.
function addCube(s: GameState, hexId: string, company: CompanyId): GameState {
  const next = structuredClone(s);
  next.hexes[hexId]!.cubes.push(company);
  return next;
}

describe('city income', () => {
  it('first company in a city gains the full value', () => {
    let s = game();
    s = addCube(s, 'ATL', 'republic');
    s = applyCityEntry(s, testBoard, 'ATL', 'republic');
    expect(s.companies.republic.income).toBe(5);
  });

  it('second company: newcomer gets shared, incumbent drops to shared', () => {
    let s = game();
    s = addCube(s, 'ATL', 'republic');
    s = applyCityEntry(s, testBoard, 'ATL', 'republic'); // republic at full 5
    s = addCube(s, 'ATL', 'majestic');
    s = applyCityEntry(s, testBoard, 'ATL', 'majestic');
    expect(s.companies.republic.income).toBe(3); // 5 -> 3
    expect(s.companies.majestic.income).toBe(3);
  });

  it('developed city: solo company +full+2; a second company reduces the dev bonus (Buffalo-style)', () => {
    let s = game();
    // Atlanta 5/3, developed
    s.hexes.ATL!.developed = true;
    s = addCube(s, 'ATL', 'national');
    s = applyCityEntry(s, testBoard, 'ATL', 'national');
    expect(s.companies.national.income).toBe(7); // 5 + 2

    s = addCube(s, 'ATL', 'liberty');
    s = applyCityEntry(s, testBoard, 'ATL', 'liberty');
    expect(s.companies.national.income).toBe(4); // 7 - (5-3) - 1 = 4
    expect(s.companies.liberty.income).toBe(4); // 3 + 1
  });

  it('placing a development marker adds income to companies already present', () => {
    let s = game();
    s = addCube(s, 'ATL', 'republic');
    s = applyCityEntry(s, testBoard, 'ATL', 'republic'); // income 5
    s.hexes.ATL!.developed = true;
    s = applyDevelopment(s, testBoard, 'ATL');
    expect(s.companies.republic.income).toBe(7); // 5 + 2 (solo)
  });
});

describe('special connections', () => {
  it('connecting two special cities grants +$10 once (idempotent)', () => {
    let s = game(specialBoard);
    // continental chain: CHI - p1 - NYC2
    for (const h of ['CHI', 'p1', 'NYC2']) s = addCube(s, h, 'continental');
    // base city income doesn't matter here; test only the bonus delta
    const before = s.companies.continental.income;
    s = applySpecialConnections(s, specialBoard, 'continental');
    expect(s.companies.continental.income).toBe(before + 10);
    const after = s.companies.continental.income;
    s = applySpecialConnections(s, specialBoard, 'continental'); // no double-award
    expect(s.companies.continental.income).toBe(after);
    expect(s.companies.continental.bonuses).toContain('Chicago|New York');
  });

  it('completing the third city awards two pairs at once (+$20)', () => {
    let s = game(specialBoard);
    for (const h of ['CHI', 'p1', 'NYC2', 'p2', 'ATL2']) s = addCube(s, h, 'continental');
    const before = s.companies.continental.income;
    s = applySpecialConnections(s, specialBoard, 'continental');
    expect(s.companies.continental.income).toBe(before + 30); // all three pairs at once
    expect(s.companies.continental.bonuses).toHaveLength(3);
  });
});
