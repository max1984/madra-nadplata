import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseUrlInputs, buildUrlParams, validateInputs, resolvePerRowFixed, resolveFixedStd, naturalOverpaysWithStart, flatOverpayWithStart, applyExtraAnnualPayment, clampCustomAnnualRate, saveInputs, loadStoredInputs, clearStoredInputs, inputsEqual, loadScenarios, persistScenarios, addScenario, removeScenario, renameScenario, duplicateScenario, sortScenarios, strategyLabelKey, buildScenarioComparisonRows, compareScenarioToCurrent, computeCalcState, parseScenariosJSON, scenariosToJSON, mergeImportedScenarios, DEFAULT_INPUTS, type CalcState } from './useCalculator';
import { naturalOverpaysFromBalance } from '../lib/mortgage';

class FakeStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
}

function makeCustomCalcState(overrides: Partial<CalcState> = {}): CalcState {
  const months = 3;
  return {
    P: 100000, r: 0.005, months, prepayFee: 0,
    stdPayment: 1798.65, origStdPayment: 1798.65,
    customOverpay: Array<number>(months).fill(0),
    customRates: Array<number>(months).fill(0.005),
    strategy: 'custom', customEffect: 'reduce',
    customPerRowEffects: Array<'shorten' | 'reduce'>(months).fill('reduce'),
    overpayStartMonth: 0, extraAnnualPayment: false,
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

describe('buildUrlParams', () => {
  it('round-trips through parseUrlInputs for the default (fixed_total) strategy', () => {
    const qs = buildUrlParams(DEFAULT_INPUTS);
    const patch = parseUrlInputs('?' + qs);
    expect(patch.loanAmount).toBe(DEFAULT_INPUTS.loanAmount);
    expect(patch.interestRate).toBe(DEFAULT_INPUTS.interestRate);
    expect(patch.strategy).toBe('fixed_total');
    expect(patch.totalMonthlySlider).toBe(DEFAULT_INPUTS.totalMonthlySlider);
  });

  it('only includes the slider param relevant to the active strategy — fixed_overpay omits totalMonthlySlider/shortenAmountSlider', () => {
    const qs = buildUrlParams({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 777 });
    const sp = new URLSearchParams(qs);
    expect(sp.get('overpay')).toBe('777');
    expect(sp.has('total')).toBe(false);
    expect(sp.has('shorten')).toBe(false);
  });

  it('regression: omits the start param when overpayStartMonth is 0 — a bare link should not carry a redundant ?start=0 for the common "start immediately" case', () => {
    const qs = buildUrlParams({ ...DEFAULT_INPUTS, overpayStartMonth: 0 });
    expect(new URLSearchParams(qs).has('start')).toBe(false);
  });

  it('includes all refinance-specific params only for the refinance strategy', () => {
    const qs = buildUrlParams({ ...DEFAULT_INPUTS, strategy: 'refinance', refiMonth: 24, refiRate: 5.5 });
    const sp = new URLSearchParams(qs);
    expect(sp.get('refiMonth')).toBe('24');
    expect(sp.get('refiRate')).toBe('5.5');

    const nonRefiQs = buildUrlParams({ ...DEFAULT_INPUTS, strategy: 'fixed_total' });
    expect(new URLSearchParams(nonRefiQs).has('refiMonth')).toBe(false);
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

  it('regression: rejects a negative or absurdly large totalMonthlySlider — a crafted ?total= link bypassed the UI slider entirely and silently got clamped deep inside buildSchedule instead of a clear error', () => {
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'fixed_total', totalMonthlySlider: -1 })).toBe('error_total_monthly');
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'fixed_total', totalMonthlySlider: 10_000_001 })).toBe('error_total_monthly');
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'fixed_total', totalMonthlySlider: 10_000_000 })).toBeNull();
  });

  it('regression: rejects a negative or absurdly large overpayAmountSlider — same ?overpay= link class of bug as totalMonthlySlider', () => {
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: -1 })).toBe('error_overpay_amount');
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 10_000_001 })).toBe('error_overpay_amount');
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 10_000_000 })).toBeNull();
  });

  it('regression: rejects a negative or absurdly large shortenAmountSlider — same ?shorten= link class of bug as totalMonthlySlider', () => {
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'shorten_period', shortenAmountSlider: -1 })).toBe('error_shorten_amount');
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'shorten_period', shortenAmountSlider: 10_000_001 })).toBe('error_shorten_amount');
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'shorten_period', shortenAmountSlider: 10_000_000 })).toBeNull();
  });

  it('does not validate totalMonthlySlider/overpayAmountSlider/shortenAmountSlider for strategies that ignore them', () => {
    expect(validateInputs({ ...DEFAULT_INPUTS, strategy: 'custom', totalMonthlySlider: -1, overpayAmountSlider: -1, shortenAmountSlider: -1 })).toBeNull();
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
    expect(validateInputs({ ...validRefi, refiOriginationFee: 50 })).toBe('error_refi_origination_fee');
    expect(validateInputs({ ...validRefi, refiOriginationFee: -1 })).toBe('error_refi_origination_fee');
    expect(validateInputs({ ...validRefi, refiFlat: -100 })).toBe('error_refi_flat_fee');
  });

  it('regression: rejects a flat refi fee above the input\'s own 10,000,000 max — validateInputs had no upper bound here even though every sibling refi field (rate, months, origination fee) does, so a crafted ?refiFlat= link could push a nonsensical fee straight into the results', () => {
    expect(validateInputs({ ...validRefi, refiFlat: 10_000_001 })).toBe('error_refi_flat_fee');
    expect(validateInputs({ ...validRefi, refiFlat: 10_000_000 })).toBeNull();
  });

  it('regression: origination fee and flat fee errors use distinct translation keys — a shared "error_refi_fee" key left users unable to tell which of the two fields to fix', () => {
    const originationErr = validateInputs({ ...validRefi, refiOriginationFee: 50 });
    const flatErr = validateInputs({ ...validRefi, refiFlat: -1 });
    expect(originationErr).not.toBe(flatErr);
    expect(originationErr).toBe('error_refi_origination_fee');
    expect(flatErr).toBe('error_refi_flat_fee');
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

describe('clampCustomAnnualRate', () => {
  it('passes through a normal rate unchanged', () => {
    expect(clampCustomAnnualRate('7.5')).toBe(7.5);
  });

  it('regression: caps an unbounded rate so Math.pow(1+r, n) cannot overflow to Infinity — an uncapped rate turned the whole schedule into NaN rows', () => {
    expect(clampCustomAnnualRate('999')).toBe(25);
  });

  it('floors at the same 0.01% minimum as the Schedule.tsx input, rejecting zero/negative/garbage input', () => {
    expect(clampCustomAnnualRate('0')).toBe(0.01);
    expect(clampCustomAnnualRate('-5')).toBe(0.01);
    expect(clampCustomAnnualRate('abc')).toBe(0.01);
  });

  it('regression: accepts a comma decimal separator — Schedule.tsx now displays the per-row rate as "7,50" in Polish, and blurring it back unchanged must round-trip', () => {
    expect(clampCustomAnnualRate('7,5')).toBe(7.5);
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

describe('applyExtraAnnualPayment', () => {
  it('adds the extra amount on top of the existing overpay at months 12, 24, 36...', () => {
    const base = Array<number>(30).fill(100);
    const result = applyExtraAnnualPayment(base, 30, 1800);
    expect(result[11]).toBe(1900); // miesiąc 12
    expect(result[23]).toBe(1900); // miesiąc 24
    expect(result[10]).toBe(100);
    expect(result[12]).toBe(100);
  });

  it('regression: does not mutate the array it was given — callers keep passing prev.customOverpay around and rely on it being untouched', () => {
    const base = Array<number>(12).fill(0);
    applyExtraAnnualPayment(base, 12, 1800);
    expect(base[11]).toBe(0);
  });

  it('is a no-op for a zero or negative extra amount', () => {
    const base = Array<number>(12).fill(500);
    expect(applyExtraAnnualPayment(base, 12, 0)).toEqual(base);
    expect(applyExtraAnnualPayment(base, 12, -100)).toEqual(base);
  });

  it('only bumps months that exist within a shorter schedule (e.g. a loan already paid off before month 12)', () => {
    const base = Array<number>(10).fill(200);
    const result = applyExtraAnnualPayment(base, 10, 1800);
    expect(result).toEqual(Array(10).fill(200));
  });

  it('regression: skips annual bumps that fall before a delayed overpayStartMonth', () => {
    const base = Array<number>(30).fill(0);
    const result = applyExtraAnnualPayment(base, 30, 1800, 20);
    expect(result[11]).toBe(0); // miesiąc 12 — przed startem, bez nadpłaty
    expect(result[23]).toBe(1800); // miesiąc 24 — po starcie
  });

  it('bumps every eligible month when startMonth is 0 (default, backward compatible)', () => {
    const base = Array<number>(24).fill(0);
    const result = applyExtraAnnualPayment(base, 24, 1800);
    expect(result[11]).toBe(1800);
    expect(result[23]).toBe(1800);
  });
});

describe('computeCalcState — extraAnnualPayment integration', () => {
  it('reduces total interest and months compared to the same strategy without the extra annual payment', () => {
    const without = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 500, extraAnnualPayment: false });
    const withExtra = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 500, extraAnnualPayment: true });
    const interestWithout = without.rows[without.rows.length - 1]!.cumInterest;
    const interestWith = withExtra.rows[withExtra.rows.length - 1]!.cumInterest;
    expect(withExtra.rows.length).toBeLessThan(without.rows.length);
    expect(interestWith).toBeLessThan(interestWithout);
  });

  it('regression: has no effect for the custom and goal strategies, which manage their own overpay independently', () => {
    const goalWithout = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'goal', goalMonths: 180, extraAnnualPayment: false });
    const goalWith = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'goal', goalMonths: 180, extraAnnualPayment: true });
    expect(goalWith.customOverpay).toEqual(goalWithout.customOverpay);

    const customWithout = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'custom', extraAnnualPayment: false });
    const customWith = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'custom', extraAnnualPayment: true });
    expect(customWith.customOverpay).toEqual(customWithout.customOverpay);
  });

  it('regression: the "13th payment" does not fire before a delayed overpayStartMonth', () => {
    const state = computeCalcState({
      ...DEFAULT_INPUTS,
      strategy: 'fixed_overpay',
      overpayAmountSlider: 500,
      overpayStartMonth: 20,
      extraAnnualPayment: true,
    });
    // Miesiąc 12 (indeks 11) jest przed startem nadpłaty (miesiąc 20) —
    // ani nadpłata "naturalna", ani "13. rata" nie powinny tam nic dodać.
    expect(state.customOverpay[11]).toBe(0);
    // Miesiąc 24 (indeks 23) jest po starcie — 13. rata powinna zadziałać.
    expect(state.customOverpay[23]).toBeGreaterThan(state.defaultOverpay);
  });
});

