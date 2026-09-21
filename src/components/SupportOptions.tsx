import { motion } from 'framer-motion';
import { useLang } from '../contexts/LangContext';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function SupportOptions() {
  const { t } = useLang();

  return (
    <section id="support">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="section-label">{t('sup_label')}</div>
          <div className="section-title">{t('sup_title')}</div>
          <p className="section-sub">{t('sup_sub')}</p>
        </motion.div>

        <motion.div
          className="support-grid"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        >
          <motion.div className="support-card" variants={cardVariant}>
            <span className="support-badge">{t('sup_badge_active')}</span>
            <h3>{t('sup_fwk_title')}</h3>
            <ul>
              <li>{t('sup_fwk_1')}</li>
              <li>{t('sup_fwk_2')}</li>
              <li>{t('sup_fwk_3')}</li>
              <li>{t('sup_fwk_4')}</li>
              <li>{t('sup_fwk_5')}</li>
            </ul>
          </motion.div>

          <motion.div className="support-card" variants={cardVariant}>
            <span className="support-badge">{t('sup_badge_active')}</span>
            <h3>{t('sup_loan_title')}</h3>
            <ul>
              <li>{t('sup_loan_1')}</li>
              <li>{t('sup_loan_2')}</li>
              <li>{t('sup_loan_3')}</li>
            </ul>
          </motion.div>

          <motion.div className="support-card ended" variants={cardVariant}>
            <span className="support-badge">{t('sup_badge_ended')}</span>
            <h3>{t('sup_holidays_title')}</h3>
            <ul>
              <li>{t('sup_holidays_1')}</li>
              <li>{t('sup_holidays_2')}</li>
              <li>{t('sup_holidays_3')}</li>
            </ul>
          </motion.div>
        </motion.div>

        <p className="support-note">{t('sup_note')}</p>
      </div>
    </section>
  );
}
