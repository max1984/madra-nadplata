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

/**
 * Zwraca klucz i18n błędu albo null — jak validateInputs w useCalculator.ts.
 * Sprawdza tylko granice, których computeCreditworthiness nie clampuje po
 * cichu (ta funkcja jest defensywna wewnętrznie, ale UI powinno pokazać
 * błąd zamiast po cichu przycinać wartość, żeby użytkownik wiedział, że
 * coś wpisał źle).
 */
export function validateCreditworthinessInputs(inputs: CreditworthinessInputs): TranslationKey | null {
  if (!isFiniteNonNegative(inputs.netIncome) || inputs.netIncome <= 0) return 'error_cw_income';
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
  if (!isFiniteNonNegative(inputs.firstPersonCost)) return 'error_cw_negative_field';
  if (!isFiniteNonNegative(inputs.additionalPersonCost)) return 'error_cw_negative_field';
  if (!isFiniteNonNegative(inputs.existingLoanInstallments)) return 'error_cw_negative_field';
  if (!isFiniteNonNegative(inputs.creditCardLimits)) return 'error_cw_negative_field';
  if (!isFiniteNonNegative(inputs.alimony)) return 'error_cw_negative_field';
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

  return {
    inputs,
    setInputs,
    calcState,
    calcError,
    calculate,
    isStale,
    resetToDefaults,
  };
}
