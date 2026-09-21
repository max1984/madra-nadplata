import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const CSS_PATH = join(__dirname, '..', 'index.css');

function printBlockSelectors(): string[] {
  const css = readFileSync(CSS_PATH, 'utf-8');
  const printBlock = css.match(/@media print\s*{([\s\S]*?)\n}/)?.[1] ?? '';
  const hideRule = printBlock.match(/([^{]+){\s*display:\s*none\s*!important;\s*}/)?.[1] ?? '';
  return hideRule.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * @media print w index.css istnieje po to, żeby wydruk harmonogramu
 * ("zabierz do banku") pokazywał tylko wynik + harmonogram, chowając cały
 * marketing. #support i #bank-offers (SupportOptions/BankOffers) oraz
 * .partner-card (PartnerOffers) renderują się poza .calc-form (który sam w
 * sobie już jest ukryty) — bez wpisania ich osobno do tej listy wydruk
 * pokazywał oferty partnerskie i sekcję wsparcia zamiast czystego wyniku.
 */
describe('@media print stylesheet', () => {
  it('regression: hides marketing/affiliate sections rendered outside .calc-form — #support, #bank-offers and .partner-card are not descendants of .calc-form, so hiding only .calc-form left them visible on a "print for the bank" printout', () => {
    const selectors = printBlockSelectors();
    expect(selectors).toContain('#support');
    expect(selectors).toContain('#bank-offers');
    expect(selectors).toContain('.partner-card');
  });

  it('still hides everything already covered before this fix', () => {
    const selectors = printBlockSelectors();
    for (const s of ['nav', '.hero', '#how-it-works', '#example', '#faq', '.ad-slot', '.consent-banner', '.calc-form', 'footer']) {
      expect(selectors).toContain(s);
    }
  });
});
