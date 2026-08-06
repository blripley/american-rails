import { GameState, CompanyId } from './types';
import { BoardDef } from './board/boardTypes';
import { cityInfo } from './board/board';
import { applyDevelopment } from './income';
import { cloneState, playerById } from './clone';
import { PlacementCheck } from './expand';

export function doPass(s: GameState): GameState {
  const next = cloneState(s);
  next.log.push(`${playerById(next, next.activePlayerId!).name} passed.`);
  return next;
}

export function doFund5(s: GameState, companyId: CompanyId): GameState {
  const next = cloneState(s);
  next.companies[companyId]!.treasury += 5;
  next.log.push(`$5 funded to ${companyId}.`);
  return next;
}

export type Take2Mode = 'take' | 'fromEach';

// 'take'   : the player takes $2 from the bank.
// 'fromEach': every OTHER player pays $2 to the bank (drains opponents; the
//             active player gains nothing). A player who can't pay $2 pays what
//             they have.
export function doTake2(s: GameState, playerId: string, mode: Take2Mode): GameState {
  const next = cloneState(s);
  if (mode === 'take') {
    playerById(next, playerId).money += 2;
    next.log.push(`${playerById(next, playerId).name} took $2 from the bank.`);
  } else {
    for (const p of next.players) {
      if (p.id === playerId) continue;
      p.money -= Math.min(2, p.money);
    }
    next.log.push(`${playerById(next, playerId).name} taxed every other player $2 to the bank.`);
  }
  return next;
}

export function canDevelop(s: GameState, board: BoardDef, hexId: string): PlacementCheck {
  const info = cityInfo(board, hexId);
  if (!info) return { ok: false, reason: 'not a city' };
  if (!info.developable) return { ok: false, reason: 'this hub city cannot be developed' };
  if (s.developmentSupply <= 0) return { ok: false, reason: 'no development markers left' };
  const hex = s.hexes[hexId];
  if (!hex || hex.cubes.length === 0) return { ok: false, reason: 'the city has no track cube' };
  if (hex.developed) return { ok: false, reason: 'already developed' };
  return { ok: true };
}

export function doDevelop(s: GameState, board: BoardDef, playerId: string, hexId: string): GameState {
  let next = cloneState(s);
  next.hexes[hexId]!.developed = true;
  next.developmentSupply -= 1;
  next = applyDevelopment(next, board, hexId);
  next.log.push(`${playerById(next, playerId).name} developed ${cityInfo(board, hexId)!.name}.`);
  return next;
}
