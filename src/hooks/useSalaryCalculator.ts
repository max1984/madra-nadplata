import { useState, useCallback } from 'react';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../lib/safeStorage';
import {
  calcEmploymentContract,
  calcMandateContract,
  calcSpecificWorkContract,
  calcB2BContract,
  computeAnnualSalarySchedule,
  computeJointTaxation,
  taxReducingAmount,
  type EmploymentInputs,
  type EmploymentResult,
  type MandateInputs,
  type MandateResult,
  type SpecificWorkInputs,
  type SpecificWorkResult,
  type B2BInputs,
  type B2BResult,
  type AnnualScheduleResult,
  type JointTaxationResult,
  type SalaryContractType,
  type SpecialRelief,
  type TaxReducingShare,
  type KupOption,
  type MandateKupOption,
  type RyczaltRate,
  type B2BTaxForm,
  type B2BZusVariant,
} from '../lib/salary';

// ------------------------------------------------------------- stan ---

export type SalarySingleResult = EmploymentResult | MandateResult | SpecificWorkResult | B2BResult;

/**
 * Każdy typ umowy trzyma swój własny, kompletny stan formularza niezależnie
 * od tego, który jest aktualnie aktywny (`contractType`) — przełączanie
 * zakładek nie gubi wpisanych danych, tak jak `customPerRowEffects` w
 * kalkulatorze kredytu nie zależy od aktywnej strategii.
 */
export interface SalaryInputs {
  contractType: SalaryContractType;
  employment: EmploymentInputs;
  mandate: MandateInputs;
  specificWork: SpecificWorkInputs;
  b2b: B2BInputs;
  annualMode: boolean;
  /** 12 elementów, użyte tylko gdy `annualMode === true`. */
  annualMonthlyValues: number[];
  jointTaxation: { enabled: boolean; spouseAnnualTaxableIncome: number };
}

export const DEFAULT_SALARY_INPUTS: SalaryInputs = {
  contractType: 'employment',
  employment: {
    grossMonthly: 6000,
    kup: 'standard',
    specialRelief: 'none',
    reducingShare: 'full',
    ppk: { mode: 'none' },
  },
  mandate: {
    grossMonthly: 6000,
    kup: 'standard',
    specialRelief: 'none',
    reducingShare: 'full',
    isStudentUnder26: false,
    sicknessVoluntary: true,
  },
  specificWork: {
    grossMonthly: 6000,
    kup: 'standard',
    reducingShare: 'full',
  },
  b2b: {
    monthlyRevenue: 10000,
    monthlyCosts: 0,
    taxForm: 'liniowy',
    ryczaltRate: 0.12,
    ipBoxSharePercent: 0,
    zusVariant: 'pelny',
    sicknessVoluntary: false,
  },
  annualMode: false,
  annualMonthlyValues: Array(12).fill(6000),
  jointTaxation: { enabled: false, spouseAnnualTaxableIncome: 0 },
};

export type SalaryState =
  | { mode: 'single'; contractType: SalaryContractType; result: SalarySingleResult; jointTaxation: JointTaxationResult | null }
  | { mode: 'annual'; contractType: SalaryContractType; result: AnnualScheduleResult<SalarySingleResult>; jointTaxation: JointTaxationResult | null };

/**
 * Wspólne rozliczenie małżonków dotyczy tylko dochodów opodatkowanych skalą
 * (art. 6 ustawy o PIT) — umowa o pracę/zlecenie/dzieło zawsze się kwalifikują
 * (jedyna forma opodatkowania tam to skala), B2B tylko na formie 'skala'
 * (liniowy/ryczałt/IP Box wyłączone z mocy prawa, patrz JSDoc `computeJointTaxation`).
 */
export function qualifiesForJointTaxation(inputs: SalaryInputs): boolean {
  return inputs.contractType !== 'b2b' || inputs.b2b.taxForm === 'skala';
}

/** Roczna kwota zmniejszająca podatek dla aktywnego typu umowy — B2B na skali nie ma tej opcji (patrz salary.ts). */
function reducingAmountAnnualFor(inputs: SalaryInputs): number {
  switch (inputs.contractType) {
    case 'employment': return taxReducingAmount(inputs.employment.reducingShare) * 12;
    case 'mandate': return taxReducingAmount(inputs.mandate.reducingShare) * 12;
    case 'specific_work': return taxReducingAmount(inputs.specificWork.reducingShare) * 12;
    case 'b2b': return 0;
  }
}

