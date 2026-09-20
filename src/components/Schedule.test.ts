import { describe, it, expect } from 'vitest';
import { csvDec, clampJumpMonth } from './Schedule';

describe('csvDec', () => {
  it('defaults to a comma decimal separator to match the ";" CSV column separator used for pl', () => {
    expect(csvDec(1234.5)).toBe('1234,50');
    expect(csvDec(0)).toBe('0,00');
  });

  it('never produces a "." for pl that would clash with a period-based number parser', () => {
    expect(csvDec(999.99)).not.toContain('.');
  });

  it('uses a period decimal separator for en — matches the "," column separator used for that export, avoiding two clashing regional conventions in one file', () => {
    expect(csvDec(1234.5, 'en')).toBe('1234.50');
    expect(csvDec(999.99, 'en')).not.toContain(',');
  });
});

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
