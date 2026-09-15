import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeGetItem, safeSetItem, safeRemoveItem } from './safeStorage';

class FakeStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

describe('safeStorage', () => {
  let fake: FakeStorage;

  beforeEach(() => {
    fake = new FakeStorage();
    vi.stubGlobal('localStorage', fake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads and writes through to localStorage when it works normally', () => {
    safeSetItem('k', 'v');
    expect(safeGetItem('k')).toBe('v');
    safeRemoveItem('k');
    expect(safeGetItem('k')).toBeNull();
  });

  it('returns null instead of throwing when localStorage.getItem is blocked', () => {
    vi.spyOn(fake, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage blocked');
    });
    expect(() => safeGetItem('k')).not.toThrow();
    expect(safeGetItem('k')).toBeNull();
  });

  it('does not throw when localStorage.setItem is blocked (e.g. private browsing quota)', () => {
    vi.spyOn(fake, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => safeSetItem('k', 'v')).not.toThrow();
  });

  it('does not throw when localStorage.removeItem is blocked', () => {
    vi.spyOn(fake, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError: storage blocked');
    });
    expect(() => safeRemoveItem('k')).not.toThrow();
  });
});
