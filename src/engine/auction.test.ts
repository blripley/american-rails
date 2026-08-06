import { describe, it, expect } from 'vitest';
import { openAuction, placeBid, passBid, isAuctionResolved } from './auction';
import { createGame } from './setup';
import { testBoard } from './board/testBoard';
import { playerById } from './clone';
import { GameState } from './types';

// 4 players => no company is removed, so every company's supply is intact.
function game(): GameState {
  return createGame({ names: ['A', 'B', 'C', 'D'], seed: 1, board: testBoard });
}

function ids(s: GameState) {
  return { A: s.players[0]!.id, B: s.players[1]!.id, C: s.players[2]!.id, D: s.players[3]!.id };
}

describe('auction', () => {
  it('winner pays final bid into the company treasury and gains the share', () => {
    let s = game();
    const { A, B, C, D } = ids(s);
    s = openAuction(s, { companyId: 'american', sellerId: A, startingCity: true });
    s = placeBid(s, A, 10);
    s = passBid(s, B);
    s = passBid(s, C);
    s = passBid(s, D);
    expect(isAuctionResolved(s)).toBe(true);
    expect(playerById(s, A).shares).toContain('american');
    expect(playerById(s, A).money).toBe(40);
    expect(s.companies.american.treasury).toBe(10);
    expect(s.companies.american.sharesInSupply).toBe(4); // was 5
    expect(s.pendingStartCube).toEqual({ playerId: A, companyId: 'american' });
  });

  it('enforces the $10 minimum opening bid', () => {
    let s = game();
    const { A } = ids(s);
    s = openAuction(s, { companyId: 'american', sellerId: A, startingCity: true });
    expect(() => placeBid(s, A, 9)).toThrow();
  });

  it('a later bid must exceed the current bid', () => {
    let s = game();
    const { A, B } = ids(s);
    s = openAuction(s, { companyId: 'american', sellerId: A, startingCity: true });
    s = placeBid(s, A, 10);
    expect(() => placeBid(s, B, 10)).toThrow();
  });

  it('a passed player may not bid again', () => {
    let s = game();
    const { A, B } = ids(s);
    s = openAuction(s, { companyId: 'american', sellerId: A, startingCity: true });
    s = passBid(s, A);
    s = placeBid(s, B, 10);
    expect(() => placeBid(s, A, 15)).toThrow();
  });

  it('highest bidder wins after others pass', () => {
    let s = game();
    const { A, B, C, D } = ids(s);
    s = openAuction(s, { companyId: 'american', sellerId: A, startingCity: true });
    s = placeBid(s, A, 10);
    s = placeBid(s, B, 12);
    s = passBid(s, C);
    s = passBid(s, D);
    s = passBid(s, A);
    expect(isAuctionResolved(s)).toBe(true);
    expect(playerById(s, B).shares).toContain('american');
    expect(playerById(s, B).money).toBe(38);
    expect(s.companies.american.treasury).toBe(12);
  });

  it('no bids removes the share from the game', () => {
    let s = game();
    const { A, B, C, D } = ids(s);
    s = openAuction(s, { companyId: 'liberty', sellerId: A, startingCity: true });
    s = passBid(s, A);
    s = passBid(s, B);
    s = passBid(s, C);
    s = passBid(s, D);
    expect(isAuctionResolved(s)).toBe(true);
    expect(s.companies.liberty.sharesInSupply).toBe(1); // was 2
    expect(s.companies.liberty.sharesRemoved).toBe(1);
    expect(s.pendingStartCube).toBeNull();
  });

  it('cannot bid more money than you hold', () => {
    let s = game();
    const { A } = ids(s);
    s = openAuction(s, { companyId: 'american', sellerId: A, startingCity: true });
    expect(() => placeBid(s, A, 51)).toThrow();
  });
});
