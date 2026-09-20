import { describe, it, expect } from 'vitest';
import { canUseNativeShare, overpayPresets, formatCalcAnnouncement, isCalculateShortcut, formatResultsSummaryText } from './Calculator';
import { t as translate } from '../lib/i18n';
import { fmt, fmtC } from '../lib/format';
import type { ScheduleRow } from '../lib/mortgage';

function makeRow(cumInterest: number): ScheduleRow {
  return {
    num: 1, balanceBefore: 0, totalPayment: 0, capital: 0, regularCap: 0,
    interest: 0, overpay: 0, fee: 0, balanceAfter: 0, cumInterest, annualRate: 0,
  };
}

describe('canUseNativeShare', () => {
  it('is true when navigator.share is a function', () => {
    expect(canUseNativeShare({ share: () => Promise.resolve() })).toBe(true);
  });

  it('is false when navigator has no share method — most desktop browsers', () => {
    expect(canUseNativeShare({})).toBe(false);
  });

  it('is false when navigator itself is unavailable (e.g. SSR/build-time)', () => {
    expect(canUseNativeShare(undefined)).toBe(false);
    expect(canUseNativeShare(null)).toBe(false);
  });

  it('is false when share exists but is not callable (defensive against a broken polyfill)', () => {
    expect(canUseNativeShare({ share: 'not a function' })).toBe(false);
  });
});

describe('overpayPresets', () => {
  it('scales with the standard payment — a bigger loan gets bigger preset suggestions', () => {
    const small = overpayPresets(1000);
    const big = overpayPresets(5000);
    for (let i = 0; i < 3; i++) expect(big[i]).toBeGreaterThan(small[i]!);
  });

  it('returns three ascending amounts (10%, 25%, 50% of the standard payment)', () => {
    const presets = overpayPresets(1798.65);
    expect(presets).toHaveLength(3);
    expect(presets[0]!).toBeLessThan(presets[1]!);
    expect(presets[1]!).toBeLessThan(presets[2]!);
  });

  it('rounds every preset to a full 50 zł, never a jarring number like 173', () => {
    for (const v of overpayPresets(1234.56)) expect(v % 50).toBe(0);
  });

  it('regression: never suggests less than 50 zł, even for a tiny standard payment where 10%/25% would round to 0', () => {
    for (const v of overpayPresets(100)) expect(v).toBeGreaterThanOrEqual(50);
  });
});

describe('formatCalcAnnouncement', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);
  const fmt = (n: number) => fmtC(n, 'pl');

  it('regression: announces something for a screen-reader user after a successful calculation — validation errors already used role="alert", but a successful result had no aria-live equivalent at all', () => {
    const cs = { rows: [makeRow(1000), makeRow(2000), makeRow(3500)] };
    const msg = formatCalcAnnouncement(cs, t, fmt);
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toContain('3');
  });

  it('reflects the row count and the final cumulative interest', () => {
    const cs = { rows: [makeRow(100), makeRow(250)] };
    const msg = formatCalcAnnouncement(cs, t, fmt);
    expect(msg).toContain('2');
    expect(msg).toContain(fmt(250));
  });

  it('does not throw for an empty schedule', () => {
    expect(() => formatCalcAnnouncement({ rows: [] }, t, fmt)).not.toThrow();
  });
});

describe('isCalculateShortcut', () => {
  it('is true for Ctrl+Enter and Cmd+Enter (Windows/Linux vs. Mac)', () => {
    expect(isCalculateShortcut({ key: 'Enter', ctrlKey: true, metaKey: false })).toBe(true);
    expect(isCalculateShortcut({ key: 'Enter', ctrlKey: false, metaKey: true })).toBe(true);
  });

  it('regression: plain Enter (no modifier) is not the shortcut — that key is already used per-field to commit/blur a single input, and must keep doing only that', () => {
    expect(isCalculateShortcut({ key: 'Enter', ctrlKey: false, metaKey: false })).toBe(false);
  });

  it('is false for Ctrl/Cmd with a different key', () => {
    expect(isCalculateShortcut({ key: 'a', ctrlKey: true, metaKey: false })).toBe(false);
  });
});

describe('formatResultsSummaryText', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);
  const fmtPl = (n: number, dec?: number) => fmt(n, dec, 'pl');
  const fmtCPl = (n: number, dec?: number) => fmtC(n, 'pl', dec);
  const url = 'https://nadplata.org/?amount=300000';

  const cs = {
    P: 300000, r: 0.06 / 12, months: 360,
    rows: [makeRow(1000), makeRow(2000), makeRow(3000)],
    baseMonths: 360, baseInterest: 300000,
  };

  it('includes the loan amount, rate and the given url — this is meant to be pasted as-is into a chat message', () => {
    const text = formatResultsSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).toContain(fmtPl(300000));
    expect(text).toContain('6');
    expect(text).toContain(url);
  });

  it('reflects the actual applied schedule length, not the nominal loan term', () => {
    const text = formatResultsSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).toContain('3'); // withMonths = rows.length = 3
    expect(text).toContain('360'); // months = nominal term
  });

  it('does not throw and has no leftover {placeholder} tokens for a normal calculation', () => {
    const text = formatResultsSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).not.toMatch(/\{[a-zA-Z]+\}/);
  });
});
