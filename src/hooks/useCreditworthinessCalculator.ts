import { useState, useCallback } from 'react';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../lib/safeStorage';
import {
  computeCreditworthiness,
  type CreditworthinessInputs,
  type CreditworthinessResult,
  type CreditworthinessContractType,
  type CreditRateType,
  DEFAULT_FIRST_PERSON_COST,
  DEFAULT_ADDITIONAL_PERSON_COST,
} from '../lib/creditworthiness';
import type { TranslationKey } from '../lib/i18n';

// ------------------------------------------------------------- stan ---

export const DEFAULT_CREDITWORTHINESS_INPUTS: CreditworthinessInputs = {
  netIncome: 8000,
  contractType: 'employment',
  incomeRecognitionRate: 100,
  householdSize: 1,
  firstPersonCost: DEFAULT_FIRST_PERSON_COST,
  additionalPersonCost: DEFAULT_ADDITIONAL_PERSON_COST,
  existingLoanInstallments: 0,
  creditCardLimits: 0,
  alimony: 0,
  years: 25,
  nominalRatePercent: 7,
  rateType: 'fixed',
};

// -------------------------------------------------------- walidacja ---

function isFiniteNonNegative(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

function isInRange(n: number, max: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= max;
}

/**
 * Zwraca klucz i18n błędu albo null — jak validateInputs w useCalculator.ts.
 * Sprawdza tylko granice, których computeCreditworthiness nie clampuje po
 * cichu (ta funkcja jest defensywna wewnętrznie, ale UI powinno pokazać
 * błąd zamiast po cichu przycinać wartość, żeby użytkownik wiedział, że
 * coś wpisał źle).
 */
export function validateCreditworthinessInputs(inputs: CreditworthinessInputs): TranslationKey | null {
  if (!isFiniteNonNegative(inputs.netIncome) || inputs.netIncome <= 0 || inputs.netIncome > 1_000_000) return 'error_cw_income';
  // Górna granica 20 zgodna z suwakiem w CreditworthinessCalculator.tsx — bez
  // niej ręcznie spreparowany link (?household=999) przechodził walidację i
  // dawał myląco zerowy wynik (koszty utrzymania astronomicznie wysokie),
  // zamiast czytelnego błędu jak każde inne pole poza zakresem UI.
  if (!Number.isFinite(inputs.householdSize) || inputs.householdSize < 1 || inputs.householdSize > 20) {
    return 'error_cw_household_size';
  }
  if (!Number.isFinite(inputs.years) || inputs.years < 1 || inputs.years > 40) return 'error_cw_years';
  if (!Number.isFinite(inputs.nominalRatePercent) || inputs.nominalRatePercent < 0 || inputs.nominalRatePercent > 30) {
    return 'error_cw_nominal_rate';
  }
  if (inputs.contractType !== 'employment') {
    const r = inputs.incomeRecognitionRate;
    if (!Number.isFinite(r) || r < 0 || r > 100) return 'error_cw_income_recognition';
  }
  // Górne granice zgodne z suwakami w CreditworthinessCalculator.tsx (100 000
  // dla kosztów utrzymania, 1 000 000 dla zobowiązań) — ten sam wzorzec buga
  // co householdSize wyżej: bez nich ręcznie spreparowany link przechodził
  // walidację i dawał myląco zniekształcony wynik zamiast czytelnego błędu.
  if (!isInRange(inputs.firstPersonCost, 100_000)) return 'error_cw_out_of_range_field';
  if (!isInRange(inputs.additionalPersonCost, 100_000)) return 'error_cw_out_of_range_field';
  if (!isInRange(inputs.existingLoanInstallments, 1_000_000)) return 'error_cw_out_of_range_field';
  if (!isInRange(inputs.creditCardLimits, 1_000_000)) return 'error_cw_out_of_range_field';
  if (!isInRange(inputs.alimony, 1_000_000)) return 'error_cw_out_of_range_field';
  return null;
}

// ------------------------------------------------------------- URL ---

const CONTRACT_TYPES: CreditworthinessContractType[] = ['employment', 'b2b', 'mandate_or_specific_work'];
const RATE_TYPES: CreditRateType[] = ['fixed', 'variable'];

function isContractType(v: string | null): v is CreditworthinessContractType {
  return v !== null && (CONTRACT_TYPES as string[]).includes(v);
}
function isRateType(v: string | null): v is CreditRateType {
  return v !== null && (RATE_TYPES as string[]).includes(v);
}

/** Jak parseNum w useCalculator.ts/useSalaryCalculator.ts — odrzuca wartości niebędące skończonymi liczbami. */
function parseNum(sp: URLSearchParams, key: string): number | undefined {
  if (!sp.has(key)) return undefined;
  const n = Number(sp.get(key));
  return Number.isFinite(n) ? n : undefined;
}

export function buildCreditworthinessUrlParams(inputs: CreditworthinessInputs): string {
  const sp = new URLSearchParams();
  sp.set('netIncome', String(inputs.netIncome));
  sp.set('contractType', inputs.contractType);
  if (inputs.contractType !== 'employment') sp.set('recognition', String(inputs.incomeRecognitionRate));
  sp.set('household', String(inputs.householdSize));
  sp.set('firstCost', String(inputs.firstPersonCost));
  sp.set('addCost', String(inputs.additionalPersonCost));
  sp.set('loans', String(inputs.existingLoanInstallments));
  sp.set('cards', String(inputs.creditCardLimits));
  sp.set('alimony', String(inputs.alimony));
  sp.set('years', String(inputs.years));
  sp.set('rate', String(inputs.nominalRatePercent));
  sp.set('rateType', inputs.rateType);
  return sp.toString();
}

/**
 * `netIncome` (i opcjonalnie `contractType`) mogą przyjść linkiem z
 * kalkulatora wynagrodzeń ("Sprawdź zdolność kredytową z tym dochodem") —
 * to nie jest osobna ścieżka, po prostu te same parametry co przy
 * standardowym udostępnionym linku tej strony.
 */
export function parseUrlCreditworthinessInputs(search: string = window.location.search): Partial<CreditworthinessInputs> {
  const sp = new URLSearchParams(search);
  const patch: Partial<CreditworthinessInputs> = {};

  const netIncome = parseNum(sp, 'netIncome');
  const contractType = sp.get('contractType');
  const recognition = parseNum(sp, 'recognition');
  const household = parseNum(sp, 'household');
  const firstCost = parseNum(sp, 'firstCost');
  const addCost = parseNum(sp, 'addCost');
  const loans = parseNum(sp, 'loans');
  const cards = parseNum(sp, 'cards');
  const alimony = parseNum(sp, 'alimony');
  const years = parseNum(sp, 'years');
  const rate = parseNum(sp, 'rate');
  const rateType = sp.get('rateType');

  if (netIncome !== undefined) patch.netIncome = netIncome;
  if (isContractType(contractType)) patch.contractType = contractType;
  if (recognition !== undefined) patch.incomeRecognitionRate = recognition;
  if (household !== undefined) patch.householdSize = household;
  if (firstCost !== undefined) patch.firstPersonCost = firstCost;
  if (addCost !== undefined) patch.additionalPersonCost = addCost;
  if (loans !== undefined) patch.existingLoanInstallments = loans;
  if (cards !== undefined) patch.creditCardLimits = cards;
  if (alimony !== undefined) patch.alimony = alimony;
  if (years !== undefined) patch.years = years;
  if (rate !== undefined) patch.nominalRatePercent = rate;
  if (isRateType(rateType)) patch.rateType = rateType;

  return patch;
}

// --------------------------------------------------------- storage ---

const STORED_CW_INPUTS_KEY = 'creditworthiness_inputs_v1';

export function saveCreditworthinessInputs(inputs: CreditworthinessInputs): void {
  safeSetItem(STORED_CW_INPUTS_KEY, JSON.stringify(inputs));
}

/** localStorage jest edytowalne ręcznie — parsowanie musi po cichu zwrócić null przy czymkolwiek niespodziewanym. */
export function loadStoredCreditworthinessInputs(): Partial<CreditworthinessInputs> | null {
  const raw = safeGetItem(STORED_CW_INPUTS_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Partial<CreditworthinessInputs>;
  } catch {
    return null;
  }
}

export function clearStoredCreditworthinessInputs(): void {
  safeRemoveItem(STORED_CW_INPUTS_KEY);
}

/**
 * Scala DEFAULT_CREDITWORTHINESS_INPUTS z patchem z URL/localStorage, z
 * walidacją — bez tego uszkodzony wpis w localStorage (albo link z
 * ręcznie dopisanymi parametrami) pokazywałby NaN-y/śmieci w formularzu od
 * razu po wczytaniu strony (jak resolveInitialInputs w useCalculator.ts).
 */
export function resolveInitialCreditworthinessInputs(
  patch: Partial<CreditworthinessInputs> | null
): CreditworthinessInputs {
  const merged: CreditworthinessInputs = { ...DEFAULT_CREDITWORTHINESS_INPUTS, ...patch };
  return validateCreditworthinessInputs(merged) === null ? merged : DEFAULT_CREDITWORTHINESS_INPUTS;
}

// ---------------------------------------------------------- scenariusze ---

export interface SavedCreditworthinessScenario {
  id: string;
  name: string;
  savedAt: number;
  inputs: CreditworthinessInputs;
}

const CW_SCENARIOS_KEY = 'creditworthiness_scenarios_v1';
export const MAX_CW_SCENARIOS = 10;
export const MAX_CW_SCENARIO_NAME_LENGTH = 60;

/** Jak clampScenarioName w useCalculator.ts — patrz tam po uzasadnienie limitu. */
function clampCwScenarioName(name: string): string {
  return name.trim().slice(0, MAX_CW_SCENARIO_NAME_LENGTH);
}

/**
 * Jak parseScenariosJSON w useCalculator.ts — jeden uszkodzony wpis (ręczna
 * edycja localStorage) nie wywala całej listy, a pusta/białoznakowa nazwa
 * jest odrzucana tak samo jak tam.
 */
export function parseCwScenariosJSON(raw: string): SavedCreditworthinessScenario[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is SavedCreditworthinessScenario =>
      typeof s === 'object' && s !== null &&
      typeof (s as SavedCreditworthinessScenario).id === 'string' &&
      typeof (s as SavedCreditworthinessScenario).name === 'string' &&
      (s as SavedCreditworthinessScenario).name.trim().length > 0 &&
      typeof (s as SavedCreditworthinessScenario).savedAt === 'number' &&
      typeof (s as SavedCreditworthinessScenario).inputs === 'object' && (s as SavedCreditworthinessScenario).inputs !== null,
    );
  } catch {
    return [];
  }
}

