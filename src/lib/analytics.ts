export const GA_ID = 'G-28E2EQV3KY';

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
  // consent default + gtag init are already in index.html
  // this function only applies stored consent on page load
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
