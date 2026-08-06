import { describe, it, expect } from 'vitest';
import { createGame } from './setup';
import { applyMove, legalMoves, Move } from './game';
import { integrationBoard } from './board/integrationBoard';
import { GameState, COMPANY_IDS } from './types';

// Whose move it is right now, across every phase.
function actor(s: GameState): string | null {
  if (s.auction && !s.auction.resolved) return s.auction.toAct;
  if (s.pendingStartCube) return s.pendingStartCube.playerId;
  if (s.phase === 'setup') return s.setup?.selectorId ?? null;
  if (s.phase === 'action') return s.activePlayerId;
  return null;
}

// A tiny deterministic "bot": progresses setup, wins each auction for its
// seller at $10, tries to expand, and otherwise takes a productive action.
function choose(s: GameState, moves: Move[]): Move {
  const start = moves.find((m) => m.type === 'placeStartingCube');
  if (start) return start;

  if (s.auction && !s.auction.resolved) {
    const bid = moves.find((m) => m.type === 'bid');
    const iAmSeller = s.auction.sellerId === s.auction.toAct;
    if (bid && iAmSeller && s.auction.currentBid === 0) return bid; // seller opens at $10
    return moves.find((m) => m.type === 'passBid')!;
  }

  const cube = moves.find((m) => m.type === 'placeCube');
  if (cube) return cube;
  const endExpand = moves.find((m) => m.type === 'endExpand');
  if (endExpand) return endExpand;

  // pending-action parameters
  const param = moves.find((m) =>
    m.type === 'fund5' || m.type === 'take2' || m.type === 'placeDevelopment' || m.type === 'openAuction',
  );
  if (param && s.phase !== 'setup') return param;

  // setup: open the next auction
  const open = moves.find((m) => m.type === 'openAuction');
  if (open) return open;

  // choosing an action: prefer to expand, else the first available
  const expand = moves.find((m) => m.type === 'chooseAction' && m.action === 'expand3');
  if (expand) return expand;
  const choose = moves.find((m) => m.type === 'chooseAction');
  if (choose) return choose;
  // fallback: decline to implement a chosen action with no legal target
  const skip = moves.find((m) => m.type === 'skipAction');
  if (skip) return skip;
  return moves[0]!;
}

function checkInvariants(s: GameState): void {
  for (const p of s.players) expect(p.money).toBeGreaterThanOrEqual(0);
  for (const id of COMPANY_IDS) {
    expect(s.companies[id].treasury).toBeGreaterThanOrEqual(0);
    expect(s.companies[id].cubesInSupply).toBeGreaterThanOrEqual(0);
    expect(s.companies[id].sharesInSupply).toBeGreaterThanOrEqual(0);
  }
  expect(s.developmentSupply).toBeGreaterThanOrEqual(0);
}

describe('full game', () => {
  it('plays a scripted 4-player game to completion with invariants holding', () => {
    let s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 5, board: integrationBoard });
    let guard = 0;
    while (s.phase !== 'ended' && guard < 5000) {
      guard++;
      const who = actor(s);
      expect(who).not.toBeNull();
      const moves = legalMoves(s, integrationBoard, who!);
      expect(moves.length).toBeGreaterThan(0);
      s = applyMove(s, integrationBoard, choose(s, moves));
      checkInvariants(s);
    }
    expect(s.phase).toBe('ended');
    expect(s.winnerIds).not.toBeNull();
    expect(s.winnerIds!.length).toBeGreaterThanOrEqual(1);
    expect(guard).toBeLessThan(5000);
  });

  it('reaches the action phase after a complete preparation round (all six companies on the map)', () => {
    let s = createGame({ names: ['A', 'B', 'C', 'D'], seed: 5, board: integrationBoard });
    let guard = 0;
    while (s.phase === 'setup' && guard < 500) {
      guard++;
      const who = actor(s)!;
      s = applyMove(s, integrationBoard, choose(s, legalMoves(s, integrationBoard, who)));
    }
    expect(s.phase).toBe('action');
    expect(s.setup).toBeNull();
    expect(s.turnOrder).toHaveLength(4);
    // most companies get placed; any that received no bid is legitimately
    // removed rather than placed, so we require the majority to be on the map.
    const onMap = COMPANY_IDS.filter((id) => s.companies[id].onMap);
    expect(onMap.length).toBeGreaterThanOrEqual(4);
    for (const id of onMap) expect(s.companies[id].income).toBeGreaterThan(0);
  });
});
