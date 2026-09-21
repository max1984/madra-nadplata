import { useMemo, useRef, useState } from 'react';
import { useLang } from '../../contexts/LangContext';
import { copyToClipboard } from '../../lib/clipboard';
import type { TranslationKey } from '../../lib/i18n';
import type { CreditworthinessContractType, CreditRateType, CreditworthinessInputs, CreditworthinessResult } from '../../lib/creditworthiness';
import {
  MAX_CW_SCENARIOS, MAX_CW_SCENARIO_NAME_LENGTH, sortCwScenarios, filterCwScenariosByName, cwScenariosToJSON,
  type SavedCreditworthinessScenario, type CwScenarioSortKey,
} from '../../hooks/useCreditworthinessCalculator';

/** Jak formatSalaryScenarioCount w SalaryCalculator.tsx. */
function formatCwScenarioCount(count: number): string {
  return `${count}/${MAX_CW_SCENARIOS}`;
}

/**
 * Jak formatResultsSummaryText w Calculator.tsx — czysty tekst wyniku do
 * wklejenia w wiadomość, bez zrzutu ekranu. Wydzielone z komponentu, żeby
 * dało się przetestować formatowanie/zaokrąglenia bez renderowania React.
 */
export function formatCreditworthinessSummaryText(
  cs: CreditworthinessResult,
  t: (key: TranslationKey) => string,
  fmt: (n: number, dec?: number) => string,
  fmtC: (n: number, dec?: number) => string,
  url: string,
): string {
  return t('cw_share_summary_text')
    .replace('{maxLoan}', fmtC(cs.maxLoanAmount))
    .replace('{income}', fmtC(cs.recognizedIncome))
    .replace('{installment}', fmtC(cs.maxInstallment))
    .replace('{dsti}', fmt(cs.dstiThreshold * 100, 0))
    .replace('{url}', url);
}

interface Props {
  inputs: CreditworthinessInputs;
  setInputs: (patch: Partial<CreditworthinessInputs>) => void;
  calcState: CreditworthinessResult | null;
  calcError: TranslationKey | null;
  onCalculate: () => void;
  onResetToDefaults: () => void;
  isStale: boolean;
  /** Zapisywanie scenariuszy — opcjonalne z bezpiecznymi domyślnymi, jak w SalaryCalculator.tsx. */
  scenarios?: SavedCreditworthinessScenario[];
  scenarioSaveError?: boolean;
  scenarioLimitReached?: boolean;
  onSaveScenario?: (name: string) => void;
  onLoadScenario?: (id: string) => void;
  onDeleteScenario?: (id: string) => void;
  onRenameScenario?: (id: string, newName: string) => void;
  onImportScenarios?: (json: string) => number;
}

const CONTRACT_TABS: { key: CreditworthinessContractType; label: TranslationKey }[] = [
  { key: 'employment', label: 'cw_contract_employment' },
  { key: 'b2b', label: 'cw_contract_b2b' },
  { key: 'mandate_or_specific_work', label: 'cw_contract_mandate_or_specific_work' },
];

/** Wspólny handler dla pól liczbowych z walidacją na blur — wzorem SalaryCalculator.tsx. */
function numberField(
  current: number,
  min: number,
  max: number,
  onCommit: (v: number) => void
): { onBlur: (e: React.FocusEvent<HTMLInputElement>) => void; onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void } {
  return {
    onBlur: (e) => {
      const raw = parseFloat(e.target.value);
      const v = Number.isFinite(raw) ? Math.max(min, Math.min(max, raw)) : current;
      e.target.value = String(v);
      onCommit(v);
    },
    onKeyDown: (e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); },
  };
}

/**
 * Link z wyniku zdolności kredytowej z powrotem do kalkulatora kredytu,
 * z zaokrągloną kwotą jako `?amount=` — ten sam param, który `useCalculator.ts`
 * (parseUrlInputs) już rozpoznaje, więc kalkulator kredytu otwiera się od
 * razu z wypełnioną kwotą. Wydzielone jako czysta funkcja, żeby dało się
 * przetestować zaokrąglenie bez renderowania komponentu.
 */
