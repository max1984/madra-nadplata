import { useRef, useEffect, memo } from 'react';
import { useLang } from '../contexts/LangContext';
import type { ScheduleRow } from '../lib/mortgage';
import type { CalcState } from '../hooks/useCalculator';

interface Props {
  calcState: CalcState | null;
  onOverpayChange: (idx: number, value: string) => void;
  onRateChange: (idx: number, value: string) => void;
  onResetOverpays: () => void;
  onClearOverpays: () => void;
  onResetRates: () => void;
}

interface RowProps {
  idx: number;
  row: ScheduleRow | null;
  overpay: number;
  rate: number;
  globalR: number;
  isPaidOff: boolean;
  paidOffLabel: string;
  onOverpayChange: (idx: number, value: string) => void;
  onRateChange: (idx: number, value: string) => void;
  fmtC: (n: number) => string;
}

const ScheduleRow = memo(function ScheduleRow({
  idx, row, overpay, rate, globalR, isPaidOff, paidOffLabel,
  onOverpayChange, onRateChange, fmtC,
}: RowProps) {
  const overpayRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);

  // Keep uncontrolled input values in sync when data changes externally
  useEffect(() => {
    if (overpayRef.current) overpayRef.current.value = String(Math.round(overpay));
  }, [overpay]);

  useEffect(() => {
    if (rateRef.current) rateRef.current.value = (rate * 12 * 100).toFixed(2);
  }, [rate]);

  const rateChanged = Math.abs(rate - globalR) > 0.0000001;

  if (isPaidOff || !row) {
    return (
      <tr className="row-paid">
        <td className="td-muted">{idx + 1}</td>
        <td colSpan={8} style={{ textAlign: 'center', fontSize: '.8rem', fontStyle: 'italic', color: 'var(--text3)' }}>
          {paidOffLabel}
        </td>
      </tr>
    );
  }

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
          defaultValue={Math.round(overpay)}
          min={0} step={100}
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

export default function Schedule({ calcState, onOverpayChange, onRateChange, onResetOverpays, onClearOverpays, onResetRates }: Props) {
  const { t, fmtC } = useLang();

  if (!calcState) {
    return (
      <section id="harmonogram">
        <div className="container">
          <div className="section-label">{t('sch_label')}</div>
          <div className="section-title">{t('sch_title')}</div>
          <p className="section-sub">{t('sch_sub')}</p>
          <div style={{ marginTop: 24, color: 'var(--text3)', fontSize: '.9rem' }}>{t('schedule_empty')}</div>
        </div>
      </section>
    );
  }

  const totalOverpay = calcState.customOverpay.slice(0, calcState.rows.length).reduce((a, b) => a + b, 0);

  return (
    <section id="harmonogram">
      <div className="container">
        <div className="section-label">{t('sch_label')}</div>
        <div className="section-title">{t('sch_title')}</div>
        <p className="section-sub">{t('sch_sub')}</p>

        <div className="table-wrapper">
          <div className="schedule-toolbar">
            <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
              {t('toolbar_total')} <strong style={{ color: 'var(--accent)' }}>{fmtC(totalOverpay)}</strong>
              &nbsp;|&nbsp;
              {t('toolbar_paid_at')} <strong style={{ color: 'var(--accent2)' }}>{calcState.rows.length}</strong> {t('toolbar_of')} {calcState.months}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="toolbar-btn" onClick={onResetOverpays}>{t('toolbar_reset')}</button>
              <button className="toolbar-btn" onClick={onClearOverpays}>{t('toolbar_clear')}</button>
              <button className="toolbar-btn" onClick={onResetRates}>{t('toolbar_reset_rates')}</button>
            </div>
          </div>

          <div className="table-scroll">
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
                {Array.from({ length: calcState.months }, (_, i) => (
                  <ScheduleRow
                    key={i}
                    idx={i}
                    row={calcState.rows[i] ?? null}
                    overpay={calcState.customOverpay[i] ?? 0}
                    rate={calcState.customRates[i] ?? calcState.r}
                    globalR={calcState.r}
                    isPaidOff={!calcState.rows[i]}
                    paidOffLabel={t('paid_off')}
                    onOverpayChange={onOverpayChange}
                    onRateChange={onRateChange}
                    fmtC={fmtC}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
