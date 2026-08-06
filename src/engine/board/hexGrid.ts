import { Terrain } from '../types';
import { BoardDef, HexDef, CityInfo } from './boardTypes';

// A hex is addressed by offset coordinates "col,row" (odd-q, flat-topped layout:
// odd columns are shifted down half a hex). Adjacency and pixel positions are
// both derived from these coordinates, so one definition drives rules and render.

export interface HexSpec {
  terrain: Terrain;
  city?: CityInfo;
}

export function coordId(col: number, row: number): string {
  return `${col},${row}`;
}

export function parseCoord(id: string): { col: number; row: number } {
  const [col, row] = id.split(',').map(Number);
  return { col: col!, row: row! };
}

// odd-q offset neighbour directions (redblobgames), indexed by column parity.
const ODDQ_DIRS: [number, number][][] = [
  [[+1, 0], [+1, -1], [0, -1], [-1, -1], [-1, 0], [0, +1]], // even columns
  [[+1, +1], [+1, 0], [0, -1], [-1, 0], [-1, +1], [0, +1]], // odd columns
];

export function neighborCoords(col: number, row: number): { col: number; row: number }[] {
  const dirs = ODDQ_DIRS[col & 1]!;
  return dirs.map(([dc, dr]) => ({ col: col + dc, row: row + dr }));
}

// Build a BoardDef from a coordinate map, computing each hex's `adjacent` list
// (only neighbours that actually exist in the map).
export function buildBoard(specs: Record<string, HexSpec>): BoardDef {
  const hexes: Record<string, HexDef> = {};
  for (const [id, spec] of Object.entries(specs)) {
    const { col, row } = parseCoord(id);
    const adjacent = neighborCoords(col, row)
      .map((c) => coordId(c.col, c.row))
      .filter((nid) => nid in specs);
    hexes[id] = { terrain: spec.terrain, city: spec.city, adjacent };
  }
  return { hexes };
}

// ---- pixel geometry (flat-topped hexes) ------------------------------------

export function hexPixel(col: number, row: number, size: number): { x: number; y: number } {
  const x = size * 1.5 * col;
  const y = size * Math.sqrt(3) * (row + 0.5 * (col & 1));
  return { x, y };
}

// SVG polygon points for a flat-topped hexagon centred at (cx, cy).
export function hexPolygon(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + size * Math.cos(angle)).toFixed(2)},${(cy + size * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export type { CityInfo };
