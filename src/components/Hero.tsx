import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import { EX, EXAMPLE_DATA } from '../lib/example';

const Hero3D = lazy(() => import('./Hero3D'));

const { savedInterest, withMonths, totalMonthly: exTotalMonthly } = EXAMPLE_DATA;
const savedMonths = EX.months - withMonths;
const savedYears = Math.floor(savedMonths / 12);
const savedRemMo = savedMonths % 12;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay },
});

export default function Hero() {
  const { t, fmt, fmtC } = useLang();

  const timeStr = savedYears > 0
    ? savedYears + ' ' + t('years') + (savedRemMo > 0 ? ' ' + savedRemMo + ' ' + t('months_short') : '')
    : savedRemMo + ' ' + t('months_short');

  const note = t('hero_note')
    .replace('{amount}', fmt(EX.P))
    .replace('{years}', String(EX.months / 12))
    .replace('{rate}', String(EX.annualRate * 100))
    .replace('{total}', fmt(exTotalMonthly));

  return (
    <section className="hero">
      <Suspense fallback={null}>
        <Hero3D />
      </Suspense>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div {...fadeUp(0)}>
          <div className="hero-badge">{t('hero_badge')}</div>
        </motion.div>

        <motion.h1 {...fadeUp(0.1)} dangerouslySetInnerHTML={{ __html: t('hero_h1_full') }} />

        <motion.p {...fadeUp(0.2)}>{t('hero_p')}</motion.p>

        <motion.div className="hero-stats" {...fadeUp(0.3)}>
          {[
            { val: fmtC(savedInterest), lbl: t('hero_stat1_lbl') },
            { val: timeStr, lbl: t('hero_stat2_lbl') },
            { val: fmtC(exTotalMonthly), lbl: t('hero_stat3_lbl') },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="hero-stat"
              whileHover={{ y: -4, borderColor: 'rgba(79,142,247,0.3)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="val">{s.val}</div>
              <div className="lbl">{s.lbl}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="flex-gap" {...fadeUp(0.4)}>
          <motion.a
            href="#calculator"
            className="btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {t('hero_btn1')}
          </motion.a>
          <motion.a
            href="#how-it-works"
            className="btn btn-outline"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {t('hero_btn2')}
          </motion.a>
        </motion.div>

        <motion.p
          {...fadeUp(0.5)}
          style={{ marginTop: 28, fontSize: '.75rem', color: 'var(--text3)' }}
        >
          {note}
        </motion.p>
      </div>
    </section>
  );
}