export function buildMortgageLinkHref(maxLoanAmount: number): string {
  return `/?amount=${Math.round(maxLoanAmount)}#calculator`;
}

export default function CreditworthinessCalculator({
  inputs, setInputs, calcState, calcError, onCalculate, onResetToDefaults, isStale,
  scenarios = [], scenarioSaveError = false, scenarioLimitReached = false,
  onSaveScenario = () => {}, onLoadScenario = () => {}, onDeleteScenario = () => {},
  onRenameScenario = () => {}, onImportScenarios = () => 0,
}: Props) {
  const { t, fmt, fmtC } = useLang();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = useState('');
  const [scenarioSort, setScenarioSort] = useState<CwScenarioSortKey>('date-desc');
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const sortedScenarios = useMemo(
    () => filterCwScenariosByName(sortCwScenarios(scenarios, scenarioSort), scenarioFilter),
    [scenarios, scenarioSort, scenarioFilter],
  );

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;
    onSaveScenario(scenarioName.trim());
    setScenarioName('');
  };

  const startEditingScenario = (s: SavedCreditworthinessScenario) => {
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
    const blob = new Blob([cwScenariosToJSON(scenarios)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenariusze-zdolnosci-kredytowej-${new Date().toISOString().slice(0, 10)}.json`;
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
      showImportMessage(count > 0 ? 'cw_scenario_import_success' : 'cw_scenario_import_empty', count > 0 ? count : undefined);
    };
    reader.onerror = () => showImportMessage('cw_scenario_import_error');
    reader.readAsText(file);
  };

  const handleCopySummary = () => {
    if (!calcState) return;
    const text = formatCreditworthinessSummaryText(calcState, t, fmt, fmtC, window.location.href);
    copyToClipboard(text, () => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  };

  return (
    <section id="creditworthiness-calculator">
      <div className="container">
        <div className="section-label">{t('cw_page_title')}</div>
        <div className="section-title">{t('cw_page_title')}</div>
        <p className="section-sub">{t('cw_page_subtitle')}</p>

        <div className="calc-form">
          <div className="form-group">
            <label htmlFor="cw-income">{t('cw_income_label')}</label>
            <div className="input-with-suffix">
              <input
                id="cw-income"
                type="number"
                defaultValue={inputs.netIncome}
                min={0}
                step={100}
                {...numberField(inputs.netIncome, 0, 1_000_000, (v) => setInputs({ netIncome: v }))}
              />
              <span className="input-suffix">{t('currency')}</span>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CONTRACT_TABS.map((tab) => (
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

          {inputs.contractType !== 'employment' && (
            <div className="form-group">
              <label htmlFor="cw-recognition">{t('cw_income_recognition_label')}</label>
              <div className="input-with-suffix">
                <input
                  id="cw-recognition"
                  type="number"
                  defaultValue={inputs.incomeRecognitionRate}
                  min={0}
                  max={100}
                  step={5}
                  {...numberField(inputs.incomeRecognitionRate, 0, 100, (v) => setInputs({ incomeRecognitionRate: v }))}
                />
                <span className="input-suffix">%</span>
              </div>
              <div className="hint">{t('cw_income_recognition_hint')}</div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="cw-household">{t('cw_household_size_label')}</label>
            <input
              id="cw-household"
              type="number"
              defaultValue={inputs.householdSize}
              min={1}
              step={1}
              {...numberField(inputs.householdSize, 1, 20, (v) => setInputs({ householdSize: Math.round(v) }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cw-years">{t('cw_years_label')}</label>
            <input
              id="cw-years"
              type="number"
              defaultValue={inputs.years}
              min={1}
              max={40}
              step={1}
              {...numberField(inputs.years, 1, 40, (v) => setInputs({ years: Math.round(v) }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cw-rate">{t('cw_nominal_rate_label')}</label>
            <div className="input-with-suffix">
              <input
                id="cw-rate"
                type="number"
                defaultValue={inputs.nominalRatePercent}
                min={0}
                max={30}
                step={0.1}
                {...numberField(inputs.nominalRatePercent, 0, 30, (v) => setInputs({ nominalRatePercent: v }))}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cw-rate-type">{t('cw_rate_type_label')}</label>
            <select
              id="cw-rate-type"
              value={inputs.rateType}
              onChange={(e) => setInputs({ rateType: e.target.value as CreditRateType })}
            >
              <option value="fixed">{t('cw_rate_type_fixed')}</option>
              <option value="variable">{t('cw_rate_type_variable')}</option>
            </select>
          </div>

          <div className="form-divider" />

          <button type="button" className="toolbar-btn" onClick={() => setShowAdvanced((v) => !v)}>
            {t('cw_advanced_toggle')} {showAdvanced ? '▲' : '▼'}
          </button>

          {showAdvanced && (
            <div className="slider-group">
              <div className="form-group">
                <label htmlFor="cw-first-cost">{t('cw_first_person_cost_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="cw-first-cost"
                    type="number"
                    defaultValue={inputs.firstPersonCost}
                    min={0}
                    step={100}
                    {...numberField(inputs.firstPersonCost, 0, 100_000, (v) => setInputs({ firstPersonCost: v }))}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="cw-additional-cost">{t('cw_additional_person_cost_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="cw-additional-cost"
                    type="number"
                    defaultValue={inputs.additionalPersonCost}
                    min={0}
                    step={100}
                    {...numberField(inputs.additionalPersonCost, 0, 100_000, (v) => setInputs({ additionalPersonCost: v }))}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="cw-loans">{t('cw_existing_loan_installments_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="cw-loans"
                    type="number"
                    defaultValue={inputs.existingLoanInstallments}
                    min={0}
                    step={50}
                    {...numberField(inputs.existingLoanInstallments, 0, 1_000_000, (v) => setInputs({ existingLoanInstallments: v }))}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="cw-cards">{t('cw_credit_card_limits_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="cw-cards"
                    type="number"
                    defaultValue={inputs.creditCardLimits}
                    min={0}
                    step={100}
                    {...numberField(inputs.creditCardLimits, 0, 1_000_000, (v) => setInputs({ creditCardLimits: v }))}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="cw-alimony">{t('cw_alimony_label')}</label>
                <div className="input-with-suffix">
                  <input
                    id="cw-alimony"
                    type="number"
                    defaultValue={inputs.alimony}
                    min={0}
                    step={50}
                    {...numberField(inputs.alimony, 0, 1_000_000, (v) => setInputs({ alimony: v }))}
                  />
                  <span className="input-suffix">{t('currency')}</span>
                </div>
              </div>
            </div>
          )}

          {calcError && <div className="calc-error" role="alert">{t(calcError)}</div>}

          <div className="form-group" style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button type="button" className="calc-btn" onClick={onCalculate}>{t('cw_calculate_btn')}</button>
            <button type="button" className="toolbar-btn" onClick={onResetToDefaults}>{t('cw_reset_btn')}</button>
          </div>

          <div className="scenario-panel">
            <div className="scenario-save-row">
              <input
                type="text"
                className="scenario-name-input"
                placeholder={t('cw_scenario_name_placeholder')}
                value={scenarioName}
                maxLength={MAX_CW_SCENARIO_NAME_LENGTH}
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
                {t('cw_scenario_save')}
              </button>
              {scenarioSaveError && (
                <div className="scenario-save-error" role="alert" style={{ color: 'var(--danger)', fontSize: '.85rem', marginTop: '6px' }}>
                  {t('cw_scenario_save_storage_error')}
                </div>
              )}
              {!scenarioSaveError && scenarioLimitReached && (
                <div className="scenario-limit-notice" role="status" style={{ color: 'var(--text3)', fontSize: '.85rem', marginTop: '6px' }}>
                  {t('cw_scenario_limit_reached')}
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
                {t('cw_scenario_import')}
              </button>
              {scenarios.length > 0 && (
                <button type="button" className="scenario-row-btn" onClick={handleExportScenarios}>
                  {t('cw_scenario_export')}
                </button>
              )}
              {importMessage && <span className="scenario-import-message">{importMessage}</span>}
            </div>
            {scenarios.length > 0 && (
              <div className="scenario-list">
                <div className="scenario-list-header">
                  <div className="scenario-list-title">
                    {t('cw_scenario_saved_title')}
                    <span className="scenario-count"> ({formatCwScenarioCount(scenarios.length)})</span>
                  </div>
                  {scenarios.length > 1 && (
                    <input
                      type="text"
                      className="scenario-filter-input"
                      value={scenarioFilter}
                      onChange={(e) => setScenarioFilter(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape' && scenarioFilter) setScenarioFilter(''); }}
                      placeholder={t('cw_scenario_filter_placeholder')}
                      aria-label={t('cw_scenario_filter_placeholder')}
                    />
                  )}
                  {scenarios.length > 1 && (
                    <select
                      className="scenario-sort-select"
                      value={scenarioSort}
                      onChange={(e) => setScenarioSort(e.target.value as CwScenarioSortKey)}
                      aria-label={t('cw_scenario_sort_label')}
                    >
                      <option value="date-desc">{t('cw_scenario_sort_newest')}</option>
                      <option value="date-asc">{t('cw_scenario_sort_oldest')}</option>
                      <option value="name-asc">{t('cw_scenario_sort_name')}</option>
                    </select>
                  )}
                </div>
                {scenarios.length > 1 && scenarioFilter.trim() !== '' && sortedScenarios.length === 0 && (
                  <div className="scenario-filter-empty">{t('cw_scenario_filter_no_match')}</div>
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
                          maxLength={MAX_CW_SCENARIO_NAME_LENGTH}
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
                          title={t('cw_scenario_rename_hint')}
                          onClick={() => startEditingScenario(s)}
                        >
                          {s.name}
                        </span>
                      )}
                      <button type="button" className="scenario-row-btn" onClick={() => onLoadScenario(s.id)}>
                        {t('cw_scenario_load')}
                      </button>
                      {isConfirmingDelete ? (
                        <>
                          <button
                            type="button"
                            className="scenario-row-btn scenario-row-btn-delete"
                            onClick={() => handleDeleteClick(s.id)}
                          >
                            {t('cw_scenario_delete_confirm')}
                          </button>
                          <button type="button" className="scenario-row-btn" onClick={() => setConfirmDeleteId(null)}>
                            {t('cw_scenario_delete_cancel')}
                          </button>
                        </>
                      ) : (
                        <button type="button" className="scenario-row-btn scenario-row-btn-delete" onClick={() => handleDeleteClick(s.id)}>
                          {t('cw_scenario_delete')}
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
            <div className="result-card highlight-green">
              <div className="result-card-label">{t('cw_result_max_loan_amount')}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{fmtC(calcState.maxLoanAmount)}</div>
              <div style={{ marginTop: 12, display: 'grid', gap: 4, fontSize: '.9rem' }}>
                <div>{t('cw_result_recognized_income')}: {fmtC(calcState.recognizedIncome)}</div>
                <div>{t('cw_result_household_cost')}: {fmtC(calcState.householdCost)}</div>
                <div>{t('cw_result_other_commitments')}: {fmtC(calcState.otherCommitments)}</div>
                <div>{t('cw_result_disposable_income')}: {fmtC(calcState.disposableIncome)}</div>
                <div>{t('cw_result_dsti_threshold')}: {fmt(calcState.dstiThreshold * 100, 0)}%</div>
                <div>{t('cw_result_max_installment')}: {fmtC(calcState.maxInstallment)}</div>
                <div>{t('cw_result_buffer')}: +{fmt(calcState.bufferPercent, 1)} p.p.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button type="button" className="toolbar-btn" onClick={handleCopySummary}>
                {copiedSummary ? t('copy_summary_copied') : t('cw_copy_summary')}
              </button>
              {calcState.maxLoanAmount > 0 && (
                <a className="toolbar-btn" href={buildMortgageLinkHref(calcState.maxLoanAmount)}>
                  {t('cw_check_mortgage_link')}
                </a>
              )}
              <button type="button" className="toolbar-btn" onClick={() => window.print()}>
                {t('cw_print')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
