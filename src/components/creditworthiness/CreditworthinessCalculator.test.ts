import { describe, it, expect } from 'vitest';
import { buildMortgageLinkHref } from './CreditworthinessCalculator';

describe('buildMortgageLinkHref', () => {
  it('rounds the loan amount and passes it as ?amount=, matching parseUrlInputs in useCalculator.ts', () => {
    expect(buildMortgageLinkHref(457_800)).toBe('/?amount=457800#calculator');
  });

  it('rounds a non-integer amount to the nearest zloty', () => {
    expect(buildMortgageLinkHref(457_748.6)).toBe('/?amount=457749#calculator');
  });

  it('handles zero without producing a malformed link', () => {
    expect(buildMortgageLinkHref(0)).toBe('/?amount=0#calculator');
  });
});
