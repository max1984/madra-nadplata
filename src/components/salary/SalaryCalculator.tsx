import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart } from 'chart.js';
import { useLang } from '../../contexts/LangContext';
import { CHART } from '../../lib/chartTheme';
import type { TranslationKey } from '../../lib/i18n';
import type { SalaryContractType } from '../../lib/salary';
import {
  qualifiesForJointTaxation,
  sortSalaryScenarios,
  filterSalaryScenariosByName,
  salaryScenariosToJSON,
  MAX_SALARY_SCENARIOS,
  MAX_SALARY_SCENARIO_NAME_LENGTH,
  type SalaryInputs,
  type SalaryState,
  type SavedSalaryScenario,
  type SalaryScenarioSortKey,
} from '../../hooks/useSalaryCalculator';

interface Props {
  inputs: SalaryInputs;
  setInputs: (patch: Partial<SalaryInputs>) => void;
  calcState: SalaryState | null;
  calcError: string | null;
  onCalculate: () => void;
  onResetToDefaults: () => void;
  isStale: boolean;
  /**
   * Zapisywanie scenariuszy — wszystkie opcjonalne z bezpiecznymi
   * domyślnymi, żeby ten komponent działał (i dało się go testować) także
   * bez podłączonego hooka. Realne dane/funkcje z useSalaryCalculator()
   * trzeba przekazać z rodzica (SalaryApp.tsx), żeby zapis faktycznie
   * przetrwał odświeżenie strony.
   */
  scenarios?: SavedSalaryScenario[];
  scenarioSaveError?: boolean;
  scenarioLimitReached?: boolean;
  onSaveScenario?: (name: string) => void;
  onLoadScenario?: (id: string) => void;
  onDeleteScenario?: (id: string) => void;
  onRenameScenario?: (id: string, newName: string) => void;
  onDuplicateScenario?: (id: string, newName: string) => void;
  onImportScenarios?: (json: string) => number;
}

function formatSalaryScenarioCount(count: number): string {
  return `${count}/${MAX_SALARY_SCENARIOS}`;
}

/**
 * Jak shouldClearFilterOnEscape/shouldCancelDeleteConfirmOnEscape w
 * Calculator.tsx — zduplikowane lokalnie (patrz formatSalaryChartYTick
 * wyżej po to samo uzasadnienie: nie ciągnąć całego Calculator.tsx do
 * bundla tej podstrony po dwie dwuliniowe funkcje).
 */
function shouldClearFilterOnEscape(key: string, currentFilter: string): boolean {
  return key === 'Escape' && currentFilter.length > 0;
}
function shouldCancelDeleteConfirmOnEscape(key: string, confirmDeleteId: string | null): boolean {
  return key === 'Escape' && confirmDeleteId !== null;
}

/** Mapuje typ umowy wynagrodzeń na typ kalkulatora zdolności kredytowej (który rozróżnia mniej wariantów — patrz creditworthiness.ts). */
function creditworthinessContractType(contractType: SalaryContractType): 'employment' | 'b2b' | 'mandate_or_specific_work' {
  if (contractType === 'employment') return 'employment';
  if (contractType === 'b2b') return 'b2b';
  return 'mandate_or_specific_work';
}

const TABS: { key: SalaryContractType; label: TranslationKey }[] = [
  { key: 'employment', label: 'salary_tab_employment' },
  { key: 'mandate', label: 'salary_tab_mandate' },
  { key: 'specific_work', label: 'salary_tab_specific_work' },
  { key: 'b2b', label: 'salary_tab_b2b' },
];

const MONTH_KEYS: TranslationKey[] = [
  'salary_month_1', 'salary_month_2', 'salary_month_3', 'salary_month_4',
  'salary_month_5', 'salary_month_6', 'salary_month_7', 'salary_month_8',
  'salary_month_9', 'salary_month_10', 'salary_month_11', 'salary_month_12',
];

/** Jak formatChartYTick w Calculator.tsx — zduplikowane lokalnie, żeby nie
 * ciągnąć całego Calculator.tsx (i jego mortgage-owych zależności) do bundla
 * tej podstrony tylko po jedną dwuliniową funkcję. */
function formatSalaryChartYTick(v: number, fmt: (n: number, dec?: number) => string): string {
  return `${fmt(v / 1000)}k`;
}

