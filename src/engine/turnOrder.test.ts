import { describe, it, expect } from 'vitest';
import { initActionRound, placeActionMarker, advanceTurn, nextToAct, endRound, emptyActionTrack } from './turnOrder';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { ActionType, GameState } from './types';

function game(): GameState {
  const s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
  return initActionRound(s);
}

// One player's whole turn: place their marker and advance to the next actor.
function act(s: GameState, action: ActionType): GameState {
  return advanceTurn(placeActionMarker(s, nextToAct(s)!, action));
}

describe('action track', () => {
  it('rejects choosing an action slot already taken this phase', () => {
    let s = game();
    s = placeActionMarker(s, nextToAct(s)!, 'develop'); // p1 -> develop
    s = advanceTurn(s); // now p2
    expect(() => placeActionMarker(s, nextToAct(s)!, 'develop')).toThrow();
  });

  it('phase 2 order follows the top-to-bottom action-track positions from phase 1', () => {
    let s = game();
    // p1 expand4 (bottom), p2 pass (top), p3 develop, p4 fund5
    s = act(s, 'expand4');
    s = act(s, 'pass');
    s = act(s, 'develop');
    s = act(s, 'fund5');
    // column full -> advanced into phase 2 (index 1). Order by column-0 rows:
    // pass(p2), develop(p3), fund5(p4), expand4(p1)
    expect(s.actionPhase).toBe(1);
    expect(nextToAct(s)).toBe(s.players[1]!.id); // p2 first
  });

  it('after three full phases the round enters the dividend phase', () => {
    let s = game();
    const acts: ActionType[] = ['pass', 'develop', 'fund5', 'take2'];
    for (let phase = 0; phase < 3; phase++) {
      for (let i = 0; i < 4; i++) s = act(s, acts[i]!);
    }
    expect(s.phase).toBe('dividend');
    expect(s.activePlayerId).toBeNull();
  });

  it('endRound returns markers to the turn order (by row) and advances the year', () => {
    const s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
    const ids = s.players.map((p) => p.id);
    s.actionTrack = emptyActionTrack();
    // column 2 (right column) filled: row0=C, row1=A, row2=D, row3=B
    s.actionTrack[0]![2] = ids[2]!;
    s.actionTrack[1]![2] = ids[0]!;
    s.actionTrack[2]![2] = ids[3]!;
    s.actionTrack[3]![2] = ids[1]!;
    const s2 = endRound(s);
    expect(s2.turnOrder).toEqual([ids[2], ids[0], ids[3], ids[1]]);
    expect(s2.year).toBe(1852);
    expect(s2.activePlayerId).toBe(ids[2]);
  });
});
