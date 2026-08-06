import { describe, it, expect } from 'vitest';
import { buildBoard, neighborCoords, coordId, hexPixel } from './hexGrid';
import { neighbors } from './board';

describe('hex grid', () => {
  it('computes symmetric adjacency for a horizontal line of hexes', () => {
    const board = buildBoard({
      '0,0': { terrain: 'plains' },
      '1,0': { terrain: 'plains' },
      '2,0': { terrain: 'plains' },
    });
    expect(neighbors(board, '1,0')).toEqual(expect.arrayContaining(['0,0', '2,0']));
    expect(neighbors(board, '0,0')).toContain('1,0');
    expect(neighbors(board, '2,0')).toContain('1,0');
  });

  it('only includes neighbours that exist in the map', () => {
    const board = buildBoard({ '0,0': { terrain: 'plains' }, '1,0': { terrain: 'forest' } });
    // '0,0' has six theoretical neighbours but only '1,0' is present
    expect(neighbors(board, '0,0')).toEqual(['1,0']);
  });

  it('carries city info through to the board definition', () => {
    const board = buildBoard({
      '3,2': { terrain: 'city', city: { name: 'Test City', full: 5, shared: 3, developable: true } },
    });
    expect(board.hexes['3,2']!.city).toMatchObject({ name: 'Test City', full: 5 });
  });

  it('neighborCoords returns six directions', () => {
    expect(neighborCoords(2, 2)).toHaveLength(6);
  });

  it('odd columns are offset downward in pixel space', () => {
    const even = hexPixel(0, 0, 10);
    const odd = hexPixel(1, 0, 10);
    expect(odd.y).toBeGreaterThan(even.y); // odd column shifted down
    expect(odd.x).toBeGreaterThan(even.x); // and to the right
  });

  it('coordId round-trips', () => {
    expect(coordId(4, 7)).toBe('4,7');
  });
});
