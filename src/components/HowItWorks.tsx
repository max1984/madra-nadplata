import { useLang } from '../contexts/LangContext';

const STEPS = [1, 2, 3, 4, 5, 6] as const;

export default function HowItWorks() {
  const { t } = useLang();

  return (
    <section id="jak-to-dziala">
      <div className="container">
        <div className="section-label">{t('how_label')}</div>
        <div className="section-title">{t('how_title')}</div>
        <p className="section-sub">{t('how_sub')}</p>

        <div className="steps">
          {STEPS.map((n) => (
            <div className="step" key={n}>
              <div className="step-num">{n}</div>
              <h3 dangerouslySetInnerHTML={{ __html: t(`step${n}_h`) }} />
              <p dangerouslySetInnerHTML={{ __html: t(`step${n}_p`) }} />
            </div>
          ))}
        </div>

        <div className="info-box mt-24" dangerouslySetInnerHTML={{ __html: t('how_formula') }} />
      </div>
    </section>
  );
}
