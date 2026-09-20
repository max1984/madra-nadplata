import { describe, it, expect } from 'vitest';
import { esc } from './seo-utils.mjs';

describe('esc', () => {
  it('escapes the basic HTML metacharacters', () => {
    expect(esc('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
  });

  it('regression: escapes " and \' — this string gets embedded inside double-quoted HTML attributes like content="...", so a literal double quote in a title/description would otherwise close the attribute early and let arbitrary HTML leak into <head>', () => {
    expect(esc('Kredyt "hipoteczny" – co warto wiedzieć')).not.toContain('"');
    expect(esc('Kredyt "hipoteczny"')).toBe('Kredyt &quot;hipoteczny&quot;');
    expect(esc("it's fine")).toBe('it&#39;s fine');
  });

  it('escapes & first so it does not double-escape the entities it just produced', () => {
    expect(esc('"')).toBe('&quot;');
    expect(esc('&quot;')).toBe('&amp;quot;');
  });
});
