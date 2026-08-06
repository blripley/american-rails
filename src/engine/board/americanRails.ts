import { buildBoard, coordId, HexSpec } from './hexGrid';
import { Terrain } from '../types';
import { CityInfo } from './boardTypes';

// The real American Rails map, transcribed from high-resolution photos of the
// physical board (Pictures of the Game/IMG_0728.jpeg and quadrant crops).
//
// City names and their two income values (full/shared) are read directly from
// the board and are believed correct. The exact hex-by-hex coastline is an
// approximation; terrain is assigned by region to match the board's look
// (yellow plains in the west/midwest, a grey Appalachian mountain band, green
// forest across the south-east and north-east uplands). The engine reads this
// file, so positions/terrain can be nudged without touching game logic.
//
// Coordinates are odd-q offset (col,row): col increases west->east, row
// increases north->south.

const HUBS = new Set(['New York', 'Baltimore', 'Philadelphia', 'Boston', 'Chicago']);
const SPECIALS = new Set(['Chicago', 'New York', 'Atlanta']);

interface CityDef { name: string; full: number; shared: number }

// city coordinate -> value. Values read from the physical board.
const CITY_AT: Record<string, CityDef> = {
  // northern tier
  '3,0': { name: 'Chicago', full: 7, shared: 5 },
  '7,0': { name: 'Detroit', full: 4, shared: 2 },
  '10,0': { name: 'Buffalo', full: 4, shared: 3 },
  '12,0': { name: 'Syracuse', full: 2, shared: 1 },
  '14,0': { name: 'Albany', full: 3, shared: 2 },
  '16,0': { name: 'Boston', full: 5, shared: 3 },
  // second tier
  '2,1': { name: 'Rock Island', full: 2, shared: 1 },
  '6,1': { name: 'Fort Wayne', full: 2, shared: 1 },
  '9,1': { name: 'Cleveland', full: 4, shared: 2 },
  '11,2': { name: 'Pittsburg', full: 5, shared: 3 },
  '12,3': { name: 'Harrisburg', full: 1, shared: 1 },
  '14,3': { name: 'New York', full: 8, shared: 5 },
  // mid tier
  '6,3': { name: 'Indianapolis', full: 4, shared: 2 },
  '9,3': { name: 'Columbus', full: 1, shared: 1 },
  '13,4': { name: 'Philadelphia', full: 6, shared: 4 },
  '12,5': { name: 'Baltimore', full: 5, shared: 3 },
  '2,4': { name: 'St. Louis', full: 5, shared: 3 },
  '7,4': { name: 'Cincinnati', full: 4, shared: 2 },
  '6,5': { name: 'Louisville', full: 1, shared: 1 },
  '9,5': { name: 'Charlestown', full: 2, shared: 1 },
  '10,6': { name: 'Roanoke', full: 2, shared: 1 },
  '12,6': { name: 'Richmond', full: 3, shared: 2 },
  '13,7': { name: 'Norfolk', full: 2, shared: 2 },
  // southern tier
  '2,7': { name: 'Memphis', full: 3, shared: 2 },
  '5,7': { name: 'Nashville', full: 3, shared: 2 },
  '8,7': { name: 'Knoxville', full: 2, shared: 1 },
  '6,8': { name: 'Chattanooga', full: 4, shared: 2 },
  '10,8': { name: 'Charlotte', full: 3, shared: 2 },
  '12,8': { name: 'Raleigh', full: 2, shared: 1 },
  '5,9': { name: 'Birmingham', full: 2, shared: 1 },
  '7,9': { name: 'Atlanta', full: 5, shared: 3 },
  '12,9': { name: 'Wilmington', full: 2, shared: 1 },
  '11,10': { name: 'Charleston', full: 3, shared: 2 },
  // gulf / deep south
  '2,10': { name: 'Jackson', full: 3, shared: 2 },
  '6,10': { name: 'Montgomery', full: 2, shared: 1 },
  '10,11': { name: 'Savannah', full: 3, shared: 2 },
  '4,11': { name: 'Mobile', full: 2, shared: 1 },
  '7,11': { name: 'Tallahassee', full: 2, shared: 1 },
  '2,12': { name: 'New Orleans', full: 5, shared: 3 },
};

const COLS = 17; // 0..16
const ROWS = 13; // 0..12

function isOcean(col: number, row: number): boolean {
  if (col + row >= 22) return true; // south-east Atlantic beyond the coast
  if (col >= 15 && row >= 2) return true; // north-east coast beyond Boston
  if (col <= 1 && row >= 11) return true; // gulf corner (south-west)
  if (col >= 13 && row >= 10) return true; // Florida / south Atlantic
  return false;
}

// Appalachian mountain spine: a diagonal grey band from Pennsylvania down to
// northern Georgia, plus a small patch in the north-east (Adirondacks).
function isMountain(col: number, row: number): boolean {
  if (row >= 2 && row <= 9) {
    const center = 11 - (row - 2) * 0.72; // 11 at row2 -> ~6 at row9
    if (Math.abs(col - center) <= 1) return true;
  }
  if (row === 1 && col >= 12 && col <= 13) return true; // NE patch
  return false;
}

// Yellow plains: the west/midwest block, the New York/Philadelphia coastal
// plain, and the gulf/Florida coastal strip. Everything else is forest.
function isPlains(col: number, row: number): boolean {
  if (col <= 7 && row <= 6) return true; // Illinois / Indiana / Missouri / Ohio-west
  if (col >= 12 && row >= 3 && row <= 6) return true; // NY / Philadelphia coastal plain
  if (row >= 11) return true; // gulf & Florida coast
  return false;
}

function regionTerrain(col: number, row: number): Terrain {
  if (isMountain(col, row)) return 'mountain';
  if (isPlains(col, row)) return 'plains';
  return 'forest';
}

const specs: Record<string, HexSpec> = {};
for (let col = 0; col < COLS; col++) {
  for (let row = 0; row < ROWS; row++) {
    const id = coordId(col, row);
    const cityDef = CITY_AT[id];
    if (cityDef) {
      const city: CityInfo = {
        name: cityDef.name,
        full: cityDef.full,
        shared: cityDef.shared,
        developable: !HUBS.has(cityDef.name),
      };
      specs[id] = { terrain: 'city', city };
    } else if (!isOcean(col, row)) {
      specs[id] = { terrain: regionTerrain(col, row) };
    }
  }
}

export const americanRailsBoard = buildBoard(specs);

export const CITY_LIST = Object.entries(CITY_AT).map(([id, c]) => ({
  id,
  name: c.name,
  full: c.full,
  shared: c.shared,
  hub: HUBS.has(c.name),
  special: SPECIALS.has(c.name),
}));
