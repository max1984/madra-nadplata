import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Chart } from 'chart.js';
import { CHART } from '../lib/chartTheme';
import { useLang } from '../contexts/LangContext';
import { parseLocaleNumber, fmtMonthYear, csvDec } from '../lib/format';
import { copyToClipboard } from '../lib/clipboard';
import { calcStdPayment, simulatePaymentHoliday, totalAppliedOverpay, refiBreakEvenMonth, halfPrincipalMonth, repaymentMultiple, dailyInterestCost, payoffDate } from '../lib/mortgage';
import type { CalcInputs, CalcState, RefiData, SavedScenario, Strategy } from '../hooks/useCalculator';
import { compareScenarioToCurrent, scenariosToJSON, inputsEqual, buildUrlParams, sortScenarios, buildScenarioComparisonRows, strategyLabelKey, computeCalcState, validateInputs, type ScenarioSortKey, type ScenarioComparisonRow } from '../hooks/useCalculator';
import type { TranslationKey, Lang } from '../lib/i18n';
import PartnerOffers from './PartnerOffers';

function useSyncInput(ref: React.RefObject<HTMLInputElement | null>, value: number | string) {
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current)
      ref.current.value = String(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * navigator.share() istnieje głównie na przeglądarkach mobilnych (i części
 * desktopowych z integracją systemowego arkusza udostępniania) — wydzielone
 * jako funkcja przyjmująca navigator jako argument, żeby dało się to
 * przetestować bez mockowania globalnego obiektu window.
 */
export function canUseNativeShare(nav: unknown): boolean {
  return typeof (nav as { share?: unknown } | null | undefined)?.share === 'function';
}

/**
 * Szybkie propozycje kwoty nadpłaty (przyciski nad suwakiem), proporcjonalne
 * do standardowej raty — stałe kwoty typu 200/500/1000 zł miałyby sens przy
 * kredycie na 300 000 zł, ale byłyby śmiesznie małe przy 1 500 000 zł i za
 * duże przy 50 000 zł. Zaokrąglone do pełnych 50 zł, z dolnym progiem 50 zł.
 */
/**
 * Krótkie podsumowanie nowo wyliczonego harmonogramu dla regionu aria-live —
 * błąd walidacji formularza już był ogłaszany czytnikom ekranu (role="alert"
 * na .calc-error), ale udany wynik obliczeń nie miał żadnego odpowiednika:
 * osoba korzystająca z czytnika ekranu nie miała jak się dowiedzieć, że
 * wynik się pojawił, poza ręcznym przeszukiwaniem całej strony.
 */
export function formatCalcAnnouncement(
  cs: Pick<CalcState, 'rows'>,
  t: (key: TranslationKey) => string,
  fmtC: (n: number) => string,
): string {
  const withInterest = cs.rows.length ? cs.rows[cs.rows.length - 1]!.cumInterest : 0;
  return t('calc_announcement')
    .replace('{months}', String(cs.rows.length))
    .replace('{interest}', fmtC(withInterest));
}

/**
 * Ctrl/Cmd+Enter jako skrót do "Oblicz" — zwykły Enter w polu formularza
 * już commituje wartość (onBlur), więc podpięcie go pod przeliczenie
 * skasowałoby możliwość przejścia Tab-em między polami bez przeliczania
 * po każdym z osobna. Modyfikator odróżnia "zatwierdź to pole" od
 * "przelicz cały formularz".
 */
export function isCalculateShortcut(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>): boolean {
  return e.key === 'Enter' && (e.ctrlKey || e.metaKey);
}

/**
 * Czytelne, tekstowe podsumowanie wyniku do wklejenia w wiadomości/czacie —
 * inaczej niż "Kopiuj link" (goły URL) czy natywne udostępnianie (to samo,
 * tylko przez systemowy arkusz), to faktyczna treść, którą odbiorca
 * przeczyta od razu, bez klikania w cokolwiek.
 */
export function formatResultsSummaryText(
  cs: Pick<CalcState, 'P' | 'r' | 'months' | 'rows' | 'baseMonths' | 'baseInterest'>,
  t: (key: TranslationKey) => string,
  fmt: (n: number, dec?: number) => string,
  fmtC: (n: number, dec?: number) => string,
  url: string,
): string {
  const withMonths = cs.rows.length;
  const withInterest = withMonths ? cs.rows[withMonths - 1]!.cumInterest : 0;
  const savedMoney = Math.max(0, cs.baseInterest - withInterest);
  const savedMonths = Math.max(0, cs.baseMonths - withMonths);
  const savedYears = Math.floor(savedMonths / 12);
  const savedRem = savedMonths % 12;
  const savedTime = savedYears > 0
    ? `${savedYears} ${t('years')}${savedRem > 0 ? ' ' + savedRem + ' ' + t('months_short') : ''}`
    : `${savedMonths} ${t('months_short')}`;

  return t('share_summary_text')
    .replace('{amount}', fmt(cs.P))
    .replace('{rate}', fmt(cs.r * 12 * 100, 2))
    .replace('{months}', String(cs.months))
    .replace('{withMonths}', String(withMonths))
    .replace('{savedTime}', savedTime)
    .replace('{saved}', fmtC(savedMoney))
    .replace('{url}', url);
}

/**
 * Jak formatResultsSummaryText, ale dla zapisanego scenariusza — inputs mógł
 * pochodzić z importu JSON, który sprawdza tylko kształt obiektu, nie
 * wartości pól (patrz buildScenarioComparisonRows). computeCalcState na
 * inputs z np. loanMonths=NaN robi Array(NaN), co rzuca RangeError — bez tej
 * bramki "Kopiuj podsumowanie" dla uszkodzonego scenariusza crashowało kartę
 * zamiast po prostu nic nie zrobić, tak jak porównanie scenariuszy i eksport
 * CSV już to obsługują.
 */
export function scenarioSummaryText(
  inputs: CalcInputs,
  t: (key: TranslationKey) => string,
  fmt: (n: number, dec?: number) => string,
  fmtC: (n: number, dec?: number) => string,
  url: string,
): string | null {
  if (validateInputs(inputs) !== null) return null;
  return formatResultsSummaryText(computeCalcState(inputs), t, fmt, fmtC, url);
}

/**
 * Buduje treść pliku CSV porównującego wszystkie zapisane scenariusze —
 * osobna, czysta funkcja (zamiast kodu wprost w handlerze), żeby dało się
 * ją przetestować bez klikania w prawdziwym pliku pobranym z przeglądarki.
 */
export function buildScenarioComparisonCSV(
  rows: ScenarioComparisonRow[],
  t: (key: TranslationKey) => string,
  lang: Lang,
): string {
  const sep = lang === 'en' ? ',' : ';';
  // Nazwa scenariusza to wolny tekst użytkownika, który Excel/Arkusze Google
  // otwierają wprost jako komórki — nazwa zaczynająca się od =, +, - albo @
  // jest tam interpretowana jako formuła (CSV/formula injection), więc trzeba
  // ją zneutralizować wiodącym apostrofem, zanim w ogóle dojdzie do cytowania.
  const csvField = (value: string) => {
    const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return /["\n]/.test(safe) || safe.includes(sep) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const headers = [
    t('scenario_compare_col_name'), t('scenario_compare_col_amount'), t('scenario_compare_col_rate'),
    t('scenario_compare_col_strategy'), t('scenario_compare_col_months'), t('scenario_compare_col_interest'),
    t('scenario_compare_col_saved_interest'), t('scenario_compare_col_saved_months'),
  ];
  const csvRows = rows.map((r) => [
    csvField(r.name),
    csvDec(r.loanAmount, lang),
    csvDec(r.interestRate, lang),
    t(strategyLabelKey(r.strategy)),
    String(r.months),
    csvDec(r.totalInterest, lang),
    csvDec(r.interestSaved, lang),
    String(r.monthsSaved),
  ].join(sep));
  return '﻿' + [headers.join(sep), ...csvRows].join('\n');
}

export function overpayPresets(stdPayment: number): number[] {
  const round50 = (n: number) => Math.max(50, Math.round(n / 50) * 50);
  return [0.1, 0.25, 0.5].map((fraction) => round50(stdPayment * fraction));
}

interface Props {
  inputs: CalcInputs;
  setInputs: (patch: Partial<CalcInputs>) => void;
  calcState: CalcState | null;
  onCalculate: () => void;
  onResetToDefaults: () => void;
  isStale: boolean;
  calcError: TranslationKey | null;
  scenarios: SavedScenario[];
  scenarioSaveError: boolean;
  onSaveScenario: (name: string) => void;
  onLoadScenario: (id: string) => void;
  onDeleteScenario: (id: string) => void;
  onRenameScenario: (id: string, name: string) => void;
  onDuplicateScenario: (id: string, newName: string) => void;
  onImportScenarios: (json: string) => number;
}

export default function Calculator({
  inputs, setInputs, calcState, onCalculate, onResetToDefaults, isStale, calcError,
  scenarios, scenarioSaveError, onSaveScenario, onLoadScenario, onDeleteScenario, onRenameScenario, onDuplicateScenario,
  onImportScenarios,
}: Props) {
  const { t, fmt, fmtC, fmtSignedC, lang } = useLang();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [copiedScenarioId, setCopiedScenarioId] = useState<string | null>(null);
  const [copiedScenarioSummaryId, setCopiedScenarioSummaryId] = useState<string | null>(null);
  const [invalidScenarioSummaryId, setInvalidScenarioSummaryId] = useState<string | null>(null);
  const canShare = useMemo(() => canUseNativeShare(typeof navigator === 'undefined' ? null : navigator), []);
  const announcement = useMemo(
    () => calcState ? formatCalcAnnouncement(calcState, t, fmtC) : '',
    [calcState, t, fmtC],
  );
  // Osobne useMemo od reszty komponentu — bez tego przeliczanie harmonogramu
  // dla każdego zapisanego scenariusza (computeCalcState, do 360 wierszy)
  // odpalałoby się na nowo przy każdym naciśnięciu klawisza w polu nazwy
  // scenariusza, bo to ten sam komponent co scenarioName.
  const scenarioDiffs = useMemo(() => {
    const map = new Map<string, { interestDiff: number; monthsDiff: number } | null>();
    if (calcState) {
      for (const s of scenarios) map.set(s.id, compareScenarioToCurrent(s.inputs, calcState));
    }
    return map;
  }, [scenarios, calcState]);

  // Które zapisane dane formularza dokładnie odpowiadają temu, co jest teraz
  // w polach — porównanie z `inputs` (nie z calcState), bo ma działać nawet
  // zanim ktoś kliknie "Oblicz" po wczytaniu/edycji.
  const activeScenarioId = useMemo(
    () => scenarios.find((s) => inputsEqual(s.inputs, inputs))?.id ?? null,
    [scenarios, inputs],
  );

  const [scenarioSort, setScenarioSort] = useState<ScenarioSortKey>('date-desc');
  const sortedScenarios = useMemo(() => sortScenarios(scenarios, scenarioSort), [scenarios, scenarioSort]);

  // Ref zamiast bezpośredniego domknięcia na onCalculate — blur() aktywnego
  // pola (poniżej) commituje wartość asynchronicznie (React batchuje setState
  // z natywnego zdarzenia DOM), więc wywołanie onCalculate() w tej samej
  // klatce synchronicznej czytałoby jeszcze stary stan sprzed edycji. Ref
  // aktualizowany co render zawsze wskazuje najświeższe domknięcie.
  const onCalculateRef = useRef(onCalculate);
  useEffect(() => { onCalculateRef.current = onCalculate; }, [onCalculate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isCalculateShortcut(e)) return;
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur();
      // setTimeout(…, 0) czeka na to, aż React przetworzy i wyrenderuje
      // stan z powyższego blur(), zanim odczytamy (przez ref) najnowsze
      // onCalculate — inaczej Ctrl+Enter tuż po wpisaniu wartości cicho
      // przeliczałoby formularz sprzed tej ostatniej zmiany.
      setTimeout(() => onCalculateRef.current(), 0);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const [investRate, setInvestRate] = useState(5);
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevCalcState = useRef(calcState);

  useEffect(() => {
    if (!prevCalcState.current && calcState && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevCalcState.current = calcState;
  }, [calcState]);

  const stdPayment = calcStdPayment(
    inputs.loanAmount,
    inputs.interestRate / 100 / 12,
    inputs.loanMonths
  );

  // Snap slider bounds to multiples of 100 so all positions are round numbers.
  // Dla bardzo małych kredytów (np. 1000 zł na 360 rat) stdPayment jest tak
  // niski, że sliderMax (2.5x raty) wychodzi poniżej sliderMin (rata+100) —
  // odwrócony zakres psuje <input type="range">. Math.max wymusza sensowny
  // rozstęp niezależnie od tego, jak mały jest kredyt.
  const sliderMin = Math.ceil((Math.ceil(stdPayment) + 1) / 100) * 100;
  const sliderMax = Math.max(sliderMin + 100, Math.floor(stdPayment * 2.5 / 100) * 100);
  const overpayMax = Math.max(10000, Math.floor(stdPayment * 2 / 100) * 100);
  const overpayChipPresets = overpayPresets(stdPayment);
  const isFixedTotal = inputs.strategy === 'fixed_total' || inputs.strategy === 'reduce_payment';

  const goalYears = Math.floor(inputs.goalMonths / 12);
  const goalRemMonths = inputs.goalMonths % 12;
  const goalLabel = [
    goalYears > 0 ? `${goalYears} ${goalYears === 1 ? t('years1') : t('years')}` : '',
    goalRemMonths > 0 ? `${goalRemMonths} ${t('months_short')}` : '',
  ].filter(Boolean).join(' ');

  const totalMonthlyRef = useRef<HTMLInputElement>(null);
  const overpayAmountRef = useRef<HTMLInputElement>(null);
  const shortenAmountRef = useRef<HTMLInputElement>(null);

  // Uncontrolled inputs to avoid leading-zero / cursor issues
  const loanAmountRef = useRef<HTMLInputElement>(null);
  const interestRateRef = useRef<HTMLInputElement>(null);
  const loanMonthsRef = useRef<HTMLInputElement>(null);
  const prepayFeeRef = useRef<HTMLInputElement>(null);

  const refiRateRef = useRef<HTMLInputElement>(null);
  const refiMonthsRef = useRef<HTMLInputElement>(null);
  const refiOriginationFeeRef = useRef<HTMLInputElement>(null);
  const refiFlatRef = useRef<HTMLInputElement>(null);

  // Clamp refiMonth when loanMonths shrinks below it
  useEffect(() => {
    const max = Math.min(120, inputs.loanMonths - 1);
    if (inputs.refiMonth > max) setInputs({ refiMonth: max });
  }, [inputs.loanMonths]); // eslint-disable-line react-hooks/exhaustive-deps

  useSyncInput(refiMonthsRef, inputs.refiMonths);
  useSyncInput(refiOriginationFeeRef, inputs.refiOriginationFee);
  useSyncInput(refiFlatRef, inputs.refiFlat);

  // Track previous sliderMin so we can preserve the overpay amount when loan params change
  const prevSliderMinRef = useRef(sliderMin);

  useSyncInput(totalMonthlyRef, inputs.totalMonthlySlider);
  useSyncInput(overpayAmountRef, inputs.overpayAmountSlider);
  useSyncInput(shortenAmountRef, inputs.shortenAmountSlider);
  useSyncInput(loanAmountRef, inputs.loanAmount);
  useSyncInput(interestRateRef, fmt(inputs.interestRate, 2));
  useSyncInput(refiRateRef, fmt(inputs.refiRate, 2));
  useSyncInput(loanMonthsRef, inputs.loanMonths);
  useSyncInput(prepayFeeRef, inputs.prepayFee);

  // When stdPayment changes (loan amount / rate / months edited), preserve the overpay amount
  // rather than keeping the old total which no longer makes sense for the new loan.
  useEffect(() => {
    const prevMin = prevSliderMinRef.current;
    prevSliderMinRef.current = sliderMin;
    if (!isFixedTotal) return;
    if (sliderMin === prevMin) return;
    const prevOverpay = Math.max(0, inputs.totalMonthlySlider - prevMin);
    const newTotal = Math.min(sliderMax, Math.max(sliderMin, sliderMin + prevOverpay));
    setInputs({ totalMonthlySlider: newTotal });
  }, [sliderMin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aktualizujemy istniejący wykres zamiast go niszczyć i tworzyć od nowa —
  // każda edycja raty/nadpłaty w harmonogramie (Schedule.tsx) tworzy nowy
  // obiekt calcState, więc przy destroy+create na każdej zmianie canvas co
  // klawisz mrugał i tracił animację przejścia. Chart.js update() płynnie
  // interpoluje między starymi a nowymi punktami.
  useEffect(() => {
    if (!calcState || !chartRef.current) return;

    const totalLen = Math.max(calcState.baseMonths, calcState.rows.length);
    const withBals = Array<number>(totalLen).fill(0);
    calcState.rows.forEach((r, i) => { if (i < totalLen) withBals[i] = r.balanceAfter; });
    const baseBals = totalLen > calcState.baseBalances.length
      ? [...calcState.baseBalances, ...Array<number>(totalLen - calcState.baseBalances.length).fill(0)]
      : calcState.baseBalances;
    const labels = Array.from({ length: totalLen }, (_, i) => i + 1);

    if (chart.current) {
      const [withoutDs, withDs] = chart.current.data.datasets;
      chart.current.data.labels = labels;
      withoutDs!.data = baseBals;
      withoutDs!.label = t('chart_without');
      withDs!.data = withBals;
      withDs!.label = t('chart_with');
      chart.current.update();
      return;
    }

    chart.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: t('chart_without'), data: baseBals, borderColor: CHART.base, backgroundColor: CHART.baseFill, borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
          { label: t('chart_with'), data: withBals, borderColor: CHART.over, backgroundColor: CHART.overFill, borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
        ],
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { labels: { color: CHART.legend, font: { size: 11 } } } },
        scales: {
          x: { grid: { color: CHART.grid }, ticks: { color: CHART.ticks, maxTicksLimit: 10 } },
          y: { grid: { color: CHART.grid }, ticks: { color: CHART.ticks, callback: (v) => fmt(Number(v) / 1000) + 'k' } },
        },
      },
    });
  }, [calcState, t, fmt]);

  // Destroy tylko przy odmontowaniu komponentu — nie przy każdej zmianie calcState.
  useEffect(() => () => { chart.current?.destroy(); chart.current = null; }, []);

  const handleCopy = () => {
    copyToClipboard(window.location.href, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopySummary = () => {
    if (!calcState) return;
    const text = formatResultsSummaryText(calcState, t, fmt, fmtC, window.location.href);
    copyToClipboard(text, () => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;
    onSaveScenario(scenarioName.trim());
    setScenarioName('');
  };

  const startEditingScenario = (s: SavedScenario) => {
    setConfirmDeleteId(null);
    setEditingScenarioId(s.id);
    setEditingScenarioName(s.name);
  };

  const commitScenarioRename = () => {
    if (editingScenarioId) onRenameScenario(editingScenarioId, editingScenarioName);
    setEditingScenarioId(null);
  };

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteScenario(id);
      setConfirmDeleteId(null);
    } else {
      setEditingScenarioId(null);
      setConfirmDeleteId(id);
    }
  };

  const handleExportScenarios = () => {
    const blob = new Blob([scenariosToJSON(scenarios)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenariusze-nadplata-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportScenarioComparison = () => {
    const csv = buildScenarioComparisonCSV(buildScenarioComparisonRows(scenarios), t, lang);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `porownanie-scenariuszy-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadChart = () => {
    if (!chart.current) return;
    const a = document.createElement('a');
    a.href = chart.current.toBase64Image('image/png', 1);
    a.download = `wykres-nadplata-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // pozwala wybrać ten sam plik ponownie i dostać onChange
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const count = onImportScenarios(String(reader.result ?? ''));
      setImportMessage(count > 0 ? t('scenario_import_success').replace('{n}', String(count)) : t('scenario_import_empty'));
      setTimeout(() => setImportMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleCopyScenarioLink = (s: SavedScenario) => {
    const url = `${window.location.origin}${window.location.pathname}?${buildUrlParams(s.inputs)}`;
    copyToClipboard(url, () => {
      setCopiedScenarioId(s.id);
      setTimeout(() => setCopiedScenarioId(null), 2000);
    });
  };

  const handleCopyScenarioSummary = (s: SavedScenario) => {
    const url = `${window.location.origin}${window.location.pathname}?${buildUrlParams(s.inputs)}`;
    const text = scenarioSummaryText(s.inputs, t, fmt, fmtC, url);
    if (text === null) {
      setInvalidScenarioSummaryId(s.id);
      setTimeout(() => setInvalidScenarioSummaryId(null), 2000);
      return;
    }
    copyToClipboard(text, () => {
      setCopiedScenarioSummaryId(s.id);
      setTimeout(() => setCopiedScenarioSummaryId(null), 2000);
    });
  };

  const handleShare = () => {
    // AbortError (użytkownik zamknął systemowy arkusz udostępniania) to nie
    // błąd aplikacji — nic nie pokazujemy, po prostu nic się nie stało.
    navigator.share({ title: 'Mądra Nadpłata', url: window.location.href }).catch(() => {});
  };

  const stats = useMemo(
    () => calcState ? renderStats(calcState, t, fmtC, lang) : null,
    [calcState, t, fmtC, lang]
  );

  const investCard = useMemo(
    () => calcState ? renderInvestCard(calcState, investRate, t, fmtC) : null,
    [calcState, investRate, t, fmtC]
  );

  return (
    <section id="calculator">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">{t('calc_label')}</div>
          <div className="section-title">{t('calc_title')}</div>
          <p className="section-sub">{t('calc_sub')}</p>
        </motion.div>

        <div className="calc-wrapper">
          {/* FORM */}
          <motion.div
            className="calc-form"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="form-group">
              <label htmlFor="loan-amount">{t('form_loan_amount')}</label>
              <div className="input-with-suffix">
                <input
                  id="loan-amount"
                  ref={loanAmountRef}
                  type="number" defaultValue={inputs.loanAmount} min={1000} max={10000000} step={1000}
                  onBlur={(e) => {
                    const raw = parseFloat(e.target.value);
                    const v = isFinite(raw) ? Math.max(1000, Math.min(10000000, raw)) : inputs.loanAmount;
                    e.target.value = String(v);
                    setInputs({ loanAmount: v });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="input-suffix">{t('currency')}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="interest-rate">{t('form_interest')}</label>
              <div className="input-with-suffix">
                <input
                  id="interest-rate"
                  ref={interestRateRef}
                  type="text" inputMode="decimal" defaultValue={fmt(inputs.interestRate, 2)}
                  onBlur={(e) => {
                    const raw = parseLocaleNumber(e.target.value);
                    const v = isFinite(raw) ? Math.max(0.01, Math.min(25, raw)) : inputs.interestRate;
                    e.target.value = fmt(v, 2);
                    setInputs({ interestRate: v });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="input-suffix">%</span>
              </div>
              <div className="hint">
                {t('form_daily_interest')} <strong>{fmtC(dailyInterestCost(inputs.loanAmount, inputs.interestRate / 100 / 12), 2)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="loan-months">{t('form_months')}</label>
              <div className="input-with-suffix">
                <input
                  id="loan-months"
                  ref={loanMonthsRef}
                  type="number" defaultValue={inputs.loanMonths} min={12} max={360} step={1}
                  onBlur={(e) => {
                    const raw = parseInt(e.target.value, 10);
                    const v = isFinite(raw) ? Math.max(12, Math.min(360, raw)) : inputs.loanMonths;
                    e.target.value = String(v);
                    setInputs({ loanMonths: v });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="input-suffix">{t('form_months_unit')}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prepay-fee">{t('form_fee')}</label>
              <div className="input-with-suffix">
                <input
                  id="prepay-fee"
                  ref={prepayFeeRef}
                  type="number" defaultValue={inputs.prepayFee} min={0} max={5} step={0.1}
                  onBlur={(e) => {
                    const raw = parseFloat(e.target.value);
                    const v = isFinite(raw) ? Math.max(0, Math.min(5, raw)) : inputs.prepayFee;
                    e.target.value = String(v);
                    setInputs({ prepayFee: v });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="input-suffix">%</span>
              </div>
              <p className="hint">{t('form_fee_hint')}</p>
            </div>

            <div className="form-divider" />

            <div className="form-group">
              <label htmlFor="strategy-select">{t('form_strategy')}</label>
              <select id="strategy-select" value={inputs.strategy === 'reduce_payment' ? 'fixed_total' : inputs.strategy} onChange={(e) => setInputs({ strategy: e.target.value as Strategy })}>
                <option value="fixed_total">{t('strategy_fixed_total')}</option>
                <option value="fixed_overpay">{t('strategy_fixed_overpay')}</option>
                <option value="shorten_period">{t('strategy_shorten')}</option>
                <option value="goal">{t('strategy_goal')}</option>
                <option value="custom">{t('strategy_custom')}</option>
                <option value="refinance">{t('strategy_refinance')}</option>
              </select>
            </div>

            {isFixedTotal && (
              <div className="slider-group">
                <div className="slider-header">
                  <label htmlFor="total-monthly">{t('slider_total')}</label>
                  <input
                    id="total-monthly"
                    ref={totalMonthlyRef}
                    type="number"
                    className="slider-val-input"
                    defaultValue={inputs.totalMonthlySlider}
                    min={1}
                    onBlur={(e) => {
                      const v = Math.max(sliderMin, Math.min(sliderMax, Math.round(+e.target.value) || sliderMin));
                      e.target.value = String(v);
                      setInputs({ totalMonthlySlider: v });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                <div className="preset-chips">
                  {overpayChipPresets.map((amount) => {
                    const total = Math.min(sliderMax, sliderMin + amount);
                    return (
                      <button
                        type="button" key={amount}
                        className={`preset-chip${inputs.totalMonthlySlider === total ? ' active' : ''}`}
                        onClick={() => setInputs({ totalMonthlySlider: total })}
                      >
                        {t('slider_std_short')} +{fmt(amount)} {t('currency')}
                      </button>
                    );
                  })}
                </div>
                <input type="range" min={sliderMin} max={sliderMax} step={100}
                  aria-label={t('slider_total')}
                  value={Math.max(inputs.totalMonthlySlider, sliderMin)}
                  onChange={(e) => setInputs({ totalMonthlySlider: +e.target.value })} />
                <div className="hint">{t('slider_std')} <strong>{fmtC(stdPayment, 2)}</strong></div>
                <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }}>{t('reduce_payment_hint')}</div>
              </div>
            )}

            {inputs.strategy === 'fixed_overpay' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label htmlFor="overpay-amount">{t('slider_overpay')}</label>
                  <input
                    id="overpay-amount"
                    ref={overpayAmountRef}
                    type="number"
                    className="slider-val-input"
                    defaultValue={inputs.overpayAmountSlider}
                    min={0}
                    onBlur={(e) => {
                      const v = Math.max(0, Math.min(overpayMax, Math.round(+e.target.value) || 0));
                      e.target.value = String(v);
                      setInputs({ overpayAmountSlider: v });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                <div className="preset-chips">
                  {overpayChipPresets.map((amount) => (
                    <button
                      type="button" key={amount}
                      className={`preset-chip${inputs.overpayAmountSlider === amount ? ' active' : ''}`}
                      onClick={() => setInputs({ overpayAmountSlider: amount })}
                    >
                      +{fmt(amount)} {t('currency')}
                    </button>
                  ))}
                </div>
                <input type="range" min={0} max={overpayMax} step={100} value={inputs.overpayAmountSlider}
                  aria-label={t('slider_overpay')}
                  onChange={(e) => setInputs({ overpayAmountSlider: +e.target.value })} />
              </div>
            )}

            {inputs.strategy === 'shorten_period' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label htmlFor="shorten-amount">{t('slider_overpay')}</label>
                  <input
                    id="shorten-amount"
                    ref={shortenAmountRef}
                    type="number"
                    className="slider-val-input"
                    defaultValue={inputs.shortenAmountSlider}
                    min={0}
                    onBlur={(e) => {
                      const v = Math.max(0, Math.min(overpayMax, Math.round(+e.target.value) || 0));
                      e.target.value = String(v);
                      setInputs({ shortenAmountSlider: v });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                <div className="preset-chips">
                  {overpayChipPresets.map((amount) => (
                    <button
                      type="button" key={amount}
                      className={`preset-chip${inputs.shortenAmountSlider === amount ? ' active' : ''}`}
                      onClick={() => setInputs({ shortenAmountSlider: amount })}
                    >
                      +{fmt(amount)} {t('currency')}
                    </button>
                  ))}
                </div>
                <input type="range" min={0} max={overpayMax} step={100} value={inputs.shortenAmountSlider}
                  aria-label={t('slider_overpay')}
                  onChange={(e) => setInputs({ shortenAmountSlider: +e.target.value })} />
                <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }} dangerouslySetInnerHTML={{ __html: t('shorten_hint') }} />
              </div>
            )}

            {inputs.strategy === 'goal' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label htmlFor="goal-months">{t('goal_years_label')}</label>
                  <span className="slider-val">{goalLabel}</span>
                </div>
                <input id="goal-months" type="range" min={12} max={inputs.loanMonths} step={12}
                  value={Math.min(inputs.goalMonths, inputs.loanMonths)}
                  onChange={(e) => setInputs({ goalMonths: +e.target.value })} />
                <div className="hint">{t('slider_std')} <strong>{fmtC(stdPayment, 2)}</strong></div>
                <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }}>{t('goal_hint')}</div>
              </div>
            )}

            {inputs.strategy === 'custom' && (
              <div>
                <div className="info-box" style={{ fontSize: '.85rem' }} dangerouslySetInnerHTML={{ __html: t('custom_hint') }} />
                <div className="hint" style={{ marginTop: 8 }}>{t('slider_std')} <strong>{fmtC(stdPayment, 2)}</strong></div>
              </div>
            )}

            {inputs.strategy === 'refinance' && (
              <div>
                <div className="slider-group">
                  <div className="slider-header">
                    <label htmlFor="refi-month">{t('refi_month_label')}</label>
                    <span className="slider-val">{inputs.refiMonth}</span>
                  </div>
                  <input id="refi-month" type="range" min={0} max={Math.min(120, inputs.loanMonths - 1)} step={1}
                    value={inputs.refiMonth}
                    onChange={(e) => setInputs({ refiMonth: +e.target.value })} />
                  <div className="hint">{t('refi_remaining_hint')} <strong>{inputs.loanMonths - inputs.refiMonth}</strong> {t('form_months_unit')}</div>
                </div>

                <div className="form-group">
                  <label htmlFor="refi-rate">{t('refi_new_rate_label')}</label>
                  <div className="input-with-suffix">
                    <input id="refi-rate" ref={refiRateRef} type="text" inputMode="decimal" defaultValue={fmt(inputs.refiRate, 2)}
                      onBlur={(e) => {
                        const raw = parseLocaleNumber(e.target.value);
                        const v = isFinite(raw) ? Math.max(0.01, Math.min(25, raw)) : inputs.refiRate;
                        e.target.value = fmt(v, 2);
                        setInputs({ refiRate: v });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="refi-months">{t('refi_new_months_label')}</label>
                  <div className="input-with-suffix">
                    <input id="refi-months" ref={refiMonthsRef} type="number" defaultValue={inputs.refiMonths}
                      min={12} max={360} step={1}
                      onBlur={(e) => {
                        const v = isFinite(+e.target.value) ? Math.max(12, Math.min(360, Math.round(+e.target.value))) : inputs.refiMonths;
                        e.target.value = String(v);
                        setInputs({ refiMonths: v });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="input-suffix">{t('form_months_unit')}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="refi-origination-fee">{t('refi_origination_fee_label')}</label>
                  <div className="input-with-suffix">
                    <input id="refi-origination-fee" ref={refiOriginationFeeRef} type="number" defaultValue={inputs.refiOriginationFee}
                      min={0} max={10} step={0.01}
                      onBlur={(e) => {
                        const v = isFinite(+e.target.value) ? Math.max(0, Math.min(10, +e.target.value)) : 0;
                        e.target.value = String(v);
                        setInputs({ refiOriginationFee: v });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                  <p className="hint">{t('refi_origination_fee_hint')}</p>
                </div>

                <div className="form-group">
                  <label htmlFor="refi-flat-fee">{t('refi_flat_fee_label')}</label>
                  <div className="input-with-suffix">
                    <input id="refi-flat-fee" ref={refiFlatRef} type="number" defaultValue={inputs.refiFlat}
                      min={0} max={10000000} step={100}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.min(10000000, +e.target.value || 0));
                        e.target.value = String(v);
                        setInputs({ refiFlat: v });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="input-suffix">{t('currency')}</span>
                  </div>
                </div>

                <div className="info-box" style={{ fontSize: '.85rem' }} dangerouslySetInnerHTML={{ __html: t('refi_hint') }} />
                <div className="info-box" style={{ fontSize: '.82rem', marginTop: 8, borderColor: '#cbb6f5', background: 'var(--accent3-soft)', color: 'var(--accent3)' }}>
                  {t('refi_no_overpay_note')}
                </div>
              </div>
            )}

            {inputs.strategy !== 'custom' && inputs.strategy !== 'refinance' && inputs.strategy !== 'goal' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label htmlFor="overpay-start">{t('overpay_start_label')}</label>
                  <span className="slider-val">
                    {inputs.overpayStartMonth === 0 ? t('overpay_start_now') : inputs.overpayStartMonth}
                  </span>
                </div>
                <input id="overpay-start" type="range" min={0} max={Math.min(120, inputs.loanMonths - 1)} step={1}
                  value={inputs.overpayStartMonth}
                  onChange={(e) => setInputs({ overpayStartMonth: +e.target.value })} />
                <div className="hint">{t('overpay_start_hint')}</div>
              </div>
            )}

            {inputs.strategy !== 'custom' && inputs.strategy !== 'refinance' && inputs.strategy !== 'goal' && (
              <div className="slider-group">
                <label className="checkbox-row" htmlFor="extra-annual-payment">
                  <input
                    id="extra-annual-payment"
                    type="checkbox"
                    checked={inputs.extraAnnualPayment}
                    onChange={(e) => setInputs({ extraAnnualPayment: e.target.checked })}
                  />
                  <span>{t('extra_annual_label')}</span>
                </label>
                <div className="hint">{t('extra_annual_hint')}</div>
              </div>
            )}

            {calcError && (
              <div className="calc-error" role="alert">{t(calcError)}</div>
            )}

            <motion.button
              type="button"
              className="calc-btn"
              onClick={() => onCalculate()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('calc_btn')}
            </motion.button>
            <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
            <button type="button" className="copy-link-btn" onClick={handleCopy} disabled={!calcState}
              style={!calcState ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
              {copied ? t('copy_link_copied') : t('copy_link')}
            </button>
            <button type="button" className="copy-link-btn" onClick={handleCopySummary} disabled={!calcState}
              style={!calcState ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
              {copiedSummary ? t('copy_summary_copied') : t('copy_summary')}
            </button>
            {canShare && (
              <button type="button" className="copy-link-btn" onClick={handleShare} disabled={!calcState}
                style={!calcState ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
                {t('share_native')}
              </button>
            )}
            <button type="button" className="copy-link-btn" onClick={() => onResetToDefaults()}>
              {t('reset_defaults')}
            </button>

            <div className="scenario-panel">
              <div className="scenario-save-row">
                <input
                  type="text"
                  className="scenario-name-input"
                  placeholder={t('scenario_name_placeholder')}
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScenario(); }}
                />
                <button
                  type="button"
                  className="copy-link-btn"
                  onClick={handleSaveScenario}
                  disabled={!scenarioName.trim()}
                  style={!scenarioName.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                >
                  {t('scenario_save')}
                </button>
                {scenarioSaveError && (
                  <div className="scenario-save-error" role="alert" style={{ color: 'var(--danger)', fontSize: '.85rem', marginTop: '6px' }}>
                    {t('scenario_save_storage_error')}
                  </div>
                )}
              </div>
              <div className="scenario-import-export-row">
                <input
                  type="file"
                  accept="application/json"
                  ref={importInputRef}
                  onChange={handleImportFileChange}
                  style={{ display: 'none' }}
                />
                <button type="button" className="scenario-row-btn" onClick={() => importInputRef.current?.click()}>
                  {t('scenario_import')}
                </button>
                {scenarios.length > 0 && (
                  <>
                    <button type="button" className="scenario-row-btn" onClick={handleExportScenarios}>
                      {t('scenario_export')}
                    </button>
                    <button type="button" className="scenario-row-btn" onClick={handleExportScenarioComparison}>
                      {t('scenario_export_csv')}
                    </button>
                  </>
                )}
                {importMessage && <span className="scenario-import-message">{importMessage}</span>}
              </div>
              {scenarios.length > 0 && (
                <div className="scenario-list">
                  <div className="scenario-list-header">
                    <div className="scenario-list-title">{t('scenario_saved_title')}</div>
                    {scenarios.length > 1 && (
                      <select
                        className="scenario-sort-select"
                        value={scenarioSort}
                        onChange={(e) => setScenarioSort(e.target.value as ScenarioSortKey)}
                        aria-label={t('scenario_sort_label')}
                      >
                        <option value="date-desc">{t('scenario_sort_newest')}</option>
                        <option value="date-asc">{t('scenario_sort_oldest')}</option>
                        <option value="name-asc">{t('scenario_sort_name')}</option>
                      </select>
                    )}
                  </div>
                  {sortedScenarios.map((s) => {
                    const diff = scenarioDiffs.get(s.id);
                    const isEditing = editingScenarioId === s.id;
                    const isConfirmingDelete = confirmDeleteId === s.id;
                    const isActive = s.id === activeScenarioId;
                    return (
                      <div className={`scenario-row${isActive ? ' active' : ''}`} key={s.id}>
                        {isEditing ? (
                          <input
                            type="text"
                            className="scenario-name-edit-input"
                            value={editingScenarioName}
                            autoFocus
                            onChange={(e) => setEditingScenarioName(e.target.value)}
                            onBlur={commitScenarioRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitScenarioRename();
                              else if (e.key === 'Escape') setEditingScenarioId(null);
                            }}
                          />
                        ) : (
                          <span
                            className="scenario-row-name"
                            title={t('scenario_rename_hint')}
                            onClick={() => startEditingScenario(s)}
                          >
                            {s.name}
                          </span>
                        )}
                        {isActive && (
                          <span className="scenario-row-active-badge" title={t('scenario_active_hint')}>
                            {t('scenario_active_badge')}
                          </span>
                        )}
                        {diff && (diff.interestDiff !== 0 || diff.monthsDiff !== 0) && (
                          <span
                            className="scenario-row-diff"
                            title={t('scenario_diff_label')}
                            style={{ color: diff.interestDiff <= 0 ? 'var(--accent2)' : 'var(--danger)' }}
                          >
                            {fmtSignedC(diff.interestDiff, 0)}
                            {diff.monthsDiff !== 0 && ` / ${diff.monthsDiff >= 0 ? '+' : ''}${diff.monthsDiff} ${t('months_short')}`}
                          </span>
                        )}
                        <button type="button" className="scenario-row-btn" onClick={() => onLoadScenario(s.id)}>
                          {t('scenario_load')}
                        </button>
                        <button
                          type="button"
                          className="scenario-row-btn"
                          onClick={() => onDuplicateScenario(s.id, `${s.name} ${t('scenario_copy_suffix')}`)}
                        >
                          {t('scenario_duplicate')}
                        </button>
                        <button type="button" className="scenario-row-btn" onClick={() => handleCopyScenarioLink(s)}>
                          {copiedScenarioId === s.id ? t('scenario_copy_link_copied') : t('scenario_copy_link')}
                        </button>
                        <button type="button" className="scenario-row-btn" onClick={() => handleCopyScenarioSummary(s)}>
                          {invalidScenarioSummaryId === s.id
                            ? t('scenario_summary_invalid')
                            : copiedScenarioSummaryId === s.id ? t('copy_summary_copied') : t('scenario_copy_summary')}
                        </button>
                        {isConfirmingDelete ? (
                          <>
                            <button
                              type="button"
                              className="scenario-row-btn scenario-row-btn-delete"
                              onClick={() => handleDeleteClick(s.id)}
                            >
                              {t('scenario_delete_confirm')}
                            </button>
                            <button type="button" className="scenario-row-btn" onClick={() => setConfirmDeleteId(null)}>
                              {t('scenario_delete_cancel')}
                            </button>
                          </>
                        ) : (
                          <button type="button" className="scenario-row-btn scenario-row-btn-delete" onClick={() => handleDeleteClick(s.id)}>
                            {t('scenario_delete')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="info-box" style={{ fontSize: '.82rem', marginTop: 12 }}>{t('overpay_day_tip')}</div>
          </motion.div>

          {/* RESULTS */}
          <motion.div
            ref={resultsRef}
            className="calc-results"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {isStale && calcState && (
              <div className="info-box" style={{ marginBottom: 20, marginTop: 0, background: 'var(--warn-soft)', borderColor: '#f5dca3', color: 'var(--warn)' }}>
                {t('calc_stale')}
              </div>
            )}

            {!calcState ? (
              <div className="result-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 200 }}>
                <div className="result-label" style={{ marginBottom: 12, fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)' }}>
                  {t('calc_placeholder')}
                </div>
                <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{t('calc_placeholder_sub')}</p>
              </div>
            ) : !stats ? (
              <div className="result-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 120 }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)', marginBottom: 8 }}>
                  {t('no_overpay_title')}
                </div>
                <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{t('no_overpay_sub')}</p>
              </div>
            ) : (
              <>
                {stats}

                <PartnerOffers calcState={calcState} />

                {calcState.strategy === 'refinance' && (
                  <div className="result-card" style={{ fontSize: '.82rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                    {t('refi_no_invest_note')}
                  </div>
                )}
                {calcState.strategy !== 'refinance' && <div className="result-card">
                  <div className="result-card-label">{t('invest_section_title')}</div>
                  <div className="slider-group" style={{ marginBottom: 12 }}>
                    <div className="slider-header">
                      <label htmlFor="invest-rate" style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text2)' }}>{t('invest_rate_label')}</label>
                      <span className="slider-val">{investRate}%</span>
                    </div>
                    <input id="invest-rate" type="range" min={0} max={15} step={0.5}
                      value={investRate}
                      onChange={(e) => setInvestRate(+e.target.value)} />
                  </div>
                  {investCard}
                </div>}

                <div className="calc-chart-box">
                  <canvas ref={chartRef} role="img" aria-label={t('chart_balance')} />
                </div>
                <button type="button" className="copy-link-btn" onClick={handleDownloadChart}>
                  {t('chart_download')}
                </button>
              </>
            )}

            {isFinite(stdPayment) && stdPayment > 0 && (
              <div className="result-card" style={{ marginBottom: 20, marginTop: 20 }}>
                <div className="result-card-label">{t('rate_shock_title')}</div>
                <p className="hint" style={{ marginBottom: 12 }}>{t('rate_shock_hint')}</p>
                <div className="result-grid">
                  {[1, 2, 3].map((delta) => {
                    const shockStd = calcStdPayment(inputs.loanAmount, (inputs.interestRate + delta) / 100 / 12, inputs.loanMonths);
                    const diff = shockStd - stdPayment;
                    return (
                      <div className="result-item" key={delta}>
                        <div className="r-val" style={{ color: 'var(--danger)' }}>{fmtC(shockStd, 0)}</div>
                        <div className="r-lbl">+{delta} p.p. ({diff >= 0 ? '+' : ''}{fmtC(diff, 0)} {t('rate_shock_more')})</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isFinite(stdPayment) && stdPayment > 0 && (
              <div className="result-card" style={{ marginBottom: 20 }}>
                <div className="result-card-label">{t('holiday_title')}</div>
                <p className="hint" style={{ marginBottom: 12 }}>{t('holiday_hint')}</p>
                <div className="result-grid">
                  {[3, 6].map((holidayMonths) => {
                    const result = simulatePaymentHoliday(inputs.loanAmount, inputs.interestRate / 100 / 12, inputs.loanMonths, holidayMonths);
                    const text = t('holiday_scenario')
                      .replace('{n}', String(holidayMonths))
                      .replace('{amount}', fmtC(result.extraInterest, 0));
                    return (
                      <div className="result-item" key={holidayMonths}>
                        <div className="r-val" style={{ color: 'var(--danger)' }}>+{result.extraMonths} {t('form_months_unit')}</div>
                        <div className="r-lbl">{text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Powyżej tej wielokrotności zwykłej raty wynik strategii "cel spłaty" jest
 * matematycznie poprawny, ale nierealny do wdrożenia w domowym budżecie —
 * wtedy pokazujemy ostrzeżenie zamiast udawać, że to zwykła rekomendacja.
 */
const GOAL_UNREASONABLE_MULTIPLE = 5;

function renderStats(
  cs: CalcState,
  t: (key: TranslationKey) => string,
  fmtC: (n: number) => string,
  lang: Lang
): React.ReactElement | null {
  if (cs.strategy === 'refinance' && cs.refiData) {
    return renderRefiStats(cs, cs.refiData, t, fmtC);
  }

  const withInterest = cs.rows.length ? cs.rows[cs.rows.length - 1]!.cumInterest : 0;
  const withMonths = cs.rows.length;

  if (cs.strategy === 'goal' && cs.requiredOverpay === 0) {
    return (
      <div className="result-card highlight-green">
        <div className="result-big green">0 zł</div>
        <div className="result-label">{t('goal_required_overpay')}</div>
        <div className="info-box" style={{ fontSize: '.88rem', marginTop: 14 }}>{t('goal_already_met')}</div>
      </div>
    );
  }

  const totalOverpay = totalAppliedOverpay(cs.rows);
  if (totalOverpay < 1) {
    if (cs.strategy !== 'custom') return null;
    return (
      <div className="result-card">
        <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text3)', marginBottom: 14 }}>
          {t('custom_base_title')}
        </div>
        <div className="result-grid">
          <div className="result-item">
            <div className="r-val" style={{ color: 'var(--danger)' }}>{fmtC(cs.baseInterest)}</div>
            <div className="r-lbl">{t('stats_total_interest')}</div>
          </div>
          <div className="result-item">
            <div className="r-val">{cs.baseMonths} {t('stats_payments_label')}</div>
            <div className="r-lbl">{t('stats_loan_duration')}</div>
          </div>
        </div>
        <div className="info-box" style={{ fontSize: '.85rem', marginTop: 12 }}>{t('custom_base_hint')}</div>
      </div>
    );
  }
  const savedMoney = Math.max(0, cs.baseInterest - withInterest);
  const savedMonths = Math.max(0, cs.baseMonths - withMonths);
  const savedYears = Math.floor(savedMonths / 12);
  const savedRem = savedMonths % 12;
  const avgOverpay = totalOverpay / Math.max(1, withMonths);

  const timeStr = savedYears > 0
    ? savedYears + ' ' + t('years') + (savedRem > 0 ? ' ' + savedRem + ' ' + t('months_short') : '')
    : savedMonths > 0 ? savedMonths + ' ' + t('months_short') : '0 ' + t('months_short');

  const halfMonth = halfPrincipalMonth(cs.rows, cs.P);
  const halfYears = halfMonth ? Math.floor(halfMonth / 12) : 0;
  const halfRem = halfMonth ? halfMonth % 12 : 0;
  const halfStr = halfMonth === null ? null : (halfYears > 0
    ? halfYears + ' ' + t('years') + (halfRem > 0 ? ' ' + halfRem + ' ' + t('months_short') : '')
    : halfMonth + ' ' + t('months_short'));

  const payoffDateStr = withMonths > 0 ? fmtMonthYear(payoffDate(withMonths), lang) : null;

  const pct = cs.baseInterest > 0 ? (withInterest / cs.baseInterest * 100).toFixed(1) : '0';

  let breakEvenMonth = -1;
  let totalFees = 0;
  if (cs.prepayFee > 0 && cs.rows.length > 0) {
    let cumFees = 0;
    for (let i = 0; i < cs.rows.length; i++) {
      cumFees += cs.rows[i]!.fee;
      totalFees = cumFees;
      const baseCumInt = cs.baseCumInterestByMonth[i] ?? 0;
      const withCumInt = cs.rows[i]!.cumInterest;
      if ((baseCumInt - withCumInt) >= cumFees && breakEvenMonth === -1) {
        breakEvenMonth = i + 1;
      }
    }
  }

  const goalCard = cs.strategy === 'goal' && cs.requiredOverpay ? (
    <div className="result-card highlight-blue">
      <div className="result-big blue">{fmtC(cs.requiredOverpay)}</div>
      <div className="result-label">{t('goal_required_overpay')}</div>
      <div className="result-grid" style={{ marginTop: 18 }}>
        <div className="result-item">
          <div className="r-val">{fmtC(cs.origStdPayment + cs.requiredOverpay)}</div>
          <div className="r-lbl">{t('goal_required_total')}</div>
        </div>
        <div className="result-item">
          <div className="r-val" style={{ color: 'var(--accent2)' }}>{withMonths} {t('stats_payments_label')}</div>
          <div className="r-lbl">{t('goal_target_label')} {cs.goalMonths} {t('months_short')}</div>
        </div>
      </div>
      {cs.requiredOverpay > cs.origStdPayment * GOAL_UNREASONABLE_MULTIPLE && (
        <div className="info-box" style={{ fontSize: '.85rem', marginTop: 14 }}>{t('goal_unreachable')}</div>
      )}
    </div>
  ) : null;

  return (
    <>
      {goalCard}
      <div className="result-card highlight-green">
        <div className="result-big green">{fmtC(savedMoney)}</div>
        <div className="result-label">{t('stats_saved')}</div>
      </div>
      <div className="result-card highlight-blue">
        <div className="result-grid">
          <div className="result-item">
            <div className="r-val" style={{ color: 'var(--accent2)' }}>{timeStr}</div>
            <div className="r-lbl">{t('stats_faster')}</div>
          </div>
          <div className="result-item">
            <div className="r-val" style={{ color: 'var(--accent)' }}>{withMonths} {t('stats_payments_label')}</div>
            <div className="r-lbl">{t('stats_payments_instead')} {cs.baseMonths}</div>
          </div>
          <div className="result-item">
            <div className="r-val" style={{ color: 'var(--accent3)' }}>{fmtC(avgOverpay)}</div>
            <div className="r-lbl">{t('stats_avg_overpay')}</div>
          </div>
          <div className="result-item">
            <div className="r-val">{fmtC(withInterest)}</div>
            <div className="r-lbl">{t('stats_total_interest')}</div>
          </div>
          {halfStr !== null && (
            <div className="result-item" title={t('stats_half_hint')}>
              <div className="r-val" style={{ color: 'var(--accent2)' }}>{halfStr}</div>
              <div className="r-lbl">{t('stats_half_label')}</div>
            </div>
          )}
          {payoffDateStr !== null && (
            <div className="result-item" title={t('stats_payoff_date_hint')}>
              <div className="r-val" style={{ color: 'var(--accent3)' }}>{payoffDateStr}</div>
              <div className="r-lbl">{t('stats_payoff_date_label')}</div>
            </div>
          )}
        </div>
      </div>
      <div className="result-card">
        <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text3)', marginBottom: 14 }}>
          {t('stats_comparison')}
        </div>
        <div className="comparison-bars">
          <div className="bar-row">
            <div className="bar-label"><span>{t('stats_without')}</span><span>{fmtC(cs.baseInterest)}</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '100%', background: 'var(--danger)', opacity: 0.7 }} /></div>
          </div>
          <div className="bar-row">
            <div className="bar-label"><span>{t('stats_with')}</span><span>{fmtC(withInterest)}</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: 'var(--grad)' }} /></div>
          </div>
        </div>
        {savedMoney > 0 && (
          <div className="info-box mt-16" style={{ fontSize: '.82rem' }}>
            {t('stats_saving_prefix')} <strong>{(100 - +pct).toFixed(1)}%</strong> {t('stats_saving_suffix')}
            <br />
            {t('stats_repayment_multiple')
              .replace('{base}', repaymentMultiple(cs.P, cs.baseInterest).toFixed(2))
              .replace('{with}', repaymentMultiple(cs.P, withInterest).toFixed(2))}
          </div>
        )}
      </div>

      {cs.prepayFee > 0 && (
        <div className="result-card">
          <div className="result-card-label">{t('breakeven_label')}</div>
          <div style={{ fontSize: '.9rem', color: 'var(--text2)', marginTop: 8 }}>
            {breakEvenMonth > 0 ? (
              <span>{t('breakeven_result')} <strong style={{ color: 'var(--accent2)' }}>{breakEvenMonth}</strong></span>
            ) : (
              <span style={{ color: 'var(--danger)' }}>{t('breakeven_never')}</span>
            )}
          </div>
          <div style={{ fontSize: '.8rem', color: 'var(--text3)', marginTop: 6 }}>
            {t('toolbar_total')} {fmtC(totalFees)}
          </div>
        </div>
      )}
    </>
  );
}

function renderInvestCard(
  cs: CalcState,
  investRate: number,
  t: (key: TranslationKey) => string,
  fmtC: (n: number) => string
) {
  const n = cs.rows.length;
  const rm = investRate / 100 / 12;
  let investFV = 0;
  for (let i = 0; i < n; i++) {
    // rows[i].overpay (co realnie zaaplikował buildSchedule), nie
    // customOverpay[i] (surowe wejście strategii) — patrz totalAppliedOverpay.
    const ov = cs.rows[i]!.overpay;
    investFV += ov * Math.pow(1 + rm, n - i);
  }
  const totalInvested = totalAppliedOverpay(cs.rows);
  const investGain = Math.max(0, investFV - totalInvested);
  const withInterest = n > 0 ? cs.rows[n - 1]!.cumInterest : 0;
  const savedInterest = Math.max(0, cs.baseInterest - withInterest);
  const diff = investGain - savedInterest;

  if (totalInvested === 0) {
    return <div style={{ fontSize: '.85rem', color: 'var(--text3)', marginTop: 4 }}>—</div>;
  }

  return (
    <div className="invest-rows">
      <div className="invest-row">
        <span>{t('invest_saved_label')}</span>
        <strong style={{ color: 'var(--accent2)' }}>{fmtC(savedInterest)}</strong>
      </div>
      <div className="invest-row">
        <span>{t('invest_gain_label')}</span>
        <strong style={{ color: 'var(--accent)' }}>{fmtC(investGain)}</strong>
      </div>
      <div className="invest-verdict" style={{ color: diff > 0 ? 'var(--accent)' : 'var(--accent2)' }}>
        {diff > 0 ? t('invest_verdict_invest') : t('invest_verdict_overpay')} <strong>{fmtC(Math.abs(diff))}</strong>
      </div>
    </div>
  );
}

function renderRefiStats(
  cs: CalcState,
  rd: RefiData,
  t: (key: TranslationKey) => string,
  fmtC: (n: number) => string,
): React.ReactElement {
  const withInterest = rd.phase1Interest + rd.phase2Interest;
  const totalFees = rd.originationFeeAmount + rd.flatFeeAmount;
  const totalWithRefi = withInterest + totalFees;
  const savedMoney = cs.baseInterest - totalWithRefi;
  const withMonths = cs.rows.length;
  const savedMonths = cs.baseMonths - withMonths;
  const newPayment = calcStdPayment(rd.balance, rd.newRate / 100 / 12, rd.newMonths);

  const pctOfBase = cs.baseInterest > 0 ? (totalWithRefi / cs.baseInterest * 100).toFixed(1) : '100';

  const breakEvenMonth = refiBreakEvenMonth(cs.baseCumInterestByMonth, cs.baseInterest, cs.rows, rd.month, totalFees) ?? -1;

  const savedYears = Math.floor(Math.abs(savedMonths) / 12);
  const savedRem = Math.abs(savedMonths) % 12;
  const timeStr = savedYears > 0
    ? savedYears + ' ' + t('years') + (savedRem > 0 ? ' ' + savedRem + ' ' + t('months_short') : '')
    : Math.abs(savedMonths) + ' ' + t('months_short');

  return (
    <>
      <div className={savedMoney >= 0 ? 'result-card highlight-green' : 'result-card'}
        style={savedMoney < 0 ? { borderColor: '#fbcaca', background: 'var(--danger-soft)' } : {}}>
        <div className="result-big" style={{ color: savedMoney >= 0 ? 'var(--accent2)' : 'var(--danger)' }}>
          {savedMoney >= 0 ? '' : '-'}{fmtC(Math.abs(savedMoney))}
        </div>
        <div className="result-label">{savedMoney >= 0 ? t('refi_net_saving') : t('refi_net_cost')}</div>
      </div>

      <div className="result-card highlight-blue">
        <div className="result-grid">
          <div className="result-item">
            <div className="r-val" style={{ color: 'var(--accent3)' }}>{fmtC(rd.balance)}</div>
            <div className="r-lbl">{t('refi_balance_label')}</div>
          </div>
          <div className="result-item">
            <div className="r-val" style={{ color: totalFees > 0 ? 'var(--danger)' : 'var(--text2)' }}>{fmtC(totalFees)}</div>
            <div className="r-lbl">{t('refi_fees_label')}</div>
          </div>
          <div className="result-item">
            <div className="r-val">{fmtC(rd.phase1Interest)}</div>
            <div className="r-lbl">{t('refi_phase1_int_label')}</div>
          </div>
          <div className="result-item">
            <div className="r-val">{fmtC(rd.phase2Interest)}</div>
            <div className="r-lbl">{t('refi_phase2_int_label')}</div>
          </div>
          <div className="result-item">
            <div className="r-val" style={{ color: 'var(--accent)' }}>{fmtC(newPayment)}</div>
            <div className="r-lbl">{t('refi_new_payment_label')}</div>
          </div>
          {savedMonths !== 0 && (
            <div className="result-item">
              <div className="r-val" style={{ color: savedMonths > 0 ? 'var(--accent2)' : 'var(--danger)' }}>
                {savedMonths > 0 ? '-' : '+'}{timeStr}
              </div>
              <div className="r-lbl">{t('stats_faster')}</div>
            </div>
          )}
        </div>
      </div>

      <div className="result-card">
        <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text3)', marginBottom: 14 }}>
          {t('stats_comparison')}
        </div>
        <div className="comparison-bars">
          <div className="bar-row">
            <div className="bar-label"><span>{t('stats_without')}</span><span>{fmtC(cs.baseInterest)}</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '100%', background: 'var(--danger)', opacity: 0.7 }} /></div>
          </div>
          <div className="bar-row">
            <div className="bar-label"><span>{t('stats_with')}</span><span>{fmtC(totalWithRefi)}</span></div>
            <div className="bar-track">
              <div className="bar-fill" style={{
                width: `${Math.min(100, +pctOfBase)}%`,
                background: totalWithRefi <= cs.baseInterest ? 'var(--grad)' : 'var(--danger)',
              }} />
            </div>
          </div>
        </div>
        {totalFees > 0 && (
          <div className="info-box mt-16" style={{ fontSize: '.82rem' }}>
            {breakEvenMonth > 0
              ? <>{t('refi_break_even')} <strong style={{ color: 'var(--accent2)' }}>{breakEvenMonth}</strong></>
              : <span style={{ color: 'var(--danger)' }}>{t('breakeven_never')}</span>
            }
          </div>
        )}
      </div>
    </>
  );
}
