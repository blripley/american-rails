import { describe, it, expect } from 'vitest';
import { makeRng, pick } from './rng';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces different streams for different seeds', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a()).not.toBe(b());
  });

  it('pick chooses deterministically from an array', () => {
    expect(pick(makeRng(1), ['x', 'y', 'z'])).toBe(pick(makeRng(1), ['x', 'y', 'z']));
  });

  it('pick stays within array bounds', () => {
    const rng = makeRng(99);
    const arr = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(pick(rng, arr));
    }
  });
});
