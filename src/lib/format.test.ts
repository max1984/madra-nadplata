import { describe, it, expect } from 'vitest';
import { fmt, fmtC, parseLocaleNumber } from './format';

describe('fmt', () => {
  it('clamps negative and non-finite numbers to 0', () => {
    expect(fmt(-5)).toBe('0');
    expect(fmt(NaN)).toBe('0');
    expect(fmt(Infinity)).toBe('0');
  });

  it('formats with Polish grouping by default', () => {
    expect(fmt(300000)).toBe('300 000');
  });
});

describe('fmtC', () => {
  it('suffixes Polish amounts with zł', () => {
    expect(fmtC(300000, 'pl')).toBe('300 000 zł');
  });

  it('suffixes English amounts with PLN, not a dollar sign — the loan is always in złoty', () => {
    expect(fmtC(300000, 'en')).toBe('300,000 PLN');
    expect(fmtC(300000, 'en')).not.toContain('$');
  });
});

describe('parseLocaleNumber', () => {
  it('parses a plain dot-decimal string', () => {
    expect(parseLocaleNumber('7.5')).toBe(7.5);
  });

  it('regression: accepts a comma decimal separator, the Polish keyboard/convention default previously truncated by parseFloat to the integer part', () => {
    expect(parseLocaleNumber('7,5')).toBe(7.5);
  });

  it('returns NaN for garbage, same as parseFloat', () => {
    expect(parseLocaleNumber('abc')).toBeNaN();
  });
});
