import { describe, it, expect } from 'vitest';
import { neighbors, isCity, connectedCities, cityInfo } from './board';
import { testBoard } from './testBoard';
import { HexState } from '../types';

function hex(cubes: string[]): HexState {
  return { cubes: cubes as any, developed: false };
}

describe('board helpers', () => {
  it('neighbors are symmetric in the test board', () => {
    expect(neighbors(testBoard, 'plains1')).toContain('NYC');
    expect(neighbors(testBoard, 'NYC')).toContain('plains1');
  });

  it('isCity distinguishes cities from land hexes', () => {
    expect(isCity(testBoard, 'NYC')).toBe(true);
    expect(isCity(testBoard, 'plains1')).toBe(false);
  });

  it('cityInfo returns names and values', () => {
    expect(cityInfo(testBoard, 'ATL')).toMatchObject({ name: 'Atlanta', full: 5, shared: 3, developable: true });
  });

  it('connectedCities follows a company cube chain', () => {
    const hexes: Record<string, HexState> = {
      NYC: hex(['republic']),
      plains1: hex(['republic']),
    };
    expect(connectedCities(testBoard, hexes, 'republic')).toEqual(new Set(['New York']));
  });

  it('connectedCities does not cross another company cubes', () => {
    const hexes: Record<string, HexState> = {
      NYC: hex(['republic']),
      plains1: hex(['liberty']), // gap: not republic
      ATL: hex(['republic']),
    };
    // republic in NYC is isolated from republic in ATL (plains1 is liberty only)
    expect(connectedCities(testBoard, hexes, 'republic')).toEqual(new Set(['New York', 'Atlanta']));
    // both are still reported because each is itself a city hex the company sits on
  });

  it('throws on an unknown hex', () => {
    expect(() => neighbors(testBoard, 'nowhere')).toThrow();
  });
});
