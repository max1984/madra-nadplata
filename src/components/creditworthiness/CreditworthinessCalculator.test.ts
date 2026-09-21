import { describe, it, expect } from 'vitest';
import { buildMortgageLinkHref, formatCreditworthinessSummaryText } from './CreditworthinessCalculator';
import { t as translate } from '../../lib/i18n';
import { fmt, fmtC } from '../../lib/format';
import type { CreditworthinessResult } from '../../lib/creditworthiness';

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

describe('formatCreditworthinessSummaryText', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('pl', key);
  const fmtPl = (n: number, dec?: number) => fmt(n, dec, 'pl');
  const fmtCPl = (n: number, dec?: number) => fmtC(n, 'pl', dec);
  const url = 'https://nadplata.org/zdolnosc-kredytowa.html?netIncome=8000';

  const cs: CreditworthinessResult = {
    recognizedIncome: 8000,
    householdCost: 1800,
    otherCommitments: 0,
    disposableIncome: 6200,
    dstiThreshold: 0.5,
    maxInstallmentByDsti: 4000,
    maxInstallment: 4000,
    bufferPercent: 2.5,
    effectiveAnnualRatePercent: 9.5,
    maxLoanAmount: 457_800,
  };

  it('includes the max loan amount, recognized income, max installment, DSTI threshold and the given url', () => {
    const text = formatCreditworthinessSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).toContain(fmtCPl(457_800));
    expect(text).toContain(fmtCPl(8000));
    expect(text).toContain(fmtCPl(4000));
    expect(text).toContain('50');
    expect(text).toContain(url);
  });

  it('formats the DSTI threshold as a whole percentage, not a fraction', () => {
    const text = formatCreditworthinessSummaryText(cs, t, fmtPl, fmtCPl, url);
    expect(text).not.toContain('0.5%');
    expect(text).not.toContain('0,5%');
  });
});
