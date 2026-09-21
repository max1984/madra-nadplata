import { useState, useCallback } from 'react';
import { parseLocaleNumber } from '../lib/format';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../lib/safeStorage';
import {
  calcStdPayment,
  buildSchedule,
  buildBaseSchedule,
  buildRefinanceSchedule,
  naturalOverpaysFromBalance,
  balanceAt,
  solveOverpayForTarget,
  type ScheduleRow,
} from '../lib/mortgage';
import type { TranslationKey } from '../lib/i18n';

export type Strategy = 'reduce_payment' | 'fixed_total' | 'fixed_overpay' | 'shorten_period' | 'goal' | 'custom' | 'refinance';

export interface CalcInputs {
  loanAmount: number;
  interestRate: number;
  loanMonths: number;
  prepayFee: number;
  strategy: Strategy;
  totalMonthlySlider: number;
  overpayAmountSlider: number;
  shortenAmountSlider: number;
  /** Cel spłaty: docelowa liczba rat (strategia 'goal'). */
  goalMonths: number;
  overpayStartMonth: number;
  /** "13. rata" — raz w roku dopłać jedną dodatkową standardową ratę. */
  extraAnnualPayment: boolean;
  refiMonth: number;
  refiRate: number;
  refiMonths: number;
  refiOriginationFee: number;
  refiFlat: number;
}

export interface RefiData {
  month: number;
  balance: number;
  originationFeeAmount: number;
  flatFeeAmount: number;
  phase1Interest: number;
  phase2Interest: number;
  newRate: number;
  newMonths: number;
}

export interface CalcState {
  P: number;
  r: number;
  months: number;
  prepayFee: number;
  stdPayment: number;
  origStdPayment: number;
  customOverpay: number[];
  customRates: number[];
  strategy: Strategy;
  customEffect: 'shorten' | 'reduce';
  customPerRowEffects: ('shorten' | 'reduce')[];
  overpayStartMonth: number;
  extraAnnualPayment: boolean;
  totalMonthly: number;
  defaultOverpay: number;
  /** Nadpłata wyliczona przez solver dla strategii 'goal'. */
  requiredOverpay?: number;
  goalMonths?: number;
  baseInterest: number;
  baseMonths: number;
  baseBalances: number[];
  baseCumInterestByMonth: number[];
  rows: ScheduleRow[];
  refiData?: RefiData;
}

export const DEFAULT_INPUTS: CalcInputs = {
  loanAmount: 300000,
  interestRate: 6,
  loanMonths: 360,
  prepayFee: 0,
  strategy: 'fixed_total',
  totalMonthlySlider: 2300,
  overpayAmountSlider: 500,
  shortenAmountSlider: 500,
  goalMonths: 180,
  overpayStartMonth: 0,
  extraAnnualPayment: false,
  refiMonth: 12,
  refiRate: 5,
  refiMonths: 300,
  refiOriginationFee: 2,
  refiFlat: 0,
};

/**
 * Parsuje liczbowe parametry URL, pomijając te, które nie są skończonymi
 * liczbami (np. ?amount=abc albo ?rate=Infinity) — inaczej trafiały jako NaN
 * wprost do stanu formularza i pola wejściowe wyglądały na puste/zepsute
 * dla każdego, kto dostał uszkodzony link do udostępnionego wyliczenia.
 */
function parseNum(sp: URLSearchParams, key: string): number | undefined {
  if (!sp.has(key)) return undefined;
  const n = Number(sp.get(key));
  return Number.isFinite(n) ? n : undefined;
}

export function parseUrlInputs(search: string = window.location.search): Partial<CalcInputs> {
  const sp = new URLSearchParams(search);
  const patch: Partial<CalcInputs> = {};
  const set = <K extends keyof CalcInputs>(key: K, value: CalcInputs[K] | undefined) => {
    if (value !== undefined) patch[key] = value;
  };

  set('loanAmount', parseNum(sp, 'amount'));
  set('interestRate', parseNum(sp, 'rate'));
  set('loanMonths', parseNum(sp, 'months'));
  set('prepayFee', parseNum(sp, 'fee'));
  const strat = sp.get('strategy');
  if (strat === 'reduce_payment') {
    patch.strategy = 'fixed_total'; // reduce_payment was removed; it was identical to fixed_total
  } else if (strat && ['fixed_total', 'fixed_overpay', 'shorten_period', 'goal', 'custom', 'refinance'].includes(strat)) {
    patch.strategy = strat as Strategy;
  }
  set('totalMonthlySlider', parseNum(sp, 'total'));
  set('overpayAmountSlider', parseNum(sp, 'overpay'));
  set('shortenAmountSlider', parseNum(sp, 'shorten'));
  set('goalMonths', parseNum(sp, 'goal'));
  set('overpayStartMonth', parseNum(sp, 'start'));
  if (sp.get('extra13') === '1') patch.extraAnnualPayment = true;
  set('refiMonth', parseNum(sp, 'refiMonth'));
  set('refiRate', parseNum(sp, 'refiRate'));
  set('refiMonths', parseNum(sp, 'refiMonths'));
  set('refiOriginationFee', parseNum(sp, 'refiOFee'));
  set('refiFlat', parseNum(sp, 'refiFlat'));
  return patch;
}

