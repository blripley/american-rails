import { describe, it, expect } from 'vitest';
import { applyMove, legalMoves, Move } from './game';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { GameState } from './types';

describe('applyMove guards', () => {
  it('rejects a move from a player who is not the selector during setup', () => {
    const s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
    const B = s.players[1]!.id;
    expect(() => applyMove(s, testBoard, { type: 'openAuction', playerId: B, companyId: 'american' })).toThrow();
  });

  it('a setup auction won unopposed sets a pending starting cube', () => {
    let s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
    const [A, B, C, D] = s.players.map((p) => p.id) as [string, string, string, string];
    s = applyMove(s, testBoard, { type: 'openAuction', playerId: A, companyId: 'american' });
    s = applyMove(s, testBoard, { type: 'bid', playerId: A, amount: 10 });
    s = applyMove(s, testBoard, { type: 'passBid', playerId: B });
    s = applyMove(s, testBoard, { type: 'passBid', playerId: C });
    s = applyMove(s, testBoard, { type: 'passBid', playerId: D });
    expect(s.pendingStartCube).toEqual({ playerId: A, companyId: 'american' });
    // A places its starting cube in an empty city
    s = applyMove(s, testBoard, { type: 'placeStartingCube', playerId: A, hexId: 'NYC' });
    expect(s.companies.american.onMap).toBe(true);
    expect(s.companies.american.income).toBe(8);
    expect(s.setup!.selectorId).toBe(A); // winner selects next
    expect(s.setup!.claimedOrder).toContain(A);
  });
});

describe('action phase via the reducer', () => {
  // Build a minimal action-phase state directly (skip the full prep round).
  function actionState(): GameState {
    let s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
    s.phase = 'action';
    s.setup = null;
    s.actionTrack = [
      [null, null, null], [null, null, null], [null, null, null], [null, null, null],
      [null, null, null], [null, null, null], [null, null, null],
    ];
    s.actionPhase = 0;
    s.activePlayerId = s.players[0]!.id;
    return s;
  }

  it('rejects a move from a player who is not active', () => {
    const s = actionState();
    const B = s.players[1]!.id;
    expect(() => applyMove(s, testBoard, { type: 'chooseAction', playerId: B, action: 'pass' })).toThrow();
  });

  it('chooseAction(fund5) then fund5 funds a company and advances the turn', () => {
    let s = actionState();
    const A = s.players[0]!.id;
    const B = s.players[1]!.id;
    s = applyMove(s, testBoard, { type: 'chooseAction', playerId: A, action: 'fund5' });
    expect(s.pendingAction).toEqual({ kind: 'fund5' });
    s = applyMove(s, testBoard, { type: 'fund5', playerId: A, companyId: 'liberty' });
    expect(s.companies.liberty.treasury).toBe(5);
    expect(s.pendingAction).toBeNull();
    expect(s.activePlayerId).toBe(B); // advanced to next player
  });

  it('chooseAction(expand3) sets a pending expand of 3 cubes', () => {
    let s = actionState();
    const A = s.players[0]!.id;
    s = applyMove(s, testBoard, { type: 'chooseAction', playerId: A, action: 'expand3' });
    expect(s.pendingExpand).toEqual({ action: 'expand3', remaining: 3 });
  });

  it('endExpand finishes an expand action early and advances the turn', () => {
    let s = actionState();
    const A = s.players[0]!.id;
    const B = s.players[1]!.id;
    s = applyMove(s, testBoard, { type: 'chooseAction', playerId: A, action: 'expand3' });
    s = applyMove(s, testBoard, { type: 'endExpand', playerId: A });
    expect(s.pendingExpand).toBeNull();
    expect(s.activePlayerId).toBe(B);
  });

  it('legalMoves offers only free action rows when choosing', () => {
    const s = actionState();
    const A = s.players[0]!.id;
    const moves: Move[] = legalMoves(s, testBoard, A);
    const actions = moves.filter((m) => m.type === 'chooseAction').map((m: any) => m.action);
    expect(actions).toContain('pass');
    expect(actions).toContain('expand2'); // 4 players -> available
    expect(moves.every((m) => m.type === 'chooseAction')).toBe(true);
  });
});
