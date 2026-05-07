import { useState, useEffect } from 'react';
import { useLang } from '../contexts/LangContext';

const STORAGE_KEY = 'ad_consent_v1';

type ConsentStatus = 'granted' | 'denied';

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
  const [status, setStatus] = useState<ConsentStatus | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : null;
  });

  // Apply stored consent as early as possible (within the 2 s wait_for_update window)
  useEffect(() => {
    if (status !== null) applyConsent(status === 'granted');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status !== null) return null;

  const decide = (granted: boolean) => {
    const s: ConsentStatus = granted ? 'granted' : 'denied';
    localStorage.setItem(STORAGE_KEY, s);
    applyConsent(granted);
    setStatus(s);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#111827', borderTop: '1px solid rgba(255,255,255,.1)',
      padding: '10px 20px', display: 'flex', alignItems: 'center',
      gap: 12, flexWrap: 'wrap', boxShadow: '0 -4px 20px rgba(0,0,0,.6)',
    }}>
      <p style={{ flex: 1, minWidth: 200, fontSize: '.76rem', color: 'var(--text2)', margin: 0, lineHeight: 1.4 }}>
        {t('ad_consent_text')}{' '}
        <a href="#privacy" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          {t('ad_consent_policy')}
        </a>
      </p>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          className="copy-link-btn"
          style={{ padding: '5px 12px', fontSize: '.76rem' }}
          onClick={() => decide(false)}
        >
          {t('ad_consent_decline')}
        </button>
        <button
          type="button"
          className="calc-btn"
          style={{ padding: '5px 14px', fontSize: '.76rem' }}
          onClick={() => decide(true)}
        >
          {t('ad_consent_accept')}
        </button>
      </div>
    </div>
  );
}
