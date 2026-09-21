import { describe, it, expect } from 'vitest';
import { barSegments, comparisonBars } from './resultBars';

describe('barSegments', () => {
  it('sums to exactly 100 regardless of rounding of individual parts', () => {
    const segments = barSegments(10000, { a: 1234.56, b: 2345.67, c: 3456.78, net: 2963 });
    const sum = segments.reduce((s, x) => s + x.pct, 0);
    expect(sum).toBe(100);
  });

  it('drops zero/negative parts instead of rendering an empty segment', () => {
    const segments = barSegments(1000, { a: 500, b: 0, c: -10, net: 500 });
    expect(segments.map((s) => s.key)).toEqual(['a', 'net']);
  });

  it('returns an empty array for a non-positive base (avoids NaN/Infinity percentages)', () => {
    expect(barSegments(0, { a: 100 })).toEqual([]);
    expect(barSegments(-100, { a: 100 })).toEqual([]);
  });

  it('every segment has a non-negative percentage', () => {
    const segments = barSegments(5000, { a: 100, b: 200, net: 4700 });
    for (const s of segments) expect(s.pct).toBeGreaterThanOrEqual(0);
  });
});

describe('comparisonBars', () => {
  it('scales every value relative to the largest one (100% for the max)', () => {
    const bars = comparisonBars({ a: 50, b: 100, c: 25 });
    expect(bars.find((b) => b.key === 'b')!.pct).toBe(100);
    expect(bars.find((b) => b.key === 'a')!.pct).toBe(50);
    expect(bars.find((b) => b.key === 'c')!.pct).toBe(25);
  });

  it('clamps negative values to 0 instead of producing a negative bar', () => {
    const bars = comparisonBars({ a: -50, b: 100 });
    expect(bars.find((b) => b.key === 'a')!.amount).toBe(0);
    expect(bars.find((b) => b.key === 'a')!.pct).toBe(0);
  });

  it('returns all-zero percentages when every value is zero (no division by zero)', () => {
    const bars = comparisonBars({ a: 0, b: 0 });
    for (const b of bars) expect(b.pct).toBe(0);
  });
});
