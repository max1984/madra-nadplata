import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeSalaryState,
  validateSalaryInputs,
  parseUrlSalaryInputs,
  buildSalaryUrlParams,
  resolveInitialSalaryInputs,
  saveSalaryInputs,
  loadStoredSalaryInputs,
  clearStoredSalaryInputs,
  DEFAULT_SALARY_INPUTS,
  type SalaryInputs,
} from './useSalaryCalculator';

class FakeStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
}

function withB2B(overrides: Partial<SalaryInputs['b2b']>): SalaryInputs {
  return { ...DEFAULT_SALARY_INPUTS, contractType: 'b2b', b2b: { ...DEFAULT_SALARY_INPUTS.b2b, ...overrides } };
}

describe('computeSalaryState — single month', () => {
  it('employment: computes a single-month result with mode "single"', () => {
    const state = computeSalaryState(DEFAULT_SALARY_INPUTS);
    if (state.mode !== 'single') throw new Error('expected single mode');
    expect(state.contractType).toBe('employment');
    expect(state.result.net).toBeGreaterThan(0);
    expect(state.jointTaxation).toBeNull();
  });

  it('mandate: switches contractType and computes from the mandate sub-state', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, contractType: 'mandate' };
    const state = computeSalaryState(inputs);
    expect(state.contractType).toBe('mandate');
    expect('employeeSocialTotal' in state.result).toBe(true);
  });

  it('specific_work: never has ZUS/health fields in the result', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, contractType: 'specific_work' };
    const state = computeSalaryState(inputs);
    expect('employeeSocialTotal' in state.result).toBe(false);
    expect('healthInsurance' in state.result).toBe(false);
  });

  it('b2b: computes from the b2b sub-state regardless of what other tabs contain', () => {
    const state = computeSalaryState(withB2B({ taxForm: 'liniowy' }));
    expect(state.contractType).toBe('b2b');
    expect('income' in state.result).toBe(true);
  });

  it('switching contractType does not mutate the other sub-states', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, contractType: 'b2b', employment: { ...DEFAULT_SALARY_INPUTS.employment, grossMonthly: 12345 } };
    computeSalaryState(inputs);
    expect(inputs.employment.grossMonthly).toBe(12345);
  });
});

describe('computeSalaryState — annual mode', () => {
  it('employment: annualMode produces a 12-month schedule', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, annualMode: true, annualMonthlyValues: Array(12).fill(7000) };
    const state = computeSalaryState(inputs);
    if (state.mode !== 'annual') throw new Error('expected annual mode');
    expect(state.result.months).toHaveLength(12);
  });

  it('b2b: annualMode uses b2b sub-state options for all 12 months', () => {
    const inputs = withB2B({ taxForm: 'ryczalt', ryczaltRate: 0.12 });
    inputs.annualMode = true;
    inputs.annualMonthlyValues = Array(12).fill(8000);
    const state = computeSalaryState(inputs);
    if (state.mode !== 'annual') throw new Error('expected annual mode');
    expect(state.result.months).toHaveLength(12);
  });
});

describe('computeSalaryState — joint taxation (wspólne rozliczenie)', () => {
  it('employment always qualifies — enabling it produces a non-null jointTaxation result', () => {
    const inputs: SalaryInputs = {
      ...DEFAULT_SALARY_INPUTS,
      jointTaxation: { enabled: true, spouseAnnualTaxableIncome: 20000 },
    };
    const state = computeSalaryState(inputs);
    expect(state.jointTaxation).not.toBeNull();
  });

  it('b2b on skala qualifies for joint taxation', () => {
    const inputs = withB2B({ taxForm: 'skala' });
    inputs.jointTaxation = { enabled: true, spouseAnnualTaxableIncome: 20000 };
    const state = computeSalaryState(inputs);
    expect(state.jointTaxation).not.toBeNull();
  });

  it(
    'regression: b2b on liniowy/ryczałt/ipbox does NOT qualify — enabling the toggle must not silently ' +
      'produce a joint-taxation result for a tax form the law excludes (art. 6 ust. 8 ustawy o PIT)',
    () => {
      for (const taxForm of ['liniowy', 'ryczalt', 'ipbox'] as const) {
        const inputs = withB2B({ taxForm });
        inputs.jointTaxation = { enabled: true, spouseAnnualTaxableIncome: 20000 };
        const state = computeSalaryState(inputs);
        expect(state.jointTaxation).toBeNull();
      }
    }
  );

  it('disabled toggle always yields null jointTaxation, even for a qualifying contract type', () => {
    const state = computeSalaryState(DEFAULT_SALARY_INPUTS);
    expect(state.jointTaxation).toBeNull();
  });
});