export function buildUrlParams(inp: CalcInputs): string {
  const sp = new URLSearchParams();
  sp.set('amount', String(inp.loanAmount));
  sp.set('rate', String(inp.interestRate));
  sp.set('months', String(inp.loanMonths));
  sp.set('fee', String(inp.prepayFee));
  sp.set('strategy', inp.strategy);
  if (inp.strategy === 'fixed_total') sp.set('total', String(inp.totalMonthlySlider));
  if (inp.strategy === 'fixed_overpay') sp.set('overpay', String(inp.overpayAmountSlider));
  if (inp.strategy === 'shorten_period') sp.set('shorten', String(inp.shortenAmountSlider));
  if (inp.strategy === 'goal') sp.set('goal', String(inp.goalMonths));
  if (inp.overpayStartMonth > 0) sp.set('start', String(inp.overpayStartMonth));
  if (inp.extraAnnualPayment) sp.set('extra13', '1');
  if (inp.strategy === 'refinance') {
    sp.set('refiMonth', String(inp.refiMonth));
    sp.set('refiRate', String(inp.refiRate));
    sp.set('refiMonths', String(inp.refiMonths));
    sp.set('refiOFee', String(inp.refiOriginationFee));
    if (inp.refiFlat > 0) sp.set('refiFlat', String(inp.refiFlat));
  }
  return sp.toString();
}

const STORED_INPUTS_KEY = 'calc_inputs_v1';

/**
 * Zapisuje dane formularza po udanym wyliczeniu, żeby powracający użytkownik
 * nie zaczynał od zera przy kolejnej wizycie — tak samo jak link URL już to
 * robi, tylko bez konieczności zapisywania/przesyłania linku.
 */
export function saveInputs(inp: CalcInputs): void {
  safeSetItem(STORED_INPUTS_KEY, JSON.stringify(inp));
}

/**
 * Wczytuje ostatnio zapisane dane formularza. localStorage jest edytowalne
 * ręcznie (DevTools) i przeżywa zmiany kształtu CalcInputs między wersjami
 * aplikacji, więc parsowanie musi po cichu zwrócić null przy czymkolwiek
 * niespodziewanym zamiast rzucić wyjątkiem w trakcie inicjalizacji stanu.
 */
export function loadStoredInputs(): Partial<CalcInputs> | null {
  const raw = safeGetItem(STORED_INPUTS_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Partial<CalcInputs>;
  } catch {
    return null;
  }
}

/** Usuwa zapamiętane dane formularza — używane przez "Przywróć domyślne". */
export function clearStoredInputs(): void {
  safeRemoveItem(STORED_INPUTS_KEY);
}

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: number;
  inputs: CalcInputs;
}

const SCENARIOS_KEY = 'calc_scenarios_v1';
const MAX_SCENARIOS = 10;

/**
 * Jak loadStoredInputs — localStorage jest edytowalne ręcznie i przeżywa
 * zmiany kształtu danych między wersjami, więc każdy wpis jest osobno
 * walidowany; jeden uszkodzony scenariusz nie może wywalić całej listy.
 */
/**
 * Wydzielone z loadScenarios, żeby ta sama walidacja (jeden uszkodzony
 * wpis nie wywala całej listy) obsługiwała też import scenariuszy z
 * pliku wyeksportowanego wcześniej — tam JSON pochodzi z zewnątrz i może
 * być równie niekompletny/uszkodzony jak coś ręcznie zmienionego w
 * localStorage.
 */
export function parseScenariosJSON(raw: string): SavedScenario[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // name musi być niepustym (po trim) stringiem — addScenario/renameScenario
    // już to gwarantują dla scenariuszy tworzonych w UI (renameScenario odrzuca
    // pustą nazwę, handleSaveScenario nie wywołuje zapisu bez niej), ale plik
    // importu to zewnętrzne dane: ręcznie spreparowany "name": "" przechodził
    // dotąd sprawdzenie kształtu i trafiał na listę jako scenariusz bez etykiety
    // — niewidoczny, "pusty" wiersz w UI, mylący i trudny do skasowania/kliknięcia.
    return parsed.filter((s): s is SavedScenario =>
      typeof s === 'object' && s !== null &&
      typeof (s as SavedScenario).id === 'string' &&
      typeof (s as SavedScenario).name === 'string' &&
      (s as SavedScenario).name.trim().length > 0 &&
      typeof (s as SavedScenario).savedAt === 'number' &&
      typeof (s as SavedScenario).inputs === 'object' && (s as SavedScenario).inputs !== null,
    );
  } catch {
    return [];
  }
}

export function loadScenarios(): SavedScenario[] {
  const raw = safeGetItem(SCENARIOS_KEY);
  if (!raw) return [];
  return parseScenariosJSON(raw);
}

export function persistScenarios(list: SavedScenario[]): boolean {
  return safeSetItem(SCENARIOS_KEY, JSON.stringify(list));
}

/** Do przycisku "Eksportuj scenariusze" — czytelny, wcięty JSON do pliku. */
export function scenariosToJSON(list: SavedScenario[]): string {
  return JSON.stringify(list, null, 2);
}

/**
 * Dokleja zaimportowane scenariusze do już zapisanych, nadając im nowe id
 * — inaczej import pliku wyeksportowanego wcześniej z TEJ SAMEJ przeglądarki
 * dawałby kolizję id z wpisami, które już tam są. Wynik obcięty do
 * MAX_SCENARIOS tak samo jak w addScenario (zachowuje najnowsze).
 */
export function mergeImportedScenarios(existing: SavedScenario[], imported: SavedScenario[]): SavedScenario[] {
  const reIded = imported.map((s) => ({
    ...s,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  }));
  const next = [...existing, ...reIded];
  return next.length > MAX_SCENARIOS ? next.slice(next.length - MAX_SCENARIOS) : next;
}

export type ScenarioSortKey = 'date-desc' | 'date-asc' | 'name-asc';

/**
 * Kolejność wyświetlania zapisanych scenariuszy — sama lista w localStorage
 * zawsze rośnie na końcu (najstarsze na początku), co przy kilku wariantach
 * robi się niewygodne do przeglądania. Domyślne sortowanie w UI to
 * 'date-desc' (najnowsze pierwsze), ale funkcja jest czystą transformacją
 * niezależną od tego wyboru, żeby dało się ją łatwo przetestować.
 */
