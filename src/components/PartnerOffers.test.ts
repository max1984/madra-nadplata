import { describe, it, expect } from 'vitest';
import { hasEnoughRemainingTermForRefi } from './PartnerOffers';
import type { ScheduleRow } from '../lib/mortgage';

const rowsOfLength = (n: number): ScheduleRow[] => Array.from({ length: n }, () => ({} as ScheduleRow));

describe('hasEnoughRemainingTermForRefi', () => {
  it('rejects a loan that is about to be paid off under the current overpay strategy, regardless of its original term', () => {
    // Kredyt wzięty na 30 lat (nominalnie calcState.months=360), ale agresywna
    // nadpłata kończy go w 20 miesięcy — refinansowanie się nie opłaca.
    expect(hasEnoughRemainingTermForRefi({ rows: rowsOfLength(20) })).toBe(false);
  });

  it('accepts a loan with enough actual remaining term', () => {
    expect(hasEnoughRemainingTermForRefi({ rows: rowsOfLength(60) })).toBe(true);
    expect(hasEnoughRemainingTermForRefi({ rows: rowsOfLength(300) })).toBe(true);
  });

  it('rejects one month short of the threshold', () => {
    expect(hasEnoughRemainingTermForRefi({ rows: rowsOfLength(59) })).toBe(false);
  });
});
