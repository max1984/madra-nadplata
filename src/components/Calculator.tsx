import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useLang } from '../contexts/LangContext';
import { calcStdPayment } from '../lib/mortgage';
import type { CalcInputs, CalcState, Strategy } from '../hooks/useCalculator';
import type { TranslationKey } from '../lib/i18n';

Chart.register(...registerables);

interface Props {
  inputs: CalcInputs;
  setInputs: (patch: Partial<CalcInputs>) => void;
  calcState: CalcState | null;
  onCalculate: () => void;
}

export default function Calculator({ inputs, setInputs, calcState, onCalculate }: Props) {
  const { t, fmt, fmtC } = useLang();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);

  const stdPayment = calcStdPayment(
    inputs.loanAmount,
    inputs.interestRate / 100 / 12,
    inputs.loanMonths
  );

  const sliderMax = Math.floor(stdPayment * 2.5);
  const sliderMin = Math.floor(stdPayment);

  // Draw / update chart
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
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: '#2e3450' }, ticks: { color: '#64748b', maxTicksLimit: 10 } },
          y: { grid: { color: '#2e3450' }, ticks: { color: '#64748b', callback: (v) => fmt(Number(v) / 1000) + 'k' } },
        },
      },
    });

    return () => { chart.current?.destroy(); };
  }, [calcState, t, fmt]);

  const stats = calcState ? renderStats(calcState, t, fmtC) : null;

  return (
    <section id="kalkulator">
      <div className="container">
        <div className="section-label">{t('calc_label')}</div>
        <div className="section-title">{t('calc_title')}</div>
        <p className="section-sub">{t('calc_sub')}</p>

        <div className="calc-wrapper">
          {/* FORM */}
          <div className="calc-form">
            <div className="form-group">
              <label>{t('form_loan_amount')}</label>
              <div className="input-with-suffix">
                <input type="number" value={inputs.loanAmount} min={10000} max={5000000} step={1000}
                  onChange={(e) => setInputs({ loanAmount: +e.target.value })} />
                <span className="input-suffix">PLN</span>
              </div>
            </div>

            <div className="form-group">
              <label>{t('form_interest')}</label>
              <div className="input-with-suffix">
                <input type="number" value={inputs.interestRate} min={0.1} max={25} step={0.1}
                  onChange={(e) => setInputs({ interestRate: +e.target.value })} />
                <span className="input-suffix">%</span>
              </div>
            </div>

            <div className="form-group">
              <label>{t('form_months')}</label>
              <div className="input-with-suffix">
                <input type="number" value={inputs.loanMonths} min={12} max={360} step={1}
                  onChange={(e) => setInputs({ loanMonths: +e.target.value })} />
                <span className="input-suffix">{t('form_months_unit')}</span>
              </div>
            </div>

            <div className="form-group">
              <label>{t('form_fee')}</label>
              <div className="input-with-suffix">
                <input type="number" value={inputs.prepayFee} min={0} max={5} step={0.1}
                  onChange={(e) => setInputs({ prepayFee: +e.target.value })} />
                <span className="input-suffix">%</span>
              </div>
              <p className="hint">{t('form_fee_hint')}</p>
            </div>

            <div className="form-divider" />

            <div className="form-group">
              <label>{t('form_strategy')}</label>
              <select value={inputs.strategy} onChange={(e) => setInputs({ strategy: e.target.value as Strategy })}>
                <option value="fixed_total">{t('strategy_fixed_total')}</option>
                <option value="fixed_overpay">{t('strategy_fixed_overpay')}</option>
                <option value="shorten_period">{t('strategy_shorten')}</option>
                <option value="custom">{t('strategy_custom')}</option>
              </select>
            </div>

            {inputs.strategy === 'fixed_total' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label>{t('slider_total')}</label>
                  <span className="slider-val">{fmt(inputs.totalMonthlySlider)} PLN</span>
                </div>
                <input type="range" min={sliderMin} max={sliderMax} step={100} value={inputs.totalMonthlySlider}
                  onChange={(e) => setInputs({ totalMonthlySlider: +e.target.value })} />
                <div className="hint">{t('slider_std')} <strong>{fmt(stdPayment, 0)} PLN</strong></div>
              </div>
            )}

            {inputs.strategy === 'fixed_overpay' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label>{t('slider_overpay')}</label>
                  <span className="slider-val">{fmt(inputs.overpayAmountSlider)} PLN</span>
                </div>
                <input type="range" min={0} max={10000} step={100} value={inputs.overpayAmountSlider}
                  onChange={(e) => setInputs({ overpayAmountSlider: +e.target.value })} />
              </div>
            )}

            {inputs.strategy === 'shorten_period' && (
              <div className="slider-group">
                <div className="slider-header">
                  <label>{t('slider_overpay')}</label>
                  <span className="slider-val">{fmt(inputs.shortenAmountSlider)} PLN</span>
                </div>
                <input type="range" min={0} max={10000} step={100} value={inputs.shortenAmountSlider}
                  onChange={(e) => setInputs({ shortenAmountSlider: +e.target.value })} />
                <div className="info-box" style={{ fontSize: '.85rem', marginTop: 8 }} dangerouslySetInnerHTML={{ __html: t('shorten_hint') }} />
              </div>
            )}

            {inputs.strategy === 'custom' && (
              <div>
                <div className="info-box" style={{ fontSize: '.85rem' }} dangerouslySetInnerHTML={{ __html: t('custom_hint') }} />
                <div className="hint" style={{ marginTop: 8 }}>{t('slider_std')} <strong>{fmt(stdPayment, 0)} PLN</strong></div>
              </div>
            )}

            <button className="calc-btn" onClick={onCalculate}>{t('calc_btn')}</button>
          </div>

          {/* RESULTS */}
          <div className="calc-results">
            {stats ? (
              <>
                {stats}
                <div className="calc-chart-box">
                  <canvas ref={chartRef} />
                </div>
              </>
            ) : (
              <div className="result-card">
                <div className="result-label" style={{ marginBottom: 12, fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)' }}>
                  {t('calc_placeholder')}
                </div>
                <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{t('calc_placeholder_sub')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function renderStats(
  cs: CalcState,
  t: (key: TranslationKey) => string,
  fmtC: (n: number) => string
) {
  const withInterest = cs.rows.length ? cs.rows[cs.rows.length - 1]!.cumInterest : 0;
  const withMonths = cs.rows.length;
  const savedMoney = Math.max(0, cs.baseInterest - withInterest);
  const savedMonths = Math.max(0, cs.baseMonths - withMonths);
  const savedYears = Math.floor(savedMonths / 12);
  const savedRem = savedMonths % 12;
  const avgOverpay = cs.customOverpay.slice(0, withMonths).reduce((a, b) => a + b, 0) / Math.max(1, withMonths);

  const timeStr = savedYears > 0
    ? savedYears + ' ' + t('years') + (savedRem > 0 ? ' ' + savedRem + ' ' + t('months_short') : '')
    : savedMonths > 0 ? savedMonths + ' ' + t('months_short') : '0 ' + t('months_short');

  const pct = cs.baseInterest > 0 ? (withInterest / cs.baseInterest * 100).toFixed(1) : '0';

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
        <div style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text3)', marginBottom: 12 }}>
          {t('stats_comparison')}
        </div>
        <div className="comparison-bars">
          <div className="bar-row">
            <div className="bar-label"><span>{t('stats_without')}</span><span>{fmtC(cs.baseInterest)}</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: '100%', background: 'var(--danger)', opacity: 0.7 }} /></div>
          </div>
          <div className="bar-row">
            <div className="bar-label"><span>{t('stats_with')}</span><span>{fmtC(withInterest)}</span></div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: 'var(--accent2)' }} /></div>
          </div>
        </div>
        {savedMoney > 0 && (
          <div className="info-box mt-16" style={{ fontSize: '.82rem' }}>
            {t('stats_saving_prefix')} <strong>{(100 - +pct).toFixed(1)}%</strong> {t('stats_saving_suffix')}
          </div>
        )}
      </div>
    </>
  );
}