export function sortScenarios(list: SavedScenario[], sortBy: ScenarioSortKey): SavedScenario[] {
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

/**
 * Filtruje zapisane scenariusze po nazwie — bez rozróżniania wielkości liter
 * i z przyciętymi spacjami, żeby przy kilkunastu wariantach dało się szybko
 * odnaleźć właściwy zamiast przewijać całą listę. Pusty (po trim) filtr
 * zwraca całą listę bez zmian.
 */
export function filterScenariosByName(list: SavedScenario[], query: string): SavedScenario[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => s.name.toLowerCase().includes(q));
}

/** Klucz tłumaczenia etykiety strategii — do CSV i wszędzie, gdzie trzeba pokazać nazwę strategii tekstem. */
export function strategyLabelKey(strategy: Strategy): TranslationKey {
  switch (strategy) {
    case 'fixed_overpay': return 'strategy_fixed_overpay';
    case 'shorten_period': return 'strategy_shorten';
    case 'custom': return 'strategy_custom';
    case 'goal': return 'strategy_goal';
    case 'refinance': return 'strategy_refinance';
    case 'reduce_payment':
    case 'fixed_total':
    default:
      return 'strategy_fixed_total';
  }
}

export interface ScenarioComparisonRow {
  name: string;
  loanAmount: number;
  interestRate: number;
  strategy: Strategy;
  months: number;
  totalInterest: number;
  interestSaved: number;
  monthsSaved: number;
  savedAt: number;
}

/**
 * Przelicza każdy zapisany scenariusz od zera (computeCalcState na jego
 * własnych inputs) — nie polega na tym, co akurat jest w kalkulatorze na
 * ekranie, więc porównanie działa niezależnie od bieżącego wyniku.
 *
 * interestSaved/monthsSaved porównują scenariusz z jego własnym baseInterest/
 * baseMonths (harmonogram tego samego kredytu bez żadnej nadpłaty) — nie z
 * innymi scenariuszami na liście — więc mają sens nawet przy porównywaniu
 * kredytów o różnej kwocie czy oprocentowaniu.
 */
/**
 * Pomija scenariusze, których inputs nie przechodzą validateInputs — inaczej
 * niż compareScenarioToCurrent (patrz niżej), ta funkcja tego nie robiła.
 * parseScenariosJSON sprawdza tylko kształt obiektu (id/name/savedAt/inputs),
 * nie wartości pól, więc ręcznie zmodyfikowany albo uszkodzony plik importu
 * mógł przemycić scenariusz z np. inputs={} — bez tego filtra computeCalcState
 * dostawało undefined zamiast liczb i po cichu produkowało wiersz-śmieć
 * ("0 miesięcy", NaN-y) w tabeli porównania i eksporcie CSV zamiast go pominąć.
 */
export function buildScenarioComparisonRows(scenarios: SavedScenario[]): ScenarioComparisonRow[] {
  return scenarios.filter((s) => validateInputs(s.inputs) === null).map((s) => {
    const state = computeCalcState(s.inputs);
    const totalInterest = state.rows.length ? state.rows[state.rows.length - 1]!.cumInterest : 0;
    return {
      name: s.name,
      loanAmount: s.inputs.loanAmount,
      interestRate: s.inputs.interestRate,
      strategy: s.inputs.strategy,
      months: state.rows.length,
      totalInterest,
      interestSaved: Math.max(0, state.baseInterest - totalInterest),
      monthsSaved: Math.max(0, state.baseMonths - state.rows.length),
      savedAt: s.savedAt,
    };
  });
}

/**
 * Dodaje nowy scenariusz na koniec listy, obcinając najstarsze wpisy powyżej
 * MAX_SCENARIOS — bez limitu localStorage rosłoby bez końca komuś, kto
 * zapisuje wiele wariantów w jednej sesji. Nazwa jest przycinana, ale
 * pusta nazwa nie jest tu domyślnie podstawiana — o to dba UI (przycisk
 * "Zapisz" jest wyłączony bez treści w polu), żeby uniknąć hardkodowania
 * jednego języka w kodzie biblioteki niezależnym od i18n.
 */
export function addScenario(list: SavedScenario[], name: string, inputs: CalcInputs): SavedScenario[] {
  const scenario: SavedScenario = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    savedAt: Date.now(),
    inputs,
  };
  const next = [...list, scenario];
  return next.length > MAX_SCENARIOS ? next.slice(next.length - MAX_SCENARIOS) : next;
}

export function removeScenario(list: SavedScenario[], id: string): SavedScenario[] {
  return list.filter((s) => s.id !== id);
}

/**
 * Pusta/białoznakowa nazwa jest ignorowana (scenariusz zachowuje poprzednią
 * nazwę) zamiast dawać scenariusz bez nazwy — łatwo o to przez przypadkowe
 * zatwierdzenie pustego pola edycji Enterem albo utratę fokusu.
 */
export function renameScenario(list: SavedScenario[], id: string, newName: string): SavedScenario[] {
  const trimmed = newName.trim();
  if (!trimmed) return list;
  return list.map((s) => (s.id === id ? { ...s, name: trimmed } : s));
}

/**
 * Duplikuje istniejący scenariusz pod nową nazwą — punkt wyjścia do
 * eksperymentowania z wariantem bez utraty oryginału (np. "Wariant X" →
 * "Wariant X (kopia)", a potem edycja formularza i ponowny zapis pod tą
 * kopią). Nazwa przychodzi z zewnątrz (a nie jest tu doklejana na sztywno
 * jak "(kopia)"), żeby ta czysta funkcja biblioteki nie musiała znać
 * aktualnego języka aplikacji — o tłumaczenie sufiksu dba wywołujący (UI).
 */