export function loadCreditworthinessScenarios(): SavedCreditworthinessScenario[] {
  const raw = safeGetItem(CW_SCENARIOS_KEY);
  if (!raw) return [];
  return parseCwScenariosJSON(raw);
}

export function persistCreditworthinessScenarios(list: SavedCreditworthinessScenario[]): boolean {
  return safeSetItem(CW_SCENARIOS_KEY, JSON.stringify(list));
}

/**
 * Dodaje nowy scenariusz na koniec listy, obcinając najstarsze wpisy powyżej
 * MAX_CW_SCENARIOS (jak addScenario w useCalculator.ts). Zapisuje CAŁY stan
 * CreditworthinessInputs.
 */
export function addCreditworthinessScenario(
  list: SavedCreditworthinessScenario[], name: string, inputs: CreditworthinessInputs
): SavedCreditworthinessScenario[] {
  const scenario: SavedCreditworthinessScenario = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: clampCwScenarioName(name),
    savedAt: Date.now(),
    inputs,
  };
  const next = [...list, scenario];
  return next.length > MAX_CW_SCENARIOS ? next.slice(next.length - MAX_CW_SCENARIOS) : next;
}

export function removeCreditworthinessScenario(list: SavedCreditworthinessScenario[], id: string): SavedCreditworthinessScenario[] {
  return list.filter((s) => s.id !== id);
}

