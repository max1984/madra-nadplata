import { useState } from 'react';
import { useLang } from '../contexts/LangContext';

const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7] as const;

export default function FAQ() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq">
      <div className="container">
        <div className="section-label">{t('faq_label')}</div>
        <div className="section-title">{t('faq_title')}</div>

        <div className="faq-list">
          {FAQ_KEYS.map((n) => (
            <div key={n} className={`faq-item${open === n ? ' open' : ''}`}>
              <div className="faq-q" onClick={() => setOpen(open === n ? null : n)}>
                <span>{t(`faq_q${n}`)}</span>
                <span className="arrow">+</span>
              </div>
              <div className="faq-a">{t(`faq_a${n}`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