function annualTaxableIncome(result: SalarySingleResult): number {
  if ('taxableIncomeThisMonth' in result) return result.taxableIncomeThisMonth * 12;
  if ('income' in result) return result.income * 12; // B2B
  return 0;
}

function annualTaxableIncomeFromSchedule(schedule: AnnualScheduleResult<SalarySingleResult>): number {
  return schedule.months.reduce((sum, m) => {
    if ('taxableIncomeThisMonth' in m) return sum + m.taxableIncomeThisMonth;
    if ('income' in m) return sum + m.income;
    return sum;
  }, 0);
}

function nonNegativeFinite(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Czysta funkcja: liczy wynik (jednomiesięczny albo roczny, zależnie od
 * `annualMode`) dla aktywnego typu umowy, plus opcjonalne wspólne rozliczenie
 * z małżonkiem, jeśli włączone i typ umowy/forma B2B się kwalifikuje.
 */
export function computeSalaryState(inputs: SalaryInputs): SalaryState {
  const { contractType } = inputs;
  const joint = inputs.jointTaxation.enabled && qualifiesForJointTaxation(inputs) ? inputs.jointTaxation : null;
  const spouseIncome = joint ? nonNegativeFinite(joint.spouseAnnualTaxableIncome) : 0;
  const reducingAmountAnnual = reducingAmountAnnualFor(inputs);

  if (!inputs.annualMode) {
    let result: SalarySingleResult;
    switch (contractType) {
      case 'employment': result = calcEmploymentContract(inputs.employment); break;
      case 'mandate': result = calcMandateContract(inputs.mandate); break;
      case 'specific_work': result = calcSpecificWorkContract(inputs.specificWork); break;
      case 'b2b': result = calcB2BContract(inputs.b2b); break;
    }
    const jointTaxation = joint
      ? computeJointTaxation(annualTaxableIncome(result), spouseIncome, reducingAmountAnnual)
      : null;
    return { mode: 'single', contractType, result, jointTaxation };
  }

  let schedule: AnnualScheduleResult<SalarySingleResult>;
  switch (contractType) {
    case 'employment': schedule = computeAnnualSalarySchedule('employment', inputs.annualMonthlyValues, inputs.employment); break;
    case 'mandate': schedule = computeAnnualSalarySchedule('mandate', inputs.annualMonthlyValues, inputs.mandate); break;
    case 'specific_work': schedule = computeAnnualSalarySchedule('specific_work', inputs.annualMonthlyValues, inputs.specificWork); break;
    case 'b2b': schedule = computeAnnualSalarySchedule('b2b', inputs.annualMonthlyValues, inputs.b2b); break;
  }
  const jointTaxation = joint
    ? computeJointTaxation(annualTaxableIncomeFromSchedule(schedule), spouseIncome, reducingAmountAnnual)
    : null;
  return { mode: 'annual', contractType, result: schedule, jointTaxation };
}

// -------------------------------------------------------- walidacja ---

function isFiniteNonNegative(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

/**
 * Zwraca komunikat błędu albo null. Na razie zwykły string — i18nSalary.ts
 * (kolejny krok planu) zamieni te literały na TranslationKey, tak jak
 * validateInputs robi to dla kalkulatora kredytu.
 * TODO: zamienić stringi na TranslationKey z i18nSalary.ts w następnym kroku.
 */
export function validateSalaryInputs(inputs: SalaryInputs): string | null {
  switch (inputs.contractType) {
    case 'employment':
      if (!isFiniteNonNegative(inputs.employment.grossMonthly)) return 'error_salary_gross';
      if (inputs.employment.bonusMonthly !== undefined && !isFiniteNonNegative(inputs.employment.bonusMonthly)) {
        return 'error_salary_bonus';
      }
      if (inputs.employment.copyrightSharePercent !== undefined) {
        const p = inputs.employment.copyrightSharePercent;
        if (!Number.isFinite(p) || p < 0 || p > 100) return 'error_salary_copyright_share';
      }
      break;
    case 'mandate':
      if (!isFiniteNonNegative(inputs.mandate.grossMonthly)) return 'error_salary_gross';
      break;
    case 'specific_work':
      if (!isFiniteNonNegative(inputs.specificWork.grossMonthly)) return 'error_salary_gross';
      break;
    case 'b2b':
      if (!isFiniteNonNegative(inputs.b2b.monthlyRevenue)) return 'error_salary_revenue';
      if (!isFiniteNonNegative(inputs.b2b.monthlyCosts)) return 'error_salary_costs';
      if (inputs.b2b.taxForm === 'ipbox') {
        const p = inputs.b2b.ipBoxSharePercent;
        if (!Number.isFinite(p) || p < 0 || p > 100) return 'error_salary_ipbox_share';
      }
      if (inputs.b2b.zusVariant === 'maly_zus_plus') {
        const base = inputs.b2b.malyZusPlusBase;
        if (base === undefined || !Number.isFinite(base) || base <= 0) return 'error_salary_maly_zus_base';
      }
      break;
  }

  if (inputs.annualMode) {
    if (inputs.annualMonthlyValues.length !== 12) return 'error_salary_annual_length';
    if (inputs.annualMonthlyValues.some((v) => !isFiniteNonNegative(v))) return 'error_salary_annual_value';
  }

  if (inputs.jointTaxation.enabled && !isFiniteNonNegative(inputs.jointTaxation.spouseAnnualTaxableIncome)) {
    return 'error_salary_spouse_income';
  }

  return null;
}

// ------------------------------------------------------- URL / typy ---

const SPECIAL_RELIEFS: SpecialRelief[] = ['none', 'under26', 'returning', 'family4plus', 'working_pensioner'];
const REDUCING_SHARES: TaxReducingShare[] = ['full', 'half', 'third', 'none'];
const KUP_OPTIONS: KupOption[] = ['standard', 'elevated'];
const MANDATE_KUP_OPTIONS: MandateKupOption[] = ['standard', 'copyright'];
const B2B_TAX_FORMS: B2BTaxForm[] = ['skala', 'liniowy', 'ryczalt', 'ipbox'];
const B2B_ZUS_VARIANTS: B2BZusVariant[] = ['ulga_na_start', 'preferencyjny', 'maly_zus_plus', 'pelny'];
const RYCZALT_RATES: RyczaltRate[] = [0.085, 0.12, 0.14, 0.15, 0.17];

function isSpecialRelief(v: string | null): v is SpecialRelief {
  return v !== null && (SPECIAL_RELIEFS as string[]).includes(v);
}
function isReducingShare(v: string | null): v is TaxReducingShare {
  return v !== null && (REDUCING_SHARES as string[]).includes(v);
}
function isKupOption(v: string | null): v is KupOption {
  return v !== null && (KUP_OPTIONS as string[]).includes(v);
}
function isMandateKupOption(v: string | null): v is MandateKupOption {
  return v !== null && (MANDATE_KUP_OPTIONS as string[]).includes(v);
}
function isB2BTaxForm(v: string | null): v is B2BTaxForm {
  return v !== null && (B2B_TAX_FORMS as string[]).includes(v);
}
function isB2BZusVariant(v: string | null): v is B2BZusVariant {
  return v !== null && (B2B_ZUS_VARIANTS as string[]).includes(v);
}
function isRyczaltRate(n: number | undefined): n is RyczaltRate {
  return n !== undefined && (RYCZALT_RATES as number[]).includes(n);
}

/**
 * Odrzuca parametry URL, które nie są skończonymi liczbami — tak samo jak
 * `parseNum` w useCalculator.ts, z tego samego powodu (uszkodzony/ręcznie
 * edytowany link nie może wpisać NaN wprost do formularza).
 */
function parseNum(sp: URLSearchParams, key: string): number | undefined {
  if (!sp.has(key)) return undefined;
  const n = Number(sp.get(key));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Serializuje tylko `contractType` + pola AKTUALNIE aktywnego typu umowy +
 * `annualMode` — bez `annualMonthlyValues` (12 liczb, zbyt długie na URL,
 * tylko w localStorage) i bez niestandardowych stawek PPK (rzadki przypadek,
 * nieopłacalny do serializacji; link odtworzy PPK jako 'none'/'standard').
 */
export function buildSalaryUrlParams(inputs: SalaryInputs): string {
  const sp = new URLSearchParams();
  sp.set('type', inputs.contractType);
  if (inputs.annualMode) sp.set('annual', '1');

  switch (inputs.contractType) {
    case 'employment': {
      const e = inputs.employment;
      sp.set('gross', String(e.grossMonthly));
      sp.set('kup', e.kup);
      sp.set('relief', e.specialRelief);
      sp.set('pit2', e.reducingShare);
      if (e.ppk.mode !== 'custom') sp.set('ppk', e.ppk.mode);
      if (e.bonusMonthly) sp.set('bonus', String(e.bonusMonthly));
      if (e.copyrightSharePercent) sp.set('copyright', String(e.copyrightSharePercent));
      break;
    }
    case 'mandate': {
      const m = inputs.mandate;
      sp.set('gross', String(m.grossMonthly));
      sp.set('kup', m.kup);
      sp.set('relief', m.specialRelief);
      sp.set('pit2', m.reducingShare);
      sp.set('student', m.isStudentUnder26 ? '1' : '0');
      sp.set('sickness', m.sicknessVoluntary ? '1' : '0');
      break;
    }
    case 'specific_work': {
      const s = inputs.specificWork;
      sp.set('gross', String(s.grossMonthly));
      sp.set('kup', s.kup);
      sp.set('pit2', s.reducingShare);
      break;
    }
    case 'b2b': {
      const b = inputs.b2b;
      sp.set('revenue', String(b.monthlyRevenue));
      sp.set('costs', String(b.monthlyCosts));
      sp.set('form', b.taxForm);
      sp.set('ryczaltRate', String(b.ryczaltRate));
      sp.set('ipboxShare', String(b.ipBoxSharePercent));
      sp.set('zus', b.zusVariant);
      sp.set('sickness', b.sicknessVoluntary ? '1' : '0');
      if (b.zusVariant === 'maly_zus_plus' && b.malyZusPlusBase !== undefined) {
        sp.set('malyZusBase', String(b.malyZusPlusBase));
      }
      break;
    }
  }
  return sp.toString();
}

export function parseUrlSalaryInputs(search: string = window.location.search): Partial<SalaryInputs> {
  const sp = new URLSearchParams(search);
  const patch: Partial<SalaryInputs> = {};

  const typeParam = sp.get('type');
  const contractType: SalaryContractType | undefined =
    typeParam === 'employment' || typeParam === 'mandate' || typeParam === 'specific_work' || typeParam === 'b2b'
      ? typeParam
      : undefined;
  if (contractType) patch.contractType = contractType;
  if (sp.get('annual') === '1') patch.annualMode = true;

  const activeType = contractType ?? DEFAULT_SALARY_INPUTS.contractType;
  const gross = parseNum(sp, 'gross');
  const kup = sp.get('kup');
  const relief = sp.get('relief');
  const pit2 = sp.get('pit2');

  // Każda gałąź zbiera tylko te pola, których param faktycznie był w URL —
  // i dokleja patch.employment/mandate/... TYLKO jeśli coś realnie znaleziono.
  // Inaczej (jak w pierwszej wersji) patch.employment było zawsze ustawiane
  // na kopię samych domyślnych wartości nawet dla całkowicie pustego URL, co
  // czyniło zwrócony obiekt zawsze "niepusty" (Object.keys(patch).length > 0)
  // — useSalaryCalculator() brało to za sygnał "jest patch" i liczyło wynik
  // od razu przy wejściu na stronę, bez kliknięcia "Oblicz" i bez żadnego
  // udostępnionego linku/zapisanych danych w tle (ten sam kontrakt co
  // parseUrlInputs w useCalculator.ts, gdzie każde pole jest ustawiane tylko
  // warunkowo przez helper `set`).
  if (activeType === 'employment') {
    const ppk = sp.get('ppk');
    const bonus = parseNum(sp, 'bonus');
    const copyright = parseNum(sp, 'copyright');
    const partial: Partial<EmploymentInputs> = {
      ...(gross !== undefined ? { grossMonthly: gross } : {}),
      ...(isKupOption(kup) ? { kup } : {}),
      ...(isSpecialRelief(relief) ? { specialRelief: relief } : {}),
      ...(isReducingShare(pit2) ? { reducingShare: pit2 } : {}),
      ...(ppk === 'standard' ? { ppk: { mode: 'standard' as const } } : ppk === 'none' ? { ppk: { mode: 'none' as const } } : {}),
      ...(bonus !== undefined ? { bonusMonthly: bonus } : {}),
      ...(copyright !== undefined ? { copyrightSharePercent: copyright } : {}),
    };
    if (Object.keys(partial).length > 0) patch.employment = { ...DEFAULT_SALARY_INPUTS.employment, ...partial };
  } else if (activeType === 'mandate') {
    const partial: Partial<MandateInputs> = {
      ...(gross !== undefined ? { grossMonthly: gross } : {}),
      ...(isMandateKupOption(kup) ? { kup } : {}),
      ...(isSpecialRelief(relief) ? { specialRelief: relief } : {}),
      ...(isReducingShare(pit2) ? { reducingShare: pit2 } : {}),
      ...(sp.get('student') === '1' ? { isStudentUnder26: true } : sp.get('student') === '0' ? { isStudentUnder26: false } : {}),
      ...(sp.get('sickness') === '1' ? { sicknessVoluntary: true } : sp.get('sickness') === '0' ? { sicknessVoluntary: false } : {}),
    };
    if (Object.keys(partial).length > 0) patch.mandate = { ...DEFAULT_SALARY_INPUTS.mandate, ...partial };
  } else if (activeType === 'specific_work') {
    const partial: Partial<SpecificWorkInputs> = {
      ...(gross !== undefined ? { grossMonthly: gross } : {}),
      ...(isMandateKupOption(kup) ? { kup } : {}),
      ...(isReducingShare(pit2) ? { reducingShare: pit2 } : {}),
    };
    if (Object.keys(partial).length > 0) patch.specificWork = { ...DEFAULT_SALARY_INPUTS.specificWork, ...partial };
  } else {
    const revenue = parseNum(sp, 'revenue');
    const costs = parseNum(sp, 'costs');
    const form = sp.get('form');
    const ryczaltRate = parseNum(sp, 'ryczaltRate');
    const ipboxShare = parseNum(sp, 'ipboxShare');
    const zus = sp.get('zus');
    const malyZusBase = parseNum(sp, 'malyZusBase');
    const partial: Partial<B2BInputs> = {
      ...(revenue !== undefined ? { monthlyRevenue: revenue } : {}),
      ...(costs !== undefined ? { monthlyCosts: costs } : {}),
      ...(isB2BTaxForm(form) ? { taxForm: form } : {}),
      ...(isRyczaltRate(ryczaltRate) ? { ryczaltRate } : {}),
      ...(ipboxShare !== undefined ? { ipBoxSharePercent: ipboxShare } : {}),
      ...(isB2BZusVariant(zus) ? { zusVariant: zus } : {}),
      ...(sp.get('sickness') === '1' ? { sicknessVoluntary: true } : sp.get('sickness') === '0' ? { sicknessVoluntary: false } : {}),
      ...(malyZusBase !== undefined ? { malyZusPlusBase: malyZusBase } : {}),
    };
    if (Object.keys(partial).length > 0) patch.b2b = { ...DEFAULT_SALARY_INPUTS.b2b, ...partial };
  }

  return patch;
}

// --------------------------------------------------------- storage ---

const STORED_SALARY_INPUTS_KEY = 'salary_inputs_v1';

export function saveSalaryInputs(inputs: SalaryInputs): void {
  safeSetItem(STORED_SALARY_INPUTS_KEY, JSON.stringify(inputs));
}

/**
 * localStorage jest edytowalne ręcznie i przeżywa zmiany kształtu danych
 * między wersjami aplikacji — parsowanie musi po cichu zwrócić null przy
 * czymkolwiek niespodziewanym, tak jak `loadStoredInputs` dla kalkulatora
 * kredytu.
 */
export function loadStoredSalaryInputs(): Partial<SalaryInputs> | null {
  const raw = safeGetItem(STORED_SALARY_INPUTS_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Partial<SalaryInputs>;
  } catch {
    return null;
  }
}

export function clearStoredSalaryInputs(): void {
  safeRemoveItem(STORED_SALARY_INPUTS_KEY);
}

/**
 * Scala DEFAULT_SALARY_INPUTS z patchem z URL/localStorage, z walidacją —
 * bez tego uszkodzony wpis w localStorage (ręczna edycja albo stary kształt
 * danych) pokazywałby NaN-y/śmieci w formularzu od razu po wczytaniu strony,
 * tak jak `resolveInitialInputs` zabezpiecza to dla kalkulatora kredytu.
 */
export function resolveInitialSalaryInputs(patch: Partial<SalaryInputs> | null): SalaryInputs {
  const merged: SalaryInputs = {
    ...DEFAULT_SALARY_INPUTS,
    ...patch,
    employment: { ...DEFAULT_SALARY_INPUTS.employment, ...patch?.employment },
    mandate: { ...DEFAULT_SALARY_INPUTS.mandate, ...patch?.mandate },
    specificWork: { ...DEFAULT_SALARY_INPUTS.specificWork, ...patch?.specificWork },
    b2b: { ...DEFAULT_SALARY_INPUTS.b2b, ...patch?.b2b },
    jointTaxation: { ...DEFAULT_SALARY_INPUTS.jointTaxation, ...patch?.jointTaxation },
  };
  return validateSalaryInputs(merged) === null ? merged : DEFAULT_SALARY_INPUTS;
}

// ---------------------------------------------------------- scenariusze ---

export interface SavedSalaryScenario {
  id: string;
  name: string;
  savedAt: number;
  inputs: SalaryInputs;
}

const SALARY_SCENARIOS_KEY = 'salary_scenarios_v1';
export const MAX_SALARY_SCENARIOS = 10;
export const MAX_SALARY_SCENARIO_NAME_LENGTH = 60;

/** Jak clampScenarioName w useCalculator.ts — patrz tam po uzasadnienie limitu. */
function clampSalaryScenarioName(name: string): string {
  return name.trim().slice(0, MAX_SALARY_SCENARIO_NAME_LENGTH);
}

/**
 * addSalaryScenario/duplicateSalaryScenario/mergeImportedSalaryScenarios
 * obcinają listę do MAX_SALARY_SCENARIOS, cicho wypychając najstarsze wpisy
 * — ta czysta funkcja pozwala UI sprawdzić z wyprzedzeniem, czy dodanie
 * `addingCount` scenariuszy do listy o `currentCount` wpisach coś wypchnie.
 */
export function willDropOldestSalaryScenario(currentCount: number, addingCount: number): boolean {
  return currentCount + addingCount > MAX_SALARY_SCENARIOS;
}

/**
 * Jak parseScenariosJSON w useCalculator.ts — jeden uszkodzony wpis (ręczna
 * edycja localStorage albo zewnętrzny plik importu) nie wywala całej listy,
 * a pusta/białoznakowa nazwa jest odrzucana tak samo jak tam.
 */
export function parseSalaryScenariosJSON(raw: string): SavedSalaryScenario[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is SavedSalaryScenario =>
      typeof s === 'object' && s !== null &&
      typeof (s as SavedSalaryScenario).id === 'string' &&
      typeof (s as SavedSalaryScenario).name === 'string' &&
      (s as SavedSalaryScenario).name.trim().length > 0 &&
      typeof (s as SavedSalaryScenario).savedAt === 'number' &&
      typeof (s as SavedSalaryScenario).inputs === 'object' && (s as SavedSalaryScenario).inputs !== null,
    );
  } catch {
    return [];
  }
}

export function loadSalaryScenarios(): SavedSalaryScenario[] {
  const raw = safeGetItem(SALARY_SCENARIOS_KEY);
  if (!raw) return [];
  return parseSalaryScenariosJSON(raw);
}

export function persistSalaryScenarios(list: SavedSalaryScenario[]): boolean {
  return safeSetItem(SALARY_SCENARIOS_KEY, JSON.stringify(list));
}

/** Do przycisku "Eksportuj scenariusze" — czytelny, wcięty JSON do pliku. */
export function salaryScenariosToJSON(list: SavedSalaryScenario[]): string {
  return JSON.stringify(list, null, 2);
}

/**
 * Jak mergeImportedScenarios w useCalculator.ts — nowe id dla każdego
 * zaimportowanego wpisu (unika kolizji z tym, co już jest zapisane w tej
 * samej przeglądarce), obcięte do MAX_SALARY_SCENARIOS wg savedAt (zachowuje
 * najnowsze), NIE wg pozycji w tablicy — import starego pliku eksportu przy
 * przekroczonym limicie kasowałby własne, nowsze scenariusze.
 */
export function mergeImportedSalaryScenarios(
  existing: SavedSalaryScenario[],
  imported: SavedSalaryScenario[]
): SavedSalaryScenario[] {
  const reIded = imported.map((s) => ({
    ...s,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  }));
  const next = [...existing, ...reIded];
  if (next.length <= MAX_SALARY_SCENARIOS) return next;
  const keep = new Set([...next].sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_SALARY_SCENARIOS));
  return next.filter((s) => keep.has(s));
}

