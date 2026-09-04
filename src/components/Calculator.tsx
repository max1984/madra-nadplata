import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Chart } from 'chart.js';
import { CHART } from '../lib/chartTheme';
import { useLang } from '../contexts/LangContext';
import { calcStdPayment } from '../lib/mortgage';
import type { CalcInputs, CalcState, RefiData, Strategy } from '../hooks/useCalculator';
import type { TranslationKey } from '../lib/i18n';
import PartnerOffers from './PartnerOffers';

function useSyncInput(ref: React.RefObject<HTMLInputElement | null>, value: number | string) {
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current)
      ref.current.value = String(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
}

interface Props {
  inputs: CalcInputs;
  setInputs: (patch: Partial<CalcInputs>) => void;
  calcState: CalcState | null;
  onCalculate: () => void;
  calcError: TranslationKey | null;
}

export default function Calculator({ inputs, setInputs, calcState, onCalculate, calcError }: Props) {
  const { t, fmt, fmtC } = useLang();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  const [copied, setCopied] = useState(false);
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

  // Snap slider bounds to multiples of 100 so all positions are round numbers
  const sliderMin = Math.ceil((Math.ceil(stdPayment) + 1) / 100) * 100;
  const sliderMax = Math.floor(stdPayment * 2.5 / 100) * 100;
  const overpayMax = Math.max(10000, Math.floor(stdPayment * 2 / 100) * 100);
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

  useSyncInput(refiRateRef, inputs.refiRate);
  useSyncInput(refiMonthsRef, inputs.refiMonths);
  useSyncInput(refiOriginationFeeRef, inputs.refiOriginationFee);
  useSyncInput(refiFlatRef, inputs.refiFlat);

  // Track previous sliderMin so we can preserve the overpay amount when loan params change
  const prevSliderMinRef = useRef(sliderMin);

  useSyncInput(totalMonthlyRef, inputs.totalMonthlySlider);
  useSyncInput(overpayAmountRef, inputs.overpayAmountSlider);
  useSyncInput(shortenAmountRef, inputs.shortenAmountSlider);
  useSyncInput(loanAmountRef, inputs.loanAmount);
  useSyncInput(interestRateRef, inputs.interestRate);
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

  useEffect(() => {
    if (!calcState || !chartRef.current) return;
    chart.current?.destroy();

    const totalLen = Math.max(calcState.baseMonths, calcState.rows.length);
    const withBals = Array<number>(totalLen).fill(0);
    calcState.rows.forEach((r, i) => { if (i < totalLen) withBals[i] = r.balanceAfter; });
    const baseBals = totalLen > calcState.baseBalances.length
      ? [...calcState.baseBalances, ...Array<number>(totalLen - calcState.baseBalances.length).fill(0)]
      : calcState.baseBalances;

    chart.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: Array.from({ length: totalLen }, (_, i) => i + 1),
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

    return () => { chart.current?.destroy(); };
  }, [calcState, t, fmt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = window.location.href;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const stats = useMemo(
    () => calcState ? renderStats(calcState, t, fmtC) : null,
    [calcState, t, fmtC]
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
              <label>{t('form_loan_amount')}</label>
              <div className="input-with-suffix">
                <input
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
              <label>{t('form_interest')}</label>
              <div className="input-with-suffix">
                <input
                  ref={interestRateRef}
                  type="number" defaultValue={inputs.interestRate} min={0.01} max={25} step={0.01}
                  onBlur={(e) => {
                    const raw = parseFloat(e.target.value);
                    const v = isFinite(raw) ? Math.max(0.01, Math.min(25, raw)) : inputs.interestRate;
                    e.target.value = String(v);
                    setInputs({ interestRate: v });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                />
                <span className="input-suffix">%</span>
              </div>
            </div>

            <div className="form-group">
              <label>{t('form_months')}</label>
              <div className="input-with-suffix">
                <input
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
              <label>{t('form_fee')}</label>
              <div className="input-with-suffix">
                <input
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
              <label>{t('form_strategy')}</label>
              <select value={inputs.strategy === 'reduce_payment' ? 'fixed_total' : inputs.strategy} onChange={(e) => setInputs({ strategy: e.target.value as Strategy })}>
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
                  <label>{t('slider_total')}</label>
                  <input
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
                <input type="range" min={sliderMin} max={sliderMax} step={100}
                  value={Math.max(inputs.totalMonthlySlider, sliderMin)}
                  onChange={(e) => setInputs({ totalMonthlySlider: +e.target.value })} />
                <div className="hint">{t('slider_std')} <strong>{fmtC(stdPayment, 2)}</strong></div>
                <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }}>{t('reduce_payment_hint')}</div>
              </div>
            )}

            {inputs.strategy === 'fixed_overpay' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label>{t('slider_overpay')}</label>
                  <input
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
                <input type="range" min={0} max={overpayMax} step={100} value={inputs.overpayAmountSlider}
                  onChange={(e) => setInputs({ overpayAmountSlider: +e.target.value })} />
              </div>
            )}

            {inputs.strategy === 'shorten_period' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label>{t('slider_overpay')}</label>
                  <input
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
                <input type="range" min={0} max={overpayMax} step={100} value={inputs.shortenAmountSlider}
                  onChange={(e) => setInputs({ shortenAmountSlider: +e.target.value })} />
                <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }} dangerouslySetInnerHTML={{ __html: t('shorten_hint') }} />
              </div>
            )}

            {inputs.strategy === 'goal' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label>{t('goal_years_label')}</label>
                  <span className="slider-val">{goalLabel}</span>
                </div>
                <input type="range" min={12} max={inputs.loanMonths} step={12}
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
                    <label>{t('refi_month_label')}</label>
                    <span className="slider-val">{inputs.refiMonth}</span>
                  </div>
                  <input type="range" min={0} max={Math.min(120, inputs.loanMonths - 1)} step={1}
                    value={inputs.refiMonth}
                    onChange={(e) => setInputs({ refiMonth: +e.target.value })} />
                  <div className="hint">{t('refi_remaining_hint')} <strong>{inputs.loanMonths - inputs.refiMonth}</strong> {t('form_months_unit')}</div>
                </div>

                <div className="form-group">
                  <label>{t('refi_new_rate_label')}</label>
                  <div className="input-with-suffix">
                    <input ref={refiRateRef} type="number" defaultValue={inputs.refiRate}
                      min={0.01} max={25} step={0.01}
                      onBlur={(e) => {
                        const v = isFinite(+e.target.value) ? Math.max(0.01, Math.min(25, +e.target.value)) : inputs.refiRate;
                        e.target.value = String(v);
                        setInputs({ refiRate: v });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('refi_new_months_label')}</label>
                  <div className="input-with-suffix">
                    <input ref={refiMonthsRef} type="number" defaultValue={inputs.refiMonths}
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
                  <label>{t('refi_origination_fee_label')}</label>
                  <div className="input-with-suffix">
                    <input ref={refiOriginationFeeRef} type="number" defaultValue={inputs.refiOriginationFee}
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
                  <label>{t('refi_flat_fee_label')}</label>
                  <div className="input-with-suffix">
                    <input ref={refiFlatRef} type="number" defaultValue={inputs.refiFlat}
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
                  <label>{t('overpay_start_label')}</label>
                  <span className="slider-val">
                    {inputs.overpayStartMonth === 0 ? t('overpay_start_now') : inputs.overpayStartMonth}
                  </span>
                </div>
                <input type="range" min={0} max={Math.min(120, inputs.loanMonths - 1)} step={1}
                  value={inputs.overpayStartMonth}
                  onChange={(e) => setInputs({ overpayStartMonth: +e.target.value })} />
                <div className="hint">{t('overpay_start_hint')}</div>
              </div>
            )}

            {calcError && (
              <div className="calc-error">{t(calcError)}</div>
            )}

            <motion.button
              type="button"
              className="calc-btn"
              onClick={onCalculate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('calc_btn')}
            </motion.button>
            <button type="button" className="copy-link-btn" onClick={handleCopy} disabled={!calcState}
              style={!calcState ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}>
              {copied ? t('copy_link_copied') : t('copy_link')}
            </button>
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
                      <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text2)' }}>{t('invest_rate_label')}</label>
                      <span className="slider-val">{investRate}%</span>
                    </div>
                    <input type="range" min={0} max={15} step={0.5}
                      value={investRate}
                      onChange={(e) => setInvestRate(+e.target.value)} />
                  </div>
                  {investCard}
                </div>}

                <div className="calc-chart-box">
                  <canvas ref={chartRef} />
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function renderStats(
  cs: CalcState,
  t: (key: TranslationKey) => string,
  fmtC: (n: number) => string
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

  const totalOverpay = cs.customOverpay.slice(0, withMonths).reduce((acc, v) => acc + v, 0);
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
  const avgOverpay = cs.customOverpay.slice(0, withMonths).reduce((acc, v) => acc + v, 0) / Math.max(1, withMonths);

  const timeStr = savedYears > 0
    ? savedYears + ' ' + t('years') + (savedRem > 0 ? ' ' + savedRem + ' ' + t('months_short') : '')
    : savedMonths > 0 ? savedMonths + ' ' + t('months_short') : '0 ' + t('months_short');

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
    const ov = cs.customOverpay[i] ?? 0;
    investFV += ov * Math.pow(1 + rm, n - i);
  }
  const totalInvested = cs.customOverpay.slice(0, n).reduce((a, b) => a + b, 0);
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

  let breakEvenMonth = -1;
  if (totalFees > 0) {
    let cumulSavings = 0;
    for (let i = rd.month; i < cs.rows.length; i++) {
      const basePrev = i > 0 ? (cs.baseCumInterestByMonth[i - 1] ?? 0) : 0;
      const baseCurr = cs.baseCumInterestByMonth[i] ?? cs.baseInterest;
      const baseMonthInt = baseCurr - basePrev;
      cumulSavings += baseMonthInt - (cs.rows[i]?.interest ?? 0);
      if (cumulSavings >= totalFees) { breakEvenMonth = i + 1; break; }
    }
  }

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