export function duplicateScenario(list: SavedScenario[], id: string, newName: string): SavedScenario[] {
  const original = list.find((s) => s.id === id);
  if (!original) return list;
  const copy: SavedScenario = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: newName.trim() || original.name,
    savedAt: Date.now(),
    inputs: original.inputs,
  };
  const next = [...list, copy];
  return next.length > MAX_SCENARIOS ? next.slice(next.length - MAX_SCENARIOS) : next;
}

/**
 * Różnica (scenariusz minus aktualnie wyświetlony wynik) w łącznych odsetkach
 * i liczbie rat — pozwala pokazać przy każdym zapisanym scenariuszu, o ile
 * byłby on lepszy/gorszy od tego, co jest teraz na ekranie, bez faktycznego
 * przełączania widoku i utraty bieżących danych formularza. Zwraca null dla
 * scenariusza, który sam w sobie już nie przechodzi walidacji (np. zapisany
 * przed zmianą reguł walidacji w starszej wersji aplikacji).
 */
export function compareScenarioToCurrent(
  scenarioInputs: CalcInputs,
  current: Pick<CalcState, 'rows'>,
): { interestDiff: number; monthsDiff: number } | null {
  if (validateInputs(scenarioInputs) !== null) return null;
  const scenarioRows = computeCalcState(scenarioInputs).rows;
  const scenarioInterest = scenarioRows.length ? scenarioRows[scenarioRows.length - 1]!.cumInterest : 0;
  const currentInterest = current.rows.length ? current.rows[current.rows.length - 1]!.cumInterest : 0;
  return {
    interestDiff: scenarioInterest - currentInterest,
    monthsDiff: scenarioRows.length - current.rows.length,
  };
}

/**
 * Porównanie płytkie — CalcInputs to płaski obiekt samych prymitywów, więc
 * to wystarcza. Używane do wykrywania, czy wyświetlony wynik jest nadal
 * aktualny względem tego, co jest teraz w formularzu (patrz isStale
 * zwracane przez useCalculator()).
 */
export function inputsEqual(a: CalcInputs, b: CalcInputs): boolean {
  const keys = Object.keys(a) as (keyof CalcInputs)[];
  return keys.every((k) => a[k] === b[k]);
}

export function validateInputs(inp: CalcInputs): TranslationKey | null {
  if (!isFinite(inp.loanAmount) || inp.loanAmount < 1000 || inp.loanAmount > 10_000_000) {
    return 'error_loan_amount';
  }
  if (!isFinite(inp.loanMonths) || inp.loanMonths < 12 || inp.loanMonths > 360) {
    return 'error_months';
  }
  if (!isFinite(inp.interestRate) || inp.interestRate < 0.01 || inp.interestRate > 25) {
    return 'error_rate';
  }
  if (!isFinite(inp.prepayFee) || inp.prepayFee < 0 || inp.prepayFee > 5) {
    return 'error_prepay_fee';
  }
  if (inp.strategy === 'goal') {
    if (!isFinite(inp.goalMonths) || inp.goalMonths < 1 || inp.goalMonths > inp.loanMonths) {
      return 'error_goal_months';
    }
  }
  // totalMonthlySlider/overpayAmountSlider/shortenAmountSlider mają w UI
  // dynamiczne granice suwaka (zależne od raty), ale trafiają tu też wprost
  // z linku (?total=/?overpay=/?shorten=) z pominięciem suwaka — bez tej
  // walidacji ujemna albo absurdalnie duża wartość z linku po cichu dawała
  // inny wynik niż to, co URL deklarował (buildSchedule przycina nadpłatę
  // do salda), zamiast jawnie zgłosić błąd jak każde inne pole formularza.
  if (inp.strategy === 'reduce_payment' || inp.strategy === 'fixed_total') {
    if (!isFinite(inp.totalMonthlySlider) || inp.totalMonthlySlider < 0 || inp.totalMonthlySlider > 10_000_000) {
      return 'error_total_monthly';
    }
  }
  if (inp.strategy === 'fixed_overpay') {
    if (!isFinite(inp.overpayAmountSlider) || inp.overpayAmountSlider < 0 || inp.overpayAmountSlider > 10_000_000) {
      return 'error_overpay_amount';
    }
  }
  if (inp.strategy === 'shorten_period') {
    if (!isFinite(inp.shortenAmountSlider) || inp.shortenAmountSlider < 0 || inp.shortenAmountSlider > 10_000_000) {
      return 'error_shorten_amount';
    }
  }
  // Bez tego link z ?start=999999999 trafiał wprost do computeCalcState, które
  // alokuje tablicę Array(overpayStartMonth) — ogromna, skończona wartość z URL
  // (nieograniczona suwakiem, którego dotyczy tylko UI) zawieszała/crashowała kartę.
  if (!isFinite(inp.overpayStartMonth) || inp.overpayStartMonth < 0 || inp.overpayStartMonth >= inp.loanMonths) {
    return 'error_overpay_start';
  }
  if (inp.strategy === 'refinance') {
    if (!isFinite(inp.refiRate) || inp.refiRate < 0.01 || inp.refiRate > 25) {
      return 'error_refi_rate';
    }
    if (!isFinite(inp.refiMonths) || inp.refiMonths < 12 || inp.refiMonths > 360) {
      return 'error_refi_months';
    }
    if (!isFinite(inp.refiMonth) || inp.refiMonth < 0 || inp.refiMonth >= inp.loanMonths) {
      return 'error_refi_month';
    }
    if (!isFinite(inp.refiOriginationFee) || inp.refiOriginationFee < 0 || inp.refiOriginationFee > 10) {
      return 'error_refi_origination_fee';
    }
    if (!isFinite(inp.refiFlat) || inp.refiFlat < 0 || inp.refiFlat > 10_000_000) {
      return 'error_refi_flat_fee';
    }
  }
  return null;
}

