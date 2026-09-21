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
