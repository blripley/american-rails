import { GameState, CompanyId, SPECIAL_CITIES } from './types';
import { BoardDef } from './board/boardTypes';
import { cityInfo, connectedCities } from './board/board';
import { cloneState } from './clone';

// Apply the income change caused by a cube of `companyId` having just been added
// to the city at `hexId`. Call AFTER the cube is pushed onto hexes[hexId].cubes.
//
// Rules (city full value F, shared value S, developed adds +2 full / +1 shared):
//  - 1st company in the city earns F (+2 if developed).
//  - When a 2nd company enters, both drop to shared: the incumbent loses
//    (F - S) plus (developed ? 1 : 0); the newcomer earns S (+1 if developed).
//  - 3rd+ company just earns S (+1 if developed); others already at shared.
export function applyCityEntry(
  s: GameState,
  board: BoardDef,
  hexId: string,
  companyId: CompanyId,
): GameState {
  const info = cityInfo(board, hexId);
  if (!info) return s; // not a city; nothing to do
  const next = cloneState(s);
  const hex = next.hexes[hexId]!;
  const dev = hex.developed ? 1 : 0;
  const count = hex.cubes.length;

  if (count === 1) {
    next.companies[companyId]!.income += info.full + 2 * dev;
  } else if (count === 2) {
    const incumbent = hex.cubes.find((c) => c !== companyId)!;
    next.companies[incumbent]!.income -= info.full - info.shared + dev;
    next.companies[companyId]!.income += info.shared + dev;
  } else {
    next.companies[companyId]!.income += info.shared + dev;
  }
  return next;
}

// Apply the income boost from placing a development marker on a city. Call AFTER
// hexes[hexId].developed is set to true. Solo company +$2; if shared, +$1 each.
export function applyDevelopment(s: GameState, board: BoardDef, hexId: string): GameState {
  const info = cityInfo(board, hexId);
  if (!info) return s;
  const next = cloneState(s);
  const hex = next.hexes[hexId]!;
  const companies = hex.cubes;
  if (companies.length === 1) {
    next.companies[companies[0]!]!.income += 2;
  } else {
    for (const c of companies) next.companies[c]!.income += 1;
  }
  return next;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

// Award any special-connection bonuses ($10 per newly-connected pair among
// Chicago / New York / Atlanta) that the company has not yet received. Awarding
// two pairs at once (completing the third city) naturally yields +$20.
export function applySpecialConnections(
  s: GameState,
  board: BoardDef,
  companyId: CompanyId,
): GameState {
  const cities = connectedCities(board, s.hexes, companyId);
  const connectedSpecials = SPECIAL_CITIES.filter((c) => cities.has(c));
  if (connectedSpecials.length < 2) return s;

  const next = cloneState(s);
  const company = next.companies[companyId]!;
  for (let i = 0; i < connectedSpecials.length; i++) {
    for (let j = i + 1; j < connectedSpecials.length; j++) {
      const key = pairKey(connectedSpecials[i]!, connectedSpecials[j]!);
      if (!company.bonuses.includes(key)) {
        company.bonuses.push(key);
        company.income += 10;
        next.log.push(`${companyId} completed the ${connectedSpecials[i]}–${connectedSpecials[j]} connection (+$10).`);
      }
    }
  }
  return next;
}
