import { describe, it, expect } from 'vitest';
import { canUseNativeShare, overpayPresets } from './Calculator';

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
