import { describe, it, expect } from 'vitest';
import { fmt, fmtC, parseLocaleNumber, fmtMonthYear, fmtSignedC, csvDec, parseISODateLocal, csvFilename } from './format';

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

describe('fmtSignedC', () => {
  it('prefixes a positive difference with a plus sign', () => {
    expect(fmtSignedC(12340, 'pl')).toBe('+12 340 zł');
  });

  it('regression: shows a real minus sign and the actual magnitude for a negative difference — fmtC alone clamps negative numbers to 0, which silently hid a favorable (negative) difference as "0 zł"', () => {
    expect(fmtSignedC(-8500, 'pl')).toBe('-8500 zł');
    expect(fmtSignedC(-8500, 'pl')).not.toMatch(/^0/);
  });

  it('shows no sign for exactly zero', () => {
    expect(fmtSignedC(0, 'pl')).toBe('0 zł');
  });

  it('works for the English locale too', () => {
    expect(fmtSignedC(-1000, 'en')).toBe('-1,000 PLN');
  });
});

describe('fmtMonthYear', () => {
  it('formats a Polish month name and year', () => {
    const result = fmtMonthYear(new Date(2044, 11, 1), 'pl');
    expect(result.toLowerCase()).toContain('grudzień');
    expect(result).toContain('2044');
  });

  it('formats an English month name and year', () => {
    const result = fmtMonthYear(new Date(2044, 11, 1), 'en');
    expect(result).toContain('December');
    expect(result).toContain('2044');
  });
});

describe('parseISODateLocal', () => {
  it('builds a Date from the local year/month/day, matching the ISO string with no shift', () => {
    const d = parseISODateLocal('2026-03-01');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(1);
  });

  it('regression: does not roll back a day for callers in timezones west of UTC — new Date("YYYY-MM-DD") parses as UTC midnight, which local-timezone getters (and thus fmtMonthYear) can read as the previous day; this constructs the Date from local components instead, exactly like mortgage.ts payoffDate() already does', () => {
    const utcParsed = new Date('2026-03-01');
    const localParsed = parseISODateLocal('2026-03-01');
    expect(localParsed.getDate()).toBe(1);
    expect(localParsed.getMonth()).toBe(2);
    // The UTC-parsed variant only reads back as March 1st for callers whose
    // local offset is >= 0 (at or east of UTC, e.g. Poland). Local-safe
    // parsing must hold everywhere, which is exactly what distinguishes it.
    if (utcParsed.getTimezoneOffset() > 0) {
      expect(utcParsed.getDate()).not.toBe(1);
    }
  });
});

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

describe('csvFilename', () => {
  it(
    'regression: shared with every CSV export in the project (mortgage schedule, salary annual schedule) — ' +
      'extracted from Schedule.tsx so a future export does not duplicate this date-formatting logic',
    () => {
      expect(csvFilename('harmonogram', new Date(2026, 8, 21))).toBe('harmonogram-2026-09-21.csv');
      expect(csvFilename('rozliczenie-roczne', new Date(2026, 0, 5))).toBe('rozliczenie-roczne-2026-01-05.csv');
    }
  );
});