describe('computeCalcState — custom strategy customEffect default', () => {
  it('regression: customEffect starts as "reduce", matching the default customPerRowEffects — a mismatched "shorten" default made the toolbar\'s "Skróć okres" button show as active right after calculating, even though every row actually used the "reduce" effect', () => {
    const state = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'custom' });
    expect(state.customEffect).toBe('reduce');
    expect(state.customPerRowEffects.every((e) => e === 'reduce')).toBe(true);
  });
});

describe('saveInputs / loadStoredInputs', () => {
  let fake: FakeStorage;

  beforeEach(() => {
    fake = new FakeStorage();
    vi.stubGlobal('localStorage', fake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a saved CalcInputs object', () => {
    saveInputs({ ...DEFAULT_INPUTS, loanAmount: 456000, interestRate: 7.25 });
    const loaded = loadStoredInputs();
    expect(loaded?.loanAmount).toBe(456000);
    expect(loaded?.interestRate).toBe(7.25);
  });

  it('returns null when nothing has been saved yet', () => {
    expect(loadStoredInputs()).toBeNull();
  });

  it('regression: returns null instead of throwing on corrupted or foreign localStorage content — DevTools or a leftover value from an older app shape must not crash state initialization', () => {
    localStorage.setItem('calc_inputs_v1', 'not json at all {{{');
    expect(() => loadStoredInputs()).not.toThrow();
    expect(loadStoredInputs()).toBeNull();

    localStorage.setItem('calc_inputs_v1', JSON.stringify([1, 2, 3]));
    expect(loadStoredInputs()).toBeNull();

    localStorage.setItem('calc_inputs_v1', JSON.stringify(42));
    expect(loadStoredInputs()).toBeNull();

    localStorage.setItem('calc_inputs_v1', JSON.stringify(null));
    expect(loadStoredInputs()).toBeNull();
  });

  it('clearStoredInputs removes a previously saved value — the "reset to defaults" button relies on this to actually stop restoring the old data on the next visit', () => {
    saveInputs({ ...DEFAULT_INPUTS, loanAmount: 999000 });
    expect(loadStoredInputs()).not.toBeNull();
    clearStoredInputs();
    expect(loadStoredInputs()).toBeNull();
  });
});

describe('addScenario / removeScenario / loadScenarios / persistScenarios', () => {
  let fake: FakeStorage;

  beforeEach(() => {
    fake = new FakeStorage();
    vi.stubGlobal('localStorage', fake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds a scenario with a generated id, trimmed name and the given inputs', () => {
    const list = addScenario([], '  Wariant A  ', { ...DEFAULT_INPUTS, loanAmount: 250000 });
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('Wariant A');
    expect(list[0]!.inputs.loanAmount).toBe(250000);
    expect(list[0]!.id).toBeTruthy();
  });

  it('assigns distinct ids to scenarios added back to back', () => {
    let list = addScenario([], 'A', DEFAULT_INPUTS);
    list = addScenario(list, 'B', DEFAULT_INPUTS);
    expect(list[0]!.id).not.toBe(list[1]!.id);
  });

  it('regression: caps the list at 10 entries by dropping the oldest — otherwise localStorage would grow without bound for anyone who saves many variants', () => {
    let list: ReturnType<typeof addScenario> = [];
    for (let i = 0; i < 12; i++) list = addScenario(list, `Scenariusz ${i}`, DEFAULT_INPUTS);
    expect(list).toHaveLength(10);
    expect(list[0]!.name).toBe('Scenariusz 2');
    expect(list[9]!.name).toBe('Scenariusz 11');
  });

  it('removeScenario filters out only the matching id', () => {
    let list = addScenario([], 'A', DEFAULT_INPUTS);
    list = addScenario(list, 'B', DEFAULT_INPUTS);
    const idToRemove = list[0]!.id;
    const next = removeScenario(list, idToRemove);
    expect(next).toHaveLength(1);
    expect(next[0]!.name).toBe('B');
  });

  it('round-trips scenarios through persistScenarios / loadScenarios', () => {
    const list = addScenario([], 'Wariant', { ...DEFAULT_INPUTS, loanAmount: 777000 });
    expect(persistScenarios(list)).toBe(true);
    const loaded = loadScenarios();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.name).toBe('Wariant');
    expect(loaded[0]!.inputs.loanAmount).toBe(777000);
  });

  it('regression: persistScenarios returns false instead of silently reporting success when the underlying storage write fails (full/blocked localStorage) — saveCurrentAsScenario in the hook uses this to warn the user their scenario will not survive a page refresh', () => {
    vi.spyOn(fake, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const list = addScenario([], 'Wariant', DEFAULT_INPUTS);
    expect(persistScenarios(list)).toBe(false);
  });

  it('regression: persistScenarios also reports the storage failure for the delete/rename/duplicate/import results, not just a fresh save — deleteScenario/renameScenario/duplicateScenario/importScenarios in the hook each feed their own resulting list into persistScenarios and only just started checking its return value (previously ignored, so a failed write for those four actions looked identical to a successful one until the next page refresh)', () => {
    let list = addScenario([], 'Wariant', DEFAULT_INPUTS);
    list = addScenario(list, 'Do usunięcia', DEFAULT_INPUTS);
    const targetId = list[1]!.id;

    vi.spyOn(fake, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(persistScenarios(removeScenario(list, targetId))).toBe(false);
    expect(persistScenarios(renameScenario(list, targetId, 'Nowa nazwa'))).toBe(false);
    expect(persistScenarios(duplicateScenario(list, targetId, 'Kopia'))).toBe(false);
    expect(persistScenarios(mergeImportedScenarios(list, [list[0]!]))).toBe(false);
  });

  it('returns an empty list when nothing has been saved yet', () => {
    expect(loadScenarios()).toEqual([]);
  });

  it('regression: filters out malformed entries instead of throwing — localStorage is manually editable and survives shape changes across app versions', () => {
    localStorage.setItem('calc_scenarios_v1', 'not json {{{');
    expect(() => loadScenarios()).not.toThrow();
    expect(loadScenarios()).toEqual([]);

    localStorage.setItem('calc_scenarios_v1', JSON.stringify([{ id: '1', name: 'ok', savedAt: 1, inputs: DEFAULT_INPUTS }, { id: '2' }, 'garbage', null]));
    const loaded = loadScenarios();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.name).toBe('ok');

    localStorage.setItem('calc_scenarios_v1', JSON.stringify({ not: 'an array' }));
    expect(loadScenarios()).toEqual([]);
  });
});

describe('renameScenario', () => {
  it('renames only the scenario with the matching id', () => {
    let list = addScenario([], 'A', DEFAULT_INPUTS);
    list = addScenario(list, 'B', DEFAULT_INPUTS);
    const targetId = list[0]!.id;
    const next = renameScenario(list, targetId, 'A renamed');
    expect(next[0]!.name).toBe('A renamed');
    expect(next[1]!.name).toBe('B');
  });

  it('trims whitespace from the new name', () => {
    const list = addScenario([], 'A', DEFAULT_INPUTS);
    const next = renameScenario(list, list[0]!.id, '  Nowa nazwa  ');
    expect(next[0]!.name).toBe('Nowa nazwa');
  });

  it('regression: an empty/whitespace-only new name is ignored, keeping the previous name — otherwise blurring the rename field with nothing typed would silently erase it', () => {
    const list = addScenario([], 'Wariant A', DEFAULT_INPUTS);
    const next = renameScenario(list, list[0]!.id, '   ');
    expect(next[0]!.name).toBe('Wariant A');
  });

  it('is a no-op when the id does not match any scenario', () => {
    const list = addScenario([], 'A', DEFAULT_INPUTS);
    const next = renameScenario(list, 'nonexistent', 'X');
    expect(next).toEqual(list);
  });
});

describe('scenariosToJSON / parseScenariosJSON', () => {
  it('round-trips a list of scenarios through export/import text', () => {
    const list = addScenario([], 'Wariant eksportowy', { ...DEFAULT_INPUTS, loanAmount: 456000 });
    const json = scenariosToJSON(list);
    const parsed = parseScenariosJSON(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.name).toBe('Wariant eksportowy');
    expect(parsed[0]!.inputs.loanAmount).toBe(456000);
  });

  it('regression: returns an empty array instead of throwing for garbage or wrongly-shaped JSON — an imported file is untrusted input, same as localStorage', () => {
    expect(() => parseScenariosJSON('not json {{{')).not.toThrow();
    expect(parseScenariosJSON('not json {{{')).toEqual([]);
    expect(parseScenariosJSON(JSON.stringify({ not: 'an array' }))).toEqual([]);
    expect(parseScenariosJSON(JSON.stringify([{ id: '1' }, 'garbage', null]))).toEqual([]);
  });
});

describe('mergeImportedScenarios', () => {
  it('appends imported scenarios to the existing list under fresh ids', () => {
    const existing = addScenario([], 'Istniejący', DEFAULT_INPUTS);
    const imported = [{ id: 'imported-id', name: 'Zaimportowany', savedAt: 1, inputs: DEFAULT_INPUTS }];
    const next = mergeImportedScenarios(existing, imported);
    expect(next).toHaveLength(2);
    expect(next[1]!.name).toBe('Zaimportowany');
    expect(next[1]!.id).not.toBe('imported-id');
  });

  it('regression: re-assigns ids so importing a file exported from the same browser does not collide with what is already saved', () => {
    const existing = addScenario([], 'A', DEFAULT_INPUTS);
    const sameFileReimported = [{ ...existing[0]! }];
    const next = mergeImportedScenarios(existing, sameFileReimported);
    expect(next).toHaveLength(2);
    expect(new Set(next.map((s) => s.id)).size).toBe(2);
  });

  it('caps the merged list at 10 entries, keeping the most recent', () => {
    let existing: ReturnType<typeof addScenario> = [];
    for (let i = 0; i < 8; i++) existing = addScenario(existing, `E${i}`, DEFAULT_INPUTS);
    const imported = [
      { id: 'i1', name: 'I1', savedAt: 1, inputs: DEFAULT_INPUTS },
      { id: 'i2', name: 'I2', savedAt: 2, inputs: DEFAULT_INPUTS },
      { id: 'i3', name: 'I3', savedAt: 3, inputs: DEFAULT_INPUTS },
    ];
    const next = mergeImportedScenarios(existing, imported);
    expect(next).toHaveLength(10);
    expect(next[9]!.name).toBe('I3');
    expect(next[0]!.name).toBe('E1');
  });
});

describe('strategyLabelKey', () => {
  it('maps each strategy to its own translation key', () => {
    expect(strategyLabelKey('fixed_overpay')).toBe('strategy_fixed_overpay');
    expect(strategyLabelKey('shorten_period')).toBe('strategy_shorten');
    expect(strategyLabelKey('custom')).toBe('strategy_custom');
    expect(strategyLabelKey('goal')).toBe('strategy_goal');
    expect(strategyLabelKey('refinance')).toBe('strategy_refinance');
    expect(strategyLabelKey('fixed_total')).toBe('strategy_fixed_total');
  });

  it('regression: maps the legacy "reduce_payment" strategy to the same label as fixed_total, since it was removed as an identical duplicate', () => {
    expect(strategyLabelKey('reduce_payment')).toBe('strategy_fixed_total');
  });
});

describe('buildScenarioComparisonRows', () => {
  it('computes months and total interest independently for each scenario, from its own saved inputs', () => {
    const list = [
      addScenario([], 'Mały overpay', { ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 200 })[0]!,
      addScenario([], 'Duży overpay', { ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 1000 })[0]!,
    ];
    const rows = buildScenarioComparisonRows(list);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.name).toBe('Mały overpay');
    expect(rows[1]!.months).toBeLessThan(rows[0]!.months);
    expect(rows[1]!.totalInterest).toBeLessThan(rows[0]!.totalInterest);
    expect(rows[1]!.interestSaved).toBeGreaterThan(rows[0]!.interestSaved);
    expect(rows[1]!.monthsSaved).toBeGreaterThan(rows[0]!.monthsSaved);
  });

  it('interestSaved and monthsSaved compare the scenario against its own no-overpayment baseline, not against other scenarios', () => {
    const [noOverpay] = addScenario([], 'Bez nadpłaty', { ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 0 });
    const [row] = buildScenarioComparisonRows([noOverpay!]);
    expect(row!.interestSaved).toBe(0);
    expect(row!.monthsSaved).toBe(0);
  });

  it('carries over the name, loan amount, rate, strategy and savedAt from the scenario unchanged', () => {
    const [scenario] = addScenario([], 'Test', { ...DEFAULT_INPUTS, loanAmount: 456000, interestRate: 7.25, strategy: 'goal' });
    const [row] = buildScenarioComparisonRows([scenario!]);
    expect(row!.loanAmount).toBe(456000);
    expect(row!.interestRate).toBe(7.25);
    expect(row!.strategy).toBe('goal');
    expect(row!.savedAt).toBe(scenario!.savedAt);
  });

  it('returns an empty array for an empty scenario list', () => {
    expect(buildScenarioComparisonRows([])).toEqual([]);
  });

  it('regression: skips a scenario whose saved inputs fail validation instead of feeding garbage (undefined-derived NaNs) into computeCalcState — parseScenariosJSON only checks the shape of an imported scenario, not the field values, so a hand-edited or corrupted import file could carry inputs like {}', () => {
    const valid = addScenario([], 'OK', { ...DEFAULT_INPUTS })[0]!;
    const corrupted = { id: 'x', name: 'Uszkodzony', savedAt: Date.now(), inputs: {} as unknown as typeof DEFAULT_INPUTS };
    const rows = buildScenarioComparisonRows([valid, corrupted]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe('OK');
  });
});

describe('sortScenarios', () => {
  const list = [
    { id: 'a', name: 'Banan', savedAt: 100, inputs: DEFAULT_INPUTS },
    { id: 'b', name: 'jabłko', savedAt: 300, inputs: DEFAULT_INPUTS },
    { id: 'c', name: 'Czereśnia', savedAt: 200, inputs: DEFAULT_INPUTS },
  ];

  it('date-desc (default) puts the most recently saved scenario first', () => {
    expect(sortScenarios(list, 'date-desc').map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('date-asc puts the oldest scenario first', () => {
    expect(sortScenarios(list, 'date-asc').map((s) => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('name-asc sorts case-insensitively — lowercase "jabłko" must not sort after the uppercase names purely due to case', () => {
    expect(sortScenarios(list, 'name-asc').map((s) => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('regression: does not mutate the original array — callers pass the same scenarios array used elsewhere in the UI', () => {
    const original = [...list];
    sortScenarios(list, 'name-asc');
    expect(list).toEqual(original);
  });

  it('returns an empty array for an empty input', () => {
    expect(sortScenarios([], 'date-desc')).toEqual([]);
  });
});

describe('duplicateScenario', () => {
  it('adds a copy with a new id, the given name and the same inputs as the original', () => {
    const list = addScenario([], 'Oryginał', { ...DEFAULT_INPUTS, loanAmount: 250000 });
    const originalId = list[0]!.id;
    const next = duplicateScenario(list, originalId, 'Oryginał (kopia)');
    expect(next).toHaveLength(2);
    expect(next[1]!.name).toBe('Oryginał (kopia)');
    expect(next[1]!.id).not.toBe(originalId);
    expect(next[1]!.inputs.loanAmount).toBe(250000);
    expect(next[0]!.name).toBe('Oryginał');
  });

  it('falls back to the original name when the given new name is blank', () => {
    const list = addScenario([], 'Oryginał', DEFAULT_INPUTS);
    const next = duplicateScenario(list, list[0]!.id, '   ');
    expect(next[1]!.name).toBe('Oryginał');
  });

  it('is a no-op when the id does not match any scenario', () => {
    const list = addScenario([], 'A', DEFAULT_INPUTS);
    const next = duplicateScenario(list, 'nonexistent', 'X');
    expect(next).toEqual(list);
  });

  it('regression: caps the list at 10 entries just like addScenario — duplicating must not bypass the storage growth limit', () => {
    let list: ReturnType<typeof addScenario> = [];
    for (let i = 0; i < 10; i++) list = addScenario(list, `S${i}`, DEFAULT_INPUTS);
    const next = duplicateScenario(list, list[0]!.id, 'S0 (kopia)');
    expect(next).toHaveLength(10);
    expect(next[9]!.name).toBe('S0 (kopia)');
    expect(next[0]!.name).toBe('S1');
  });
});

describe('compareScenarioToCurrent', () => {
  it('returns a positive interestDiff and monthsDiff when the scenario is worse than the current result (smaller overpay leaves more interest and more months)', () => {
    const current = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 1000 });
    const diff = compareScenarioToCurrent({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 200 }, current);
    expect(diff).not.toBeNull();
    expect(diff!.interestDiff).toBeGreaterThan(0);
    expect(diff!.monthsDiff).toBeGreaterThan(0);
  });

  it('returns a negative interestDiff and monthsDiff when the scenario is better than the current result', () => {
    const current = computeCalcState({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 200 });
    const diff = compareScenarioToCurrent({ ...DEFAULT_INPUTS, strategy: 'fixed_overpay', overpayAmountSlider: 1000 }, current);
    expect(diff).not.toBeNull();
    expect(diff!.interestDiff).toBeLessThan(0);
    expect(diff!.monthsDiff).toBeLessThan(0);
  });

  it('returns a zero diff for two identical inputs', () => {
    const current = computeCalcState(DEFAULT_INPUTS);
    const diff = compareScenarioToCurrent(DEFAULT_INPUTS, current);
    expect(diff).toEqual({ interestDiff: 0, monthsDiff: 0 });
  });

  it('regression: returns null for a scenario whose inputs no longer pass validation instead of throwing — a scenario saved under an older, looser validateInputs must not crash the comparison badge', () => {
    const current = computeCalcState(DEFAULT_INPUTS);
    const diff = compareScenarioToCurrent({ ...DEFAULT_INPUTS, loanAmount: -1 }, current);
    expect(diff).toBeNull();
  });
});

describe('inputsEqual', () => {
  it('is true for two separate objects with identical field values', () => {
    expect(inputsEqual({ ...DEFAULT_INPUTS }, { ...DEFAULT_INPUTS })).toBe(true);
  });

  it('is false when any single field differs', () => {
    expect(inputsEqual(DEFAULT_INPUTS, { ...DEFAULT_INPUTS, loanAmount: 123 })).toBe(false);
    expect(inputsEqual(DEFAULT_INPUTS, { ...DEFAULT_INPUTS, strategy: 'goal' })).toBe(false);
  });

  it('regression: this is what drives the "results are stale" banner — editing any field after calculating must be detected so the displayed results are not silently presented as current', () => {
    const before = { ...DEFAULT_INPUTS };
    const after = { ...DEFAULT_INPUTS, overpayStartMonth: 12 };
    expect(inputsEqual(before, after)).toBe(false);
  });
});
