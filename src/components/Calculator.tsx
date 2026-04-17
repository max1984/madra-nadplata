import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Chart } from 'chart.js';
import { useLang } from '../contexts/LangContext';
import { calcStdPayment } from '../lib/mortgage';
import type { CalcInputs, CalcState, Strategy } from '../hooks/useCalculator';
import type { TranslationKey } from '../lib/i18n';

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

  const stdPayment = calcStdPayment(
    inputs.loanAmount,
    inputs.interestRate / 100 / 12,
    inputs.loanMonths
  );

  // Snap slider bounds to multiples of 100 so all positions are round numbers
  const sliderMin = Math.ceil((Math.ceil(stdPayment) + 1) / 100) * 100;
  const sliderMax = Math.floor(stdPayment * 2.5 / 100) * 100;

  // Refs for the manual number inputs (uncontrolled, synced via useEffect)
  const totalMonthlyRef = useRef<HTMLInputElement>(null);
  const overpayAmountRef = useRef<HTMLInputElement>(null);
  const shortenAmountRef = useRef<HTMLInputElement>(null);

  // Refs for the main form inputs (uncontrolled to avoid leading-zero / cursor issues)
  const loanAmountRef = useRef<HTMLInputElement>(null);
  const interestRateRef = useRef<HTMLInputElement>(null);
  const loanMonthsRef = useRef<HTMLInputElement>(null);
  const prepayFeeRef = useRef<HTMLInputElement>(null);

  // Track previous sliderMin so we can preserve the overpay amount when loan params change
  const prevSliderMinRef = useRef(sliderMin);

  useEffect(() => {
    if (totalMonthlyRef.current) totalMonthlyRef.current.value = String(inputs.totalMonthlySlider);
  }, [inputs.totalMonthlySlider]);

  useEffect(() => {
    if (overpayAmountRef.current) overpayAmountRef.current.value = String(inputs.overpayAmountSlider);
  }, [inputs.overpayAmountSlider]);

  useEffect(() => {
    if (shortenAmountRef.current) shortenAmountRef.current.value = String(inputs.shortenAmountSlider);
  }, [inputs.shortenAmountSlider]);

  // Sync form inputs when props change externally (e.g. URL params on load), but not while focused
  useEffect(() => {
    if (loanAmountRef.current && document.activeElement !== loanAmountRef.current)
      loanAmountRef.current.value = String(inputs.loanAmount);
  }, [inputs.loanAmount]);
  useEffect(() => {
    if (interestRateRef.current && document.activeElement !== interestRateRef.current)
      interestRateRef.current.value = String(inputs.interestRate);
  }, [inputs.interestRate]);
  useEffect(() => {
    if (loanMonthsRef.current && document.activeElement !== loanMonthsRef.current)
      loanMonthsRef.current.value = String(inputs.loanMonths);
  }, [inputs.loanMonths]);
  useEffect(() => {
    if (prepayFeeRef.current && document.activeElement !== prepayFeeRef.current)
      prepayFeeRef.current.value = String(inputs.prepayFee);
  }, [inputs.prepayFee]);

  // When stdPayment changes (loan amount / rate / months edited), preserve the overpay amount
  // rather than keeping the old total which no longer makes sense for the new loan.
  useEffect(() => {
    const prevMin = prevSliderMinRef.current;
    prevSliderMinRef.current = sliderMin;
    if (!(inputs.strategy === 'reduce_payment' || inputs.strategy === 'fixed_total')) return;
    if (sliderMin === prevMin) return;
    const prevOverpay = Math.max(0, inputs.totalMonthlySlider - prevMin);
    const newTotal = Math.min(sliderMax, Math.max(sliderMin, sliderMin + prevOverpay));
    setInputs({ totalMonthlySlider: newTotal });
  }, [sliderMin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!calcState || !chartRef.current) return;
    chart.current?.destroy();

    const totalLen = calcState.baseMonths;
    const withBals = Array<number>(totalLen).fill(0);
    calcState.rows.forEach((r, i) => { if (i < totalLen) withBals[i] = r.balanceAfter; });

    chart.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: Array.from({ length: totalLen }, (_, i) => i + 1),
        datasets: [
          { label: t('chart_without'), data: calcState.baseBalances, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.08)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
          { label: t('chart_with'), data: withBals, borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,.08)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
        ],
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { labels: { color: '#8892b0', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4d5a7c', maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4d5a7c', callback: (v) => fmt(Number(v) / 1000) + 'k' } },
        },
      },
    });

    return () => { chart.current?.destroy(); };
  }, [calcState, t, fmt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
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
                  type="number" defaultValue={inputs.interestRate} min={0.1} max={25} step={0.1}
                  onBlur={(e) => {
                    const raw = parseFloat(e.target.value);
                    const v = isFinite(raw) ? Math.max(0.1, Math.min(25, raw)) : inputs.interestRate;
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
                <option value="custom">{t('strategy_custom')}</option>
              </select>
            </div>

            {(inputs.strategy === 'reduce_payment' || inputs.strategy === 'fixed_total') && (
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
                      const v = Math.max(1, Math.min(sliderMax, Math.round(+e.target.value) || 1));
                      setInputs({ totalMonthlySlider: v });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                <input type="range" min={sliderMin} max={sliderMax} step={100}
                  value={Math.max(inputs.totalMonthlySlider, sliderMin)}
                  onChange={(e) => setInputs({ totalMonthlySlider: +e.target.value })} />
                <div className="hint">{t('slider_std')} <strong>{fmtC(stdPayment, 2)}</strong></div>
                {(inputs.strategy === 'fixed_total' || inputs.strategy === 'reduce_payment') && (
                  <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }}>{t('reduce_payment_hint')}</div>
                )}
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
                      const v = Math.max(0, Math.min(10000, Math.round(+e.target.value) || 0));
                      setInputs({ overpayAmountSlider: v });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                <input type="range" min={0} max={10000} step={100} value={inputs.overpayAmountSlider}
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
                      const v = Math.max(0, Math.min(10000, Math.round(+e.target.value) || 0));
                      setInputs({ shortenAmountSlider: v });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                <input type="range" min={0} max={10000} step={100} value={inputs.shortenAmountSlider}
                  onChange={(e) => setInputs({ shortenAmountSlider: +e.target.value })} />
                <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }} dangerouslySetInnerHTML={{ __html: t('shorten_hint') }} />
              </div>
            )}

            {inputs.strategy === 'custom' && (
              <div>
                <div className="info-box" style={{ fontSize: '.85rem' }} dangerouslySetInnerHTML={{ __html: t('custom_hint') }} />
                <div className="hint" style={{ marginTop: 8 }}>{t('slider_std')} <strong>{fmtC(stdPayment, 2)}</strong></div>
              </div>
            )}

            {inputs.strategy !== 'custom' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label>{t('overpay_start_label')}</label>
                  <span className="slider-val">{inputs.overpayStartMonth}</span>
                </div>
                <input type="range" min={0} max={60} step={1}
                  value={inputs.overpayStartMonth}
                  onChange={(e) => setInputs({ overpayStartMonth: +e.target.value })} />
                <div className="hint">{t('overpay_start_hint')}</div>
              </div>
            )}

            {calcError && (
              <div className="calc-error">{t(calcError)}</div>
            )}

            <motion.button
              className="calc-btn"
              onClick={onCalculate}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('calc_btn')}
            </motion.button>
            <button className="copy-link-btn" onClick={handleCopy}>
              {copied ? t('copy_link_copied') : t('copy_link')}
            </button>
          </motion.div>

          {/* RESULTS */}
          <motion.div
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

                <div className="result-card">
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
                </div>

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
  const withInterest = cs.rows.length ? cs.rows[cs.rows.length - 1]!.cumInterest : 0;
  const withMonths = cs.rows.length;

  const totalOverpay = cs.customOverpay.slice(0, withMonths).reduce((acc, v) => acc + v, 0);
  if (totalOverpay < 1) return null;
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

  return (
    <>
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
