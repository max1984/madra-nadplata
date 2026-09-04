import { useMemo } from 'react';
import { useLang } from '../contexts/LangContext';
import { buildBaseSchedule } from '../lib/mortgage';
import { PARTNER_OFFERS, partnersEnabled } from '../config/monetization';
import type { CalcState } from '../hooks/useCalculator';

/** Refinansowanie ma sens tylko przy odpowiednio długim pozostałym okresie. */
const MIN_MONTHS_FOR_REFI = 60;

/**
 * Kontekstowy moduł ofert partnerskich pod wynikami kalkulatora.
 *
 * Zasady, których ten komponent pilnuje (patrz docs/PLAN-ZYSKU.md, sekcja 1.3):
 * 1. Pokazuje się dopiero po wyliczeniu i tylko wtedy, gdy dane użytkownika
 *    faktycznie wskazują na sens szukania niższego oprocentowania.
 * 2. Kwota w treści pochodzi z jego własnego kredytu, nie z obietnicy reklamodawcy.
 * 3. Jest jawnie oznaczony jako materiał partnerski, z informacją o prowizji.
 */
export default function PartnerOffers({ calcState }: { calcState: CalcState }) {
  const { t, fmtC } = useLang();

  // Ile odsetek zniknęłoby przy oprocentowaniu niższym o 1 pp — liczone
  // na realnym saldzie i okresie użytkownika, bez zakładania czegokolwiek
  // o ofertach banków.
  const savingPerPoint = useMemo(() => {
    const lowerR = Math.max(0.00001, calcState.r - 0.01 / 12);
    const lower = buildBaseSchedule(
      calcState.P,
      Array<number>(calcState.months).fill(lowerR),
      calcState.months,
      lowerR,
    );
    return calcState.baseInterest - lower.totalInterest;
  }, [calcState.P, calcState.r, calcState.months, calcState.baseInterest]);

  if (!partnersEnabled()) return null;
  if (calcState.months < MIN_MONTHS_FOR_REFI) return null;
  if (savingPerPoint <= 0) return null;

  return (
    <div className="partner-card">
      <div className="partner-label">{t('partner_label')}</div>
      <div className="partner-title">{t('partner_title')}</div>
      <p className="partner-body">
        {t('partner_body').replace('{amount}', fmtC(savingPerPoint))}
      </p>
      <div className="partner-offers">
        {PARTNER_OFFERS.map((offer) => (
          <a
            key={offer.id}
            className="partner-offer"
            href={offer.url}
            target="_blank"
            rel="sponsored nofollow noopener noreferrer"
          >
            <span className="partner-offer-name">{offer.name}</span>
            <span className="partner-offer-pitch">{offer.pitch}</span>
          </a>
        ))}
      </div>
      <p className="partner-disclosure">{t('partner_disclosure')}</p>
    </div>
  );
}
