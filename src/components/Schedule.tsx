import { useRef, useEffect, memo, useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import type { Lang, TranslationKey } from '../lib/i18n';
import { totalAppliedOverpay, type ScheduleRow } from '../lib/mortgage';
import { csvDec } from '../lib/format';
import { copyToClipboard } from '../lib/clipboard';
import type { CalcState } from '../hooks/useCalculator';

interface Props {
  calcState: CalcState | null;
  onOverpayChange: (idx: number, value: string) => void;
  onRateChange: (idx: number, value: string) => void;
  onCustomEffectChange: (effect: 'shorten' | 'reduce') => void;
  onRowEffectChange: (idx: number, effect: 'shorten' | 'reduce') => void;
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
  isCustom: boolean;
  isRefi: boolean;
  rowEffect: 'shorten' | 'reduce';
  onOverpayChange: (idx: number, value: string) => void;
  onRateChange: (idx: number, value: string) => void;
  onRowEffectChange: (idx: number, effect: 'shorten' | 'reduce') => void;
  fmtC: (n: number) => string;
  t: (key: TranslationKey) => string;
  lang: Lang;
}

const ScheduleRowItem = memo(function ScheduleRowItem({
  idx, row, overpay, rate, globalR, isCustom, isRefi, rowEffect,
  onOverpayChange, onRateChange, onRowEffectChange, fmtC, t, lang,
}: RowProps) {
  const overpayRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (overpayRef.current && document.activeElement !== overpayRef.current)
      overpayRef.current.value = String(Math.round(overpay));
  }, [overpay]);

  useEffect(() => {
    if (rateRef.current && document.activeElement !== rateRef.current)
      rateRef.current.value = csvDec(rate * 12 * 100, lang);
  }, [rate, lang]);

  const rateChanged = Math.abs(rate - globalR) > 0.0000001;

  return (
    <tr id={`sch-row-${row.num}`}>
      <td className="td-muted">{row.num}</td>
      <td>{fmtC(row.balanceBefore)}</td>
      <td>
        <input
          ref={rateRef}
          type="text" inputMode="decimal"
          className={`rate-input${rateChanged ? ' rate-changed' : ''}`}
          defaultValue={csvDec(rate * 12 * 100, lang)}
          aria-label={`${t('sch_col_rate')} — ${t('sch_col_num')} ${row.num}`}
          readOnly={isRefi}
          aria-readonly={isRefi}
          style={isRefi ? { opacity: 0.5, cursor: 'default' } : undefined}
          onBlur={isRefi ? undefined : (e) => onRateChange(idx, e.target.value)}
          onKeyDown={isRefi ? undefined : (e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
      </td>
      <td className="td-red">{fmtC(row.interest)}</td>
      <td className="td-green">{fmtC(row.regularCap)}</td>
      <td>
        <input
          ref={overpayRef}
          type="number"
          className="overpay-input"
          defaultValue={String(Math.round(overpay))}
          min={0} step={1}
          aria-label={`${t('sch_col_overpay')} — ${t('sch_col_num')} ${row.num}`}
          readOnly={isRefi}
          aria-readonly={isRefi}
          style={isRefi ? { opacity: 0.5, cursor: 'default' } : undefined}
          onBlur={isRefi ? undefined : (e) => onOverpayChange(idx, e.target.value)}
          onKeyDown={isRefi ? undefined : (e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
        {isCustom && (
          <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
            <button
              className={`toolbar-btn${rowEffect === 'shorten' ? ' active' : ''}`}
              style={{ fontSize: '.65rem', padding: '1px 5px' }}
              onClick={() => onRowEffectChange(idx, 'shorten')}
            >{t('row_effect_shorten')}</button>
            <button
              className={`toolbar-btn${rowEffect === 'reduce' ? ' active' : ''}`}
              style={{ fontSize: '.65rem', padding: '1px 5px' }}
              onClick={() => onRowEffectChange(idx, 'reduce')}
            >{t('row_effect_reduce')}</button>
          </div>
        )}
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
  isRefiStart: boolean;
}

function buildYearlyRows(calcState: CalcState): YearRow[] {
  const rows = calcState.rows;
  const years: YearRow[] = [];
  let refiStarted = false;
  for (let y = 0; y * 12 < rows.length; y++) {
    const start = y * 12;
    const end = Math.min((y + 1) * 12, rows.length);
    const slice = rows.slice(start, end);
    const isRefiStart = !refiStarted && slice.some(r => r.isRefiRow);
    if (isRefiStart) refiStarted = true;
    let totalInterest = 0, totalRegularCap = 0, totalOverpay = 0, totalFee = 0, totalPayment = 0;
    for (const r of slice) {
      totalInterest += r.interest;
      totalRegularCap += r.regularCap;
      totalOverpay += r.overpay;
      totalFee += r.fee;
      totalPayment += r.totalPayment;
    }
    years.push({
      year: y + 1,
      startPayment: start + 1,
      endPayment: end,
      totalInterest,
      totalRegularCap,
      totalOverpay,
      totalFee,
      totalPayment,
      endBalance: slice[slice.length - 1]!.balanceAfter,
      isRefiStart,
    });
  }
  return years;
}

function RefiSeparatorRow({ colSpan, refiData, fmtC, t }: {
  colSpan: number;
  refiData: NonNullable<CalcState['refiData']>;
  fmtC: (n: number) => string;
  t: (key: TranslationKey) => string;
}) {
  const totalFees = refiData.originationFeeAmount + refiData.flatFeeAmount;
  return (
    <tr>
      <td colSpan={colSpan} style={{
        textAlign: 'center', fontSize: '.78rem', fontWeight: 700,
        color: 'var(--accent2)', background: 'var(--accent2-soft)',
        padding: '6px 12px', letterSpacing: '.5px',
      }}>
        {t('refi_separator')}
        <span style={{ fontWeight: 400, color: 'var(--text2)', marginLeft: 8 }}>
          {t('refi_balance_label')}: <strong style={{ color: 'var(--accent3)' }}>{fmtC(refiData.balance)}</strong>
          {totalFees > 0 && (
            <> &nbsp;|&nbsp; {t('refi_fees_label')}: <strong style={{ color: 'var(--danger)' }}>{fmtC(totalFees)}</strong></>
          )}
        </span>
      </td>
    </tr>
  );
}

/**
 * Ogranicza wpisany numer miesiąca do sensownego zakresu tabeli (1..maxMonth)
 * — bez tego wpisanie 0, liczby ujemnej albo miesiąca poza faktyczną
 * długością harmonogramu (np. po wcześniejszej spłacie) próbowałoby
 * przewinąć do wiersza, którego w DOM w ogóle nie ma.
 */
export function clampJumpMonth(value: number, maxMonth: number): number {
  if (!Number.isFinite(value) || maxMonth < 1) return 1;
  return Math.min(Math.max(1, Math.round(value)), maxMonth);
}

/**
 * Odczytuje ?jump=N z URL wygenerowanego przez "Kopiuj link do tego
 * miesiąca" — null zamiast rzucać/zwracać śmieciową wartość dla brakującego
 * albo niepoprawnego parametru, żeby wywołujący mógł po prostu pominąć
 * automatyczne przewinięcie zamiast próbować skoczyć do NaN-tego wiersza.
 */
export function parseJumpMonth(search: string): number | null {
  const sp = new URLSearchParams(search);
  if (!sp.has('jump')) return null;
  const n = Number(sp.get('jump'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * Dokleja/nadpisuje ?jump=N do aktualnego URL (który już zawiera parametry
 * kredytu wpisane przez buildUrlParams przy ostatnim "Oblicz") i celuje w
 * kotwicę #schedule, żeby odbiorca linku od razu wylądował na harmonogramie.
 */
export function buildJumpUrl(currentUrl: string, month: number): string {
  const url = new URL(currentUrl);
  url.searchParams.set('jump', String(month));
  url.hash = 'schedule';
  return url.toString();
}

function exportCSV(calcState: CalcState, t: (key: TranslationKey) => string, lang: Lang) {
  const sep = lang === 'en' ? ',' : ';';
  const headers = [
    t('sch_col_num'), t('sch_col_bal_before'), t('sch_col_rate'),
    t('sch_col_interest'), t('sch_col_capital'), t('sch_col_overpay'),
    t('sch_col_fee'), t('sch_col_total'), t('sch_col_bal_after'),
  ];
  const rows = calcState.rows.map((r) => [
    r.num,
    csvDec(r.balanceBefore, lang),
    csvDec(r.annualRate * 100, lang),
    csvDec(r.interest, lang),
    csvDec(r.regularCap, lang),
    csvDec(r.overpay, lang),
    csvDec(r.fee, lang),
    csvDec(r.totalPayment, lang),
    csvDec(r.balanceAfter, lang),
  ].join(sep));
  // BOM na początku — bez niego Excel na Windows potrafi wczytać UTF-8 jako
  // ANSI i połamać polskie znaki (ą, ł, ż...) w nagłówkach kolumn.
  const csv = '﻿' + [headers.join(sep), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `harmonogram-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Schedule({ calcState, onOverpayChange, onRateChange, onCustomEffectChange, onRowEffectChange, onResetOverpays, onClearOverpays, onResetRates }: Props) {
  const { t, fmtC, lang } = useLang();
  const [yearlyView, setYearlyView] = useState(false);
  const [jumpMonth, setJumpMonth] = useState('');
  const [jumpLinkCopied, setJumpLinkCopied] = useState(false);
  const autoJumpedRef = useRef(false);

  // Odbiorca linku z "Kopiuj link do tego miesiąca" (?jump=N) ma od razu
  // wylądować na właściwym wierszu — bez tego dostałby tylko harmonogram
  // od góry i musiałby ręcznie przewijać/wpisywać numer na nowo. Flaga w
  // refie, żeby zadziałało dokładnie raz na wejście, nie przy każdym
  // przeliczeniu harmonogramu. Opóźnienie jest konieczne — sekcje nad
  // harmonogramem (HowItWorks, Example, Support, FAQ, Calculator...) ładują
  // się leniwie (React.lazy + Suspense fallback={null}), więc od razu po
  // zamontowaniu Schedule strona nad nim jest jeszcze pusta/niska i
  // scrollIntoView wyliczone teraz trafiłoby w pozycję sprzed doładowania
  // się reszty treści, czyli dużo wyżej niż docelowa.
  useEffect(() => {
    if (autoJumpedRef.current || !calcState || yearlyView) return;
    const target = parseJumpMonth(window.location.search);
    if (target === null) return;
    autoJumpedRef.current = true;
    const clamped = clampJumpMonth(target, calcState.rows.length);
    const timer = setTimeout(() => {
      const el = document.getElementById(`sch-row-${clamped}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('row-jump-highlight');
      setTimeout(() => el.classList.remove('row-jump-highlight'), 1500);
    }, 400);
    return () => clearTimeout(timer);
  }, [calcState, yearlyView]);

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

  const totalOverpay = totalAppliedOverpay(calcState.rows);
  const paidOffCount = calcState.months - calcState.rows.length;

  const handleJumpToMonth = () => {
    const target = clampJumpMonth(parseInt(jumpMonth, 10), calcState.rows.length);
    const el = document.getElementById(`sch-row-${target}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('row-jump-highlight');
    setTimeout(() => el.classList.remove('row-jump-highlight'), 1500);
  };

  const handleCopyJumpLink = () => {
    const target = clampJumpMonth(parseInt(jumpMonth, 10), calcState.rows.length);
    copyToClipboard(buildJumpUrl(window.location.href, target), () => {
      setJumpLinkCopied(true);
      setTimeout(() => setJumpLinkCopied(false), 2000);
    });
  };

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
              {calcState.rows.length > 60 && (
                <span style={{ fontSize: '.75rem', color: 'var(--text3)', marginLeft: 8 }}>
                  ({calcState.rows.length} {t('stats_payments_label')})
                </span>
              )}
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
              {!yearlyView && (
                <div className="jump-to-month">
                  <input
                    type="number"
                    min={1}
                    max={calcState.rows.length}
                    placeholder={t('sch_jump_placeholder')}
                    value={jumpMonth}
                    onChange={(e) => setJumpMonth(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleJumpToMonth(); }}
                    aria-label={t('sch_jump_placeholder')}
                  />
                  <button type="button" className="toolbar-btn" onClick={handleJumpToMonth}>
                    {t('sch_jump_btn')}
                  </button>
                  <button type="button" className="toolbar-btn" onClick={handleCopyJumpLink}>
                    {jumpLinkCopied ? t('sch_jump_link_copied') : t('sch_jump_link')}
                  </button>
                </div>
              )}
              <div className="toolbar-divider" />
              {calcState.strategy !== 'refinance' ? (
                <>
                  <button className="toolbar-btn" onClick={onResetOverpays}>{t('toolbar_reset')}</button>
                  <button className="toolbar-btn" onClick={onClearOverpays}>{t('toolbar_clear')}</button>
                  <button className="toolbar-btn" onClick={onResetRates}>{t('toolbar_reset_rates')}</button>
                </>
              ) : (
                <span style={{ fontSize: '.78rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                  {t('refi_no_overpay_note')}
                </span>
              )}
              <button className="toolbar-btn" onClick={() => exportCSV(calcState, t, lang)}>{t('csv_export')}</button>
              <button className="toolbar-btn" onClick={() => window.print()}>{t('sch_print')}</button>
            </div>
          </div>

          <div className="table-scroll">
            {yearlyView ? (
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t('sch_col_year')}</th>
                    <th scope="col">{t('sch_col_interest')}</th>
                    <th scope="col">{t('sch_col_capital')}</th>
                    <th scope="col">{t('sch_col_overpay')}</th>
                    <th scope="col">{t('sch_col_fee')}</th>
                    <th scope="col">{t('sch_col_total')}</th>
                    <th scope="col">{t('sch_col_bal_after')}</th>
                  </tr>
                </thead>
                <tbody>
                  {buildYearlyRows(calcState).map((yr) => (
                    <Fragment key={yr.year}>
                      {yr.isRefiStart && calcState.refiData && (
                        <RefiSeparatorRow colSpan={7} refiData={calcState.refiData} fmtC={fmtC} t={t} />
                      )}
                      <tr>
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
                    </Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t('sch_col_num')}</th>
                    <th scope="col">{t('sch_col_bal_before')}</th>
                    <th scope="col">{t('sch_col_rate')}</th>
                    <th scope="col">{t('sch_col_interest')}</th>
                    <th scope="col">{t('sch_col_capital')}</th>
                    <th scope="col">{t('sch_col_overpay')}</th>
                    <th scope="col">{t('sch_col_fee')}</th>
                    <th scope="col">{t('sch_col_total')}</th>
                    <th scope="col">{t('sch_col_bal_after')}</th>
                  </tr>
                </thead>
                <tbody>
                  {calcState.rows.map((row, i) => {
                    const isFirstRefiRow = !!row.isRefiRow && (i === 0 || !calcState.rows[i - 1]?.isRefiRow);
                    const isRefi = calcState.strategy === 'refinance';
                    const refiRowRate = row.isRefiRow
                      ? (calcState.refiData?.newRate ?? 0) / 100 / 12
                      : (calcState.customRates[i] ?? calcState.r);
                    return (
                      <Fragment key={row.num}>
                        {isFirstRefiRow && calcState.refiData && (
                          <RefiSeparatorRow colSpan={9} refiData={calcState.refiData} fmtC={fmtC} t={t} />
                        )}
                        <ScheduleRowItem
                          idx={i}
                          row={row}
                          overpay={row.overpay}
                          rate={refiRowRate}
                          globalR={calcState.r}
                          isCustom={calcState.strategy === 'custom'}
                          isRefi={isRefi}
                          rowEffect={calcState.customPerRowEffects[i] ?? calcState.customEffect}
                          onOverpayChange={onOverpayChange}
                          onRateChange={onRateChange}
                          onRowEffectChange={onRowEffectChange}
                          fmtC={fmtC}
                          t={t}
                          lang={lang}
                        />
                      </Fragment>
                    );
                  })}
                  {paidOffCount > 0 && calcState.strategy !== 'refinance' && (
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
