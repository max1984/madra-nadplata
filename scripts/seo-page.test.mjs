import { describe, it, expect } from 'vitest';
import { page } from './seo-page.mjs';

describe('page footer', () => {
  const html = page({
    slug: 'test',
    title: 'Test',
    description: 'Test',
    keywords: 'test',
    body: '<p>body</p>',
    jsonLd: {},
  });

  it(
    'regression: links to the salary and creditworthiness calculators — these 18 statically ' +
      'generated SEO pages are Google\'s main entry point into the site, but until now their footer ' +
      'only linked back to the mortgage calculator, so a visitor landing on one of them (and Google ' +
      'itself) had no path to the newer tools that Nav.tsx/Footer.tsx already link to from the homepage',
    () => {
      expect(html).toContain('href="/wynagrodzenia.html"');
      expect(html).toContain('href="/zdolnosc-kredytowa.html"');
    }
  );

  it('still links back to the mortgage calculator and FAQ, unchanged', () => {
    expect(html).toContain('href="/#calculator"');
    expect(html).toContain('href="/#faq"');
  });
});
