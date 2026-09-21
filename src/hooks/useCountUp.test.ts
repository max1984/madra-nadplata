import { describe, it, expect } from 'vitest';
import { countUpValue } from './useCountUp';

describe('countUpValue', () => {
  it('returns the start value at progress 0', () => {
    expect(countUpValue(0, 100, 0)).toBe(0);
    expect(countUpValue(50, 200, 0)).toBe(50);
  });

  it('returns the end value at progress 1', () => {
    expect(countUpValue(0, 100, 1)).toBe(100);
    expect(countUpValue(50, 200, 1)).toBe(200);
  });

  it('interpolates linearly in between', () => {
    expect(countUpValue(0, 100, 0.5)).toBe(50);
    expect(countUpValue(100, 0, 0.25)).toBe(75);
  });

  it('is monotonic between from and to for increasing progress', () => {
    const values = [0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => countUpValue(10, 210, p));
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]!);
  });

  it('regression: clamps progress outside [0,1] instead of overshooting the target', () => {
    expect(countUpValue(0, 100, 1.2)).toBe(100);
    expect(countUpValue(0, 100, -0.5)).toBe(0);
  });
});
