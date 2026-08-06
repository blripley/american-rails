import { describe, it, expect } from 'vitest';
import { expandCost, canExpandCube, placeCube, placeStartingCube } from './expand';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { CompanyId, GameState, HexState } from './types';

function game(): GameState {
  return createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
}
function hexes(spec: Record<string, string[]>): Record<string, HexState> {
  const out: Record<string, HexState> = {};
  for (const [id, cubes] of Object.entries(spec)) out[id] = { cubes: cubes as CompanyId[], developed: false };
  return out;
}
// Give player A a share of liberty and fund liberty's treasury.
function withLiberty(treasury = 100): GameState {
  const s = game();
  s.players[0]!.shares.push('liberty');
  s.companies.liberty.treasury = treasury;
  return s;
}

describe('expandCost', () => {
  it('plains: $2 plus $2 per existing cube', () => {
    expect(expandCost(testBoard, hexes({ plains1: [] }), 'plains1')).toBe(2);
    expect(expandCost(testBoard, hexes({ plains1: ['liberty'] }), 'plains1')).toBe(4);
  });
  it('city: adds $2 per cube and $2 per development marker', () => {
    const h = hexes({ ATL: ['republic'] });
    h.ATL!.developed = true;
    expect(expandCost(testBoard, h, 'ATL')).toBe(6); // 2 + 2(cube) + 2(dev)
  });
  it('forest is $3, mountain is $5', () => {
    expect(expandCost(testBoard, hexes({ forest1: [] }), 'forest1')).toBe(3);
    expect(expandCost(testBoard, hexes({ mtn1: [] }), 'mtn1')).toBe(5);
  });
});

describe('canExpandCube', () => {
  it('allows an adjacent, affordable placement', () => {
    const s = withLiberty();
    s.hexes.NYC!.cubes.push('liberty'); // seed a liberty cube; plains1 is adjacent
    expect(canExpandCube(s, testBoard, s.players[0]!.id, 'liberty', 'plains1').ok).toBe(true);
  });
  it('rejects a second same-colour cube in a hex', () => {
    const s = withLiberty();
    s.hexes.plains1!.cubes.push('liberty');
    expect(canExpandCube(s, testBoard, s.players[0]!.id, 'liberty', 'plains1').ok).toBe(false);
  });
  it('rejects a non-adjacent placement', () => {
    const s = withLiberty();
    s.hexes.NYC!.cubes.push('liberty');
    // mtn1 is not adjacent to NYC
    expect(canExpandCube(s, testBoard, s.players[0]!.id, 'liberty', 'mtn1').ok).toBe(false);
  });
  it('rejects a full forest/mountain', () => {
    const s = withLiberty();
    s.hexes.plains1!.cubes.push('liberty');
    s.hexes.forest1!.cubes.push('republic'); // forest already occupied
    expect(canExpandCube(s, testBoard, s.players[0]!.id, 'liberty', 'forest1').ok).toBe(false);
  });
  it('rejects when the company cannot afford the cost', () => {
    const s = withLiberty(1); // needs $2 for plains
    s.hexes.NYC!.cubes.push('liberty');
    expect(canExpandCube(s, testBoard, s.players[0]!.id, 'liberty', 'plains1').ok).toBe(false);
  });
  it('rejects when the player owns no share in the company', () => {
    const s = game(); // A owns nothing
    s.hexes.NYC!.cubes.push('liberty');
    s.companies.liberty.treasury = 100;
    expect(canExpandCube(s, testBoard, s.players[0]!.id, 'liberty', 'plains1').ok).toBe(false);
  });
});

describe('placeCube', () => {
  it('pays the cost from the treasury and updates city income', () => {
    let s = withLiberty(100);
    // seed liberty in plains1, then expand into Atlanta (city, cost 2)
    s.hexes.plains1!.cubes.push('liberty');
    s = placeCube(s, testBoard, 'liberty', 'ATL');
    expect(s.companies.liberty.treasury).toBe(98); // 100 - 2
    expect(s.hexes.ATL!.cubes).toContain('liberty');
    expect(s.companies.liberty.income).toBe(5); // Atlanta full value
  });
});

describe('placeStartingCube', () => {
  it('places on an unoccupied city and sets income to the full value, no cost', () => {
    let s = game();
    s = placeStartingCube(s, testBoard, 'republic', 'NYC');
    expect(s.companies.republic.income).toBe(8);
    expect(s.companies.republic.onMap).toBe(true);
    expect(s.hexes.NYC!.cubes).toContain('republic');
  });
  it('refuses an occupied city', () => {
    const s = game();
    s.hexes.NYC!.cubes.push('liberty');
    expect(() => placeStartingCube(s, testBoard, 'republic', 'NYC')).toThrow();
  });
});
