import { describe, it, expect } from 'vitest';
import { clampJumpMonth, parseJumpMonth, buildJumpUrl } from './Schedule';

describe('clampJumpMonth', () => {
  it('passes a valid in-range month through unchanged', () => {
    expect(clampJumpMonth(24, 360)).toBe(24);
  });

  it('clamps a value below 1 up to 1', () => {
    expect(clampJumpMonth(0, 360)).toBe(1);
    expect(clampJumpMonth(-5, 360)).toBe(1);
  });

  it('regression: clamps a value beyond the actual schedule length instead of pointing at a row that does not exist in the DOM — a loan can pay off early, so the table can be shorter than the nominal loan term', () => {
    expect(clampJumpMonth(300, 180)).toBe(180);
  });

  it('rounds a fractional input to the nearest whole month', () => {
    expect(clampJumpMonth(12.7, 360)).toBe(13);
  });

  it('falls back to 1 for a non-finite input (e.g. an empty or non-numeric field parsed to NaN)', () => {
    expect(clampJumpMonth(NaN, 360)).toBe(1);
  });
});

describe('parseJumpMonth', () => {
  it('reads a valid ?jump= param', () => {
    expect(parseJumpMonth('?amount=300000&jump=120')).toBe(120);
  });

  it('returns null when the param is absent', () => {
    expect(parseJumpMonth('?amount=300000')).toBeNull();
  });

  it('regression: returns null instead of NaN for a garbage or non-positive value — a caller must not try to scroll to a NaN-th or negative row', () => {
    expect(parseJumpMonth('?jump=abc')).toBeNull();
    expect(parseJumpMonth('?jump=0')).toBeNull();
    expect(parseJumpMonth('?jump=-5')).toBeNull();
  });

  it('rounds a fractional value', () => {
    expect(parseJumpMonth('?jump=12.9')).toBe(13);
  });
});

describe('buildJumpUrl', () => {
  it('adds a ?jump= param and the #schedule hash to a URL that has none yet', () => {
    const result = buildJumpUrl('https://nadplata.org/?amount=300000', 84);
    expect(result).toBe('https://nadplata.org/?amount=300000&jump=84#schedule');
  });

  it('regression: overwrites a pre-existing ?jump= instead of appending a duplicate param — re-sharing a link for a different month must not accumulate stale jump values', () => {
    const result = buildJumpUrl('https://nadplata.org/?amount=300000&jump=12#schedule', 200);
    const params = new URL(result).searchParams;
    expect(params.getAll('jump')).toEqual(['200']);
  });

  it('preserves the other loan query params untouched', () => {
    const result = buildJumpUrl('https://nadplata.org/?amount=300000&rate=6.5', 10);
    const params = new URL(result).searchParams;
    expect(params.get('amount')).toBe('300000');
    expect(params.get('rate')).toBe('6.5');
  });
});
