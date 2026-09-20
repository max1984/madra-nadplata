import { describe, it, expect } from 'vitest';
import { clampJumpMonth } from './Schedule';

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
