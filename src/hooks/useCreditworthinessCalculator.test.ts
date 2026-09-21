import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateCreditworthinessInputs,
  buildCreditworthinessUrlParams,
  parseUrlCreditworthinessInputs,
  resolveInitialCreditworthinessInputs,
  saveCreditworthinessInputs,
  loadStoredCreditworthinessInputs,
  clearStoredCreditworthinessInputs,
  DEFAULT_CREDITWORTHINESS_INPUTS,
} from './useCreditworthinessCalculator';
import type { CreditworthinessInputs } from '../lib/creditworthiness';

class FakeStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
}

describe('validateCreditworthinessInputs', () => {
  it('accepts the defaults', () => {
    expect(validateCreditworthinessInputs(DEFAULT_CREDITWORTHINESS_INPUTS)).toBeNull();
  });

  it('rejects a zero or negative netIncome', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, netIncome: 0 })).toBe('error_cw_income');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, netIncome: -100 })).toBe('error_cw_income');
  });

  it('rejects a householdSize below 1', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, householdSize: 0 })).toBe('error_cw_household_size');
  });

  it(
    'regression: rejects a householdSize above 20 instead of silently accepting it — the form field ' +
      'clamps to 1-20 (CreditworthinessCalculator.tsx), but a hand-crafted URL/localStorage value like ' +
      '?household=999 used to pass validation and produce a misleadingly-zero result (astronomical ' +
      'household cost swallowing all income) instead of a clear error',
    () => {
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, householdSize: 21 })).toBe('error_cw_household_size');
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, householdSize: 20 })).toBeNull();
    }
  );

  it('rejects years outside 1-40', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, years: 0 })).toBe('error_cw_years');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, years: 41 })).toBe('error_cw_years');
  });

  it('rejects nominalRatePercent outside 0-30', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, nominalRatePercent: -1 })).toBe('error_cw_nominal_rate');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, nominalRatePercent: 31 })).toBe('error_cw_nominal_rate');
  });

  it('rejects an out-of-range incomeRecognitionRate only for non-employment contract types', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, contractType: 'employment', incomeRecognitionRate: 500 })).toBeNull();
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, contractType: 'b2b', incomeRecognitionRate: 500 })).toBe('error_cw_income_recognition');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, contractType: 'b2b', incomeRecognitionRate: 85 })).toBeNull();
  });

  it('rejects negative household cost / commitment fields', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, firstPersonCost: -1 })).toBe('error_cw_negative_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, additionalPersonCost: -1 })).toBe('error_cw_negative_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, existingLoanInstallments: -1 })).toBe('error_cw_negative_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, creditCardLimits: -1 })).toBe('error_cw_negative_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, alimony: -1 })).toBe('error_cw_negative_field');
  });
});

describe('buildCreditworthinessUrlParams / parseUrlCreditworthinessInputs — round trip', () => {
  it('round-trips all fields for an employment contract', () => {
    const inputs: CreditworthinessInputs = {
      ...DEFAULT_CREDITWORTHINESS_INPUTS,
      netIncome: 9500,
      contractType: 'employment',
      householdSize: 3,
      firstPersonCost: 2000,
      additionalPersonCost: 800,
      existingLoanInstallments: 500,
      creditCardLimits: 10000,
      alimony: 300,
      years: 30,
      nominalRatePercent: 7.5,
      rateType: 'variable',
    };
    const patch = parseUrlCreditworthinessInputs('?' + buildCreditworthinessUrlParams(inputs));
    expect(patch).toMatchObject({
      netIncome: 9500, contractType: 'employment', householdSize: 3,
      firstPersonCost: 2000, additionalPersonCost: 800, existingLoanInstallments: 500,
      creditCardLimits: 10000, alimony: 300, years: 30, nominalRatePercent: 7.5, rateType: 'variable',
    });
  });

  it('round-trips incomeRecognitionRate for a b2b contract', () => {
    const inputs: CreditworthinessInputs = { ...DEFAULT_CREDITWORTHINESS_INPUTS, contractType: 'b2b', incomeRecognitionRate: 85 };
    const patch = parseUrlCreditworthinessInputs('?' + buildCreditworthinessUrlParams(inputs));
    expect(patch.contractType).toBe('b2b');
    expect(patch.incomeRecognitionRate).toBe(85);
  });

  it(
    'regression: a link shared from the salary calculator only needs to carry netIncome (and optionally ' +
      'contractType) — other fields are left unset rather than forced to some value, so the rest of the ' +
      'form keeps its defaults/localStorage state instead of being silently reset',
    () => {
      const patch = parseUrlCreditworthinessInputs('?netIncome=6200');
      expect(patch).toEqual({ netIncome: 6200 });
    }
  );

  it('ignores garbage query values, leaving them unset rather than NaN', () => {
    const patch = parseUrlCreditworthinessInputs('?netIncome=abc&contractType=nonsense&rateType=bogus');
    expect(patch).toEqual({});
  });

  it('a completely empty search string produces a fully empty patch object', () => {
    expect(parseUrlCreditworthinessInputs('')).toEqual({});
  });
});

describe('resolveInitialCreditworthinessInputs', () => {
  it('returns defaults merged with a valid patch', () => {
    const result = resolveInitialCreditworthinessInputs({ netIncome: 12000 });
    expect(result).toEqual({ ...DEFAULT_CREDITWORTHINESS_INPUTS, netIncome: 12000 });
  });

  it('returns DEFAULT_CREDITWORTHINESS_INPUTS unchanged when there is no patch', () => {
    expect(resolveInitialCreditworthinessInputs(null)).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
  });

  it(
    'regression: falls back to DEFAULT_CREDITWORTHINESS_INPUTS instead of leaking invalid data into the ' +
      'form — a corrupted localStorage entry (e.g. negative netIncome) must not flow into the state driving ' +
      'the form fields, the same guarantee resolveInitialInputs/resolveInitialSalaryInputs give elsewhere',
    () => {
      expect(resolveInitialCreditworthinessInputs({ netIncome: -50 })).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
      expect(resolveInitialCreditworthinessInputs({ years: 999 })).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
    }
  );
});

describe('saveCreditworthinessInputs / loadStoredCreditworthinessInputs / clearStoredCreditworthinessInputs', () => {
  let fake: FakeStorage;

  beforeEach(() => {
    fake = new FakeStorage();
    vi.stubGlobal('localStorage', fake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips through JSON', () => {
    saveCreditworthinessInputs(DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(loadStoredCreditworthinessInputs()).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
  });

  it('returns null when nothing has been saved yet', () => {
    expect(loadStoredCreditworthinessInputs()).toBeNull();
  });

  it('clearStoredCreditworthinessInputs removes the stored entry', () => {
    saveCreditworthinessInputs(DEFAULT_CREDITWORTHINESS_INPUTS);
    clearStoredCreditworthinessInputs();
    expect(loadStoredCreditworthinessInputs()).toBeNull();
  });

  it('returns null instead of throwing for corrupted/non-object JSON', () => {
    fake.setItem('creditworthiness_inputs_v1', 'not json');
    expect(loadStoredCreditworthinessInputs()).toBeNull();
    fake.setItem('creditworthiness_inputs_v1', '[1,2,3]');
    expect(loadStoredCreditworthinessInputs()).toBeNull();
    fake.setItem('creditworthiness_inputs_v1', '"just a string"');
    expect(loadStoredCreditworthinessInputs()).toBeNull();
  });
});
