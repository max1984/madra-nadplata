import { useState, useEffect } from 'react';
import { useLang } from '../contexts/LangContext';
import { adsEnabled } from '../config/monetization';

const STORAGE_KEY = 'ad_consent_v1';

function applyConsent(granted: boolean) {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: granted ? 'granted' : 'denied',
      ad_user_data: granted ? 'granted' : 'denied',
      ad_personalization: granted ? 'granted' : 'denied',
    });
  }
}

export default function AdConsent() {
  const { t } = useLang();
  const [status, setStatus] = useState<'granted' | 'denied' | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : null;
  });

  // Apply stored consent as early as possible (within the 2 s wait_for_update window)
  useEffect(() => {
    if (status !== null) applyConsent(status === 'granted');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dopóki reklamy nie są skonfigurowane, baner o zgodzie na reklamy jest
  // nieprawdziwy i tylko zabiera miejsce — nie ma czego zgadzać.
  if (!adsEnabled() || status !== null) return null;

  const decide = (granted: boolean) => {
    const s = granted ? 'granted' : 'denied';
    localStorage.setItem(STORAGE_KEY, s);
    applyConsent(granted);
    setStatus(s);
  };

  return (
    <div className="consent-banner">
      <p className="consent-text">
        {t('ad_consent_text')}{' '}
        <a href="#privacy" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          {t('ad_consent_policy')}
        </a>
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-btn" onClick={() => decide(false)}>
          {t('ad_consent_decline')}
        </button>
        <button type="button" className="consent-btn consent-btn-accept" onClick={() => decide(true)}>
          {t('ad_consent_accept')}
        </button>
      </div>
    </div>
  );
}
