import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import {
  initConsentMode, updateConsent,
  getStoredConsent, storeConsent,
} from '../lib/analytics';

export default function CookieBanner() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    initConsentMode();
    const stored = getStoredConsent();
    if (stored === 'accepted') {
      updateConsent('granted', 'denied'); // only analytics; ads kept denied until monetisation
    } else if (stored === null) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    storeConsent('accepted');
    updateConsent('granted', 'denied');
    setVisible(false);
  };

  const decline = () => {
    storeConsent('declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="cookie-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <div className="cookie-banner-inner">
            <div className="cookie-text">
              <strong>{t('cookie_title')}</strong>
              <p>{t('cookie_desc')}</p>
              {details && (
                <p className="cookie-details-text">{t('cookie_details')}</p>
              )}
              <button
                className="cookie-details-toggle"
                onClick={() => setDetails((v) => !v)}
              >
                {details ? t('cookie_hide_details') : t('cookie_show_details')}
              </button>
            </div>
            <div className="cookie-actions">
              <button className="cookie-btn cookie-btn-accept" onClick={accept}>
                {t('cookie_accept')}
              </button>
              <button className="cookie-btn cookie-btn-decline" onClick={decline}>
                {t('cookie_decline')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