/**
 * Nadpłaty "naturalne" (dopłać do stałej raty) z opóźnionym startem —
 * przed miesiącem startMonth same zera, dopiero od niego rozkład liczony
 * od salda w tym momencie. Wydzielone, żeby onRateChange/resetOverpays nie
 * musiały (i nie zapominały) powtarzać tej samej logiki co computeCalcState.
 */
export function naturalOverpaysWithStart(
  P: number, customRates: number[], months: number, totalMonthly: number, r: number, startMonth: number
): number[] {
  if (startMonth <= 0) return naturalOverpaysFromBalance(P, 0, customRates, months, totalMonthly, r);
  const noOv = Array<number>(months).fill(0);
  const balAtStart = balanceAt(P, customRates, months, noOv, startMonth - 1, r);
  const postOvs = naturalOverpaysFromBalance(balAtStart, startMonth, customRates, months, totalMonthly, r);
  return [...Array<number>(startMonth).fill(0), ...postOvs];
}

/**
 * Stała kwota nadpłaty (fixed_overpay/shorten_period), z zerami przed
 * opóźnionym startem — wydzielone z tego samego powodu co naturalOverpaysWithStart:
 * resetOverpays miał osobną kopię tej logiki BEZ zerowania prefiksu, więc reset
 * cicho kasował skonfigurowane opóźnienie startu dla tych dwóch strategii.
 */
export function flatOverpayWithStart(months: number, amount: number, startMonth: number): number[] {
  const arr = Array<number>(months).fill(amount);
  for (let i = 0; i < startMonth && i < months; i++) arr[i] = 0;
  return arr;
}

/**
 * "13. rata" — dodaje wysokość jednej standardowej raty jako nadpłatę co
 * 12 miesięcy (indeksy 11, 23, 35, ...). Inspirowane popularną w USA/UK
 * praktyką płatności co dwa tygodnie (26 pół-rat = 13 pełnych rat rocznie);
 * tutaj uproszczone do jednej dodatkowej wpłaty raz w roku, bo polskie
 * kredyty rozliczane są miesięcznie i sama zmiana częstotliwości płatności
 * nie ma tu odpowiednika — liczy się tylko dodatkowa kwota rocznie.
 *
 * startMonth pomija roczne raty przed opóźnionym startem nadpłaty —
 * inaczej "13. rata" w miesiącu 12 wstrzykiwałaby nadpłatę, nawet gdy
 * użytkownik ustawił start dopiero np. od miesiąca 20, łamiąc gwarancję
 * "zero nadpłat przed startem" z naturalOverpaysWithStart/flatOverpayWithStart.
 */
export function applyExtraAnnualPayment(
  overpay: number[], months: number, extraAmount: number, startMonth = 0
): number[] {
  if (extraAmount <= 0) return overpay;
  const result = [...overpay];
  for (let i = 11; i < months; i += 12) {
    if (i < startMonth) continue;
    result[i] = (result[i] ?? 0) + extraAmount;
  }
  return result;
}

export function computeCalcState(inp: CalcInputs): CalcState {
  const { loanAmount: P, interestRate, loanMonths: months, prepayFee: feeRate, strategy } = inp;
  const r = interestRate / 100 / 12;
  const fee = feeRate / 100;
  const stdPayment = calcStdPayment(P, r, months);
  const customRates = Array<number>(months).fill(r);
  const startMonth = inp.overpayStartMonth;

  let customOverpay: number[];
  let totalMonthly = 0;
  let defaultOverpay = 0;
  let requiredOverpay: number | undefined;

  if (strategy === 'reduce_payment' || strategy === 'fixed_total') {
    totalMonthly = inp.totalMonthlySlider;
    defaultOverpay = totalMonthly;
    customOverpay = naturalOverpaysWithStart(P, customRates, months, totalMonthly, r, startMonth);
  } else if (strategy === 'fixed_overpay') {
    defaultOverpay = inp.overpayAmountSlider;
    customOverpay = flatOverpayWithStart(months, defaultOverpay, startMonth);
  } else if (strategy === 'shorten_period') {
    defaultOverpay = inp.shortenAmountSlider;
    customOverpay = flatOverpayWithStart(months, defaultOverpay, startMonth);
  } else if (strategy === 'goal') {
    requiredOverpay = solveOverpayForTarget(P, customRates, months, fee, r, inp.goalMonths, stdPayment);
    defaultOverpay = requiredOverpay;
    customOverpay = Array<number>(months).fill(requiredOverpay);
  } else {
    customOverpay = Array<number>(months).fill(0);
  }

  // "13. rata" ma sens tylko przy tych samych strategiach co opóźnienie
  // startu nadpłaty (UI ukrywa ją dla 'custom'/'goal'/'refinance') — przy
  // 'goal' nadpłata jest rozwiązywana pod konkretny cel w miesiącach, a
  // przy 'custom' użytkownik sam w pełni kontroluje harmonogram.
  if (inp.extraAnnualPayment && strategy !== 'custom' && strategy !== 'goal' && strategy !== 'refinance') {
    customOverpay = applyExtraAnnualPayment(customOverpay, months, stdPayment, startMonth);
  }

  const base = buildBaseSchedule(P, customRates, months, r);
  const customPerRowEffects = Array<'shorten' | 'reduce'>(months).fill('reduce');

  let rows: ScheduleRow[];
  let refiData: RefiData | undefined;

  if (strategy === 'refinance') {
    const result = buildRefinanceSchedule(
      P, customRates, months, r,
      inp.refiMonth, inp.refiRate, inp.refiMonths,
      inp.refiOriginationFee, inp.refiFlat,
    );
    rows = result.rows;
    refiData = {
      month: inp.refiMonth,
      balance: result.refiBalance,
      originationFeeAmount: result.originationFeeAmount,
      flatFeeAmount: result.flatFeeAmount,
      phase1Interest: result.phase1Interest,
      phase2Interest: result.phase2Interest,
      newRate: inp.refiRate,
      newMonths: inp.refiMonths,
    };
  } else {
    const fixedStd = strategy === 'shorten_period' || strategy === 'goal' ? stdPayment : null;
    rows = buildSchedule(P, customRates, months, fee, customOverpay, r, fixedStd);
  }

  return {
    P, r, months, prepayFee: fee, stdPayment, origStdPayment: stdPayment,
    // 'reduce', zgodnie z domyślną wartością customPerRowEffects poniżej —
    // inaczej przycisk "Skróć okres" w toolbarze Schedule.tsx pokazywał się
    // jako aktywny zaraz po przeliczeniu strategii 'custom', mimo że faktycznie
    // zastosowany efekt (per wiersz, z customPerRowEffects) to 'reduce'.
    customOverpay, customRates, strategy, customEffect: 'reduce' as const,
    customPerRowEffects, totalMonthly, defaultOverpay, overpayStartMonth: startMonth,
    extraAnnualPayment: inp.extraAnnualPayment,
    requiredOverpay, goalMonths: strategy === 'goal' ? inp.goalMonths : undefined,
    baseInterest: base.totalInterest, baseMonths: base.count, baseBalances: base.balances,
    baseCumInterestByMonth: base.cumInterestByMonth,
    rows, refiData,
  };
}

