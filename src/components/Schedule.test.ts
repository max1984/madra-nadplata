import { describe, it, expect } from 'vitest';
import { csvDec, totalAppliedOverpay } from './Schedule';
import { buildSchedule } from '../lib/mortgage';
import type { ScheduleRow } from '../lib/mortgage';

function makeRow(overpay: number): ScheduleRow {
  return {
    num: 1, balanceBefore: 0, totalPayment: 0, capital: 0, regularCap: 0,
    interest: 0, overpay, fee: 0, balanceAfter: 0, cumInterest: 0, annualRate: 0,
  };
}

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

describe('totalAppliedOverpay', () => {
  it('sums the overpay actually applied per row', () => {
    const rows = [makeRow(500), makeRow(500), makeRow(120)];
    expect(totalAppliedOverpay(rows)).toBe(1120);
  });

  it('returns 0 for an empty schedule', () => {
    expect(totalAppliedOverpay([])).toBe(0);
  });

  it('regression: matches the real applied total, not the raw flat overpay input that buildSchedule clamps on the payoff row — a 300k/6%/30yr loan with a flat 2000 zł/month overpay overstated "Łącznie nadpłacono" by over 1000 zł before this fix', () => {
    const P = 300000, r = 0.06 / 12, n = 360;
    const flatOverpay = Array<number>(n).fill(2000);
    const rows = buildSchedule(P, Array<number>(n).fill(r), n, 0, flatOverpay, r);

    const rawTotal = flatOverpay.slice(0, rows.length).reduce((a, b) => a + b, 0);
    const realTotal = totalAppliedOverpay(rows);

    expect(realTotal).toBeLessThan(rawTotal);
    // Every row's contribution must match what buildSchedule actually applied.
    expect(realTotal).toBe(rows.reduce((acc, row) => acc + row.overpay, 0));
  });
});
