import { describe, it, expect } from 'vitest';
import { COMPANIES, COMPANY_IDS, CompanyId, ACTION_ROWS, TOTAL_DEV_MARKERS } from './types';

describe('company constants', () => {
  it('has six companies', () => {
    expect(COMPANY_IDS).toHaveLength(6);
  });

  it('total cubes = 144 and total shares = 21', () => {
    const cubes = COMPANY_IDS.reduce((s, id) => s + COMPANIES[id].cubes, 0);
    const shares = COMPANY_IDS.reduce((s, id) => s + COMPANIES[id].shares, 0);
    expect(cubes).toBe(144);
    expect(shares).toBe(21);
  });

  it('has the correct per-company counts from the rulebook', () => {
    const expected: Record<CompanyId, [number, number]> = {
      american: [31, 5],
      national: [29, 4],
      continental: [26, 3],
      majestic: [22, 4],
      liberty: [19, 2],
      republic: [17, 3],
    };
    for (const id of COMPANY_IDS) {
      expect([COMPANIES[id].cubes, COMPANIES[id].shares]).toEqual(expected[id]);
    }
  });

  it('there are 12 development markers', () => {
    expect(TOTAL_DEV_MARKERS).toBe(12);
  });

  it('the action track has seven action rows', () => {
    expect(ACTION_ROWS).toHaveLength(7);
    expect(ACTION_ROWS[0]).toBe('pass');
  });
});
