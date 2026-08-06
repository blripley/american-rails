import { CompanyId, HexState } from '../types';
import { BoardDef, HexDef, CityInfo } from './boardTypes';

export function hexDef(board: BoardDef, id: string): HexDef {
  const def = board.hexes[id];
  if (!def) throw new Error(`unknown hex: ${id}`);
  return def;
}

export function neighbors(board: BoardDef, id: string): string[] {
  return hexDef(board, id).adjacent;
}

export function isCity(board: BoardDef, id: string): boolean {
  return hexDef(board, id).terrain === 'city';
}

export function cityInfo(board: BoardDef, id: string): CityInfo | undefined {
  return hexDef(board, id).city;
}

// Every hex id that currently holds a cube of the given company.
export function companyHexes(hexes: Record<string, HexState>, companyId: CompanyId): string[] {
  return Object.keys(hexes).filter((id) => hexes[id]!.cubes.includes(companyId));
}

// The set of city NAMES the company's connected track network touches.
// A company's cubes form one or more networks via hex adjacency; this returns
// every city name reachable through cubes of that company.
export function connectedCities(
  board: BoardDef,
  hexes: Record<string, HexState>,
  companyId: CompanyId,
): Set<string> {
  const owned = new Set(companyHexes(hexes, companyId));
  const cities = new Set<string>();
  const seen = new Set<string>();
  for (const start of owned) {
    if (seen.has(start)) continue;
    // BFS across the connected component of this company's cubes.
    const queue = [start];
    seen.add(start);
    while (queue.length) {
      const cur = queue.shift()!;
      const info = cityInfo(board, cur);
      if (info) cities.add(info.name);
      for (const nb of neighbors(board, cur)) {
        if (owned.has(nb) && !seen.has(nb)) {
          seen.add(nb);
          queue.push(nb);
        }
      }
    }
  }
  return cities;
}
