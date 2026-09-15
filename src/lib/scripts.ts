import { CF_ANALYTICS_TOKEN, analyticsEnabled } from '../config/monetization';

function appendScript(attrs: Record<string, string>) {
  const s = document.createElement('script');
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
}

/**
 * Ładuje skrypty zewnętrzne dopiero po pierwszym renderze i tylko te, które są
 * faktycznie skonfigurowane. Dzięki temu przy pustej konfiguracji strona nie
 * ciągnie ani bajta obcego kodu — LCP zostaje nietknięte.
 * Skrypt AdSense jest osobno wklejony statycznie w index.html <head>, bo
 * AdSense wymaga go tam do weryfikacji witryny.
 */
export function loadExternalScripts() {
  const run = () => {
    if (analyticsEnabled()) {
      appendScript({
        defer: '',
        src: 'https://static.cloudflareinsights.com/beacon.min.js',
        'data-cf-beacon': JSON.stringify({ token: CF_ANALYTICS_TOKEN }),
      });
    }
  };

  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}