export type SalaryScenarioSortKey = 'date-desc' | 'date-asc' | 'name-asc';

export function sortSalaryScenarios(list: SavedSalaryScenario[], sortBy: SalaryScenarioSortKey): SavedSalaryScenario[] {
  const sorted = [...list];
  switch (sortBy) {
    case 'date-asc':
      return sorted.sort((a, b) => a.savedAt - b.savedAt);
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    case 'date-desc':
    default:
      return sorted.sort((a, b) => b.savedAt - a.savedAt);
  }
}

/** Jak filterScenariosByName w useCalculator.ts. */
export function filterSalaryScenariosByName(list: SavedSalaryScenario[], query: string): SavedSalaryScenario[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => s.name.toLowerCase().includes(q));
}

/**
 * Dodaje nowy scenariusz na koniec listy, obcinając najstarsze wpisy powyżej
 * MAX_SALARY_SCENARIOS. Zapisuje CAŁY stan SalaryInputs (łącznie z aktywną
 * zakładką contractType) — inaczej niż kredyt, tu nie ma jednego "wyniku"
 * tylko 4 niezależne formularze, więc wczytanie musi przywrócić wszystko.
 */
export function addSalaryScenario(list: SavedSalaryScenario[], name: string, inputs: SalaryInputs): SavedSalaryScenario[] {
  const scenario: SavedSalaryScenario = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: clampSalaryScenarioName(name),
    savedAt: Date.now(),
    inputs,
  };
  const next = [...list, scenario];
  return next.length > MAX_SALARY_SCENARIOS ? next.slice(next.length - MAX_SALARY_SCENARIOS) : next;
}

