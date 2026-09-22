import { describe, it, expect } from 'vitest';
import { fillAnnualValuesFromAmount, formatSalarySummaryText, formatAnnualScheduleCsv, formatSalaryAnnouncement, earliestElevatedMonth } from './SalaryCalculator';
import type { SalaryState } from '../../hooks/useSalaryCalculator';

const fmtC = (n: number) => `${n.toFixed(0)} zł`;
const templates: Record<string, string> = {
  salary_share_summary_text_single: 'Netto: {net} (podatek {tax}). {url}',
  salary_share_summary_text_annual: 'Netto roczne: {totalNet} (podatek {totalTax}). {url}',
  salary_csv_col_month: 'Miesiąc',
  salary_csv_col_revenue: 'Przychód',
  salary_result_gross: 'Brutto',
  salary_result_tax: 'Podatek',
  salary_result_net: 'Na rękę',
  salary_announcement_single: 'Wyliczono: na rękę {net}, podatek {tax}.',
  salary_announcement_annual: 'Wyliczono rocznie: na rękę {totalNet}, podatek {totalTax}.',
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

describe('formatAnnualScheduleCsv', () => {
  it(
    'regression: builds a 12-row CSV from the annual schedule using grossMonthly — the annual chart shows only ' +
      'net pay per month with no way to read exact figures or paste them into a spreadsheet, unlike the mortgage ' +
      'schedule which has had CSV export for a while',
    () => {
      const state = {
        mode: 'annual',
        contractType: 'employment',
        result: {
          months: [
            { grossMonthly: 10000, tax: 800, net: 7500 },
            { grossMonthly: 12000, tax: 1000, net: 8900 },
          ],
        },
        jointTaxation: null,
      } as unknown as Extract<SalaryState, { mode: 'annual' }>;
      const csv = formatAnnualScheduleCsv(state, t, 'pl');
      const lines = csv.replace(/^﻿/, '').split('\n');
      expect(lines[0]).toBe('Miesiąc;Brutto;Podatek;Na rękę');
      expect(lines[1]).toBe('1;10000,00;800,00;7500,00');
      expect(lines[2]).toBe('2;12000,00;1000,00;8900,00');
    }
  );

  it('reads monthlyRevenue instead of grossMonthly for B2B months (B2BResult has no grossMonthly field), and uses the "Przychód" header instead of "Brutto"', () => {
    const state = {
      mode: 'annual',
      contractType: 'b2b',
      result: {
        months: [{ monthlyRevenue: 15000, tax: 1500, net: 11000 }],
      },
      jointTaxation: null,
    } as unknown as Extract<SalaryState, { mode: 'annual' }>;
    const csv = formatAnnualScheduleCsv(state, t, 'pl');
    const lines = csv.replace(/^﻿/, '').split('\n');
    expect(lines[0]).toBe('Miesiąc;Przychód;Podatek;Na rękę');
    expect(lines[1]).toBe('1;15000,00;1500,00;11000,00');
  });

  it('uses comma column separator and dot decimal separator for English locale, matching csvDec/Schedule.tsx conventions', () => {
    const state = {
      mode: 'annual',
      contractType: 'employment',
      result: { months: [{ grossMonthly: 10000, tax: 800, net: 7500 }] },
      jointTaxation: null,
    } as unknown as Extract<SalaryState, { mode: 'annual' }>;
    const csv = formatAnnualScheduleCsv(state, t, 'en');
    const lines = csv.replace(/^﻿/, '').split('\n');
    expect(lines[0]).toBe('Miesiąc,Brutto,Podatek,Na rękę');
    expect(lines[1]).toBe('1,10000.00,800.00,7500.00');
  });
});

describe('formatSalaryAnnouncement', () => {
  it(
    'regression: builds a short aria-live announcement for screen reader users after a successful calculation, ' +
      'single mode — the mortgage calculator had this (formatCalcAnnouncement) but salary had no equivalent',
    () => {
      const state = {
        mode: 'single',
        contractType: 'employment',
        result: { net: 5000, tax: 800 },
        jointTaxation: null,
      } as unknown as SalaryState;
      expect(formatSalaryAnnouncement(state, t, fmtC)).toBe('Wyliczono: na rękę 5000 zł, podatek 800 zł.');
    }
  );

  it('uses the annual-totals template for annual mode, not the single-month one', () => {
    const state = {
      mode: 'annual',
      contractType: 'employment',
      result: { totalNet: 60000, totalTax: 9600 },
      jointTaxation: null,
    } as unknown as SalaryState;
    expect(formatSalaryAnnouncement(state, t, fmtC)).toBe('Wyliczono rocznie: na rękę 60000 zł, podatek 9600 zł.');
  });
});

describe('earliestElevatedMonth', () => {
  const result = (over: Partial<{
    scaleThresholdCrossedMonth: number | null;
    zusLimitCrossedMonth: number | null;
    reliefLimitCrossedMonth: number | null;
    ryczaltHealthTierCrossedMonth: number | null;
    copyrightLimitCrossedMonth: number | null;
  }>) =>
    ({
      scaleThresholdCrossedMonth: null,
      zusLimitCrossedMonth: null,
      reliefLimitCrossedMonth: null,
      ryczaltHealthTierCrossedMonth: null,
      copyrightLimitCrossedMonth: null,
      ...over,
    }) as unknown as Extract<SalaryState, { mode: 'annual' }>['result'];

  it('returns null when none of the four thresholds were crossed', () => {
    expect(earliestElevatedMonth(result({}), false)).toBeNull();
  });

  it('returns the single threshold that was crossed', () => {
    expect(earliestElevatedMonth(result({ scaleThresholdCrossedMonth: 6 }), false)).toBe(6);
    expect(earliestElevatedMonth(result({ ryczaltHealthTierCrossedMonth: 9 }), false)).toBe(9);
  });

  it(
    'regression: returns the EARLIEST of several thresholds crossed in the same year, not just the scale ' +
      'threshold — an employment contract with a high copyright share can exhaust the 60 000 zł copyright ' +
      'limit before crossing the 120 000 zł scale threshold, and the chart must color bars from the earlier one',
    () => {
      expect(earliestElevatedMonth(result({ scaleThresholdCrossedMonth: 5, copyrightLimitCrossedMonth: 3 }), false)).toBe(3);
      expect(earliestElevatedMonth(result({ scaleThresholdCrossedMonth: 3, reliefLimitCrossedMonth: 7 }), false)).toBe(3);
      expect(earliestElevatedMonth(result({ copyrightLimitCrossedMonth: 8, reliefLimitCrossedMonth: 4 }), false)).toBe(4);
    }
  );

  it(
    'regression: scaleExcluded (flatRateDeclared) suppresses only the scale threshold, not the other three — ' +
      'exhausting the copyright/relief limit still raises taxableIncomeThisMonth even under a flat 12% withholding',
    () => {
      expect(earliestElevatedMonth(result({ scaleThresholdCrossedMonth: 2 }), true)).toBeNull();
      expect(earliestElevatedMonth(result({ scaleThresholdCrossedMonth: 2, reliefLimitCrossedMonth: 5 }), true)).toBe(5);
    }
  );

  it('zusLimitCrossedMonth is never included — it gets a border marker on the chart, not the fill color', () => {
    expect(earliestElevatedMonth(result({ zusLimitCrossedMonth: 1 }), false)).toBeNull();
  });
});