describe('validateSalaryInputs', () => {
  it('accepts the defaults', () => {
    expect(validateSalaryInputs(DEFAULT_SALARY_INPUTS)).toBeNull();
  });

  it('rejects a negative/NaN gross for employment', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, employment: { ...DEFAULT_SALARY_INPUTS.employment, grossMonthly: -100 } };
    expect(validateSalaryInputs(inputs)).toBe('error_salary_gross');
    const nanInputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, employment: { ...DEFAULT_SALARY_INPUTS.employment, grossMonthly: NaN } };
    expect(validateSalaryInputs(nanInputs)).toBe('error_salary_gross');
  });

  it('rejects an out-of-range copyrightSharePercent', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, employment: { ...DEFAULT_SALARY_INPUTS.employment, copyrightSharePercent: 150 } };
    expect(validateSalaryInputs(inputs)).toBe('error_salary_copyright_share');
  });

  it('rejects negative revenue/costs for b2b', () => {
    expect(validateSalaryInputs(withB2B({ monthlyRevenue: -1 }))).toBe('error_salary_revenue');
    expect(validateSalaryInputs(withB2B({ monthlyCosts: -1 }))).toBe('error_salary_costs');
  });

  it('rejects an out-of-range ipBoxSharePercent only when taxForm is ipbox', () => {
    expect(validateSalaryInputs(withB2B({ taxForm: 'ipbox', ipBoxSharePercent: 200 }))).toBe('error_salary_ipbox_share');
    expect(validateSalaryInputs(withB2B({ taxForm: 'liniowy', ipBoxSharePercent: 200 }))).toBeNull();
  });

  it('requires a positive malyZusPlusBase only when zusVariant is maly_zus_plus', () => {
    expect(validateSalaryInputs(withB2B({ zusVariant: 'maly_zus_plus', malyZusPlusBase: undefined }))).toBe('error_salary_maly_zus_base');
    expect(validateSalaryInputs(withB2B({ zusVariant: 'maly_zus_plus', malyZusPlusBase: 0 }))).toBe('error_salary_maly_zus_base');
    expect(validateSalaryInputs(withB2B({ zusVariant: 'pelny', malyZusPlusBase: undefined }))).toBeNull();
  });

  it('rejects an annualMonthlyValues array with the wrong length', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, annualMode: true, annualMonthlyValues: [1000, 2000] };
    expect(validateSalaryInputs(inputs)).toBe('error_salary_annual_length');
  });

  it('rejects a negative value inside annualMonthlyValues', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, annualMode: true, annualMonthlyValues: Array(12).fill(1000).map((v, i) => (i === 5 ? -1 : v)) };
    expect(validateSalaryInputs(inputs)).toBe('error_salary_annual_value');
  });

  it('rejects a negative spouseAnnualTaxableIncome only when joint taxation is enabled', () => {
    const inputs: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, jointTaxation: { enabled: true, spouseAnnualTaxableIncome: -5 } };
    expect(validateSalaryInputs(inputs)).toBe('error_salary_spouse_income');
    const disabled: SalaryInputs = { ...DEFAULT_SALARY_INPUTS, jointTaxation: { enabled: false, spouseAnnualTaxableIncome: -5 } };
    expect(validateSalaryInputs(disabled)).toBeNull();
  });
});

