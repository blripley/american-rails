import { BoardDef } from './boardTypes';

// A small, deliberately-shaped board used only by unit tests. Two cities plus
// one hex of each land terrain, wired with a known adjacency so tests can
// reason precisely about neighbours, costs, and connectivity.
//
//   NYC(8/5,hub) -- plains1 -- ATL(5/3,dev)
//                     |
//                  forest1 -- mtn1
//
export const testBoard: BoardDef = {
  hexes: {
    NYC: {
      terrain: 'city',
      city: { name: 'New York', full: 8, shared: 5, developable: false },
      adjacent: ['plains1'],
    },
    plains1: { terrain: 'plains', adjacent: ['NYC', 'forest1', 'ATL'] },
    forest1: { terrain: 'forest', adjacent: ['plains1', 'mtn1'] },
    mtn1: { terrain: 'mountain', adjacent: ['forest1'] },
    ATL: {
      terrain: 'city',
      city: { name: 'Atlanta', full: 5, shared: 3, developable: true },
      adjacent: ['plains1'],
    },
  },
};

// A second test board with all three special cities in a line, for testing
// special-connection bonuses.
//   CHI(4/2) -- p1 -- NYC2(8/5) -- p2 -- ATL2(5/3)
export const specialBoard: BoardDef = {
  hexes: {
    CHI: { terrain: 'city', city: { name: 'Chicago', full: 4, shared: 2, developable: false }, adjacent: ['p1'] },
    p1: { terrain: 'plains', adjacent: ['CHI', 'NYC2'] },
    NYC2: { terrain: 'city', city: { name: 'New York', full: 8, shared: 5, developable: false }, adjacent: ['p1', 'p2'] },
    p2: { terrain: 'plains', adjacent: ['NYC2', 'ATL2'] },
    ATL2: { terrain: 'city', city: { name: 'Atlanta', full: 5, shared: 3, developable: true }, adjacent: ['p2'] },
  },
};
