import { describe, it, expect } from 'vitest';
import { parseUrlInputs, validateInputs, resolvePerRowFixed, resolveFixedStd, naturalOverpaysWithStart, flatOverpayWithStart, DEFAULT_INPUTS, type CalcState } from './useCalculator';
import { naturalOverpaysFromBalance } from '../lib/mortgage';

function makeCustomCalcState(overrides: Partial<CalcState> = {}): CalcState {
  const months = 3;
  return {
    P: 100000, r: 0.005, months, prepayFee: 0,
    stdPayment: 1798.65, origStdPayment: 1798.65,
    customOverpay: Array<number>(months).fill(0),
    customRates: Array<number>(months).fill(0.005),
    strategy: 'custom', customEffect: 'reduce',
    customPerRowEffects: Array<'shorten' | 'reduce'>(months).fill('reduce'),
    overpayStartMonth: 0,
    totalMonthly: 0, defaultOverpay: 0,
    baseInterest: 0, baseMonths: months, baseBalances: [], baseCumInterestByMonth: [],
    rows: [],
    ...overrides,
  };
}

describe('parseUrlInputs', () => {
  it('parses valid numeric params', () => {
    const patch = parseUrlInputs('?amount=250000&rate=7.5&months=240');
    expect(patch).toEqual({ loanAmount: 250000, interestRate: 7.5, loanMonths: 240 });
  });

  it('ignores non-numeric or non-finite values instead of producing NaN', () => {
    const patch = parseUrlInputs('?amount=abc&rate=Infinity&fee=-NaN&months=180');
    expect(patch).toEqual({ loanMonths: 180 });
    expect(patch.loanAmount).toBeUndefined();
    expect(patch.interestRate).toBeUndefined();
    expect(patch.prepayFee).toBeUndefined();
  });

  it('ignores an unknown strategy value', () => {
    const patch = parseUrlInputs('?strategy=made_up');
    expect(patch.strategy).toBeUndefined();
  });

  it('maps the legacy reduce_payment strategy to fixed_total', () => {
    const patch = parseUrlInputs('?strategy=reduce_payment');
    expect(patch.strategy).toBe('fixed_total');
  });

  it('returns an empty patch for an empty query string', () => {
    expect(parseUrlInputs('')).toEqual({});
  });
});

describe('validateInputs', () => {
  it('accepts the default inputs', () => {
    expect(validateInputs(DEFAULT_INPUTS)).toBeNull();
  });

  it('rejects an out-of-range prepayment fee — a shared link could set ?fee=999 unchecked', () => {
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: 999 })).toBe('error_prepay_fee');
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: -1 })).toBe('error_prepay_fee');
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: 0 })).toBeNull();
    expect(validateInputs({ ...DEFAULT_INPUTS, prepayFee: 5 })).toBeNull();
  });

  const validRefi = { ...DEFAULT_INPUTS, strategy: 'refinance' as const };

  it('accepts refinance inputs within the UI bounds', () => {
    expect(validateInputs(validRefi)).toBeNull();
  });

  it('rejects a refinancing month outside the loan term', () => {
    expect(validateInputs({ ...validRefi, refiMonth: -1 })).toBe('error_refi_month');
    expect(validateInputs({ ...validRefi, refiMonth: validRefi.loanMonths })).toBe('error_refi_month');
  });

  it('rejects an out-of-range origination fee or a negative flat fee — same class of bug as ?fee on prepayFee', () => {
    expect(validateInputs({ ...validRefi, refiOriginationFee: 50 })).toBe('error_refi_fee');
    expect(validateInputs({ ...validRefi, refiOriginationFee: -1 })).toBe('error_refi_fee');
    expect(validateInputs({ ...validRefi, refiFlat: -100 })).toBe('error_refi_fee');
  });

  it('rejects an overpay start month outside the loan term — a shared link could set ?start=999999999 unchecked, which computeCalcState would turn into a huge Array allocation', () => {
    expect(validateInputs({ ...DEFAULT_INPUTS, overpayStartMonth: 999999999 })).toBe('error_overpay_start');
    expect(validateInputs({ ...DEFAULT_INPUTS, overpayStartMonth: -1 })).toBe('error_overpay_start');
    expect(validateInputs({ ...DEFAULT_INPUTS, overpayStartMonth: DEFAULT_INPUTS.loanMonths })).toBe('error_overpay_start');
    expect(validateInputs({ ...DEFAULT_INPUTS, overpayStartMonth: 0 })).toBeNull();
    expect(validateInputs({ ...DEFAULT_INPUTS, overpayStartMonth: DEFAULT_INPUTS.loanMonths - 1 })).toBeNull();
  });
});

