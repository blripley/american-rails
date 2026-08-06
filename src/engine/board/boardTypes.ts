import { Terrain } from '../types';

export interface CityInfo {
  name: string;
  full: number; // full value (only one company present)
  shared: number; // shared value (two or more companies present)
  developable: boolean; // false for the five hub cities
}

export interface HexDef {
  terrain: Terrain;
  city?: CityInfo;
  adjacent: string[]; // ids of neighbouring hexes
}

export interface BoardDef {
  hexes: Record<string, HexDef>;
}
