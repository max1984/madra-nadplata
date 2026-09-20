import { buildBaseSchedule } from './mortgage';
import type { BankOffer } from '../config/bankOffers';

/**
 * Czy oferta wciąż obowiązuje względem podanej daty (domyślnie dziś).
 * Koniec dnia (23:59:59) dla validUntil, żeby oferta ważna "do końca
 * miesiąca" faktycznie znikała dopiero następnego dnia, a nie o północy
 * pierwszej sekundy tego dnia.
 */
export function isOfferValid(offer: Pick<BankOffer, 'validUntil'>, today: Date = new Date()): boolean {
  const until = new Date(offer.validUntil + 'T23:59:59');
  return until.getTime() >= today.getTime();
}

/** Tylko wciąż ważne oferty, posortowane od najniższego oprocentowania. */
export function activeSortedOffers(offers: BankOffer[], today: Date = new Date()): BankOffer[] {
  return offers.filter((o) => isOfferValid(o, today)).sort((a, b) => a.rate - b.rate);
}

/**
 * Różnica w łącznych odsetkach, gdyby ten sam kredyt (P, months) był
 * oprocentowany wg oferty banku zamiast currentInterest, które podaje
 * wywołujący. Ujemna wartość = oferta korzystniejsza (mniej odsetek).
 * Uproszczenie takie samo jak w PartnerOffers.tsx: liczone na nominalnej
 * kwocie/okresie z formularza, nie na rzeczywistym saldzie w danym
 * momencie spłaty (który wymagałby wiedzy o dacie startu kredytu).
 */
export function offerInterestDiff(offer: Pick<BankOffer, 'rate'>, P: number, months: number, currentInterest: number): number {
  const r = offer.rate / 100 / 12;
  const schedule = buildBaseSchedule(P, Array<number>(months).fill(r), months, r);
  return schedule.totalInterest - currentInterest;
}
