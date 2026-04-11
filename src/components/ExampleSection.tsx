import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Chart } from 'chart.js';
import { useLang } from '../contexts/LangContext';
import { EX, EXAMPLE_DATA } from '../lib/example';

export default function ExampleSection() {
  const { lang, t, fmt, fmtC } = useLang();
  const balChartRef = useRef<HTMLCanvasElement>(null);
  const intChartRef = useRef<HTMLCanvasElement>(null);
  const balChart = useRef<Chart | null>(null);
  const intChart = useRef<Chart | null>(null);

  const { std, baseRows, withRows, baseInterest, withInterest, withMonths, savedInterest } = EXAMPLE_DATA;
  const { P, months } = EX;

  useEffect(() => {
    if (!balChartRef.current || !intChartRef.current) return;

    balChart.current?.destroy();
    intChart.current?.destroy();

    const labels = Array.from({ length: months }, (_, i) => i + 1);
    const baseBalances = baseRows.map((r) => r.balanceAfter);
    const withBals = labels.map((_, i) => withRows[i]?.balanceAfter ?? 0);

    balChart.current = new Chart(balChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: t('chart_without'), data: baseBalances, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.07)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
          { label: t('chart_with'), data: withBals, borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,.07)', borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4 },
        ],
      },
      options: {
        responsive: true,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { labels: { color: '#8892b0', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4d5a7c', maxTicksLimit: 8, callback: (_, i) => i % 24 === 0 ? `${t('chart_year')} ${Math.floor(i / 12) + 1}` : '' } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4d5a7c', callback: (v) => fmt(Number(v) / 1000) + 'k' } },
        },
      },
    });

    const numYears = months / 12;
    const yearLabels: string[] = [];
    const yiBase: number[] = [], ycBase: number[] = [], yiWith: number[] = [], ycWith: number[] = [];
    for (let y = 0; y < numYears; y++) {
      const si = y * 12;
      const ei = si + 12;
      yearLabels.push(`${t('chart_year')} ${y + 1}`);
      yiBase.push(baseRows.slice(si, ei).reduce((acc, row) => acc + row.interest, 0));
      ycBase.push(baseRows.slice(si, ei).reduce((acc, row) => acc + row.regularCap, 0));
      yiWith.push(withRows.slice(si, Math.min(ei, withRows.length)).reduce((acc, row) => acc + row.interest, 0));
      ycWith.push(withRows.slice(si, Math.min(ei, withRows.length)).reduce((acc, row) => acc + row.capital, 0));
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
        plugins: { legend: { labels: { color: '#8892b0', font: { size: 10 }, boxWidth: 12 } } },
        scales: {
          x: { stacked: true, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4d5a7c', maxRotation: 45, font: { size: 10 } } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#4d5a7c', callback: (v) => fmt(Number(v) / 1000) + 'k' } },
        },
      },
    });

    return () => {
      balChart.current?.destroy();
      intChart.current?.destroy();
    };
  }, [lang, t, fmt]);

  const yrs = Math.floor(withMonths / 12);
  const mo = withMonths % 12;
  const yrsLabel = yrs === 1 ? t('years1') : t('years');
  const periodStr = `${yrs} ${yrsLabel}${mo > 0 ? ` ${mo} ${t('months_short')}` : ''} (${withMonths} ${t('stats_payments_label')})`;

  return (
    <section id="example">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">{t('ex_label')}</div>
          <div className="section-title">{t('ex_title_text')}</div>
          <p className="section-sub">{t('ex_sub_text').replace('{std}', fmtC(std))}</p>
        </motion.div>

        <motion.div
          className="impact-grid"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="impact-card">
            <h3>{t('ex_without')}</h3>
            <div className="impact-row"><span className="label">{t('impact_loan')}</span><span className="value">{fmtC(P)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_period')}</span><span className="value">{`${months / 12} ${t('years')} (${months} ${t('stats_payments_label')})`}</span></div>
            <div className="impact-row"><span className="label">{t('impact_payment')}</span><span className="value">{fmtC(std)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_interest_total')}</span><span className="value bad">{fmtC(baseInterest)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_total')}</span><span className="value bad">{fmtC(baseInterest + P)}</span></div>
          </div>
          <div className="impact-card highlight">
            <h3>{t('ex_with_header')}</h3>
            <div className="impact-row"><span className="label">{t('impact_loan')}</span><span className="value">{fmtC(P)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_period')}</span><span className="value good">{periodStr}</span></div>
            <div className="impact-row"><span className="label">{t('impact_monthly_total')}</span><span className="value">{fmtC(EX.totalMonthly)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_interest_total')}</span><span className="value good">{fmtC(withInterest)}</span></div>
            <div className="impact-row"><span className="label">{t('impact_saved')}</span><span className="value good">{fmtC(savedInterest)} !</span></div>
          </div>
        </motion.div>

        <motion.div
          className="charts-row"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="chart-box">
            <h4>{t('chart_balance')}</h4>
            <canvas ref={balChartRef} />
          </div>
          <div className="chart-box">
            <h4>{t('chart_breakdown')}</h4>
            <canvas ref={intChartRef} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
