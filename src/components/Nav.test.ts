import { describe, it, expect } from 'vitest';
import { shouldCloseMobileNav, shouldCloseOnOutsidePointer } from './Nav';

describe('shouldCloseMobileNav', () => {
  it('keeps the mobile menu state untouched at and below the 700px breakpoint', () => {
    expect(shouldCloseMobileNav(700)).toBe(false);
    expect(shouldCloseMobileNav(375)).toBe(false);
  });

  it(
    'regression: closes the mobile menu once the viewport crosses the 700px breakpoint — ' +
      'the mobile menu media query in index.css only positions/shows .nav-links.mobile-open ' +
      'below 700px, so a menu left open from a phone (e.g. after a resize or orientation change ' +
      'to a wider viewport) used to fall back to the base .nav-links{display:flex} rule and render ' +
      'as a second, duplicated row of links instead of disappearing with the hamburger',
    () => {
      expect(shouldCloseMobileNav(701)).toBe(true);
      expect(shouldCloseMobileNav(1280)).toBe(true);
    },
  );
});

describe('shouldCloseOnOutsidePointer', () => {
  it(
    'regression: the mobile panel renders as a sibling of <nav>, not a descendant — ' +
      'closing on outside pointerdown must check both refs, not just the nav bar',
    () => {
      expect(shouldCloseOnOutsidePointer(false, false)).toBe(true);
      expect(shouldCloseOnOutsidePointer(true, false)).toBe(false);
      expect(shouldCloseOnOutsidePointer(false, true)).toBe(false);
      expect(shouldCloseOnOutsidePointer(true, true)).toBe(false);
    },
  );
});
