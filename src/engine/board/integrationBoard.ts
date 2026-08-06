import { BoardDef } from './boardTypes';

// A linear 6-city board used by the full-game integration test. Six cities
// (enough starting cities for all six companies) joined by plains, with a couple
// of forest/mountain hexes to exercise terrain costs. Includes the three special
// cities (Chicago, New York, Atlanta) so connection bonuses can occur.
//
// CHI - a1 - DET - a2 - NYC - a3 - PIT - a4 - ATL - a5 - STL
//                          |
//                        f1 - m1
export const integrationBoard: BoardDef = {
  hexes: {
    CHI: { terrain: 'city', city: { name: 'Chicago', full: 4, shared: 2, developable: false }, adjacent: ['a1'] },
    a1: { terrain: 'plains', adjacent: ['CHI', 'DET'] },
    DET: { terrain: 'city', city: { name: 'Detroit', full: 3, shared: 2, developable: true }, adjacent: ['a1', 'a2'] },
    a2: { terrain: 'plains', adjacent: ['DET', 'NYC'] },
    NYC: { terrain: 'city', city: { name: 'New York', full: 8, shared: 5, developable: false }, adjacent: ['a2', 'a3', 'f1'] },
    a3: { terrain: 'plains', adjacent: ['NYC', 'PIT'] },
    PIT: { terrain: 'city', city: { name: 'Pittsburgh', full: 5, shared: 3, developable: true }, adjacent: ['a3', 'a4'] },
    a4: { terrain: 'plains', adjacent: ['PIT', 'ATL'] },
    ATL: { terrain: 'city', city: { name: 'Atlanta', full: 5, shared: 3, developable: true }, adjacent: ['a4', 'a5'] },
    a5: { terrain: 'plains', adjacent: ['ATL', 'STL'] },
    STL: { terrain: 'city', city: { name: 'St. Louis', full: 3, shared: 2, developable: true }, adjacent: ['a5'] },
    f1: { terrain: 'forest', adjacent: ['NYC', 'm1'] },
    m1: { terrain: 'mountain', adjacent: ['f1'] },
  },
};
