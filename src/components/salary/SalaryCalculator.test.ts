import { describe, it, expect } from 'vitest';
import { fillAnnualValuesFromAmount, formatSalarySummaryText } from './SalaryCalculator';
import type { SalaryState } from '../../hooks/useSalaryCalculator';

const fmtC = (n: number) => `${n.toFixed(0)} zł`;
const templates: Record<string, string> = {
  salary_share_summary_text_single: 'Netto: {net} (podatek {tax}). {url}',
  salary_share_summary_text_annual: 'Netto roczne: {totalNet} (podatek {totalTax}). {url}',
};
const t = (key: string) => templates[key] ?? key;

describe('fillAnnualValuesFromAmount', () => {
  it('regression: copies the currently entered single-month amount to all 12 months when annual mode is enabled — it used to keep the previous/default annualMonthlyValues (e.g. 6000 zł) instead of the amount the user just typed', () => {
    expect(fillAnnualValuesFromAmount(10000)).toEqual(Array(12).fill(10000));
    expect(fillAnnualValuesFromAmount(10000)).toHaveLength(12);
  });

  it('handles zero', () => {
    expect(fillAnnualValuesFromAmount(0)).toEqual(Array(12).fill(0));
  });

  it('falls back to 0 for negative or non-finite input instead of propagating NaN into all 12 fields', () => {
    expect(fillAnnualValuesFromAmount(-50)).toEqual(Array(12).fill(0));
    expect(fillAnnualValuesFromAmount(NaN)).toEqual(Array(12).fill(0));
    expect(fillAnnualValuesFromAmount(Infinity)).toEqual(Array(12).fill(0));
  });
});

describe('formatSalarySummaryText', () => {
  it(
    'regression: builds a "copy result" summary text for single-month mode — mortgage and creditworthiness ' +
      'calculators already had a copy-summary feature, salary had none at all',
    () => {
      const state = {
        mode: 'single',
        contractType: 'employment',
        result: { net: 5000, tax: 800 },
        jointTaxation: null,
      } as unknown as SalaryState;
      const text = formatSalarySummaryText(state, t, fmtC, 'https://example.com');
      expect(text).toBe('Netto: 5000 zł (podatek 800 zł). https://example.com');
    }
  );

  it('uses the annual-totals template (totalNet/totalTax) for annual mode, not the single-month one', () => {
    const state = {
      mode: 'annual',
      contractType: 'employment',
      result: { totalNet: 60000, totalTax: 9600 },
      jointTaxation: null,
    } as unknown as SalaryState;
    const text = formatSalarySummaryText(state, t, fmtC, 'https://example.com');
    expect(text).toBe('Netto roczne: 60000 zł (podatek 9600 zł). https://example.com');
  });
});
