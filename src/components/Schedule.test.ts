import { describe, it, expect } from 'vitest';
import { csvDec } from './Schedule';

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
