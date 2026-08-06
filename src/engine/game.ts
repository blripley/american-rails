import { GameState, CompanyId, ActionType, COMPANY_IDS } from './types';
import { BoardDef } from './board/boardTypes';
import { cityInfo } from './board/board';
import { cloneState, playerById } from './clone';
import { openAuction, placeBid, passBid } from './auction';
import { placeCube, placeStartingCube, canExpandCube } from './expand';
import { doPass, doFund5, doTake2, doDevelop, canDevelop, Take2Mode } from './actions';
import {
  initActionRound,
  placeActionMarker,
  advanceTurn,
  nextToAct,
  rowOf,
  endRound,
} from './turnOrder';
import { payDividends } from './dividends';
import { checkGameEnd } from './endgame';

export type Move =
  | { type: 'openAuction'; playerId: string; companyId: CompanyId }
  | { type: 'bid'; playerId: string; amount: number }
  | { type: 'passBid'; playerId: string }
  | { type: 'placeStartingCube'; playerId: string; hexId: string }
  | { type: 'chooseAction'; playerId: string; action: ActionType }
  | { type: 'fund5'; playerId: string; companyId: CompanyId }
  | { type: 'take2'; playerId: string; mode: Take2Mode }
  | { type: 'placeDevelopment'; playerId: string; hexId: string }
  | { type: 'placeCube'; playerId: string; companyId: CompanyId; hexId: string }
  | { type: 'endExpand'; playerId: string }
  // finish the chosen action without implementing it (rules: a player "chooses
  // whether or not to implement" the action they picked).
  | { type: 'skipAction'; playerId: string };

const EXPAND_COUNT: Partial<Record<ActionType, number>> = { expand2: 2, expand3: 3, expand4: 4 };

function inPlayCompanies(s: GameState): CompanyId[] {
  return COMPANY_IDS.filter((id) => !s.companies[id]!.removed);
}

function emptyCities(s: GameState, board: BoardDef): string[] {
  return Object.keys(board.hexes).filter(
    (id) => board.hexes[id]!.city && (s.hexes[id]?.cubes.length ?? 0) === 0,
  );
}

// ---- top-level reducer -----------------------------------------------------

export function applyMove(s: GameState, board: BoardDef, move: Move): GameState {
  switch (move.type) {
    case 'openAuction':
      return doOpenAuction(s, board, move.playerId, move.companyId);
    case 'bid':
      return afterBid(placeBid(assertBidder(s, move.playerId), move.playerId, move.amount), board);
    case 'passBid':
      return afterBid(passBid(assertBidder(s, move.playerId), move.playerId), board);
    case 'placeStartingCube':
      return doPlaceStartingCube(s, board, move.playerId, move.hexId);
    case 'chooseAction':
      return doChooseAction(s, board, move.playerId, move.action);
    case 'fund5':
      return doParamFund5(s, move.playerId, move.companyId);
    case 'take2':
      return doParamTake2(s, move.playerId, move.mode);
    case 'placeDevelopment':
      return doParamDevelop(s, board, move.playerId, move.hexId);
    case 'placeCube':
      return doExpandCube(s, board, move.playerId, move.companyId, move.hexId);
    case 'endExpand':
      return finishAction(assertActive(s, move.playerId));
    case 'skipAction':
      assertActive(s, move.playerId);
      if (!s.pendingAction && !s.pendingExpand) throw new Error('no action to skip');
      return finishAction(s);
  }
}

// ---- setup / auction -------------------------------------------------------

function assertBidder(s: GameState, playerId: string): GameState {
  if (!s.auction || s.auction.resolved) throw new Error('no auction in progress');
  if (s.auction.toAct !== playerId) throw new Error(`not ${playerId}'s turn to bid`);
  return s;
}

function doOpenAuction(s: GameState, board: BoardDef, playerId: string, companyId: CompanyId): GameState {
  if (s.auction && !s.auction.resolved) throw new Error('an auction is already running');
  const company = s.companies[companyId]!;
  if (company.removed) throw new Error('that company is not in play');

  if (s.phase === 'setup') {
    if (!s.setup || s.setup.selectorId !== playerId) throw new Error('not your turn to choose a share');
    if (s.setup.auctioned.includes(companyId)) throw new Error('that company already had its share auctioned');
    let next = cloneState(s);
    next.setup!.auctioned.push(companyId);
    next = openAuction(next, { companyId, sellerId: playerId, startingCity: true });
    return next;
  }

  // action-phase 'auction' action
  if (!s.pendingAction || s.pendingAction.kind !== 'auction') throw new Error('not auctioning now');
  assertActive(s, playerId);
  if (company.sharesInSupply <= 0) throw new Error('no shares of that company remain in supply');
  return openAuction(s, { companyId, sellerId: playerId, startingCity: !company.onMap });
}

