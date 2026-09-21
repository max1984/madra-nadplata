import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7] as const;

/**
 * Przycisk pytania i panel odpowiedzi muszą wskazywać na siebie nawzajem
 * (aria-controls / aria-labelledby) — akordeon renderował aria-expanded na
 * przycisku, ale bez programowego powiązania z treścią, którą rozwija.
 * Wydzielone, żeby oba id zawsze pochodziły z jednego miejsca i nie rozjechały
 * się przy edycji.
 */
export const faqQuestionId = (n: number) => `faq-q-${n}`;
export const faqPanelId = (n: number) => `faq-panel-${n}`;

export default function FAQ() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label">{t('faq_label')}</div>
          <div className="section-title">{t('faq_title')}</div>
        </motion.div>

        <motion.div
          className="faq-list"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {FAQ_KEYS.map((n) => (
            <div key={n} className={`faq-item${open === n ? ' open' : ''}`}>
              <button
                type="button"
                id={faqQuestionId(n)}
                className="faq-q"
                aria-expanded={open === n}
                aria-controls={faqPanelId(n)}
                onClick={() => setOpen(open === n ? null : n)}
              >
                <span>{t(`faq_q${n}`)}</span>
                <span className="arrow">+</span>
              </button>
              <AnimatePresence initial={false}>
                {open === n && (
                  <motion.div
                    key="answer"
                    id={faqPanelId(n)}
                    role="region"
                    aria-labelledby={faqQuestionId(n)}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 24px 20px', color: 'var(--text2)', fontSize: '.95rem' }}>
                      {t(`faq_a${n}`)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
