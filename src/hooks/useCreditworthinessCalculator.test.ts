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
  addCreditworthinessScenario,
  removeCreditworthinessScenario,
  renameCreditworthinessScenario,
  loadCreditworthinessScenarios,
  persistCreditworthinessScenarios,
  parseCwScenariosJSON,
  cwScenariosToJSON,
  mergeImportedCwScenarios,
  willDropOldestCwScenario,
  sortCwScenarios,
  filterCwScenariosByName,
  MAX_CW_SCENARIOS,
  MAX_CW_SCENARIO_NAME_LENGTH,
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

  it('rejects years outside 1-35', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, years: 0 })).toBe('error_cw_years');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, years: 36 })).toBe('error_cw_years');
  });

  it('regression: resolveInitialCreditworthinessInputs clamps years from an old saved scenario (e.g. 40, from before MAX_LOAN_YEARS was lowered to 35) instead of discarding the whole scenario back to defaults', () => {
    const resolved = resolveInitialCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, netIncome: 12345, years: 40 });
    expect(resolved.years).toBe(35);
    expect(resolved.netIncome).toBe(12345);
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
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, firstPersonCost: -1 })).toBe('error_cw_out_of_range_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, additionalPersonCost: -1 })).toBe('error_cw_out_of_range_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, existingLoanInstallments: -1 })).toBe('error_cw_out_of_range_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, creditCardLimits: -1 })).toBe('error_cw_out_of_range_field');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, alimony: -1 })).toBe('error_cw_out_of_range_field');
  });

  it(
    'regression: rejects household cost / commitment fields above the UI slider maximum instead of silently ' +
      'accepting them — CreditworthinessCalculator.tsx clamps firstPersonCost/additionalPersonCost to 100 000 ' +
      'and existingLoanInstallments/creditCardLimits/alimony to 1 000 000, but validation previously only ' +
      'checked for negative values, so a hand-crafted URL/localStorage value above those caps used to pass ' +
      'and skew the result instead of producing a clear error (same bug class as householdSize above 20)',
    () => {
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, firstPersonCost: 100_001 })).toBe('error_cw_out_of_range_field');
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, firstPersonCost: 100_000 })).toBeNull();
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, additionalPersonCost: 100_001 })).toBe('error_cw_out_of_range_field');
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, existingLoanInstallments: 1_000_001 })).toBe('error_cw_out_of_range_field');
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, creditCardLimits: 1_000_001 })).toBe('error_cw_out_of_range_field');
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, alimony: 1_000_001 })).toBe('error_cw_out_of_range_field');
      expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, alimony: 1_000_000 })).toBeNull();
    }
  );

  it('regression: rejects netIncome above the UI field maximum (1 000 000), matching the same slider-vs-validation pattern', () => {
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, netIncome: 1_000_001 })).toBe('error_cw_income');
    expect(validateCreditworthinessInputs({ ...DEFAULT_CREDITWORTHINESS_INPUTS, netIncome: 1_000_000 })).toBeNull();
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

  it(
    'regression: also falls back to defaults for the upper-bound fields added in 0be975b/418fc1e ' +
      '(householdSize, firstPersonCost, existingLoanInstallments) — those commits fixed validateCreditworthinessInputs ' +
      'itself, but this locks in that the initial-load path (the one a crafted URL/localStorage entry actually ' +
      'goes through) rejects the same out-of-range values instead of leaking a distorted form state',
    () => {
      expect(resolveInitialCreditworthinessInputs({ householdSize: 999 })).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
      expect(resolveInitialCreditworthinessInputs({ firstPersonCost: 999_999_999 })).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
      expect(resolveInitialCreditworthinessInputs({ existingLoanInstallments: 99_999_999 })).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
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

describe('addCreditworthinessScenario / removeCreditworthinessScenario', () => {
  it('adds a scenario with a trimmed, length-clamped name and its own id/timestamp', () => {
    const list = addCreditworthinessScenario([], '  Rodzina, 2 osoby  ', DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('Rodzina, 2 osoby');
    expect(list[0]!.inputs).toEqual(DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(list[0]!.id).toBeTruthy();
    expect(list[0]!.savedAt).toBeGreaterThan(0);
  });

  it('clamps a very long scenario name to MAX_CW_SCENARIO_NAME_LENGTH', () => {
    const long = 'x'.repeat(MAX_CW_SCENARIO_NAME_LENGTH + 20);
    const list = addCreditworthinessScenario([], long, DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(list[0]!.name).toHaveLength(MAX_CW_SCENARIO_NAME_LENGTH);
  });

  it('drops the oldest scenario once the list exceeds MAX_CW_SCENARIOS', () => {
    let list: ReturnType<typeof addCreditworthinessScenario> = [];
    for (let i = 0; i < MAX_CW_SCENARIOS; i++) {
      list = addCreditworthinessScenario(list, `Wariant ${i}`, DEFAULT_CREDITWORTHINESS_INPUTS);
    }
    expect(list).toHaveLength(MAX_CW_SCENARIOS);
    list = addCreditworthinessScenario(list, 'Nowy', DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(list).toHaveLength(MAX_CW_SCENARIOS);
    expect(list[0]!.name).toBe('Wariant 1');
    expect(list[list.length - 1]!.name).toBe('Nowy');
  });

  it('removeCreditworthinessScenario filters out the matching id and leaves others untouched', () => {
    const list = addCreditworthinessScenario(
      addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS), 'B', DEFAULT_CREDITWORTHINESS_INPUTS
    );
    const targetId = list[0]!.id;
    const next = removeCreditworthinessScenario(list, targetId);
    expect(next).toHaveLength(1);
    expect(next[0]!.name).toBe('B');
  });

  it('removeCreditworthinessScenario is a no-op for an unknown id', () => {
    const list = addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(removeCreditworthinessScenario(list, 'nonexistent')).toEqual(list);
  });
});

describe('renameCreditworthinessScenario', () => {
  it('renames the matching scenario, trimmed', () => {
    const list = addCreditworthinessScenario([], 'Stary', DEFAULT_CREDITWORTHINESS_INPUTS);
    const next = renameCreditworthinessScenario(list, list[0]!.id, '  Nowy  ');
    expect(next[0]!.name).toBe('Nowy');
  });

  it('ignores an empty/whitespace-only new name, keeping the previous one', () => {
    const list = addCreditworthinessScenario([], 'Oryginał', DEFAULT_CREDITWORTHINESS_INPUTS);
    const next = renameCreditworthinessScenario(list, list[0]!.id, '   ');
    expect(next[0]!.name).toBe('Oryginał');
  });

  it('is a no-op for an unknown id', () => {
    const list = addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(renameCreditworthinessScenario(list, 'nonexistent', 'X')).toEqual(list);
  });

  it('clamps a very long new name to MAX_CW_SCENARIO_NAME_LENGTH, matching addCreditworthinessScenario', () => {
    const list = addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS);
    const long = 'y'.repeat(MAX_CW_SCENARIO_NAME_LENGTH + 10);
    const next = renameCreditworthinessScenario(list, list[0]!.id, long);
    expect(next[0]!.name).toHaveLength(MAX_CW_SCENARIO_NAME_LENGTH);
  });

  it('does not affect other scenarios in the list', () => {
    const list = addCreditworthinessScenario(
      addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS), 'B', DEFAULT_CREDITWORTHINESS_INPUTS
    );
    const next = renameCreditworthinessScenario(list, list[0]!.id, 'Zmieniona');
    expect(next[0]!.name).toBe('Zmieniona');
    expect(next[1]!.name).toBe('B');
  });
});

describe('willDropOldestCwScenario', () => {
  it('returns false while the list still has room for the new entries', () => {
    expect(willDropOldestCwScenario(0, 1)).toBe(false);
    expect(willDropOldestCwScenario(MAX_CW_SCENARIOS - 1, 1)).toBe(false);
  });

  it(
    'regression: returns true right at the MAX_CW_SCENARIOS boundary — addCreditworthinessScenario ' +
      'silently drops the oldest entry once the list would exceed the cap, so a save that hits it used ' +
      'to look identical in the UI to any other successful save, even though an older saved scenario ' +
      'vanished with no warning',
    () => {
      expect(willDropOldestCwScenario(MAX_CW_SCENARIOS, 1)).toBe(true);
      expect(willDropOldestCwScenario(MAX_CW_SCENARIOS - 1, 2)).toBe(true);
    }
  );
});

describe('sortCwScenarios', () => {
  const mk = (name: string, savedAt: number) => ({ id: name, name, savedAt, inputs: DEFAULT_CREDITWORTHINESS_INPUTS });

  const list = [mk('Bravo', 200), mk('alfa', 100), mk('Charlie', 300)];

  it('sorts by date descending (newest first) by default', () => {
    expect(sortCwScenarios(list, 'date-desc').map((s) => s.name)).toEqual(['Charlie', 'Bravo', 'alfa']);
  });

  it('sorts by date ascending (oldest first)', () => {
    expect(sortCwScenarios(list, 'date-asc').map((s) => s.name)).toEqual(['alfa', 'Bravo', 'Charlie']);
  });

  it('sorts by name, case-insensitively', () => {
    expect(sortCwScenarios(list, 'name-asc').map((s) => s.name)).toEqual(['alfa', 'Bravo', 'Charlie']);
  });

  it('does not mutate the original array', () => {
    const copy = [...list];
    sortCwScenarios(list, 'name-asc');
    expect(list).toEqual(copy);
  });
});

describe('filterCwScenariosByName', () => {
  const list = [
    { id: '1', name: 'Rodzina, 2 osoby', savedAt: 1, inputs: DEFAULT_CREDITWORTHINESS_INPUTS },
    { id: '2', name: 'Singiel', savedAt: 2, inputs: DEFAULT_CREDITWORTHINESS_INPUTS },
  ];

  it('returns the full list for an empty or whitespace-only query', () => {
    expect(filterCwScenariosByName(list, '')).toEqual(list);
    expect(filterCwScenariosByName(list, '   ')).toEqual(list);
  });

  it('filters case-insensitively by substring match', () => {
    expect(filterCwScenariosByName(list, 'rodzin').map((s) => s.id)).toEqual(['1']);
    expect(filterCwScenariosByName(list, 'SINGIEL').map((s) => s.id)).toEqual(['2']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterCwScenariosByName(list, 'nieistniejący')).toEqual([]);
  });
});

describe('parseCwScenariosJSON', () => {
  it('parses a valid array of scenarios', () => {
    const list = addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(parseCwScenariosJSON(JSON.stringify(list))).toEqual(list);
  });

  it('returns an empty array for malformed JSON or a non-array top level', () => {
    expect(parseCwScenariosJSON('not json')).toEqual([]);
    expect(parseCwScenariosJSON(JSON.stringify({ not: 'an array' }))).toEqual([]);
  });

  it(
    'regression: drops a scenario whose name is empty or whitespace-only instead of importing an unlabeled ' +
      'row — matches parseScenariosJSON in useCalculator.ts / parseSalaryScenariosJSON in useSalaryCalculator.ts',
    () => {
      const valid = { id: '1', name: 'OK', savedAt: Date.now(), inputs: DEFAULT_CREDITWORTHINESS_INPUTS };
      const blank = { id: '2', name: '   ', savedAt: Date.now(), inputs: DEFAULT_CREDITWORTHINESS_INPUTS };
      expect(parseCwScenariosJSON(JSON.stringify([valid, blank]))).toEqual([valid]);
    }
  );

  it('drops entries with a missing/wrong-typed field instead of throwing', () => {
    expect(parseCwScenariosJSON(JSON.stringify([{ id: '1' }, 'garbage', null]))).toEqual([]);
  });
});

describe('cwScenariosToJSON / mergeImportedCwScenarios', () => {
  it('round-trips a valid list through JSON', () => {
    const list = addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS);
    expect(parseCwScenariosJSON(cwScenariosToJSON(list))).toEqual(list);
  });

  it('mergeImportedCwScenarios assigns fresh ids to imported entries, avoiding collisions', () => {
    const existing = addCreditworthinessScenario([], 'Istniejący', DEFAULT_CREDITWORTHINESS_INPUTS);
    const imported = [{ id: existing[0]!.id, name: 'Zaimportowany', savedAt: Date.now(), inputs: DEFAULT_CREDITWORTHINESS_INPUTS }];
    const merged = mergeImportedCwScenarios(existing, imported);
    expect(merged).toHaveLength(2);
    expect(merged[1]!.id).not.toBe(existing[0]!.id);
  });

  it('mergeImportedCwScenarios caps the result at MAX_CW_SCENARIOS, keeping the newest', () => {
    let existing = addCreditworthinessScenario([], 'S0', DEFAULT_CREDITWORTHINESS_INPUTS);
    existing[0]!.savedAt = 1;
    for (let i = 1; i < MAX_CW_SCENARIOS; i++) {
      existing = addCreditworthinessScenario(existing, `S${i}`, DEFAULT_CREDITWORTHINESS_INPUTS);
      existing[existing.length - 1]!.savedAt = i + 1;
    }
    const imported = [{ id: 'x', name: 'Nowy import', savedAt: MAX_CW_SCENARIOS + 1, inputs: DEFAULT_CREDITWORTHINESS_INPUTS }];
    const merged = mergeImportedCwScenarios(existing, imported);
    expect(merged).toHaveLength(MAX_CW_SCENARIOS);
    expect(merged[merged.length - 1]!.name).toBe('Nowy import');
  });

  it('regression: importing an old export file must not delete the user\'s own newer scenarios — the cap used to trim by array position, so an old import could evict fresh, unrelated entries', () => {
    let existing = addCreditworthinessScenario([], 'Own0', DEFAULT_CREDITWORTHINESS_INPUTS);
    existing[0]!.savedAt = 1000;
    for (let i = 1; i < 8; i++) {
      existing = addCreditworthinessScenario(existing, `Own${i}`, DEFAULT_CREDITWORTHINESS_INPUTS);
      existing[existing.length - 1]!.savedAt = 1000 + i;
    }
    const imported = Array.from({ length: 5 }, (_, i) => ({
      id: `old-${i}`,
      name: `Old${i}`,
      savedAt: i + 1,
      inputs: DEFAULT_CREDITWORTHINESS_INPUTS,
    }));
    const merged = mergeImportedCwScenarios(existing, imported);
    expect(merged).toHaveLength(MAX_CW_SCENARIOS);
    expect(merged.filter((s) => s.savedAt >= 1000)).toHaveLength(8);
  });
});

describe('loadCreditworthinessScenarios / persistCreditworthinessScenarios', () => {
  let fake: FakeStorage;

  beforeEach(() => {
    fake = new FakeStorage();
    vi.stubGlobal('localStorage', fake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a scenario list through persist/load', () => {
    const list = addCreditworthinessScenario([], 'A', DEFAULT_CREDITWORTHINESS_INPUTS);
    persistCreditworthinessScenarios(list);
    expect(loadCreditworthinessScenarios()).toEqual(list);
  });

  it('returns an empty list when nothing has been saved yet', () => {
    expect(loadCreditworthinessScenarios()).toEqual([]);
  });

  it(
    'regression: persistCreditworthinessScenarios reports storage failure instead of silently succeeding — ' +
      'lets the hook set scenarioSaveError, same pattern as persistScenarios in useCalculator.ts',
    () => {
      vi.spyOn(fake, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(persistCreditworthinessScenarios([])).toBe(false);
    }
  );
});