export function resolveFixedStd(prev: CalcState): number | null {
  if (prev.strategy === 'shorten_period' || prev.strategy === 'goal') return prev.origStdPayment;
  if (prev.strategy === 'custom' && prev.customEffect === 'shorten') return prev.origStdPayment;
  return null;
}

/**
 * W strategii 'custom' każdy wiersz może mieć własny efekt (skróć/obniż),
 * niezależnie od resolveFixedStd, który zna tylko jeden globalny customEffect.
 * Bez tego edycja nadpłaty/oprocentowania albo reset zerowały ustawione
 * wcześniej efekty per wiersz — przycisk przy wierszu dalej pokazywał wybrany
 * efekt, ale przeliczony harmonogram cicho wracał do jednego globalnego.
 */
export function resolvePerRowFixed(prev: CalcState): (number | null)[] | undefined {
  if (prev.strategy !== 'custom') return undefined;
  return prev.customPerRowEffects.map((e) => (e === 'shorten' ? prev.origStdPayment : null));
}

/**
 * Ten sam zakres co min/max na polu w Schedule.tsx (0,01–25%) — bez górnego
 * ograniczenia stawka rzędu setek % dawała Math.pow(1+r, n) = Infinity,
 * calcStdPayment liczyło Infinity/Infinity = NaN, a od tego wiersza cały
 * harmonogram urywał się z jednym wierszem pełnym "NaN zł" (balance > 0.005
 * z NaN jest false, więc pętla w buildSchedule kończy się od razu).
 */
export function clampCustomAnnualRate(annualRateValue: string): number {
  return Math.min(25, Math.max(0.01, parseLocaleNumber(annualRateValue) || 0));
}

/**
 * Scala DEFAULT_INPUTS z patchem z URL/localStorage dla stanu formularza
 * (`inputs`), z walidacją — w przeciwieństwie do calcState/lastCalculatedInputs,
 * ten stan trafia wprost do pól formularza, więc bez validateInputs uszkodzony
 * wpis w localStorage (ręczna edycja w DevTools albo stary kształt danych
 * sprzed zmiany wersji) pokazywał NaN-y/śmieci w polach i suwakach od razu po
 * wczytaniu strony, mimo że calcState i tak zostawał null.
 */
export function resolveInitialInputs(patch: Partial<CalcInputs> | null): CalcInputs {
  const merged = { ...DEFAULT_INPUTS, ...patch };
  return validateInputs(merged) === null ? merged : DEFAULT_INPUTS;
}

