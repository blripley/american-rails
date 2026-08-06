import { GameState, ACTION_ROWS, ActionType } from './types';
import { cloneState } from './clone';

export function emptyActionTrack(): (string | null)[][] {
  return ACTION_ROWS.map(() => [null, null, null]);
}

// Begin the three-phase action round: fresh track, phase 0, first actor is the
// player at the top of the turn-order track.
export function initActionRound(s: GameState): GameState {
  const next = cloneState(s);
  next.actionTrack = emptyActionTrack();
  next.actionPhase = 0;
  next.phase = 'action';
  next.activePlayerId = next.turnOrder[0] ?? null;
  return next;
}

// The order players act in for the current phase.
//  phase 0: the turn-order track.
//  phase 1+: by top-to-bottom position in the previous phase's column.
export function phaseOrder(s: GameState): string[] {
  if (s.actionPhase === 0) return [...s.turnOrder];
  const prev = s.actionPhase - 1;
  const order: string[] = [];
  for (let row = 0; row < s.actionTrack.length; row++) {
    const who = s.actionTrack[row]![prev];
    if (who) order.push(who);
  }
  return order;
}

function placedThisPhase(s: GameState): Set<string> {
  const placed = new Set<string>();
  for (const row of s.actionTrack) {
    const who = row[s.actionPhase];
    if (who) placed.add(who);
  }
  return placed;
}

// The next player to choose an action this phase, or null if everyone has.
export function nextToAct(s: GameState): string | null {
  const placed = placedThisPhase(s);
  for (const id of phaseOrder(s)) {
    if (!placed.has(id)) return id;
  }
  return null;
}

export function rowOf(action: ActionType): number {
  // expand2 shares the take2 row (it is the alternate use of that slot).
  const key = action === 'expand2' ? 'take2' : action;
  const idx = ACTION_ROWS.indexOf(key);
  if (idx < 0) throw new Error(`no action-track row for ${action}`);
  return idx;
}

// Place the active player's marker on the chosen action row in the current
// phase's column. Validates turn order and that the slot is free.
export function placeActionMarker(s: GameState, playerId: string, action: ActionType): GameState {
  if (s.phase !== 'action') throw new Error('not in the action phase');
  if (nextToAct(s) !== playerId) throw new Error(`not ${playerId}'s turn`);
  const row = rowOf(action);
  if (s.actionTrack[row]![s.actionPhase] !== null) throw new Error('that action is already taken this phase');
  const next = cloneState(s);
  next.actionTrack[row]![next.actionPhase] = playerId;
  return next;
}

// Advance to the next actor. When the current column is full, move to the next
// phase; after the third phase, enter the dividend phase.
export function advanceTurn(s: GameState): GameState {
  const next = cloneState(s);
  const columnFull = placedThisPhase(next).size >= next.players.length;
  if (!columnFull) {
    next.activePlayerId = nextToAct(next);
    return next;
  }
  if (next.actionPhase < 2) {
    next.actionPhase += 1;
    next.activePlayerId = nextToAct(next);
    return next;
  }
  next.phase = 'dividend';
  next.activePlayerId = null;
  return next;
}

// After dividends: markers from the right column return to the turn-order track
// (preserving their top-to-bottom order), then the year advances.
export function endRound(s: GameState): GameState {
  const next = cloneState(s);
  const lastCol = 2;
  const newOrder: string[] = [];
  for (let row = 0; row < next.actionTrack.length; row++) {
    const who = next.actionTrack[row]![lastCol];
    if (who) newOrder.push(who);
  }
  // Fallback: if the round didn't fully populate the last column, keep prior order.
  next.turnOrder = newOrder.length === next.players.length ? newOrder : next.turnOrder;
  next.year += 1;
  next.actionTrack = emptyActionTrack();
  next.actionPhase = 0;
  next.phase = 'action';
  next.activePlayerId = next.turnOrder[0] ?? null;
  return next;
}
