import { motion } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import { BANK_OFFERS, bankOffersEnabled } from '../config/bankOffers';
import { activeSortedOffers, offerInterestDiff } from '../lib/bankOffers';
import { fmtMonthYear } from '../lib/format';
import type { CalcState } from '../hooks/useCalculator';

/**
 * Statyczna tabela ofert banków (patrz config/bankOffers.ts) — pokazuje się
 * tylko, gdy ktoś ręcznie wpisał tam realne dane, żeby nie prezentować
 * zmyślonych stóp procentowych jako prawdziwej oferty.
 *
 * Kolumna "różnica w odsetkach" pojawia się dopiero po wyliczeniu w
 * kalkulatorze (calcState) — to jedyny moment, w którym znamy P i months
 * użytkownika, względem których w ogóle da się to policzyć. Porównanie
 * celowo bierze baseInterest (harmonogram BEZ nadpłaty) jako punkt
 * odniesienia zamiast wyniku z nadpłatą — tak samo jak PartnerOffers.tsx —
 * inaczej niższe oprocentowanie bez nadpłaty mogłoby wyjść "gorsze" niż
 * wyższe oprocentowanie z agresywną nadpłatą, co nie mówi nic o samej
 * ofercie banku.
 */
export default function BankOffers({ calcState }: { calcState: CalcState | null }) {
  const { t, fmt, fmtSignedC, lang } = useLang();

  if (!bankOffersEnabled()) return null;
  const offers = activeSortedOffers(BANK_OFFERS);
  if (offers.length === 0) return null;

  const currentInterest = calcState ? calcState.baseInterest : null;

  return (
    <section id="bank-offers">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">{t('bank_offers_label')}</div>
          <div className="section-title">{t('bank_offers_title')}</div>
          <p className="section-sub">{t('bank_offers_sub')}</p>
        </motion.div>

        <motion.div
          className="table-wrapper"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('bank_offers_col_bank')}</th>
                  <th scope="col">{t('bank_offers_col_rate')}</th>
                  <th scope="col">{t('bank_offers_col_valid')}</th>
                  {currentInterest !== null && calcState && <th scope="col">{t('bank_offers_col_diff')}</th>}
                  <th scope="col">{t('bank_offers_col_note')}</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const diff = currentInterest !== null && calcState
                    ? offerInterestDiff(offer, calcState.P, calcState.months, currentInterest)
                    : null;
                  return (
                    <tr key={offer.id}>
                      <td>{offer.bank}</td>
                      <td>{fmt(offer.rate, 2)}%</td>
                      <td>{fmtMonthYear(new Date(offer.validUntil), lang)}</td>
                      {diff !== null && (
                        <td style={{ color: diff <= 0 ? 'var(--accent2)' : 'var(--danger)', fontWeight: 600 }}>
                          {fmtSignedC(diff, 0)}
                        </td>
                      )}
                      <td>{offer.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="partner-disclosure">{t('bank_offers_disclaimer')}</p>
        </motion.div>
      </div>
    </section>
  );
}
