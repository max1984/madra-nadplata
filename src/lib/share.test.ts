import { describe, it, expect } from 'vitest';
import { canUseNativeShare } from './share';

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
