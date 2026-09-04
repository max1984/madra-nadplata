import { ADSENSE_CLIENT, CF_ANALYTICS_TOKEN, adsEnabled, analyticsEnabled } from '../config/monetization';

function appendScript(attrs: Record<string, string>) {
  const s = document.createElement('script');
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.appendChild(s);
}

/**
 * Ładuje skrypty zewnętrzne dopiero po pierwszym renderze i tylko te, które są
 * faktycznie skonfigurowane. Dzięki temu przy pustej konfiguracji strona nie
 * ciągnie ani bajta obcego kodu — LCP zostaje nietknięte.
 */
export function loadExternalScripts() {
  const run = () => {
    if (adsEnabled()) {
      appendScript({
        async: '',
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
        crossorigin: 'anonymous',
      });
    }
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
