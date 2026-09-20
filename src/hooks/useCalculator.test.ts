import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseUrlInputs, validateInputs, resolvePerRowFixed, resolveFixedStd, naturalOverpaysWithStart, flatOverpayWithStart, clampCustomAnnualRate, saveInputs, loadStoredInputs, clearStoredInputs, inputsEqual, loadScenarios, persistScenarios, addScenario, removeScenario, renameScenario, duplicateScenario, compareScenarioToCurrent, computeCalcState, DEFAULT_INPUTS, type CalcState } from './useCalculator';
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

  it('regression: rejects a flat refi fee above the input\'s own 10,000,000 max — validateInputs had no upper bound here even though every sibling refi field (rate, months, origination fee) does, so a crafted ?refiFlat= link could push a nonsensical fee straight into the results', () => {
    expect(validateInputs({ ...validRefi, refiFlat: 10_000_001 })).toBe('error_refi_fee');
    expect(validateInputs({ ...validRefi, refiFlat: 10_000_000 })).toBeNull();
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
    persistScenarios(list);
    const loaded = loadScenarios();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.name).toBe('Wariant');
    expect(loaded[0]!.inputs.loanAmount).toBe(777000);
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
