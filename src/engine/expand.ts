import { GameState, CompanyId, HexState } from './types';
import { BoardDef } from './board/boardTypes';
import { hexDef, neighbors, cityInfo } from './board/board';
import { applyCityEntry, applySpecialConnections } from './income';
import { cloneState, playerById } from './clone';

export interface PlacementCheck {
  ok: boolean;
  reason?: string;
}

// Cost to add ONE more cube to `hexId`, given the cubes currently there.
//  cities/plains: $2 + $2 per cube already present (+$2 per development marker for cities)
//  forests: $3   mountains: $5
export function expandCost(board: BoardDef, hexes: Record<string, HexState>, hexId: string): number {
  const def = hexDef(board, hexId);
  const hex = hexes[hexId] ?? { cubes: [], developed: false };
  switch (def.terrain) {
    case 'plains':
      return 2 + 2 * hex.cubes.length;
    case 'city':
      return 2 + 2 * hex.cubes.length + (hex.developed ? 2 : 0);
    case 'forest':
      return 3;
    case 'mountain':
      return 5;
    default:
      return Infinity; // water / unbuildable
  }
}

// Can the given player expand `companyId` onto `hexId` via the Expand action?
export function canExpandCube(
  s: GameState,
  board: BoardDef,
  playerId: string,
  companyId: CompanyId,
  hexId: string,
): PlacementCheck {
  const player = playerById(s, playerId);
  if (!player.shares.includes(companyId)) return { ok: false, reason: 'you own no share in that company' };

  const company = s.companies[companyId]!;
  if (company.cubesInSupply <= 0) return { ok: false, reason: 'no cubes left in that company supply' };

  const def = hexDef(board, hexId);
  if (def.terrain === 'water') return { ok: false, reason: 'cannot build on water' };

  const hex = s.hexes[hexId] ?? { cubes: [], developed: false };
  if (hex.cubes.includes(companyId)) return { ok: false, reason: 'a same-colour cube is already here' };
  if ((def.terrain === 'forest' || def.terrain === 'mountain') && hex.cubes.length >= 1) {
    return { ok: false, reason: 'forests and mountains hold only one cube' };
  }

  // Must be adjacent to another cube of the same company.
  const adjacentSameColour = neighbors(board, hexId).some((nb) => s.hexes[nb]?.cubes.includes(companyId));
  if (!adjacentSameColour) return { ok: false, reason: 'must be adjacent to a same-colour cube' };

  const cost = expandCost(board, s.hexes, hexId);
  if (company.treasury < cost) return { ok: false, reason: 'the company cannot afford this cube' };

  return { ok: true };
}

// Low-level placement: pay the cost from the company treasury, move a cube from
// supply to the hex, and apply the resulting income and connection bonuses.
// Assumes the placement has already been validated.
export function placeCube(s: GameState, board: BoardDef, companyId: CompanyId, hexId: string): GameState {
  let next = cloneState(s);
  const cost = expandCost(board, next.hexes, hexId);
  const company = next.companies[companyId]!;
  company.treasury -= cost;
  company.cubesInSupply -= 1;
  company.onMap = true;
  if (!next.hexes[hexId]) next.hexes[hexId] = { cubes: [], developed: false };
  next.hexes[hexId]!.cubes.push(companyId);
  next.log.push(`${companyId} expanded into ${cityInfo(board, hexId)?.name ?? hexId} for $${cost}.`);

  if (cityInfo(board, hexId)) next = applyCityEntry(next, board, hexId, companyId);
  next = applySpecialConnections(next, board, companyId);
  return next;
}

// Place a company's FIRST cube (prep-round starting city, or a share bought for a
// company not yet on the map): any unoccupied city, no cost, income set to the
// city's full value.
export function placeStartingCube(s: GameState, board: BoardDef, companyId: CompanyId, hexId: string): GameState {
  const info = cityInfo(board, hexId);
  if (!info) throw new Error('starting cube must be placed on a city');
  const hex = s.hexes[hexId];
  if (hex && hex.cubes.length > 0) throw new Error('starting city must be unoccupied');

  const next = cloneState(s);
  const company = next.companies[companyId]!;
  company.cubesInSupply -= 1;
  company.onMap = true;
  company.income = info.full + (hex?.developed ? 2 : 0);
  if (!next.hexes[hexId]) next.hexes[hexId] = { cubes: [], developed: false };
  next.hexes[hexId]!.cubes.push(companyId);
  next.log.push(`${companyId} placed its first cube in ${info.name} (income ${company.income}).`);
  return next;
}
