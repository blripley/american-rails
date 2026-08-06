import { describe, it, expect } from 'vitest';
import { americanRailsBoard, CITY_LIST } from './americanRails';
import { neighbors } from './board';

describe('American Rails board', () => {
  it('contains the five hub cities as non-developable', () => {
    const hubs = ['New York', 'Baltimore', 'Philadelphia', 'Boston', 'Chicago'];
    for (const name of hubs) {
      const hex = Object.values(americanRailsBoard.hexes).find((h) => h.city?.name === name);
      expect(hex, name).toBeDefined();
      expect(hex!.city!.developable).toBe(false);
    }
  });

  it('contains the three special-connection cities', () => {
    const specials = ['Chicago', 'New York', 'Atlanta'];
    for (const name of specials) {
      expect(CITY_LIST.some((c) => c.name === name && c.special)).toBe(true);
    }
  });

  it('New York reads 8/5', () => {
    const nyc = Object.values(americanRailsBoard.hexes).find((h) => h.city?.name === 'New York')!;
    expect([nyc.city!.full, nyc.city!.shared]).toEqual([8, 5]);
  });

  it('is a single connected landmass (every hex reachable from any hex)', () => {
    const ids = Object.keys(americanRailsBoard.hexes);
    const seen = new Set<string>([ids[0]!]);
    const queue = [ids[0]!];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const nb of neighbors(americanRailsBoard, cur)) {
        if (!seen.has(nb)) {
          seen.add(nb);
          queue.push(nb);
        }
      }
    }
    expect(seen.size).toBe(ids.length);
  });

  it('has around forty cities', () => {
    expect(CITY_LIST.length).toBeGreaterThanOrEqual(35);
  });
});
