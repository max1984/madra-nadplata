/**
 * Jedyne miejsce w kodzie, w którym konfiguruje się zarabianie na stronie.
 * Podmiana ID / linków tutaj wystarczy — reszta aplikacji czyta stąd.
 *
 * Szczegóły i uzasadnienie: docs/PLAN-ZYSKU.md
 */

/**
 * Publisher ID z Google AdSense, w formacie `ca-pub-1234567890123456`.
 * Dopóki jest tu atrapa, skrypt AdSense w ogóle się nie ładuje — nie ma sensu
 * ciągnąć 200 kB JavaScriptu, który i tak nic nie wyświetli.
 */
export const ADSENSE_CLIENT = 'ca-pub-6577606072180185';

/** ID jednostek reklamowych z panelu AdSense (Reklamy → Według jednostek). */
export const ADSENSE_SLOTS = {
  /** Pod wynikami kalkulatora — miejsce o najwyższej widoczności. */
  afterResults: '',
  /** W treści, między sekcjami edukacyjnymi. */
  inArticle: '',
} as const;

const PLACEHOLDER = /X{6,}/;

/** Czy mamy prawdziwe ID i wolno ładować skrypty AdSense. */
export const adsEnabled = (): boolean =>
  ADSENSE_CLIENT.startsWith('ca-pub-') && !PLACEHOLDER.test(ADSENSE_CLIENT);

export interface PartnerOffer {
  /** Klucz stabilny — używany w zdarzeniach analitycznych. */
  id: string;
  name: string;
  /** Jednozdaniowa obietnica; bez obietnic konkretnych stóp, których nie kontrolujemy. */
  pitch: string;
  /** Link afiliacyjny/trackingowy z sieci partnerskiej. */
  url: string;
}

/**
 * Oferty partnerskie pokazywane pod wynikami — wyłącznie wtedy, gdy wyliczenie
 * użytkownika faktycznie wskazuje na sens refinansowania (patrz PartnerOffers.tsx).
 * Pusta tablica = moduł się nie renderuje.
 */
export const PARTNER_OFFERS: PartnerOffer[] = [];

/** Czy w ogóle pokazywać sekcję ofert partnerskich. */
export const partnersEnabled = (): boolean => PARTNER_OFFERS.length > 0;

/**
 * Analityka bezciasteczkowa (Cloudflare Web Analytics). Nie wymaga zgody RODO,
 * bo nie zapisuje niczego na urządzeniu użytkownika i nie profiluje.
 * Token: panel Cloudflare → Analytics & Logs → Web Analytics → dodaj nadplata.org.
 */
export const CF_ANALYTICS_TOKEN = '';

export const analyticsEnabled = (): boolean => CF_ANALYTICS_TOKEN.length > 0;
