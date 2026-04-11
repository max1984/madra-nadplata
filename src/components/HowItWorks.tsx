import { motion } from 'framer-motion';
import { useLang } from '../contexts/LangContext';

const STEPS = [1, 2, 3, 4, 5, 6] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function HowItWorks() {
  const { t } = useLang();

  return (
    <section id="how-it-works">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">{t('how_label')}</div>
          <div className="section-title">{t('how_title')}</div>
          <p className="section-sub">{t('how_sub')}</p>
        </motion.div>

        <motion.div
          className="steps"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {STEPS.map((n) => (
            <motion.div
              key={n}
              className="step"
              variants={cardVariant}
              whileHover={{ y: -8, borderColor: 'rgba(79,142,247,0.3)' }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <div className="step-num">{n}</div>
              <h3 dangerouslySetInnerHTML={{ __html: t(`step${n}_h`) }} />
              <p dangerouslySetInnerHTML={{ __html: t(`step${n}_p`) }} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="info-box mt-24"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          dangerouslySetInnerHTML={{ __html: t('how_formula') }}
        />
      </div>
    </section>
  );
}