describe('buildSalaryUrlParams / parseUrlSalaryInputs — round trip', () => {
  it('employment: round-trips gross/kup/relief/pit2/ppk/bonus/copyright', () => {
    const inputs: SalaryInputs = {
      ...DEFAULT_SALARY_INPUTS,
      contractType: 'employment',
      employment: {
        grossMonthly: 9500, kup: 'elevated', specialRelief: 'under26', reducingShare: 'half',
        ppk: { mode: 'standard' }, bonusMonthly: 1500, copyrightSharePercent: 30,
      },
    };
    const params = buildSalaryUrlParams(inputs);
    const patch = parseUrlSalaryInputs('?' + params);
    expect(patch.contractType).toBe('employment');
    expect(patch.employment).toMatchObject({
      grossMonthly: 9500, kup: 'elevated', specialRelief: 'under26', reducingShare: 'half',
      ppk: { mode: 'standard' }, bonusMonthly: 1500, copyrightSharePercent: 30,
    });
  });

  it('mandate: round-trips student/sickness booleans correctly (including explicit false)', () => {
    const inputs: SalaryInputs = {
      ...DEFAULT_SALARY_INPUTS,
      contractType: 'mandate',
      mandate: { grossMonthly: 4000, kup: 'copyright', specialRelief: 'none', reducingShare: 'none', isStudentUnder26: true, sicknessVoluntary: false },
    };
    const patch = parseUrlSalaryInputs('?' + buildSalaryUrlParams(inputs));
    expect(patch.mandate).toMatchObject({ grossMonthly: 4000, kup: 'copyright', isStudentUnder26: true, sicknessVoluntary: false });
  });

  it('specific_work: round-trips gross/kup/pit2', () => {
    const inputs: SalaryInputs = {
      ...DEFAULT_SALARY_INPUTS,
      contractType: 'specific_work',
      specificWork: { grossMonthly: 3000, kup: 'copyright', reducingShare: 'third' },
    };
    const patch = parseUrlSalaryInputs('?' + buildSalaryUrlParams(inputs));
    expect(patch.specificWork).toMatchObject({ grossMonthly: 3000, kup: 'copyright', reducingShare: 'third' });
  });

  it('b2b: round-trips revenue/costs/form/zus/malyZusPlusBase', () => {
    const inputs = withB2B({ monthlyRevenue: 15000, monthlyCosts: 2000, taxForm: 'skala', zusVariant: 'maly_zus_plus', malyZusPlusBase: 3000 });
    const patch = parseUrlSalaryInputs('?' + buildSalaryUrlParams(inputs));
    expect(patch.b2b).toMatchObject({ monthlyRevenue: 15000, monthlyCosts: 2000, taxForm: 'skala', zusVariant: 'maly_zus_plus', malyZusPlusBase: 3000 });
  });

  it(
    'regression: leaves employment entirely unset when every field param is garbage — an empty ' +
      'sub-object patch (previously always a copy of the defaults) used to make the URL patch look ' +
      '"non-empty" to useSalaryCalculator(), which then computed and displayed a result on first load ' +
      'even for a URL/localStorage-less visit with nothing to calculate',
    () => {
      const patch = parseUrlSalaryInputs('?type=employment&gross=abc&kup=nonsense');
      expect(patch.employment).toBeUndefined();
      expect(patch.contractType).toBe('employment');
    }
  );

  it('a completely empty search string produces a fully empty patch object', () => {
    expect(parseUrlSalaryInputs('')).toEqual({});
  });
});

describe('resolveInitialSalaryInputs', () => {
  it('returns defaults deep-merged with a valid partial patch', () => {
    const result = resolveInitialSalaryInputs({ employment: { ...DEFAULT_SALARY_INPUTS.employment, grossMonthly: 7777 } });
    expect(result.employment.grossMonthly).toBe(7777);
    expect(result.mandate).toEqual(DEFAULT_SALARY_INPUTS.mandate);
  });

  it('returns DEFAULT_SALARY_INPUTS unchanged when there is no patch', () => {
    expect(resolveInitialSalaryInputs(null)).toEqual(DEFAULT_SALARY_INPUTS);
  });

  it(
    'regression: falls back to DEFAULT_SALARY_INPUTS instead of leaking invalid data into the form — ' +
      'a corrupted localStorage entry (e.g. negative gross) must not flow into the state driving the form fields',
    () => {
      const result = resolveInitialSalaryInputs({ employment: { ...DEFAULT_SALARY_INPUTS.employment, grossMonthly: -50 } });
      expect(result).toEqual(DEFAULT_SALARY_INPUTS);
    }
  );
});

describe('saveSalaryInputs / loadStoredSalaryInputs / clearStoredSalaryInputs', () => {
  let fake: FakeStorage;

  beforeEach(() => {
    fake = new FakeStorage();
    vi.stubGlobal('localStorage', fake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips through JSON', () => {
    saveSalaryInputs(DEFAULT_SALARY_INPUTS);
    expect(loadStoredSalaryInputs()).toEqual(DEFAULT_SALARY_INPUTS);
  });

  it('returns null when nothing has been saved yet', () => {
    expect(loadStoredSalaryInputs()).toBeNull();
  });

  it('returns null for corrupted (non-JSON) stored data instead of throwing', () => {
    fake.setItem('salary_inputs_v1', 'not json {{{');
    expect(() => loadStoredSalaryInputs()).not.toThrow();
    expect(loadStoredSalaryInputs()).toBeNull();
  });

  it('clearStoredSalaryInputs removes the stored entry', () => {
    saveSalaryInputs(DEFAULT_SALARY_INPUTS);
    clearStoredSalaryInputs();
    expect(loadStoredSalaryInputs()).toBeNull();
  });
});
