// Replace G-XXXXXXXXXX with your actual GA4 Measurement ID
export const GA_ID = 'G-XXXXXXXXXX';

type ConsentChoice = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}
window.gtag = gtag;

export function initConsentMode() {
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
}

export function updateConsent(analytics: ConsentChoice, ads: ConsentChoice) {
  gtag('consent', 'update', {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
}

export const CONSENT_KEY = 'madra_consent';

export type ConsentState = 'accepted' | 'declined' | null;

export function getStoredConsent(): ConsentState {
  try {
    return (localStorage.getItem(CONSENT_KEY) as ConsentState) ?? null;
  } catch {
    return null;
  }
}

export function storeConsent(choice: 'accepted' | 'declined') {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // ignore
  }
}
