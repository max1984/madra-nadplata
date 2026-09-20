/**
 * Statyczna, ręcznie aktualizowana tabela ofert kredytów hipotecznych.
 * Podobnie jak PARTNER_OFFERS w monetization.ts — pusta tablica oznacza,
 * że sekcja się nie renderuje, zamiast pokazywać zmyślone banki/stopy.
 *
 * Każdą ofertę trzeba samodzielnie zweryfikować i regularnie odświeżać:
 * ten plik nie łączy się z żadnym źródłem danych, więc "validUntil" mówi
 * tylko tyle, ile ktoś tu ręcznie wpisał.
 */

export interface BankOffer {
  /** Klucz stabilny — do React key i ewentualnej analityki. */
  id: string;
  bank: string;
  /** Oprocentowanie nominalne w % rocznie, np. 6.79. */
  rate: number;
  /** Data, do której oferta obowiązuje wg banku, format ISO "YYYY-MM-DD". */
  validUntil: string;
  /** Krótka notatka: RRSO, wymagane produkty dodatkowe, prowizja itp. */
  note: string;
}

export const BANK_OFFERS: BankOffer[] = [];

/** Czy w ogóle pokazywać sekcję ofert banków. */
export const bankOffersEnabled = (): boolean => BANK_OFFERS.length > 0;