function afterBid(s: GameState, board: BoardDef): GameState {
  const a = s.auction!;
  if (!a.resolved) return s; // still bidding

  if (s.phase === 'setup') {
    if (a.highBidderId) {
      // winner claimed a turn-order spot; they must now place a starting cube
      let next = cloneState(s);
      if (!next.setup!.claimedOrder.includes(a.highBidderId)) next.setup!.claimedOrder.push(a.highBidderId);
      // if there is nowhere to place, remove the share + remaining shares
      if (emptyCities(next, board).length === 0) {
        removeCompanyRemainder(next, a.companyId);
        next.pendingStartCube = null;
        next.setup!.selectorId = a.highBidderId;
        next.auction = null;
        return continueOrFinishSetup(next, board);
      }
      return next; // await placeStartingCube
    }
    // no bids: the last player to pass selects the next share
    let next = cloneState(s);
    const lastPasser = a.passed[a.passed.length - 1]!;
    next.setup!.selectorId = lastPasser;
    next.auction = null;
    return continueOrFinishSetup(next, board);
  }

  // action-phase auction
  if (a.highBidderId && a.startingCity) {
    if (emptyCities(s, board).length === 0) {
      const next = cloneState(s);
      removeCompanyRemainder(next, a.companyId);
      next.pendingStartCube = null;
      next.auction = null;
      return finishAction(next);
    }
    return s; // await placeStartingCube from the winner
  }
  const next = cloneState(s);
  next.auction = null;
  return finishAction(next);
}

function removeCompanyRemainder(s: GameState, companyId: CompanyId): void {
  const c = s.companies[companyId]!;
  c.sharesRemoved += c.sharesInSupply;
  c.sharesInSupply = 0;
  s.log.push(`No empty city for ${companyId}; its remaining shares are removed.`);
}

function doPlaceStartingCube(s: GameState, board: BoardDef, playerId: string, hexId: string): GameState {
  if (!s.pendingStartCube || s.pendingStartCube.playerId !== playerId) throw new Error('no starting cube to place');
  const companyId = s.pendingStartCube.companyId;
  let next = placeStartingCube(s, board, companyId, hexId);
  next.pendingStartCube = null;
  next.auction = null;

  if (next.phase === 'setup') {
    next.setup!.selectorId = playerId;
    return continueOrFinishSetup(next, board);
  }
  return finishAction(next);
}

function continueOrFinishSetup(s: GameState, board: BoardDef): GameState {
  const done = inPlayCompanies(s).every((id) => s.setup!.auctioned.includes(id));
  if (!done) return s; // selector will open the next auction
  return finalizeSetup(s, board);
}

function finalizeSetup(s: GameState, board: BoardDef): GameState {
  let next = cloneState(s);
  // Players who never won a share join the turn order after the winners,
  // beginning with the banker (seat 0) and proceeding clockwise.
  const order = [...next.setup!.claimedOrder];
  const bySeat = [...next.players].sort((a, b) => a.seat - b.seat);
  for (const p of bySeat) if (!order.includes(p.id)) order.push(p.id);
  next.turnOrder = order;
  next.setup = null;
  next.log.push('Preparation complete. The first year begins.');
  next = initActionRound(next);
  return next;
}

// ---- action phase ----------------------------------------------------------

function assertActive(s: GameState, playerId: string): GameState {
  if (s.activePlayerId !== playerId) throw new Error(`not ${playerId}'s turn`);
  return s;
}

function doChooseAction(s: GameState, board: BoardDef, playerId: string, action: ActionType): GameState {
  if (s.phase !== 'action') throw new Error('not in the action phase');
  if (s.pendingAction || s.pendingExpand) throw new Error('finish your current action first');
  if (nextToAct(s) !== playerId) throw new Error(`not ${playerId}'s turn`);
  if (action === 'expand2' && s.players.length < 4) throw new Error('Expand 2 is only available with 4-5 players');

  // place the marker on the correct row for this phase's column
  let next = placeActionMarker(s, playerId, action);

  switch (action) {
    case 'pass':
      next = doPass(next);
      return finishAction(next);
    case 'expand2':
    case 'expand3':
    case 'expand4':
      next = cloneState(next);
      next.pendingExpand = { action, remaining: EXPAND_COUNT[action]! };
      return next;
    default:
      next = cloneState(next);
      next.pendingAction = { kind: action };
      return next;
  }
}

function doParamFund5(s: GameState, playerId: string, companyId: CompanyId): GameState {
  requirePending(s, playerId, 'fund5');
  return finishAction(doFund5(s, companyId));
}

function doParamTake2(s: GameState, playerId: string, mode: Take2Mode): GameState {
  requirePending(s, playerId, 'take2');
  return finishAction(doTake2(s, playerId, mode));
}

