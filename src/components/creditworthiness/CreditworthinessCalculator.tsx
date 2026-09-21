import { useState } from 'react';
import { useLang } from '../../contexts/LangContext';
import type { TranslationKey } from '../../lib/i18n';
import type { CreditworthinessContractType, CreditRateType, CreditworthinessInputs, CreditworthinessResult } from '../../lib/creditworthiness';

interface Props {
  inputs: CreditworthinessInputs;
  setInputs: (patch: Partial<CreditworthinessInputs>) => void;
  calcState: CreditworthinessResult | null;
  calcError: TranslationKey | null;
  onCalculate: () => void;
  onResetToDefaults: () => void;
  isStale: boolean;
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
}: Props) {
  const { t, fmt, fmtC } = useLang();
  const [showAdvanced, setShowAdvanced] = useState(false);

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
            {calcState.maxLoanAmount > 0 && (
              <a
                className="toolbar-btn"
                style={{ display: 'inline-block', marginTop: 12 }}
                href={buildMortgageLinkHref(calcState.maxLoanAmount)}
              >
                {t('cw_check_mortgage_link')}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
