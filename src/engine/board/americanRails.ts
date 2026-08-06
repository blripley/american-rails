import { buildBoard, coordId, HexSpec } from './hexGrid';
import { Terrain } from '../types';
import { CityInfo } from './boardTypes';

// The real American Rails map, transcribed from the publisher's board render
// (Pictures of the Game/Screenshot 2026-08-05 214949.png) plus docs/board-research.md.
//
// IMPORTANT — income values are best-effort reads off a ~700px image and are
// marked `// VERIFY`. The city list, terrain regions, hubs (black square) and the
// three special-connection cities are solid; the two numbers per city need a
// glance at the physical board. Because the engine reads this file, fixing a
// number later changes nothing else.
//
// Coordinates are odd-q offset (col,row); geography runs west->east (col up) and
// north->south (row up). Terrain is assigned by region, overridden by cities.

const HUBS = new Set(['New York', 'Baltimore', 'Philadelphia', 'Boston', 'Chicago']);

interface CityDef { name: string; full: number; shared: number }

// city coordinate -> value  (developable = not a hub)
const CITY_AT: Record<string, CityDef> = {
  '2,0': { name: 'Milwaukee', full: 3, shared: 2 }, // VERIFY
  '2,1': { name: 'Chicago', full: 7, shared: 5 }, // VERIFY (hub + special)
  '1,2': { name: 'Rock Island', full: 3, shared: 2 }, // VERIFY
  '0,4': { name: 'St. Louis', full: 3, shared: 2 }, // VERIFY
  '4,0': { name: 'Detroit', full: 3, shared: 2 }, // VERIFY
  '5,1': { name: 'Cleveland', full: 4, shared: 3 }, // VERIFY
  '3,2': { name: 'Fort Wayne', full: 2, shared: 1 }, // VERIFY
  '3,3': { name: 'Indianapolis', full: 4, shared: 2 }, // VERIFY
  '4,4': { name: 'Cincinnati', full: 4, shared: 2 }, // VERIFY (develop example city)
  '4,3': { name: 'Columbus', full: 2, shared: 1 }, // VERIFY
  '3,5': { name: 'Louisville', full: 2, shared: 1 }, // VERIFY
  '6,0': { name: 'Buffalo', full: 4, shared: 3 }, // HIGH (rulebook example)
  '7,0': { name: 'Syracuse', full: 2, shared: 1 }, // VERIFY
  '8,0': { name: 'Albany', full: 3, shared: 2 }, // VERIFY
  '9,0': { name: 'Boston', full: 5, shared: 3 }, // VERIFY (hub)
  '5,3': { name: 'Pittsburgh', full: 5, shared: 3 }, // MEDIUM
  '6,2': { name: 'Harrisburg', full: 2, shared: 1 }, // VERIFY
  '8,2': { name: 'New York', full: 8, shared: 5 }, // HIGH (hub + special)
  '7,3': { name: 'Philadelphia', full: 6, shared: 4 }, // MEDIUM (hub)
  '7,4': { name: 'Baltimore', full: 5, shared: 3 }, // VERIFY (hub)
  '8,4': { name: 'Norfolk', full: 2, shared: 2 }, // VERIFY
  '5,4': { name: 'Charleston WV', full: 1, shared: 1 }, // VERIFY
  '6,4': { name: 'Roanoke', full: 2, shared: 1 }, // VERIFY
  '7,5': { name: 'Richmond', full: 2, shared: 1 }, // VERIFY
  '1,7': { name: 'Memphis', full: 3, shared: 2 }, // VERIFY
  '3,6': { name: 'Nashville', full: 3, shared: 2 }, // VERIFY
  '5,6': { name: 'Knoxville', full: 2, shared: 1 }, // VERIFY
  '4,7': { name: 'Chattanooga', full: 4, shared: 2 }, // VERIFY
  '6,6': { name: 'Charlotte', full: 3, shared: 2 }, // VERIFY
  '7,6': { name: 'Raleigh', full: 2, shared: 1 }, // VERIFY
  '8,6': { name: 'Wilmington', full: 2, shared: 1 }, // VERIFY
  '3,8': { name: 'Birmingham', full: 2, shared: 1 }, // VERIFY
  '5,8': { name: 'Atlanta', full: 3, shared: 2 }, // MEDIUM (special)
  '7,8': { name: 'Charleston SC', full: 3, shared: 2 }, // VERIFY
  '1,9': { name: 'Jackson', full: 3, shared: 2 }, // VERIFY
  '4,9': { name: 'Montgomery', full: 2, shared: 1 }, // VERIFY
  '6,9': { name: 'Savannah', full: 3, shared: 2 }, // VERIFY
  '3,10': { name: 'Mobile', full: 2, shared: 1 }, // VERIFY
  '5,10': { name: 'Tallahassee', full: 2, shared: 1 }, // VERIFY
  '1,11': { name: 'New Orleans', full: 2, shared: 1 }, // VERIFY
};

// Appalachian mountain spine (blue-grey), diagonal from PA down to N. Georgia.
const MOUNTAINS = new Set([
  '5,2', '6,3', '4,5', '5,5', '6,5', '4,6', '5,7', '6,7', '5,9', '4,8', '6,8',
]);

// Ocean / gulf cutouts to shape the coastline (not playable hexes).
const OCEAN = new Set([
  '9,5', '9,6', '9,7', '9,8', '9,9', '9,10', '9,11',
  '8,9', '8,10', '8,11', '7,10', '7,11', '6,10', '6,11',
  '0,10', '0,11', '9,3', '9,4',
]);

const COLS = 10; // 0..9
const ROWS = 12; // 0..11

function regionTerrain(col: number, row: number): Terrain {
  const id = coordId(col, row);
  if (MOUNTAINS.has(id)) return 'mountain';
  // Forest fills the south-east interior (Tennessee/Carolinas/Georgia uplands).
  if (row >= 6 && col >= 2 && col <= 8) return 'forest';
  // A little forest flanking the northern Appalachians too.
  if ((col === 4 || col === 6) && row >= 3 && row <= 5) return 'forest';
  return 'plains';
}

const specs: Record<string, HexSpec> = {};
for (let col = 0; col < COLS; col++) {
  for (let row = 0; row < ROWS; row++) {
    const id = coordId(col, row);
    if (OCEAN.has(id)) continue;
    const cityDef = CITY_AT[id];
    if (cityDef) {
      const city: CityInfo = {
        name: cityDef.name,
        full: cityDef.full,
        shared: cityDef.shared,
        developable: !HUBS.has(cityDef.name),
      };
      specs[id] = { terrain: 'city', city };
    } else {
      specs[id] = { terrain: regionTerrain(col, row) };
    }
  }
}

export const americanRailsBoard = buildBoard(specs);

// Exported for the verification checklist and for UI layout.
export const CITY_LIST = Object.entries(CITY_AT).map(([id, c]) => ({
  id,
  name: c.name,
  full: c.full,
  shared: c.shared,
  hub: HUBS.has(c.name),
  special: c.name === 'Chicago' || c.name === 'New York' || c.name === 'Atlanta',
}));