function doParamDevelop(s: GameState, board: BoardDef, playerId: string, hexId: string): GameState {
  requirePending(s, playerId, 'develop');
  const check = canDevelop(s, board, hexId);
  if (!check.ok) throw new Error(check.reason);
  return finishAction(doDevelop(s, board, playerId, hexId));
}

function requirePending(s: GameState, playerId: string, kind: ActionType): void {
  assertActive(s, playerId);
  if (!s.pendingAction || s.pendingAction.kind !== kind) throw new Error(`no pending ${kind} action`);
}

function doExpandCube(s: GameState, board: BoardDef, playerId: string, companyId: CompanyId, hexId: string): GameState {
  assertActive(s, playerId);
  if (!s.pendingExpand) throw new Error('no expand in progress');
  const check = canExpandCube(s, board, playerId, companyId, hexId);
  if (!check.ok) throw new Error(check.reason);
  let next = placeCube(s, board, companyId, hexId);
  next.pendingExpand = { ...next.pendingExpand!, remaining: next.pendingExpand!.remaining - 1 };
  if (next.pendingExpand.remaining <= 0) return finishAction(next);
  return next;
}

// Advance the turn once an action is fully resolved; auto-run the dividend phase
// and start the next round (or end the game) when the third phase completes.
function finishAction(s: GameState): GameState {
  let next = cloneState(s);
  next.pendingExpand = null;
  next.pendingAction = null;
  next.auction = null;
  next = advanceTurn(next);
  if (next.phase === 'dividend') {
    next = payDividends(next);
    next = checkGameEnd(next);
    if (next.phase !== 'ended') {
      next = endRound(next); // return markers, advance the year, start next round
    }
  }
  return next;
}

// ---- legal-move surface for the UI ----------------------------------------

export function legalMoves(s: GameState, board: BoardDef, playerId: string): Move[] {
  const moves: Move[] = [];
  if (s.phase === 'ended') return moves;

  // auction in progress
  if (s.auction && !s.auction.resolved) {
    if (s.auction.toAct === playerId) {
      const min = s.auction.currentBid === 0 ? 10 : s.auction.currentBid + 1;
      if (playerById(s, playerId).money >= min) moves.push({ type: 'bid', playerId, amount: min });
      moves.push({ type: 'passBid', playerId });
    }
    return moves;
  }

  // must place a starting cube
  if (s.pendingStartCube && s.pendingStartCube.playerId === playerId) {
    for (const hexId of emptyCities(s, board)) moves.push({ type: 'placeStartingCube', playerId, hexId });
    return moves;
  }

  if (s.phase === 'setup') {
    if (s.setup && s.setup.selectorId === playerId) {
      for (const id of inPlayCompanies(s)) {
        if (!s.setup.auctioned.includes(id)) moves.push({ type: 'openAuction', playerId, companyId: id });
      }
    }
    return moves;
  }

  // action phase
  if (s.pendingExpand && s.activePlayerId === playerId) {
    for (const companyId of playerById(s, playerId).shares) {
      for (const hexId of Object.keys(board.hexes)) {
        if (canExpandCube(s, board, playerId, companyId, hexId).ok) {
          moves.push({ type: 'placeCube', playerId, companyId, hexId });
        }
      }
    }
    moves.push({ type: 'endExpand', playerId });
    moves.push({ type: 'skipAction', playerId });
    return moves;
  }

  if (s.pendingAction && s.activePlayerId === playerId) {
    switch (s.pendingAction.kind) {
      case 'fund5':
        for (const id of inPlayCompanies(s)) moves.push({ type: 'fund5', playerId, companyId: id });
        break;
      case 'take2':
        moves.push({ type: 'take2', playerId, mode: 'take' });
        moves.push({ type: 'take2', playerId, mode: 'fromEach' });
        break;
      case 'develop':
        for (const hexId of Object.keys(board.hexes)) {
          if (canDevelop(s, board, hexId).ok) moves.push({ type: 'placeDevelopment', playerId, hexId });
        }
        break;
      case 'auction':
        for (const id of inPlayCompanies(s)) {
          if (s.companies[id]!.sharesInSupply > 0) moves.push({ type: 'openAuction', playerId, companyId: id });
        }
        break;
    }
    moves.push({ type: 'skipAction', playerId }); // may always decline to implement
    return moves;
  }

  // choosing an action
  if (nextToAct(s) === playerId) {
    const chooseable: ActionType[] = ['pass', 'develop', 'fund5', 'take2', 'expand3', 'auction', 'expand4'];
    if (s.players.length >= 4) chooseable.push('expand2');
    for (const action of chooseable) {
      if (s.actionTrack[rowOf(action)]![s.actionPhase] === null) {
        moves.push({ type: 'chooseAction', playerId, action });
      }
    }
  }
  return moves;
}
