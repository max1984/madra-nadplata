import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement IntersectionObserver, which framer-motion's
// `whileInView` (used across the app for scroll-triggered animations)
// requires to even mount — without a stub, every render test touching a
// component with whileInView throws "IntersectionObserver is not defined"
// before any assertion runs. Only defined when `window` exists (jsdom
// test files), so it's a no-op for the node-environment test files.
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  // @ts-expect-error minimal stub, not a spec-complete IntersectionObserver
  window.IntersectionObserver = MockIntersectionObserver;
  // @ts-expect-error same stub for the global reference some libs check
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

// Node 22+/25 ships its OWN global `localStorage` (Web Storage API), gated
// behind the `--localstorage-file` CLI flag — without that flag every method
// on it throws "is not a function". Since Node defines this global BEFORE
// jsdom's environment is set up, `localStorage === window.localStorage`
// resolves to Node's broken native object, not jsdom's own (working)
// per-window implementation — confirmed by probing both in this exact test
// setup (2026-09-22): every localStorage call in every jsdom render test
// was silently hitting this broken stub. The app itself never crashes on
// this (safeGetItem/safeSetItem in src/lib/safeStorage.ts wrap every call
// in try/catch, by design — see that file's own comment), so no user-facing
// bug — but it meant no render test could ever verify real persistence
// round-trips through localStorage, only the defensive fallback path.
// A minimal in-memory Storage polyfill, installed as the global, fixes this
// for every jsdom test in the project at once.
if (typeof window !== 'undefined') {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length() { return this.store.size; }
    clear() { this.store.clear(); }
    getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
    key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
    removeItem(key: string) { this.store.delete(key); }
    setItem(key: string, value: string) { this.store.set(key, String(value)); }
  }
  const workingLocalStorage = new MemoryStorage();
  const workingSessionStorage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: workingLocalStorage, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: workingSessionStorage, configurable: true, writable: true });
  Object.defineProperty(window, 'localStorage', { value: workingLocalStorage, configurable: true, writable: true });
  Object.defineProperty(window, 'sessionStorage', { value: workingSessionStorage, configurable: true, writable: true });
}
