import { describe, it, expect } from 'vitest';
import { csvDec } from './Schedule';

describe('csvDec', () => {
  it('formats with a comma decimal separator to match the ";" CSV column separator', () => {
    expect(csvDec(1234.5)).toBe('1234,50');
    expect(csvDec(0)).toBe('0,00');
  });

  it('never produces a "." that would clash with a period-based number parser', () => {
    expect(csvDec(999.99)).not.toContain('.');
  });
});