describe('resolvePerRowFixed', () => {
  it('is undefined for non-custom strategies — buildSchedule then uses the scalar fixedStdPayment', () => {
    expect(resolvePerRowFixed(makeCustomCalcState({ strategy: 'fixed_total' }))).toBeUndefined();
  });

  it('builds one fixed-payment slot per row, matching that row\'s own effect', () => {
    const state = makeCustomCalcState({
      customPerRowEffects: ['shorten', 'reduce', 'shorten'],
      origStdPayment: 1798.65,
    });
    expect(resolvePerRowFixed(state)).toEqual([1798.65, null, 1798.65]);
  });

  it('regression: onOverpayChange/resetRates/etc. must pass this so a mixed per-row setup survives other edits', () => {
    // onCustomEffectChange/onRowEffectChange already built this array correctly;
    // the bug was the other five buildSchedule call sites silently dropping it
    // and falling back to the single global customEffect for every row.
    const mixed = makeCustomCalcState({ customPerRowEffects: ['shorten', 'reduce'], customEffect: 'reduce' });
    const perRow = resolvePerRowFixed(mixed);
    expect(perRow).not.toBeUndefined();
    expect(perRow![0]).not.toBe(perRow![1]);
  });
});

describe('naturalOverpaysWithStart', () => {
  const P = 300000, months = 360, r = 0.06 / 12;
  const rates = Array<number>(months).fill(r);

  it('is all zeros before the configured start month', () => {
    const overpay = naturalOverpaysWithStart(P, rates, months, 2300, r, 24);
    expect(overpay.slice(0, 24).every((v) => v === 0)).toBe(true);
    expect(overpay[24]).toBeGreaterThan(0);
  });

  it('matches plain naturalOverpaysFromBalance when startMonth is 0', () => {
    const withStart = naturalOverpaysWithStart(P, rates, months, 2300, r, 0);
    const plain = naturalOverpaysFromBalance(P, 0, rates, months, 2300, r);
    expect(withStart).toEqual(plain);
  });

  it('regression: onRateChange/resetOverpays/resetRates must pass overpayStartMonth from CalcState, not hardcode 0 — otherwise a configured delayed start silently resets to "overpay from month 1"', () => {
    const delayed = naturalOverpaysWithStart(P, rates, months, 2300, r, 24);
    const fromZero = naturalOverpaysWithStart(P, rates, months, 2300, r, 0);
    expect(delayed[0]).toBe(0);
    expect(fromZero[0]).toBeGreaterThan(0);
  });
});

describe('resolveFixedStd', () => {
  it('fixes the payment at the original standard rate for shorten_period and goal — that is the whole point of those strategies', () => {
    expect(resolveFixedStd(makeCustomCalcState({ strategy: 'shorten_period', origStdPayment: 1798.65 }))).toBe(1798.65);
    expect(resolveFixedStd(makeCustomCalcState({ strategy: 'goal', origStdPayment: 1798.65 }))).toBe(1798.65);
  });

  it('fixes the payment for custom strategy only when the global effect is "shorten"', () => {
    expect(resolveFixedStd(makeCustomCalcState({ strategy: 'custom', customEffect: 'shorten', origStdPayment: 1798.65 }))).toBe(1798.65);
    expect(resolveFixedStd(makeCustomCalcState({ strategy: 'custom', customEffect: 'reduce' }))).toBeNull();
  });

  it('lets the payment float (null) for the natural-payment strategies', () => {
    expect(resolveFixedStd(makeCustomCalcState({ strategy: 'fixed_total' }))).toBeNull();
    expect(resolveFixedStd(makeCustomCalcState({ strategy: 'fixed_overpay' }))).toBeNull();
  });
});

describe('flatOverpayWithStart', () => {
  it('fills every month with the flat amount when there is no delayed start', () => {
    expect(flatOverpayWithStart(4, 500, 0)).toEqual([500, 500, 500, 500]);
  });

  it('zeroes the months before the configured start — this exact case was missing from resetOverpays for fixed_overpay/shorten_period', () => {
    expect(flatOverpayWithStart(6, 500, 3)).toEqual([0, 0, 0, 500, 500, 500]);
  });

  it('is a no-op zeroing when startMonth reaches or exceeds the schedule length', () => {
    expect(flatOverpayWithStart(4, 500, 10)).toEqual([0, 0, 0, 0]);
  });
});
