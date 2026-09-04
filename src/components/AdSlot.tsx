import { useEffect, useRef } from 'react';
import { useLang } from '../contexts/LangContext';
import { ADSENSE_CLIENT, ADSENSE_SLOTS, adsEnabled } from '../config/monetization';

type SlotName = keyof typeof ADSENSE_SLOTS;

/**
 * Pojedyncza jednostka reklamowa. Renderuje się wyłącznie wtedy, gdy konto
 * AdSense i konkretny slot są skonfigurowane — inaczej zostawia po sobie
 * dosłownie nic, bez pustej ramki i bez przeskoku layoutu.
 */
export default function AdSlot({ slot }: { slot: SlotName }) {
  const { t } = useLang();
  const slotId = ADSENSE_SLOTS[slot];
  const enabled = adsEnabled() && slotId.length > 0;
  const pushed = useRef(false);

  useEffect(() => {
    // AdSense wymaga jednego push() na jednostkę. W StrictMode efekt odpala się
    // dwa razy, a podwójny push kończy się błędem "already have ads in them".
    if (!enabled || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blokada reklam albo skrypt jeszcze niezaładowany — nie jest to błąd,
      // który użytkownik ma zobaczyć.
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="ad-slot">
      <div className="ad-slot-label">{t('ad_label')}</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
