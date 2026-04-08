import { useMemo } from 'react';
import { useLang } from '../contexts/LangContext';
import { buildSchedule, buildBaseSchedule, naturalOverpaysFromBalance } from '../lib/mortgage';

const EX = { P: 800000, annualRate: 0.075, months: 360, totalMonthly: 7000 };

export default function Hero() {
  const { lang, t, fmt, fmtC } = useLang();

  const stats = useMemo(() => {
    const { P, annualRate, months, totalMonthly } = EX;
    const r = annualRate / 12;
    const rates = Array<number>(months).fill(r);
    const overpays = naturalOverpaysFromBalance(P, 0, rates, months, totalMonthly, r);
    const base = buildBaseSchedule(P, rates, months, r);
    const rows = buildSchedule(P, rates, months, 0, overpays, r);
    const withInterest = rows.length ? rows[rows.length - 1]!.cumInterest : 0;
    const withMonths = rows.length;
    const savedInterest = Math.round(base.totalInterest - withInterest);
    const savedMonths = months - withMonths;
    const savedYears = Math.floor(savedMonths / 12);
    const savedRemMo = savedMonths % 12;
    return { savedInterest, savedYears, savedRemMo, totalMonthly, P, months, annualRate };
  }, []);

  const timeStr = stats.savedYears > 0
    ? stats.savedYears + ' ' + t('years') + (stats.savedRemMo > 0 ? ' ' + stats.savedRemMo + ' ' + t('months_short') : '')
    : stats.savedRemMo + ' ' + t('months_short');

  const note = lang === 'en'
    ? `* example: ${fmt(stats.P)} PLN, ${stats.months / 12} years, ${stats.annualRate * 100}%, fixed total ${fmt(stats.totalMonthly)} PLN/mo.`
    : `* przykład: kredyt ${fmt(stats.P)} zł, ${stats.months / 12} lat, ${stats.annualRate * 100}%, łącznie ${fmt(stats.totalMonthly)} zł/mies. do banku`;

  return (
    <section className="hero">
      <div className="hero-badge">{t('hero_badge')}</div>
      <h1 className="fade-up" dangerouslySetInnerHTML={{ __html: t('hero_h1_full') }} />
      <p className="fade-up delay-1">{t('hero_p')}</p>

      <div className="hero-stats fade-up delay-2">
        <div className="hero-stat">
          <div className="val">{fmtC(stats.savedInterest)}</div>
          <div className="lbl">{t('hero_stat1_lbl')}</div>
        </div>
        <div className="hero-stat">
          <div className="val">{timeStr}</div>
          <div className="lbl">{t('hero_stat2_lbl')}</div>
        </div>
        <div className="hero-stat">
          <div className="val">{fmtC(stats.totalMonthly)}</div>
          <div className="lbl">{t('hero_stat3_lbl')}</div>
        </div>
      </div>

      <div className="flex-gap fade-up delay-3">
        <a href="#kalkulator" className="btn">{t('hero_btn1')}</a>
        <a href="#jak-to-dziala" className="btn btn-outline">{t('hero_btn2')}</a>
      </div>

      <p style={{ marginTop: 24, fontSize: '.75rem', color: 'var(--text3)' }}>{note}</p>
    </section>
  );
}