function primaryAmount(inputs: SalaryInputs): number {
  switch (inputs.contractType) {
    case 'employment': return inputs.employment.grossMonthly;
    case 'mandate': return inputs.mandate.grossMonthly;
    case 'specific_work': return inputs.specificWork.grossMonthly;
    case 'b2b': return inputs.b2b.monthlyRevenue;
  }
}

function setPrimaryAmount(inputs: SalaryInputs, v: number): Partial<SalaryInputs> {
  switch (inputs.contractType) {
    case 'employment': return { employment: { ...inputs.employment, grossMonthly: v } };
    case 'mandate': return { mandate: { ...inputs.mandate, grossMonthly: v } };
    case 'specific_work': return { specificWork: { ...inputs.specificWork, grossMonthly: v } };
    case 'b2b': return { b2b: { ...inputs.b2b, monthlyRevenue: v } };
  }
}

export default function SalaryCalculator({
  inputs, setInputs, calcState, calcError, onCalculate, onResetToDefaults, isStale,
  scenarios = [], scenarioSaveError = false, scenarioLimitReached = false,
  onSaveScenario = () => {}, onLoadScenario = () => {}, onDeleteScenario = () => {},
  onRenameScenario = () => {}, onDuplicateScenario = () => {}, onImportScenarios = () => 0,
}: Props) {
  const { t, fmt, fmtC, lang } = useLang();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  const [scenarioName, setScenarioName] = useState('');
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [scenarioSort, setScenarioSort] = useState<SalaryScenarioSortKey>('date-desc');
  const [scenarioFilter, setScenarioFilter] = useState('');
  const sortedScenarios = useMemo(
    () => filterSalaryScenariosByName(sortSalaryScenarios(scenarios, scenarioSort), scenarioFilter),
    [scenarios, scenarioSort, scenarioFilter],
  );

  // Escape anuluje potwierdzenie usunięcia scenariusza z dowolnego miejsca
  // na stronie — jak w kalkulatorze kredytu (patrz Calculator.tsx).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldCancelDeleteConfirmOnEscape(e.key, confirmDeleteId)) setConfirmDeleteId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDeleteId]);

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;
    onSaveScenario(scenarioName.trim());
    setScenarioName('');
  };

  const startEditingScenario = (s: SavedSalaryScenario) => {
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
    const blob = new Blob([salaryScenariosToJSON(scenarios)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenariusze-wynagrodzen-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    const showImportMessage = (key: TranslationKey, count?: number) => {
      const msg = count !== undefined ? t(key).replace('{n}', String(count)) : t(key);
      setImportMessage(msg);
      setTimeout(() => setImportMessage(null), 4000);
    };
    reader.onload = () => {
      const count = onImportScenarios(String(reader.result ?? ''));
      showImportMessage(count > 0 ? 'salary_scenario_import_success' : 'salary_scenario_import_empty', count > 0 ? count : undefined);
    };
    reader.onerror = () => showImportMessage('salary_scenario_import_error');
    reader.readAsText(file);
  };

  // Wykres roczny: destroy+create (jak ExampleSection.tsx) — aktualizuje się
  // tylko po kliknięciu "Oblicz", nie na każde naciśnięcie klawisza, więc
  // migotanie canvasu nie jest tu problemem, w przeciwieństwie do wykresu
  // salda w Calculator.tsx. `lang` w zależnościach, żeby etykiety miesięcy i
  // format osi Y odświeżały się po zmianie języka (patrz commit 6821794 —
  // ten sam wzorzec buga, tu unikniety od razu).
  useEffect(() => {
    if (!chartRef.current || !calcState || calcState.mode !== 'annual') {
      chart.current?.destroy();
      chart.current = null;
      return;
    }
    const labels = MONTH_KEYS.map((k) => t(k));
    const netValues = calcState.result.months.map((m) => m.net);
    chart.current?.destroy();
    chart.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ label: t('salary_annual_chart_label'), data: netValues, backgroundColor: CHART.overBar }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: CHART.legend, font: { size: 11 } } } },
        scales: {
          x: { grid: { color: CHART.grid }, ticks: { color: CHART.ticks, maxTicksLimit: 12 } },
          y: { grid: { color: CHART.grid }, ticks: { color: CHART.ticks, callback: (v) => formatSalaryChartYTick(Number(v), fmt) } },
        },
      },
    });
    return () => { chart.current?.destroy(); chart.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcState, lang]);

  const canJointTax = qualifiesForJointTaxation(inputs);

  return (
    <section id="salary-calculator">
      <div className="container">
        <div className="section-label">{t('salary_page_title')}</div>
        <div className="section-title">{t('salary_page_title')}</div>
        <p className="section-sub">{t('salary_page_subtitle')}</p>

        <div className="calc-form">
          <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`toolbar-btn${inputs.contractType === tab.key ? ' active' : ''}`}
                onClick={() => setInputs({ contractType: tab.key })}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>

          {/*
            Przełącznik trybu rocznego renderuje się TUTAJ, tuż pod wyborem
            typu umowy — wcześniej był schowany na końcu "Opcji zaawansowanych"
            (po KUP/uldze/PIT-2/PPK/premii/prawach autorskich/wspólnym
            rozliczeniu), podczas gdy jego efekt (siatka 12 pól miesięcznych
            zamiast jednego pola kwoty) pojawiał się od razu tutaj, na górze.
            Ten rozjazd — przełącznik na dole, efekt na górze — sprawiał, że
            tryb roczny (i połączone z nim funkcje: wspólne rozliczenie,
            limit ZUS) był łatwy do przeoczenia, mimo że liczył się poprawnie.
          */}
          <label className="checkbox-row" htmlFor="annual-mode">
            <input
              id="annual-mode"
              type="checkbox"
              checked={inputs.annualMode}
              onChange={(e) => setInputs({ annualMode: e.target.checked })}
            />
            <span>{t('salary_annual_mode_toggle')}</span>
          </label>

          <div key={`${inputs.contractType}-${inputs.annualMode}`}>
            {!inputs.annualMode ? (
              <div className="form-group">
                <label htmlFor="salary-amount">
                  {inputs.contractType === 'b2b' ? t('salary_b2b_revenue_label') : t('salary_gross_label')}
                </label>
                <div className="input-with-suffix">
                  <input
                    id="salary-amount"
                    type="number"
                    defaultValue={primaryAmount(inputs)}
                    min={0}
                    step={100}
                    onBlur={(e) => {
                      const raw = parseFloat(e.target.value);
                      const v = Number.isFinite(raw) && raw >= 0 ? raw : primaryAmount(inputs);
                      e.target.value = String(v);
                      setInputs(setPrimaryAmount(inputs, v));
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {MONTH_KEYS.map((mk, i) => (
                    <div key={i} className="input-with-suffix">
                      <input
                        type="number"
                        aria-label={t(mk)}
                        defaultValue={inputs.annualMonthlyValues[i] ?? 0}
                        min={0}
                        step={100}
                        onBlur={(e) => {
                          const raw = parseFloat(e.target.value);
                          const v = Number.isFinite(raw) && raw >= 0 ? raw : (inputs.annualMonthlyValues[i] ?? 0);
                          e.target.value = String(v);
                          const next = [...inputs.annualMonthlyValues];
                          next[i] = v;
                          setInputs({ annualMonthlyValues: next });
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      />
                      <span className="input-suffix">{t(mk).slice(0, 3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inputs.contractType === 'b2b' && (
              <div className="form-group">
                <label htmlFor="b2b-costs">{t('salary_b2b_costs_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="b2b-costs"
                    type="number"
                    defaultValue={inputs.b2b.monthlyCosts}
                    min={0}
                    step={100}
                    onBlur={(e) => {
                      const raw = parseFloat(e.target.value);
                      const v = Number.isFinite(raw) && raw >= 0 ? raw : inputs.b2b.monthlyCosts;
                      e.target.value = String(v);
                      setInputs({ b2b: { ...inputs.b2b, monthlyCosts: v } });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
            )}

            {inputs.contractType === 'b2b' && (
              <div className="form-group">
                <label htmlFor="b2b-form">{t('salary_b2b_form_label')}</label>
                <select
                  id="b2b-form"
                  value={inputs.b2b.taxForm}
                  onChange={(e) => setInputs({ b2b: { ...inputs.b2b, taxForm: e.target.value as SalaryInputs['b2b']['taxForm'] } })}
                >
                  <option value="skala">{t('salary_b2b_form_skala')}</option>
                  <option value="liniowy">{t('salary_b2b_form_liniowy')}</option>
                  <option value="ryczalt">{t('salary_b2b_form_ryczalt')}</option>
                  <option value="ipbox">{t('salary_b2b_form_ipbox')}</option>
                </select>
              </div>
            )}

            {inputs.contractType === 'b2b' && inputs.b2b.taxForm === 'ryczalt' && (
              <div className="form-group">
                <label htmlFor="b2b-ryczalt-rate">{t('salary_b2b_ryczalt_rate_label')}</label>
                <select
                  id="b2b-ryczalt-rate"
                  value={inputs.b2b.ryczaltRate}
                  onChange={(e) => setInputs({ b2b: { ...inputs.b2b, ryczaltRate: Number(e.target.value) as SalaryInputs['b2b']['ryczaltRate'] } })}
                >
                  <option value={0.085}>8,5%</option>
                  <option value={0.12}>12%</option>
                  <option value={0.14}>14%</option>
                  <option value={0.15}>15%</option>
                  <option value={0.17}>17%</option>
                </select>
              </div>
            )}

            {inputs.contractType === 'b2b' && inputs.b2b.taxForm === 'ipbox' && (
              <div className="form-group">
                <label htmlFor="b2b-ipbox-share">{t('salary_b2b_ipbox_share_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="b2b-ipbox-share"
                    type="number"
                    defaultValue={inputs.b2b.ipBoxSharePercent}
                    min={0}
                    max={100}
                    step={5}
                    onBlur={(e) => {
                      const raw = parseFloat(e.target.value);
                      const v = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : inputs.b2b.ipBoxSharePercent;
                      e.target.value = String(v);
                      setInputs({ b2b: { ...inputs.b2b, ipBoxSharePercent: v } });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            )}

            {inputs.contractType === 'b2b' && (
              <div className="form-group">
                <label htmlFor="b2b-zus">{t('salary_b2b_zus_label')}</label>
                <select
                  id="b2b-zus"
                  value={inputs.b2b.zusVariant}
                  onChange={(e) => setInputs({ b2b: { ...inputs.b2b, zusVariant: e.target.value as SalaryInputs['b2b']['zusVariant'] } })}
                >
                  <option value="ulga_na_start">{t('salary_b2b_zus_ulga_na_start')}</option>
                  <option value="preferencyjny">{t('salary_b2b_zus_preferencyjny')}</option>
                  <option value="maly_zus_plus">{t('salary_b2b_zus_maly_zus_plus')}</option>
                  <option value="pelny">{t('salary_b2b_zus_pelny')}</option>
                </select>
              </div>
            )}

            {inputs.contractType === 'b2b' && inputs.b2b.zusVariant === 'maly_zus_plus' && (
              <div className="form-group">
                <label htmlFor="b2b-maly-zus-base">{t('salary_b2b_maly_zus_base_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="b2b-maly-zus-base"
                    type="number"
                    defaultValue={inputs.b2b.malyZusPlusBase ?? 0}
                    min={0}
                    step={50}
                    onBlur={(e) => {
                      const raw = parseFloat(e.target.value);
                      const v = Number.isFinite(raw) && raw >= 0 ? raw : (inputs.b2b.malyZusPlusBase ?? 0);
                      e.target.value = String(v);
                      setInputs({ b2b: { ...inputs.b2b, malyZusPlusBase: v } });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
            )}

            {inputs.contractType === 'b2b' && (
              <label className="checkbox-row" htmlFor="b2b-sickness">
                <input
                  id="b2b-sickness"
                  type="checkbox"
                  checked={inputs.b2b.sicknessVoluntary}
                  onChange={(e) => setInputs({ b2b: { ...inputs.b2b, sicknessVoluntary: e.target.checked } })}
                />
                <span>{t('salary_sickness_toggle')}</span>
              </label>
            )}

            <div className="form-divider" />

            <button type="button" className="toolbar-btn" onClick={() => setShowAdvanced((v) => !v)}>
              {t('salary_advanced_toggle')} {showAdvanced ? '▲' : '▼'}
            </button>

            {showAdvanced && (
              <div className="slider-group">
                {inputs.contractType === 'employment' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="emp-kup">{t('salary_result_kup')}</label>
                      <select
                        id="emp-kup"
                        value={inputs.employment.kup}
                        onChange={(e) => setInputs({ employment: { ...inputs.employment, kup: e.target.value as SalaryInputs['employment']['kup'] } })}
                      >
                        <option value="standard">{t('salary_kup_standard')}</option>
                        <option value="elevated">{t('salary_kup_elevated')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-relief">{t('salary_relief_label')}</label>
                      <select
                        id="emp-relief"
                        value={inputs.employment.specialRelief}
                        onChange={(e) => setInputs({ employment: { ...inputs.employment, specialRelief: e.target.value as SalaryInputs['employment']['specialRelief'] } })}
                      >
                        <option value="none">{t('salary_relief_none')}</option>
                        <option value="under26">{t('salary_relief_under26')}</option>
                        <option value="returning">{t('salary_relief_returning')}</option>
                        <option value="family4plus">{t('salary_relief_family4plus')}</option>
                        <option value="working_pensioner">{t('salary_relief_working_pensioner')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-pit2">{t('salary_pit2_label')}</label>
                      <select
                        id="emp-pit2"
                        value={inputs.employment.reducingShare}
                        onChange={(e) => setInputs({ employment: { ...inputs.employment, reducingShare: e.target.value as SalaryInputs['employment']['reducingShare'] } })}
                      >
                        <option value="full">{t('salary_pit2_full')}</option>
                        <option value="half">{t('salary_pit2_half')}</option>
                        <option value="third">{t('salary_pit2_third')}</option>
                        <option value="none">{t('salary_pit2_none')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-ppk">{t('salary_ppk_label')}</label>
                      <select
                        id="emp-ppk"
                        value={inputs.employment.ppk.mode}
                        onChange={(e) => {
                          const mode = e.target.value;
                          if (mode === 'custom') {
                            setInputs({ employment: { ...inputs.employment, ppk: { mode: 'custom', employeeRate: 0.02, employerRate: 0.015 } } });
                          } else {
                            setInputs({ employment: { ...inputs.employment, ppk: { mode: mode as 'none' | 'standard' } } });
                          }
                        }}
                      >
                        <option value="none">{t('salary_ppk_none')}</option>
                        <option value="standard">{t('salary_ppk_standard')}</option>
                        <option value="custom">{t('salary_ppk_custom')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-bonus">{t('salary_bonus_label')}</label>
                      <div className="input-with-suffix">
                        <input
                          id="emp-bonus"
                          type="number"
                          defaultValue={inputs.employment.bonusMonthly ?? 0}
                          min={0}
                          step={100}
                          onBlur={(e) => {
                            const raw = parseFloat(e.target.value);
                            const v = Number.isFinite(raw) && raw >= 0 ? raw : (inputs.employment.bonusMonthly ?? 0);
                            e.target.value = String(v);
                            setInputs({ employment: { ...inputs.employment, bonusMonthly: v } });
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                        <span className="input-suffix">{t('currency')}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="emp-copyright">{t('salary_copyright_share_label')}</label>
                      <div className="input-with-suffix">
                        <input
                          id="emp-copyright"
                          type="number"
                          defaultValue={inputs.employment.copyrightSharePercent ?? 0}
                          min={0}
                          max={100}
                          step={5}
                          onBlur={(e) => {
                            const raw = parseFloat(e.target.value);
                            const v = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : (inputs.employment.copyrightSharePercent ?? 0);
                            e.target.value = String(v);
                            setInputs({ employment: { ...inputs.employment, copyrightSharePercent: v } });
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        />
                        <span className="input-suffix">%</span>
                      </div>
                    </div>
                  </>
                )}

                {inputs.contractType === 'mandate' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="mnd-kup">{t('salary_result_kup')}</label>
                      <select
                        id="mnd-kup"
                        value={inputs.mandate.kup}
                        onChange={(e) => setInputs({ mandate: { ...inputs.mandate, kup: e.target.value as SalaryInputs['mandate']['kup'] } })}
                      >
                        <option value="standard">{t('salary_mandate_kup_standard')}</option>
                        <option value="copyright">{t('salary_mandate_kup_copyright')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mnd-relief">{t('salary_relief_label')}</label>
                      <select
                        id="mnd-relief"
                        value={inputs.mandate.specialRelief}
                        onChange={(e) => setInputs({ mandate: { ...inputs.mandate, specialRelief: e.target.value as SalaryInputs['mandate']['specialRelief'] } })}
                      >
                        <option value="none">{t('salary_relief_none')}</option>
                        <option value="under26">{t('salary_relief_under26')}</option>
                        <option value="returning">{t('salary_relief_returning')}</option>
                        <option value="family4plus">{t('salary_relief_family4plus')}</option>
                        <option value="working_pensioner">{t('salary_relief_working_pensioner')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mnd-pit2">{t('salary_pit2_label')}</label>
                      <select
                        id="mnd-pit2"
                        value={inputs.mandate.reducingShare}
                        onChange={(e) => setInputs({ mandate: { ...inputs.mandate, reducingShare: e.target.value as SalaryInputs['mandate']['reducingShare'] } })}
                      >
                        <option value="full">{t('salary_pit2_full')}</option>
                        <option value="half">{t('salary_pit2_half')}</option>
                        <option value="third">{t('salary_pit2_third')}</option>
                        <option value="none">{t('salary_pit2_none')}</option>
                      </select>
                    </div>
                    <label className="checkbox-row" htmlFor="mnd-student">
                      <input
                        id="mnd-student"
                        type="checkbox"
                        checked={inputs.mandate.isStudentUnder26}
                        onChange={(e) => setInputs({ mandate: { ...inputs.mandate, isStudentUnder26: e.target.checked } })}
                      />
                      <span>{t('salary_student_toggle')}</span>
                    </label>
                    {!inputs.mandate.isStudentUnder26 && (
                      <label className="checkbox-row" htmlFor="mnd-sickness">
                        <input
                          id="mnd-sickness"
                          type="checkbox"
                          checked={inputs.mandate.sicknessVoluntary}
                          onChange={(e) => setInputs({ mandate: { ...inputs.mandate, sicknessVoluntary: e.target.checked } })}
                        />
                        <span>{t('salary_sickness_toggle')}</span>
                      </label>
                    )}
                  </>
                )}

                {inputs.contractType === 'specific_work' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="sw-kup">{t('salary_result_kup')}</label>
                      <select
                        id="sw-kup"
                        value={inputs.specificWork.kup}
                        onChange={(e) => setInputs({ specificWork: { ...inputs.specificWork, kup: e.target.value as SalaryInputs['specificWork']['kup'] } })}
                      >
                        <option value="standard">{t('salary_mandate_kup_standard')}</option>
                        <option value="copyright">{t('salary_mandate_kup_copyright')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="sw-pit2">{t('salary_pit2_label')}</label>
                      <select
                        id="sw-pit2"
                        value={inputs.specificWork.reducingShare}
                        onChange={(e) => setInputs({ specificWork: { ...inputs.specificWork, reducingShare: e.target.value as SalaryInputs['specificWork']['reducingShare'] } })}
                      >
                        <option value="full">{t('salary_pit2_full')}</option>
                        <option value="half">{t('salary_pit2_half')}</option>
                        <option value="third">{t('salary_pit2_third')}</option>
                        <option value="none">{t('salary_pit2_none')}</option>
                      </select>
                    </div>
                  </>
                )}

                {/*
                  Checkbox renderuje się ZAWSZE (nie tylko gdy canJointTax) —
                  inaczej włączenie wspólnego rozliczenia na umowie o pracę,
                  a potem przełączenie na B2B liniowy/ryczałt, chowało ten
                  checkbox razem z jedynym sposobem jego odznaczenia:
                  jointTaxation.enabled zostawało "true" w stanie (i tak
                  bez efektu na wynik, patrz guard w computeSalaryState),
                  ale użytkownik nie miał jak tego cofnąć bez powrotu do
                  kwalifikującego się typu umowy. Pole dochodu małżonka i
                  faktyczne zastosowanie w obliczeniach nadal wymagają
                  canJointTax.
                */}
                <label className="checkbox-row" htmlFor="joint-tax">
                  <input
                    id="joint-tax"
                    type="checkbox"
                    checked={inputs.jointTaxation.enabled}
                    onChange={(e) => setInputs({ jointTaxation: { ...inputs.jointTaxation, enabled: e.target.checked } })}
                  />
                  <span>{t('salary_joint_taxation_toggle')}</span>
                </label>
                {canJointTax && inputs.jointTaxation.enabled && (
                  <div className="form-group">
                    <label htmlFor="spouse-income">{t('salary_joint_spouse_income_label')}</label>
                    <div className="input-with-suffix">
                      <input
                        id="spouse-income"
                        type="number"
                        defaultValue={inputs.jointTaxation.spouseAnnualTaxableIncome}
                        min={0}
                        step={1000}
                        onBlur={(e) => {
                          const raw = parseFloat(e.target.value);
                          const v = Number.isFinite(raw) && raw >= 0 ? raw : inputs.jointTaxation.spouseAnnualTaxableIncome;
                          e.target.value = String(v);
                          setInputs({ jointTaxation: { ...inputs.jointTaxation, spouseAnnualTaxableIncome: v } });
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      />
                      <span className="input-suffix">{t('currency')}</span>
                    </div>
                  </div>
                )}
                {!canJointTax && inputs.jointTaxation.enabled && (
                  <div className="hint">{t('salary_joint_not_eligible')}</div>
                )}
              </div>
            )}
          </div>

          {calcError && <div className="calc-error" role="alert">{t(calcError as TranslationKey)}</div>}

          <div className="form-group" style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button type="button" className="calc-btn" onClick={onCalculate}>{t('salary_calculate_btn')}</button>
            <button type="button" className="toolbar-btn" onClick={onResetToDefaults}>{t('salary_reset_btn')}</button>
          </div>

          <div className="scenario-panel">
            <div className="scenario-save-row">
              <input
                type="text"
                className="scenario-name-input"
                placeholder={t('salary_scenario_name_placeholder')}
                value={scenarioName}
                maxLength={MAX_SALARY_SCENARIO_NAME_LENGTH}
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
                {t('salary_scenario_save')}
              </button>
              {scenarioSaveError && (
                <div className="scenario-save-error" role="alert" style={{ color: 'var(--danger)', fontSize: '.85rem', marginTop: '6px' }}>
                  {t('salary_scenario_save_storage_error')}
                </div>
              )}
              {!scenarioSaveError && scenarioLimitReached && (
                <div className="scenario-limit-notice" role="status" style={{ color: 'var(--text3)', fontSize: '.85rem', marginTop: '6px' }}>
                  {t('salary_scenario_limit_reached')}
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
                {t('salary_scenario_import')}
              </button>
              {scenarios.length > 0 && (
                <button type="button" className="scenario-row-btn" onClick={handleExportScenarios}>
                  {t('salary_scenario_export')}
                </button>
              )}
              {importMessage && <span className="scenario-import-message">{importMessage}</span>}
            </div>
            {scenarios.length > 0 && (
              <div className="scenario-list">
                <div className="scenario-list-header">
                  <div className="scenario-list-title">
                    {t('salary_scenario_saved_title')}
                    <span className="scenario-count"> ({formatSalaryScenarioCount(scenarios.length)})</span>
                  </div>
                  {scenarios.length > 1 && (
                    <input
                      type="text"
                      className="scenario-filter-input"
                      value={scenarioFilter}
                      onChange={(e) => setScenarioFilter(e.target.value)}
                      onKeyDown={(e) => { if (shouldClearFilterOnEscape(e.key, scenarioFilter)) setScenarioFilter(''); }}
                      placeholder={t('salary_scenario_filter_placeholder')}
                      aria-label={t('salary_scenario_filter_placeholder')}
                    />
                  )}
                  {scenarios.length > 1 && (
                    <select
                      className="scenario-sort-select"
                      value={scenarioSort}
                      onChange={(e) => setScenarioSort(e.target.value as SalaryScenarioSortKey)}
                      aria-label={t('salary_scenario_sort_label')}
                    >
                      <option value="date-desc">{t('salary_scenario_sort_newest')}</option>
                      <option value="date-asc">{t('salary_scenario_sort_oldest')}</option>
                      <option value="name-asc">{t('salary_scenario_sort_name')}</option>
                    </select>
                  )}
                </div>
                {scenarios.length > 1 && scenarioFilter.trim() !== '' && sortedScenarios.length === 0 && (
                  <div className="scenario-filter-empty">{t('salary_scenario_filter_no_match')}</div>
                )}
                {sortedScenarios.map((s) => {
                  const isEditing = editingScenarioId === s.id;
                  const isConfirmingDelete = confirmDeleteId === s.id;
                  return (
                    <div className="scenario-row" key={s.id}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="scenario-name-edit-input"
                          value={editingScenarioName}
                          autoFocus
                          maxLength={MAX_SALARY_SCENARIO_NAME_LENGTH}
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
                          title={t('salary_scenario_rename_hint')}
                          onClick={() => startEditingScenario(s)}
                        >
                          {s.name}
                        </span>
                      )}
                      <button type="button" className="scenario-row-btn" onClick={() => onLoadScenario(s.id)}>
                        {t('salary_scenario_load')}
                      </button>
                      <button
                        type="button"
                        className="scenario-row-btn"
                        onClick={() => onDuplicateScenario(s.id, `${s.name} ${t('salary_scenario_copy_suffix')}`)}
                      >
                        {t('salary_scenario_duplicate')}
                      </button>
                      {isConfirmingDelete ? (
                        <>
                          <button
                            type="button"
                            className="scenario-row-btn scenario-row-btn-delete"
                            onClick={() => handleDeleteClick(s.id)}
                          >
                            {t('salary_scenario_delete_confirm')}
                          </button>
                          <button type="button" className="scenario-row-btn" onClick={() => setConfirmDeleteId(null)}>
                            {t('salary_scenario_delete_cancel')}
                          </button>
                        </>
                      ) : (
                        <button type="button" className="scenario-row-btn scenario-row-btn-delete" onClick={() => handleDeleteClick(s.id)}>
                          {t('salary_scenario_delete')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {calcState && (
          <div className="calc-results" style={{ marginTop: 24 }}>
            {isStale && <div className="hint">{t('calc_stale')}</div>}

            {calcState.mode === 'single' ? (
              <>
                <SingleResultCard result={calcState.result} fmtC={fmtC} t={t} />
                <a
                  className="toolbar-btn"
                  style={{ display: 'inline-block', marginTop: 12 }}
                  href={`/zdolnosc-kredytowa.html?netIncome=${Math.round(calcState.result.net)}&contractType=${creditworthinessContractType(calcState.contractType)}`}
                >
                  {t('salary_check_creditworthiness_link')}
                </a>
              </>
            ) : (
              <>
                <div className="result-card highlight-blue">
                  <div className="result-card-label">{t('salary_annual_summary_title')}</div>
                  <div>{t('salary_annual_total_net')}: <strong>{fmtC(calcState.result.totalNet)}</strong></div>
                  <div>{t('salary_annual_total_tax')}: <strong>{fmtC(calcState.result.totalTax)}</strong></div>
                  <div>{t('salary_annual_total_social_health')}: <strong>{fmtC(calcState.result.totalSocialAndHealth)}</strong></div>
                  {calcState.result.scaleThresholdCrossedMonth !== null && (
                    <div>{t('salary_annual_scale_crossed')}: <strong>{calcState.result.scaleThresholdCrossedMonth}</strong></div>
                  )}
                  {calcState.result.zusLimitCrossedMonth !== null && (
                    <div>{t('salary_annual_zus_crossed')}: <strong>{calcState.result.zusLimitCrossedMonth}</strong></div>
                  )}
                  {calcState.result.reliefLimitCrossedMonth !== null && (
                    <div>{t('salary_annual_relief_crossed')}: <strong>{calcState.result.reliefLimitCrossedMonth}</strong></div>
                  )}
                </div>
                <div style={{ height: 260, marginTop: 16 }}>
                  <canvas ref={chartRef} role="img" aria-label={t('salary_annual_chart_label')} />
                </div>
              </>
            )}

            {calcState.jointTaxation && (
              <div className="result-card" style={{ marginTop: 16 }}>
                <div className="result-card-label">{t('salary_joint_taxation_toggle')}</div>
                {calcState.jointTaxation.taxSavingsVsSeparate > 0 ? (
                  <div>{t('salary_joint_savings_positive')}: <strong>{fmtC(calcState.jointTaxation.taxSavingsVsSeparate)}</strong></div>
                ) : (
                  <div>{t('salary_joint_savings_negative')}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SingleResultCard({
  result,
  fmtC,
  t,
}: {
  result: Extract<SalaryState, { mode: 'single' }>['result'];
  fmtC: (n: number, dec?: number) => string;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="result-card highlight-green">
      <div className="result-card-label">{t('salary_result_net')}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{fmtC(result.net)}</div>
      <div style={{ marginTop: 12, display: 'grid', gap: 4, fontSize: '.9rem' }}>
        <div>{t('salary_result_tax')}: {fmtC(result.tax)}</div>
        {'employeeSocialTotal' in result && <div>{t('salary_result_social')}: {fmtC(result.employeeSocialTotal)}</div>}
        {'socialContributions' in result && <div>{t('salary_result_social')}: {fmtC(result.socialContributions)}</div>}
        {'healthInsurance' in result && <div>{t('salary_result_health')}: {fmtC(result.healthInsurance)}</div>}
        {'kup' in result && <div>{t('salary_result_kup')}: {fmtC(result.kup)}</div>}
        {'copyrightKup' in result && result.copyrightKup > 0 && <div>{t('salary_result_copyright_kup')}: {fmtC(result.copyrightKup)}</div>}
        {'employerTotalCost' in result && <div>{t('salary_result_employer_cost')}: {fmtC(result.employerTotalCost)}</div>}
      </div>
    </div>
  );
}