/**
 * addCreditworthinessScenario obcina listę do MAX_CW_SCENARIOS, cicho
 * wypychając najstarszy wpis — jak willDropOldestSalaryScenario w
 * useSalaryCalculator.ts, pozwala UI sprawdzić z wyprzedzeniem, czy zapis
 * coś wypchnie, żeby pokazać ostrzeżenie zamiast ciszy.
 */
export function willDropOldestCwScenario(currentCount: number, addingCount: number): boolean {
  return currentCount + addingCount > MAX_CW_SCENARIOS;
}

// ------------------------------------------------------------- hook ---

export function useCreditworthinessCalculator() {
  const [inputs, setInputsState] = useState<CreditworthinessInputs>(() => {
    const urlPatch = parseUrlCreditworthinessInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredCreditworthinessInputs();
    return resolveInitialCreditworthinessInputs(patch);
  });

  const [calcState, setCalcState] = useState<CreditworthinessResult | null>(() => {
    const urlPatch = parseUrlCreditworthinessInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredCreditworthinessInputs();
    if (!patch) return null;
    const resolved = resolveInitialCreditworthinessInputs(patch);
    return validateCreditworthinessInputs(resolved) === null ? computeCreditworthiness(resolved) : null;
  });

  const [lastCalculatedInputs, setLastCalculatedInputs] = useState<CreditworthinessInputs | null>(() => {
    const urlPatch = parseUrlCreditworthinessInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredCreditworthinessInputs();
    if (!patch) return null;
    const resolved = resolveInitialCreditworthinessInputs(patch);
    return validateCreditworthinessInputs(resolved) === null ? resolved : null;
  });

  const [calcError, setCalcError] = useState<TranslationKey | null>(null);
  const [scenarios, setScenarios] = useState<SavedCreditworthinessScenario[]>(() => loadCreditworthinessScenarios());
  const [scenarioSaveError, setScenarioSaveError] = useState(false);
  const [scenarioLimitReached, setScenarioLimitReached] = useState(false);

  const isStale =
    calcState !== null && lastCalculatedInputs !== null && JSON.stringify(inputs) !== JSON.stringify(lastCalculatedInputs);

  const setInputs = useCallback((patch: Partial<CreditworthinessInputs>) => {
    setInputsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyCalculation = useCallback((inp: CreditworthinessInputs): boolean => {
    const err = validateCreditworthinessInputs(inp);
    if (err) {
      setCalcError(err);
      return false;
    }
    setCalcError(null);
    window.history.replaceState(null, '', '?' + buildCreditworthinessUrlParams(inp));
    saveCreditworthinessInputs(inp);
    setLastCalculatedInputs(inp);
    setCalcState(computeCreditworthiness(inp));
    return true;
  }, []);

  const calculate = useCallback(() => {
    applyCalculation(inputs);
  }, [inputs, applyCalculation]);

  const resetToDefaults = useCallback(() => {
    clearStoredCreditworthinessInputs();
    setInputsState(DEFAULT_CREDITWORTHINESS_INPUTS);
    setCalcState(null);
    setLastCalculatedInputs(null);
    setCalcError(null);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Zapisuje CAŁY bieżący stan `inputs`. localStorage.setItem może rzucić
  // (storage pełny/zablokowany); scenarioSaveError daje UI sygnał do
  // pokazania ostrzeżenia, tak samo jak w pozostałych dwóch kalkulatorach.
  const saveCurrentAsScenario = useCallback((name: string) => {
    setScenarios((prev) => {
      const next = addCreditworthinessScenario(prev, name, inputs);
      setScenarioSaveError(!persistCreditworthinessScenarios(next));
      setScenarioLimitReached(willDropOldestCwScenario(prev.length, 1));
      return next;
    });
  }, [inputs]);

  // resolveInitialCreditworthinessInputs waliduje scenario.inputs przed
  // wpisaniem do formularza — parseCwScenariosJSON sprawdza tylko kształt
  // obiektu, nie wartości pól (jak loadScenario w useCalculator.ts/
  // useSalaryCalculator.ts).
  const loadScenario = useCallback((id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const inp = resolveInitialCreditworthinessInputs(scenario.inputs);
    setInputsState(inp);
    applyCalculation(inp);
  }, [scenarios, applyCalculation]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = removeCreditworthinessScenario(prev, id);
      setScenarioSaveError(!persistCreditworthinessScenarios(next));
      setScenarioLimitReached(false);
      return next;
    });
  }, []);

  return {
    inputs,
    setInputs,
    calcState,
    calcError,
    calculate,
    isStale,
    resetToDefaults,
    scenarios,
    scenarioSaveError,
    scenarioLimitReached,
    saveCurrentAsScenario,
    loadScenario,
    deleteScenario,
  };
}
