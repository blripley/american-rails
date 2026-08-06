import { GameState, CompanyId, AuctionState } from './types';
import { cloneState, playerById } from './clone';

const MIN_BID = 10;

// Build the clockwise bidding order (by seat) starting from the seller.
function biddingOrder(s: GameState, sellerId: string): string[] {
  const bySeat = [...s.players].sort((a, b) => a.seat - b.seat).map((p) => p.id);
  const start = bySeat.indexOf(sellerId);
  return [...bySeat.slice(start), ...bySeat.slice(0, start)];
}

export interface OpenAuctionArgs {
  companyId: CompanyId;
  sellerId: string;
  startingCity: boolean; // true in the prep round / for a company not yet on the map
}

export function openAuction(s: GameState, args: OpenAuctionArgs): GameState {
  const next = cloneState(s);
  const order = biddingOrder(next, args.sellerId);
  next.auction = {
    companyId: args.companyId,
    sellerId: args.sellerId,
    startingCity: args.startingCity,
    currentBid: 0,
    highBidderId: null,
    order,
    passed: [],
    toAct: order[0]!,
    resolved: false,
  };
  return next;
}

function requireAuction(s: GameState): AuctionState {
  if (!s.auction) throw new Error('no auction in progress');
  return s.auction;
}

export function placeBid(s: GameState, playerId: string, amount: number): GameState {
  const a = requireAuction(s);
  if (a.resolved) throw new Error('auction already resolved');
  if (a.toAct !== playerId) throw new Error(`not ${playerId}'s turn to bid`);
  if (a.passed.includes(playerId)) throw new Error('passed players cannot bid');
  const minAllowed = a.currentBid === 0 ? MIN_BID : a.currentBid + 1;
  if (amount < minAllowed) throw new Error(`bid must be at least ${minAllowed}`);
  if (amount > playerById(s, playerId).money) throw new Error('cannot bid more than you hold');

  const next = cloneState(s);
  next.auction!.currentBid = amount;
  next.auction!.highBidderId = playerId;
  return advance(next);
}

export function passBid(s: GameState, playerId: string): GameState {
  const a = requireAuction(s);
  if (a.resolved) throw new Error('auction already resolved');
  if (a.toAct !== playerId) throw new Error(`not ${playerId}'s turn to bid`);
  if (a.passed.includes(playerId)) throw new Error('already passed');

  const next = cloneState(s);
  next.auction!.passed.push(playerId);
  return advance(next);
}

// Move to the next eligible bidder, or resolve if none remain.
function advance(s: GameState): GameState {
  const a = s.auction!;
  const fromIdx = a.order.indexOf(a.toAct!);
  for (let step = 1; step <= a.order.length; step++) {
    const cand = a.order[(fromIdx + step) % a.order.length]!;
    if (a.passed.includes(cand)) continue;
    if (a.highBidderId !== null && cand === a.highBidderId) continue; // needn't outbid self
    a.toAct = cand;
    return s;
  }
  return resolve(s);
}

// `s` here is already a fresh clone owned by the caller, so we mutate directly.
function resolve(s: GameState): GameState {
  const a = s.auction!;
  a.resolved = true;
  a.toAct = null;
  const company = s.companies[a.companyId]!;

  if (a.highBidderId) {
    const winnerId = a.highBidderId;
    const winner = playerById(s, winnerId);
    winner.money -= a.currentBid;
    winner.shares.push(a.companyId);
    company.treasury += a.currentBid;
    company.sharesInSupply -= 1;
    s.log.push(`${winner.name} won a ${a.companyId} share for $${a.currentBid}.`);
    if (a.startingCity) {
      s.pendingStartCube = { playerId: winnerId, companyId: a.companyId };
    }
  } else {
    company.sharesInSupply -= 1;
    company.sharesRemoved += 1;
    s.log.push(`No bids for the ${a.companyId} share; it is removed from the game.`);
  }
  return s;
}

export function isAuctionResolved(s: GameState): boolean {
  return !!s.auction?.resolved;
}
