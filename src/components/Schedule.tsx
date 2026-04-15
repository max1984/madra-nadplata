import { useRef, useEffect, memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import type { ScheduleRow } from '../lib/mortgage';
import type { CalcState } from '../hooks/useCalculator';

interface Props {
  calcState: CalcState | null;
  onOverpayChange: (idx: number, value: string) => void;
  onRateChange: (idx: number, value: string) => void;
  onCustomEffectChange: (effect: 'shorten' | 'reduce') => void;
  onResetOverpays: () => void;
  onClearOverpays: () => void;
  onResetRates: () => void;
}

interface RowProps {
  idx: number;
  row: ScheduleRow;
  overpay: number;
  rate: number;
  globalR: number;
  onOverpayChange: (idx: number, value: string) => void;
  onRateChange: (idx: number, value: string) => void;
  fmtC: (n: number) => string;
}

const ScheduleRowItem = memo(function ScheduleRowItem({
  idx, row, overpay, rate, globalR,
  onOverpayChange, onRateChange, fmtC,
}: RowProps) {
  const overpayRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (overpayRef.current) overpayRef.current.value = overpay.toFixed(2);
  }, [overpay]);

  useEffect(() => {
    if (rateRef.current) rateRef.current.value = (rate * 12 * 100).toFixed(2);
  }, [rate]);

  const rateChanged = Math.abs(rate - globalR) > 0.0000001;

  return (
    <tr>
      <td className="td-muted">{row.num}</td>
      <td>{fmtC(row.balanceBefore)}</td>
      <td>
        <input
          ref={rateRef}
          type="number"
          className={`rate-input${rateChanged ? ' rate-changed' : ''}`}
          defaultValue={(rate * 12 * 100).toFixed(2)}
          min={0.1} max={25} step={0.1}
          onBlur={(e) => onRateChange(idx, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
      </td>
      <td className="td-red">{fmtC(row.interest)}</td>
      <td className="td-green">{fmtC(row.regularCap)}</td>
      <td>
        <input
          ref={overpayRef}
          type="number"
          className="overpay-input"
          defaultValue={overpay.toFixed(2)}
          min={0} step={1}
          onBlur={(e) => onOverpayChange(idx, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
      </td>
      <td className="td-muted">{row.fee > 0.5 ? fmtC(row.fee) : '—'}</td>
      <td>{fmtC(row.totalPayment)}</td>
      <td style={{ color: 'var(--accent3)' }}>{fmtC(row.balanceAfter)}</td>
    </tr>
  );
});

interface YearRow {
  year: number;
  startPayment: number;
  endPayment: number;
  totalInterest: number;
  totalRegularCap: number;
  totalOverpay: number;
  totalFee: number;
  totalPayment: number;
  endBalance: number;
}

function buildYearlyRows(calcState: CalcState): YearRow[] {
  const rows = calcState.rows;
  const years: YearRow[] = [];
  for (let y = 0; y * 12 < rows.length; y++) {
    const start = y * 12;
    const end = Math.min((y + 1) * 12, rows.length);
    const slice = rows.slice(start, end);
    years.push({
      year: y + 1,
      startPayment: start + 1,
      endPayment: end,
      totalInterest: slice.reduce((s, r) => s + r.interest, 0),
      totalRegularCap: slice.reduce((s, r) => s + r.regularCap, 0),
      totalOverpay: slice.reduce((s, r) => s + r.overpay, 0),
      totalFee: slice.reduce((s, r) => s + r.fee, 0),
      totalPayment: slice.reduce((s, r) => s + r.totalPayment, 0),
      endBalance: slice[slice.length - 1]!.balanceAfter,
    });
  }
  return years;
}

function exportCSV(calcState: CalcState) {
  const sep = ';';
  const headers = ['Rata #', 'Saldo przed', 'Oprocent. %', 'Odsetki', 'Kapital', 'Nadplata', 'Prowizja', 'Laczna rata', 'Saldo po'];
  const rows = calcState.rows.map((r) => [
    r.num,
    r.balanceBefore.toFixed(2),
    (r.annualRate * 100).toFixed(2),
    r.interest.toFixed(2),
    r.regularCap.toFixed(2),
    r.overpay.toFixed(2),
    r.fee.toFixed(2),
    r.totalPayment.toFixed(2),
    r.balanceAfter.toFixed(2),
  ].join(sep));
  const csv = [headers.join(sep), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `harmonogram-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Schedule({ calcState, onOverpayChange, onRateChange, onCustomEffectChange, onResetOverpays, onClearOverpays, onResetRates }: Props) {
  const { t, fmtC } = useLang();
  const [yearlyView, setYearlyView] = useState(false);

  if (!calcState) {
    return (
      <section id="schedule">
        <div className="container">
          <div className="section-label">{t('sch_label')}</div>
          <div className="section-title">{t('sch_title')}</div>
          <p className="section-sub">{t('sch_sub')}</p>
          <div style={{ marginTop: 24, color: 'var(--text3)', fontSize: '.9rem' }}>{t('schedule_empty')}</div>
        </div>
      </section>
    );
  }

  const totalOverpay = calcState.customOverpay.slice(0, calcState.rows.length).reduce((acc, v) => acc + v, 0);
  const paidOffCount = calcState.months - calcState.rows.length;

  return (
    <section id="schedule">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">{t('sch_label')}</div>
          <div className="section-title">{t('sch_title')}</div>
          <p className="section-sub">{t('sch_sub')}</p>
        </motion.div>

        <motion.div
          className="table-wrapper"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="schedule-toolbar">
            <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
              {t('toolbar_total')} <strong style={{ color: 'var(--accent)' }}>{fmtC(totalOverpay)}</strong>
              &nbsp;|&nbsp;
              {t('toolbar_paid_at')} <strong style={{ color: 'var(--accent2)' }}>{calcState.rows.length}</strong> {t('toolbar_of')} {calcState.months}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {calcState.strategy === 'custom' && (
                <>
                  <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{t('custom_effect_label')}:</span>
                  <button
                    className={`toolbar-btn${calcState.customEffect === 'shorten' ? ' active' : ''}`}
                    onClick={() => onCustomEffectChange('shorten')}
                  >{t('custom_effect_shorten')}</button>
                  <button
                    className={`toolbar-btn${calcState.customEffect === 'reduce' ? ' active' : ''}`}
                    onClick={() => onCustomEffectChange('reduce')}
                  >{t('custom_effect_reduce')}</button>
                  <div className="toolbar-divider" />
                </>
              )}
              <button
                className={`toolbar-btn${yearlyView ? ' active' : ''}`}
                onClick={() => setYearlyView((v) => !v)}
              >{yearlyView ? t('sch_monthly_toggle') : t('sch_yearly_toggle')}</button>
              <div className="toolbar-divider" />
              <button className="toolbar-btn" onClick={onResetOverpays}>{t('toolbar_reset')}</button>
              <button className="toolbar-btn" onClick={onClearOverpays}>{t('toolbar_clear')}</button>
              <button className="toolbar-btn" onClick={onResetRates}>{t('toolbar_reset_rates')}</button>
              <button className="toolbar-btn" onClick={() => exportCSV(calcState)}>{t('csv_export')}</button>
            </div>
          </div>

          <div className="table-scroll">
            {yearlyView ? (
              <table>
                <thead>
                  <tr>
                    <th>{t('sch_col_year')}</th>
                    <th>{t('sch_col_interest')}</th>
                    <th>{t('sch_col_capital')}</th>
                    <th>{t('sch_col_overpay')}</th>
                    <th>{t('sch_col_fee')}</th>
                    <th>{t('sch_col_total')}</th>
                    <th>{t('sch_col_bal_after')}</th>
                  </tr>
                </thead>
                <tbody>
                  {buildYearlyRows(calcState).map((yr) => (
                    <tr key={yr.year}>
                      <td className="td-muted">
                        {yr.year} <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>({yr.startPayment}–{yr.endPayment})</span>
                      </td>
                      <td className="td-red">{fmtC(yr.totalInterest)}</td>
                      <td className="td-green">{fmtC(yr.totalRegularCap)}</td>
                      <td>{yr.totalOverpay > 0.5 ? fmtC(yr.totalOverpay) : '—'}</td>
                      <td className="td-muted">{yr.totalFee > 0.5 ? fmtC(yr.totalFee) : '—'}</td>
                      <td>{fmtC(yr.totalPayment)}</td>
                      <td style={{ color: 'var(--accent3)' }}>{fmtC(yr.endBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('sch_col_num')}</th>
                    <th>{t('sch_col_bal_before')}</th>
                    <th>{t('sch_col_rate')}</th>
                    <th>{t('sch_col_interest')}</th>
                    <th>{t('sch_col_capital')}</th>
                    <th>{t('sch_col_overpay')}</th>
                    <th>{t('sch_col_fee')}</th>
                    <th>{t('sch_col_total')}</th>
                    <th>{t('sch_col_bal_after')}</th>
                  </tr>
                </thead>
                <tbody>
                  {calcState.rows.map((row, i) => (
                    <ScheduleRowItem
                      key={row.num}
                      idx={i}
                      row={row}
                      overpay={calcState.customOverpay[i] ?? 0}
                      rate={calcState.customRates[i] ?? calcState.r}
                      globalR={calcState.r}
                      onOverpayChange={onOverpayChange}
                      onRateChange={onRateChange}
                      fmtC={fmtC}
                    />
                  ))}
                  {paidOffCount > 0 && (
                    <tr className="row-paid">
                      <td className="td-muted">{calcState.rows.length + 1}–{calcState.months}</td>
                      <td colSpan={8} style={{ textAlign: 'center', fontSize: '.8rem', fontStyle: 'italic', color: 'var(--text3)' }}>
                        {t('paid_off')} ({paidOffCount} {t('stats_payments_label')})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
