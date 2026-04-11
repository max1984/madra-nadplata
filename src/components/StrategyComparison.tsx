import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import { calcStdPayment, buildSchedule, naturalOverpaysFromBalance } from '../lib/mortgage';
import type { CalcInputs, CalcState } from '../hooks/useCalculator';

interface Props {
  inputs: CalcInputs;
  calcState: CalcState;
}

interface StratRow {
  key: string;
  labelKey: 'compare_row_reduce' | 'compare_row_fixed_overpay' | 'compare_row_shorten';
  months: number;
  savedMonths: number;
  savedInterest: number;
  isActive: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function StrategyComparison({ inputs, calcState }: Props) {
  const { t, fmtC } = useLang();

  const { rows } = useMemo(() => {
    const P = inputs.loanAmount;
    const r = inputs.interestRate / 100 / 12;
    const months = inputs.loanMonths;
    const fee = inputs.prepayFee / 100;
    const rates = Array<number>(months).fill(r);
    const std = calcStdPayment(P, r, months);

    let overpayAmount: number;
    if (inputs.strategy === 'reduce_payment' || inputs.strategy === 'fixed_total') {
      overpayAmount = Math.max(0, inputs.totalMonthlySlider - std);
    } else if (inputs.strategy === 'fixed_overpay') {
      overpayAmount = inputs.overpayAmountSlider;
    } else if (inputs.strategy === 'shorten_period') {
      overpayAmount = inputs.shortenAmountSlider;
    } else {
      const n = calcState.rows.length;
      overpayAmount = n > 0
        ? calcState.customOverpay.slice(0, n).reduce((a, b) => a + b, 0) / n
        : 0;
    }

    if (overpayAmount <= 0) return { rows: [] };

    const ovs1 = Array<number>(months).fill(overpayAmount);
    const s1 = buildSchedule(P, rates, months, fee, ovs1, r);

    const ovs2 = Array<number>(months).fill(overpayAmount);
    const s2 = buildSchedule(P, rates, months, fee, ovs2, r, std);

    const totalMonthly = std + overpayAmount;
    const naturalOvs = naturalOverpaysFromBalance(P, 0, rates, months, totalMonthly, r);
    const s3 = buildSchedule(P, rates, months, fee, naturalOvs, r);

    const getInt = (s: typeof s1) => s.length ? s[s.length - 1]!.cumInterest : 0;

    const activeStrategy = inputs.strategy;
    const stratRows: StratRow[] = [
      {
        key: 'reduce',
        labelKey: 'compare_row_reduce',
        months: s3.length,
        savedMonths: calcState.baseMonths - s3.length,
        savedInterest: Math.max(0, calcState.baseInterest - getInt(s3)),
        isActive: activeStrategy === 'reduce_payment' || activeStrategy === 'fixed_total',
      },
      {
        key: 'fixed_overpay',
        labelKey: 'compare_row_fixed_overpay',
        months: s1.length,
        savedMonths: calcState.baseMonths - s1.length,
        savedInterest: Math.max(0, calcState.baseInterest - getInt(s1)),
        isActive: activeStrategy === 'fixed_overpay',
      },
      {
        key: 'shorten',
        labelKey: 'compare_row_shorten',
        months: s2.length,
        savedMonths: calcState.baseMonths - s2.length,
        savedInterest: Math.max(0, calcState.baseInterest - getInt(s2)),
        isActive: activeStrategy === 'shorten_period',
      },
    ];

    return { rows: stratRows };
  }, [inputs, calcState]);

  if (!rows.length) return null;

  const maxSaved = Math.max(...rows.map((r) => r.savedInterest));

  return (
    <section id="comparison" style={{ background: 'var(--bg2)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">{t('compare_section_label')}</div>
          <div className="section-title">{t('compare_section_title')}</div>
          <p className="section-sub">
            {t('compare_section_sub').replace('{amount}', fmtC(
              inputs.strategy === 'reduce_payment' || inputs.strategy === 'fixed_total'
                ? Math.max(0, inputs.totalMonthlySlider - calcStdPayment(inputs.loanAmount, inputs.interestRate / 100 / 12, inputs.loanMonths))
                : inputs.strategy === 'fixed_overpay' ? inputs.overpayAmountSlider
                : inputs.strategy === 'shorten_period' ? inputs.shortenAmountSlider
                : calcState.customOverpay.slice(0, calcState.rows.length).reduce((a, b) => a + b, 0) / Math.max(1, calcState.rows.length)
            ))}
          </p>
        </motion.div>

        <motion.div
          className="compare-cards"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {rows.map((row) => {
            const barPct = maxSaved > 0 ? (row.savedInterest / maxSaved) * 100 : 0;
            return (
              <motion.div
                key={row.key}
                className={`compare-card${row.isActive ? ' compare-card-active' : ''}`}
                variants={cardVariant}
                whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(79,142,247,.14)' }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              >
                {row.isActive && <div className="compare-badge">{t('nav_calc')}</div>}
                <div className="compare-card-title">{t(row.labelKey)}</div>
                <div className="compare-stat">
                  <div className="compare-stat-val" style={{ color: 'var(--accent2)' }}>{fmtC(row.savedInterest)}</div>
                  <div className="compare-stat-lbl">{t('compare_col_saved')}</div>
                </div>
                <div className="compare-bar-track">
                  <div className="compare-bar-fill" style={{ width: `${barPct}%` }} />
                </div>
                <div className="compare-meta">
                  <span>{row.months} {t('stats_payments_label')}</span>
                  <span style={{ color: 'var(--accent2)' }}>−{row.savedMonths} {t('months_short')}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
