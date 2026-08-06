import { GameState, CompanyId, CompanyState, Player } from './types';

// Deep, structural clone. All engine functions clone before mutating so that
// inputs are never modified in place.
export function cloneState(s: GameState): GameState {
  return structuredClone(s);
}

export function withCompany(s: GameState, id: CompanyId, patch: Partial<CompanyState>): GameState {
  const next = cloneState(s);
  next.companies[id] = { ...next.companies[id], ...patch };
  return next;
}

export function withPlayer(s: GameState, id: string, patch: Partial<Player>): GameState {
  const next = cloneState(s);
  const idx = next.players.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error(`unknown player: ${id}`);
  next.players[idx] = { ...next.players[idx]!, ...patch };
  return next;
}

export function playerById(s: GameState, id: string): Player {
  const p = s.players.find((pl) => pl.id === id);
  if (!p) throw new Error(`unknown player: ${id}`);
  return p;
}

export function log(s: GameState, message: string): GameState {
  const next = cloneState(s);
  next.log = [...next.log, message];
  return next;
}