export function removeSalaryScenario(list: SavedSalaryScenario[], id: string): SavedSalaryScenario[] {
  return list.filter((s) => s.id !== id);
}

/** Pusta/białoznakowa nazwa jest ignorowana (scenariusz zachowuje poprzednią nazwę) — jak renameScenario w useCalculator.ts. */
export function renameSalaryScenario(list: SavedSalaryScenario[], id: string, newName: string): SavedSalaryScenario[] {
  const trimmed = clampSalaryScenarioName(newName);
  if (!trimmed) return list;
  return list.map((s) => (s.id === id ? { ...s, name: trimmed } : s));
}

export function duplicateSalaryScenario(list: SavedSalaryScenario[], id: string, newName: string): SavedSalaryScenario[] {
  const original = list.find((s) => s.id === id);
  if (!original) return list;
  const copy: SavedSalaryScenario = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: clampSalaryScenarioName(newName) || original.name,
    savedAt: Date.now(),
    inputs: original.inputs,
  };
  const next = [...list, copy];
  return next.length > MAX_SALARY_SCENARIOS ? next.slice(next.length - MAX_SALARY_SCENARIOS) : next;
}

// ------------------------------------------------------------- hook ---

export function useSalaryCalculator() {
  const [inputs, setInputsState] = useState<SalaryInputs>(() => {
    const urlPatch = parseUrlSalaryInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredSalaryInputs();
    return resolveInitialSalaryInputs(patch);
  });

  const [calcState, setCalcState] = useState<SalaryState | null>(() => {
    const urlPatch = parseUrlSalaryInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredSalaryInputs();
    if (!patch) return null;
    const resolved = resolveInitialSalaryInputs(patch);
    return validateSalaryInputs(resolved) === null ? computeSalaryState(resolved) : null;
  });

  const [lastCalculatedInputs, setLastCalculatedInputs] = useState<SalaryInputs | null>(() => {
    const urlPatch = parseUrlSalaryInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredSalaryInputs();
    if (!patch) return null;
    const resolved = resolveInitialSalaryInputs(patch);
    return validateSalaryInputs(resolved) === null ? resolved : null;
  });

  const [calcError, setCalcError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<SavedSalaryScenario[]>(() => loadSalaryScenarios());
  const [scenarioSaveError, setScenarioSaveError] = useState(false);
  const [scenarioLimitReached, setScenarioLimitReached] = useState(false);

  const isStale =
    calcState !== null && lastCalculatedInputs !== null && JSON.stringify(inputs) !== JSON.stringify(lastCalculatedInputs);

  const setInputs = useCallback((patch: Partial<SalaryInputs>) => {
    setInputsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyCalculation = useCallback((inp: SalaryInputs): boolean => {
    const err = validateSalaryInputs(inp);
    if (err) {
      setCalcError(err);
      return false;
    }
    setCalcError(null);
    window.history.replaceState(null, '', '?' + buildSalaryUrlParams(inp));
    saveSalaryInputs(inp);
    setLastCalculatedInputs(inp);
    setCalcState(computeSalaryState(inp));
    return true;
  }, []);

  const calculate = useCallback(() => {
    applyCalculation(inputs);
  }, [inputs, applyCalculation]);

  const resetToDefaults = useCallback(() => {
    clearStoredSalaryInputs();
    setInputsState(DEFAULT_SALARY_INPUTS);
    setCalcState(null);
    setLastCalculatedInputs(null);
    setCalcError(null);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Zapisuje CAŁY bieżący stan `inputs` (nie tylko aktywną zakładkę) — patrz
  // addSalaryScenario. localStorage.setItem może rzucić (storage pełny/
  // zablokowany); scenarioSaveError daje UI sygnał do pokazania ostrzeżenia,
  // tak samo jak w kalkulatorze kredytu (patrz useCalculator.ts).
  const saveCurrentAsScenario = useCallback((name: string) => {
    setScenarios((prev) => {
      const next = addSalaryScenario(prev, name, inputs);
      setScenarioSaveError(!persistSalaryScenarios(next));
      setScenarioLimitReached(willDropOldestSalaryScenario(prev.length, 1));
      return next;
    });
  }, [inputs]);

  // resolveInitialSalaryInputs waliduje scenario.inputs przed wpisaniem do
  // formularza — parseSalaryScenariosJSON sprawdza tylko kształt obiektu,
  // nie wartości pól, więc uszkodzony/ręcznie zmodyfikowany zapisany
  // scenariusz mógł inaczej wpisać NaN-y wprost w pola (patrz
  // resolveInitialSalaryInputs i loadScenario w useCalculator.ts).
  const loadScenario = useCallback((id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const inp = resolveInitialSalaryInputs(scenario.inputs);
    setInputsState(inp);
    applyCalculation(inp);
  }, [scenarios, applyCalculation]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = removeSalaryScenario(prev, id);
      setScenarioSaveError(!persistSalaryScenarios(next));
      setScenarioLimitReached(false);
      return next;
    });
  }, []);

  const renameScenarioById = useCallback((id: string, newName: string) => {
    setScenarios((prev) => {
      const next = renameSalaryScenario(prev, id, newName);
      setScenarioSaveError(!persistSalaryScenarios(next));
      setScenarioLimitReached(false);
      return next;
    });
  }, []);

  const duplicateScenarioById = useCallback((id: string, newName: string) => {
    setScenarios((prev) => {
      const next = duplicateSalaryScenario(prev, id, newName);
      setScenarioSaveError(!persistSalaryScenarios(next));
      setScenarioLimitReached(willDropOldestSalaryScenario(prev.length, 1));
      return next;
    });
  }, []);

  /** Zwraca liczbę faktycznie zaimportowanych scenariuszy — do komunikatu w UI. */
  const importScenarios = useCallback((json: string): number => {
    const imported = parseSalaryScenariosJSON(json);
    if (imported.length === 0) return 0;
    setScenarios((prev) => {
      const next = mergeImportedSalaryScenarios(prev, imported);
      setScenarioSaveError(!persistSalaryScenarios(next));
      setScenarioLimitReached(willDropOldestSalaryScenario(prev.length, imported.length));
      return next;
    });
    return imported.length;
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
    renameScenarioById,
    duplicateScenarioById,
    importScenarios,
  };
}