export function useCalculator() {
  // Link URL to jawna, udostępniona intencja — ma pierwszeństwo przed cicho
  // zapamiętanymi danymi z poprzedniej wizyty w tej samej przeglądarce.
  const [inputs, setInputsState] = useState<CalcInputs>(() => {
    const urlPatch = parseUrlInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredInputs();
    return resolveInitialInputs(patch);
  });

  const [calcState, setCalcState] = useState<CalcState | null>(() => {
    const urlPatch = parseUrlInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredInputs();
    if (!patch) return null;
    const inp = { ...DEFAULT_INPUTS, ...patch };
    if (validateInputs(inp) !== null) return null;
    return computeCalcState(inp);
  });

  // Dane wejściowe, dla których policzono aktualny calcState — potrzebne,
  // żeby wykryć, że użytkownik zmienił formularz po obliczeniu, ale jeszcze
  // nie kliknął "Oblicz" ponownie (isStale niżej), inaczej wyniki na ekranie
  // po cichu przestają odpowiadać temu, co widać w polach formularza.
  const [lastCalculatedInputs, setLastCalculatedInputs] = useState<CalcInputs | null>(() => {
    const urlPatch = parseUrlInputs();
    const patch = Object.keys(urlPatch).length ? urlPatch : loadStoredInputs();
    if (!patch) return null;
    const inp = { ...DEFAULT_INPUTS, ...patch };
    return validateInputs(inp) === null ? inp : null;
  });

  const [calcError, setCalcError] = useState<TranslationKey | null>(null);
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => loadScenarios());
  const [scenarioSaveError, setScenarioSaveError] = useState(false);

  const isStale = calcState !== null && lastCalculatedInputs !== null && !inputsEqual(inputs, lastCalculatedInputs);

  const setInputs = useCallback((patch: Partial<CalcInputs>) => {
    setInputsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyCalculation = useCallback((inp: CalcInputs): boolean => {
    const err = validateInputs(inp);
    if (err) {
      setCalcError(err);
      return false;
    }
    setCalcError(null);
    window.history.replaceState(null, '', '?' + buildUrlParams(inp));
    saveInputs(inp);
    setLastCalculatedInputs(inp);
    setCalcState(computeCalcState(inp));
    return true;
  }, []);

  const calculate = useCallback(() => {
    applyCalculation(inputs);
  }, [inputs, applyCalculation]);

  // Wczytanie scenariusza liczy od razu na podstawie jego danych, a nie
  // stanu `inputs` z poprzedniego renderu — setInputsState + calculate()
  // w tym samym wywołaniu widziałoby jeszcze stare dane sprzed aktualizacji.
  // localStorage.setItem może rzucić (storage pełny/zablokowany) — bez tego
  // scenariusz znikał z listy w React state (a więc "wyglądał" na zapisany)
  // ale nie przetrwał odświeżenia strony, bez żadnego ostrzeżenia dla
  // użytkownika. scenarioSaveError daje UI sygnał do pokazania komunikatu.
  const saveCurrentAsScenario = useCallback((name: string) => {
    setScenarios((prev) => {
      const next = addScenario(prev, name, inputs);
      setScenarioSaveError(!persistScenarios(next));
      return next;
    });
  }, [inputs]);

  const loadScenario = useCallback((id: string) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const inp = { ...DEFAULT_INPUTS, ...scenario.inputs };
    setInputsState(inp);
    applyCalculation(inp);
  }, [scenarios, applyCalculation]);

  // persistScenarios zwraca sukces zapisu (patrz saveCurrentAsScenario) —
  // delete/rename/duplicate/import miały ten sam problem co pierwotny zapis:
  // przy pełnym/zablokowanym storage React state (a więc UI) pokazywał
  // zmianę jako trwałą, mimo że znikała po odświeżeniu strony bez ostrzeżenia.
  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = removeScenario(prev, id);
      setScenarioSaveError(!persistScenarios(next));
      return next;
    });
  }, []);

  const renameScenarioById = useCallback((id: string, newName: string) => {
    setScenarios((prev) => {
      const next = renameScenario(prev, id, newName);
      setScenarioSaveError(!persistScenarios(next));
      return next;
    });
  }, []);

  const duplicateScenarioById = useCallback((id: string, newName: string) => {
    setScenarios((prev) => {
      const next = duplicateScenario(prev, id, newName);
      setScenarioSaveError(!persistScenarios(next));
      return next;
    });
  }, []);

  /** Zwraca liczbę faktycznie zaimportowanych scenariuszy — do komunikatu w UI. */
  const importScenarios = useCallback((json: string): number => {
    const imported = parseScenariosJSON(json);
    if (imported.length === 0) return 0;
    setScenarios((prev) => {
      const next = mergeImportedScenarios(prev, imported);
      setScenarioSaveError(!persistScenarios(next));
      return next;
    });
    return imported.length;
  }, []);

  // Uzupełnienie zapamiętywania danych (saveInputs) — bez tego jedyną drogą
  // powrotu do domyślnych wartości byłoby ręczne czyszczenie localStorage
  // z DevTools.
  const resetToDefaults = useCallback(() => {
    clearStoredInputs();
    window.history.replaceState(null, '', window.location.pathname);
    setCalcError(null);
    setCalcState(null);
    setInputsState(DEFAULT_INPUTS);
  }, []);

  const onOverpayChange = useCallback((idx: number, value: string) => {
    setCalcState((prev) => {
      if (!prev || prev.strategy === 'refinance') return prev;
      const newOverpay = [...prev.customOverpay];
      newOverpay[idx] = Math.max(0, parseFloat(value) || 0);

      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        const balance = balanceAt(prev.P, prev.customRates, prev.months, newOverpay, idx, prev.r);
        const natural = naturalOverpaysFromBalance(balance, idx + 1, prev.customRates, prev.months, prev.totalMonthly, prev.r);
        for (let i = idx + 1; i < prev.months; i++) {
          newOverpay[i] = natural[i - (idx + 1)] ?? 0;
        }
      }

      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev), resolvePerRowFixed(prev));
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const onRateChange = useCallback((idx: number, annualRateValue: string) => {
    setCalcState((prev) => {
      if (!prev || prev.strategy === 'refinance') return prev;
      const newRate = clampCustomAnnualRate(annualRateValue) / 100 / 12;
      const newRates = [...prev.customRates];
      for (let i = idx; i < prev.months; i++) newRates[i] = newRate;

      let newOverpay = [...prev.customOverpay];
      let newRequiredOverpay = prev.requiredOverpay;
      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysWithStart(prev.P, newRates, prev.months, prev.totalMonthly, newRate, prev.overpayStartMonth);
        if (prev.extraAnnualPayment) newOverpay = applyExtraAnnualPayment(newOverpay, prev.months, prev.origStdPayment, prev.overpayStartMonth);
      } else if (prev.strategy === 'goal' && prev.goalMonths !== undefined) {
        // Bez przeliczenia tutaj "wymagana nadpłata" i sam harmonogram cicho
        // rozjeżdżały się po edycji stopy w trakcie — nowe raty przechodziły
        // do rows, ale requiredOverpay/customOverpay zostawały policzone dla
        // starej stopy i kredyt przestawał realnie spłacać się w goalMonths.
        newRequiredOverpay = solveOverpayForTarget(
          prev.P, newRates, prev.months, prev.prepayFee, newRate, prev.goalMonths, prev.origStdPayment,
        );
        newOverpay = Array<number>(prev.months).fill(newRequiredOverpay);
      }

      const base = buildBaseSchedule(prev.P, newRates, prev.months, newRate);
      const rows = buildSchedule(prev.P, newRates, prev.months, prev.prepayFee, newOverpay, newRate, resolveFixedStd(prev), resolvePerRowFixed(prev));

      return {
        ...prev,
        customRates: newRates,
        customOverpay: newOverpay,
        requiredOverpay: newRequiredOverpay,
        defaultOverpay: prev.strategy === 'goal' ? (newRequiredOverpay ?? prev.defaultOverpay) : prev.defaultOverpay,
        baseInterest: base.totalInterest,
        baseMonths: base.count,
        baseBalances: base.balances,
        rows,
      };
    });
  }, []);

  // Refinansowanie liczy harmonogram przez buildRefinanceSchedule, nie buildSchedule
  // — reset tutaj podmieniłby go na zwykłą amortyzację, ignorując refiMonth/refiRate.
  // UI chowa te przyciski dla strategii 'refinance' (patrz Schedule.tsx), ale strażnik
  // zostaje na wypadek, gdyby to się kiedyś zmieniło (tak jak już mają onOverpayChange/onRateChange).
  const resetOverpays = useCallback(() => {
    setCalcState((prev) => {
      if (!prev || prev.strategy === 'refinance') return prev;
      let newOverpay: number[];
      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysWithStart(prev.P, prev.customRates, prev.months, prev.totalMonthly, prev.r, prev.overpayStartMonth);
      } else if (prev.strategy === 'custom') {
        newOverpay = Array<number>(prev.months).fill(0);
      } else if (prev.strategy === 'fixed_overpay' || prev.strategy === 'shorten_period') {
        newOverpay = flatOverpayWithStart(prev.months, prev.defaultOverpay, prev.overpayStartMonth);
      } else {
        // 'goal' — nadpłata dotyczy całego okresu, bez pojęcia opóźnionego startu.
        newOverpay = Array<number>(prev.months).fill(prev.defaultOverpay);
      }
      if (prev.extraAnnualPayment && prev.strategy !== 'custom' && prev.strategy !== 'goal') {
        newOverpay = applyExtraAnnualPayment(newOverpay, prev.months, prev.origStdPayment, prev.overpayStartMonth);
      }
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev), resolvePerRowFixed(prev));
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const clearOverpays = useCallback(() => {
    setCalcState((prev) => {
      if (!prev || prev.strategy === 'refinance') return prev;
      const newOverpay = Array<number>(prev.months).fill(0);
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev), resolvePerRowFixed(prev));
      return { ...prev, customOverpay: newOverpay, rows };
    });
  }, []);

  const onCustomEffectChange = useCallback((effect: 'shorten' | 'reduce') => {
    setCalcState((prev) => {
      if (!prev || prev.strategy !== 'custom') return prev;
      const newPerRowEffects = Array<'shorten' | 'reduce'>(prev.months).fill(effect);
      const perRowFixed = newPerRowEffects.map((e) => e === 'shorten' ? prev.origStdPayment : null);
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, prev.customOverpay, prev.r, null, perRowFixed);
      return { ...prev, customEffect: effect, customPerRowEffects: newPerRowEffects, rows };
    });
  }, []);

  const onRowEffectChange = useCallback((idx: number, effect: 'shorten' | 'reduce') => {
    setCalcState((prev) => {
      if (!prev || prev.strategy !== 'custom') return prev;
      const newPerRowEffects = [...prev.customPerRowEffects];
      newPerRowEffects[idx] = effect;
      const perRowFixed = newPerRowEffects.map((e) => e === 'shorten' ? prev.origStdPayment : null);
      const rows = buildSchedule(prev.P, prev.customRates, prev.months, prev.prepayFee, prev.customOverpay, prev.r, null, perRowFixed);
      return { ...prev, customPerRowEffects: newPerRowEffects, rows };
    });
  }, []);

  const resetRates = useCallback(() => {
    setCalcState((prev) => {
      if (!prev || prev.strategy === 'refinance') return prev;
      const newRates = Array<number>(prev.months).fill(prev.r);
      let newOverpay = [...prev.customOverpay];
      let newRequiredOverpay = prev.requiredOverpay;
      if (prev.strategy === 'reduce_payment' || prev.strategy === 'fixed_total') {
        newOverpay = naturalOverpaysWithStart(prev.P, newRates, prev.months, prev.totalMonthly, prev.r, prev.overpayStartMonth);
        if (prev.extraAnnualPayment) newOverpay = applyExtraAnnualPayment(newOverpay, prev.months, prev.origStdPayment, prev.overpayStartMonth);
      } else if (prev.strategy === 'goal' && prev.goalMonths !== undefined) {
        // Ten sam powód co w onRateChange — bez przeliczenia "Przywróć
        // oprocentowanie" wracało do stawki bazowej, ale requiredOverpay
        // zostawało policzone dla stawek sprzed resetu.
        newRequiredOverpay = solveOverpayForTarget(
          prev.P, newRates, prev.months, prev.prepayFee, prev.r, prev.goalMonths, prev.origStdPayment,
        );
        newOverpay = Array<number>(prev.months).fill(newRequiredOverpay);
      }
      const base = buildBaseSchedule(prev.P, newRates, prev.months, prev.r);
      const rows = buildSchedule(prev.P, newRates, prev.months, prev.prepayFee, newOverpay, prev.r, resolveFixedStd(prev), resolvePerRowFixed(prev));
      return {
        ...prev,
        customRates: newRates,
        customOverpay: newOverpay,
        requiredOverpay: newRequiredOverpay,
        defaultOverpay: prev.strategy === 'goal' ? (newRequiredOverpay ?? prev.defaultOverpay) : prev.defaultOverpay,
        baseInterest: base.totalInterest,
        baseMonths: base.count,
        baseBalances: base.balances,
        rows,
      };
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
    saveCurrentAsScenario,
    loadScenario,
    deleteScenario,
    renameScenario: renameScenarioById,
    duplicateScenario: duplicateScenarioById,
    importScenarios,
    onOverpayChange,
    onRateChange,
    onCustomEffectChange,
    onRowEffectChange,
    resetOverpays,
    clearOverpays,
    resetRates,
  };
}
