import { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useLang } from '../contexts/LangContext';
import { calcStdPayment, buildSchedule, buildBaseSchedule, naturalOverpaysFromBalance } from '../lib/mortgage';

Chart.register(...registerables);

const EX = { P: 800000, annualRate: 0.075, months: 360, totalMonthly: 7000 };

export default function ExampleSection() {
  const { lang, t, fmt, fmtC } = useLang();
  const balChartRef = useRef<HTMLCanvasElement>(null);
  const intChartRef = useRef<HTMLCanvasElement>(null);
  const balChart = useRef<Chart | null>(null);
  const intChart = useRef<Chart | null>(null);

  const data = useMemo(() => {
    const { P, annualRate, months, totalMonthly } = EX;
    const r = annualRate / 12;
    const std = calcStdPayment(P, r, months);
    const rates = Array<number>(months).fill(r);
    const overpays = naturalOverpaysFromBalance(P, 0, rates, months, totalMonthly, r);
    const base = buildBaseSchedule(P, rates, months, r);
    const rows = buildSchedule(P, rates, months, 0, overpays, r);

    const withInterest = rows.length ? rows[rows.length - 1]!.cumInterest : 0;
    const withMonths = rows.length;
    const savedInterest = Math.round(base.totalInterest - withInterest);

    // Build per-month balance arrays
    let b = P;
    const baseBalances: number[] = [];
    const baseInterests: number[] = [];
    const baseCaps: number[] = [];
    for (let i = 0; i < months; i++) {
      const interest = b * r;
      const cap = Math.min(std - interest, b);
      b = Math.max(0, b - cap);
      baseBalances.push(b);
      baseInterests.push(interest);
      baseCaps.push(cap);
    }

    b = P;
    const withBalances: number[] = [];
    const withInterests: number[] = [];
    const withCaps: number[] = [];
    for (let i = 0; b > 0.01 && i < months; i++) {
      const remaining = months - i;
      const interest = b * r;
      const currentStd = calcStdPayment(b, r, remaining);
      const regularCap = Math.min(currentStd - interest, b);
      const overpay = Math.max(0, totalMonthly - currentStd);
      const cap = Math.min(regularCap + overpay, b);
      b = Math.max(0, b - cap);
      withBalances.push(b);
      withInterests.push(interest);
      withCaps.push(cap);
    }

    return { std, withInterest, withMonths, savedInterest, base, baseBalances, baseInterests, baseCaps, withBalances, withInterests, withCaps };
  }, []);

  useEffect(() => {
    if (!balChartRef.current || !intChartRef.current) return;

    balChart.current?.destroy();
    intChart.current?.destroy();

    const { months } = EX;
    const labels = Array.from({ length: months }, (_, i) => i + 1);

    balChart.current = new Chart(balChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: t('chart_without'), data: data.baseBalances, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.07)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
          { label: t('chart_with'), data: labels.map((_, i) => i < data.withBalances.length ? data.withBalances[i] : 0), borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,.07)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
        ],
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: '#2e3450' }, ticks: { color: '#64748b', maxTicksLimit: 8, callback: (_, i) => i % 24 === 0 ? `${t('chart_year')} ${Math.floor(i / 12) + 1}` : '' } },
          y: { grid: { color: '#2e3450' }, ticks: { color: '#64748b', callback: (v) => fmt(Number(v) / 1000) + 'k' } },
        },
      },
    });

    const numYears = months / 12;
    const yearLabels: string[] = [];
    const yiBase: number[] = [], ycBase: number[] = [], yiWith: number[] = [], ycWith: number[] = [];
    for (let y = 0; y < numYears; y++) {
      const si = y * 12, ei = si + 12;
      yearLabels.push(`${t('chart_year')} ${y + 1}`);
      yiBase.push(data.baseInterests.slice(si, ei).reduce((a, b) => a + b, 0));
      ycBase.push(data.baseCaps.slice(si, ei).reduce((a, b) => a + b, 0));
      yiWith.push(data.withInterests.slice(si, Math.min(ei, data.withInterests.length)).reduce((a, b) => a + b, 0));
      ycWith.push(data.withCaps.slice(si, Math.min(ei, data.withCaps.length)).reduce((a, b) => a + b, 0));
    }

    intChart.current = new Chart(intChartRef.current, {
      type: 'bar',
      data: {
        labels: yearLabels,
        datasets: [
          { label: t('chart_interest_without'), data: yiBase, backgroundColor: 'rgba(239,68,68,.6)', stack: 'base' },
          { label: t('chart_capital_without'), data: ycBase, backgroundColor: 'rgba(100,116,139,.3)', stack: 'base' },
          { label: t('chart_interest_with'), data: yiWith, backgroundColor: 'rgba(79,142,247,.7)', stack: 'over' },
          { label: t('chart_capital_with'), data: ycWith, backgroundColor: 'rgba(110,231,183,.4)', stack: 'over' },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12 } } },
        scales: {
          x: { stacked: true, grid: { color: '#2e3450' }, ticks: { color: '#64748b', maxRotation: 45, font: { size: 10 } } },
          y: { stacked: true, grid: { color: '#2e3450' }, ticks: { color: '#64748b', callback: (v) => fmt(Number(v) / 1000) + 'k' } },
        },
      },
    });

    return () => {
      balChart.current?.destroy();
      intChart.current?.destroy();
    };
  }, [lang, data, t, fmt]);

  const { P, months } = EX;
  const yrs = Math.floor(data.withMonths / 12);
  const mo = data.withMonths % 12;
  const periodStr = lang === 'en'
    ? `${yrs} ${yrs === 1 ? 'year' : 'years'}${mo > 0 ? ' ' + mo + ' mo.' : ''} (${data.withMonths} payments)`
    : `${yrs} lat${mo > 0 ? ' ' + mo + ' mies.' : ''} (${data.withMonths} rat)`;

  return (
    <section id="przyklad">
      <div className="container">
        <div className="section-label">{t('ex_label')}</div>
        <div className="section-title">{t('ex_title_text')}</div>
        <p className="section-sub">
          {t('ex_sub_text').replace('{std}', fmtC(data.std))}
        </p>

        <div className="impact-grid">
          <div className="impact-card">
            <h3>{t('ex_without')}</h3>
            <div className="impact-row"><span className="label">{t('impact_loan')}</span><span className="value">{fmtC(P)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_period')}</span><span className="value">{lang === 'en' ? `${months / 12} years (${months} payments)` : `${months / 12} lat (${months} rat)`}</span></div>
            <div className="impact-row"><span className="label">{t('impact_payment')}</span><span className="value">{fmtC(data.std)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_interest_total')}</span><span className="value bad">{fmtC(data.base.totalInterest)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_total')}</span><span className="value bad">{fmtC(data.base.totalInterest + P)}</span></div>
          </div>
          <div className="impact-card highlight">
            <h3>{t('ex_with_header')}</h3>
            <div className="impact-row"><span className="label">{t('impact_loan')}</span><span className="value">{fmtC(P)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_period')}</span><span className="value good">{periodStr}</span></div>
            <div className="impact-row"><span className="label">{t('impact_monthly_total')}</span><span className="value">{fmtC(EX.totalMonthly)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_interest_total')}</span><span className="value good">{fmtC(data.withInterest)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_saved')}</span><span className="value good">{fmtC(data.savedInterest)} !</span></div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-box">
            <h4>{t('chart_balance')}</h4>
            <canvas ref={balChartRef} />
          </div>
          <div className="chart-box">
            <h4>{t('chart_breakdown')}</h4>
            <canvas ref={intChartRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
