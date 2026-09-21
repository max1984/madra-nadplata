import { describe, it, expect } from 'vitest';
import { fillAnnualValuesFromAmount } from './SalaryCalculator';

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
