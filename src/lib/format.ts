import type { Lang } from './i18n';

export function fmt(n: number, dec = 0, lang: Lang = 'pl'): string {
  return (isFinite(n) ? Math.max(0, n) : 0).toLocaleString(
    lang === 'en' ? 'en-US' : 'pl-PL',
    { minimumFractionDigits: dec, maximumFractionDigits: dec }
  );
}

/**
 * Wszystkie kwoty w kalkulatorze to złotówki niezależnie od języka interfejsu
 * — to kalkulator polskich kredytów hipotecznych dla anglojęzycznych
 * użytkowników, nie przelicznik walut. Wersja "en" pokazywała "$", co
 * sugerowało dolary i myliło co do realnej wartości kredytu.
 */
export function fmtC(n: number, lang: Lang = 'pl', dec = 0): string {
  const suffix = lang === 'en' ? 'PLN' : 'zł';
  return fmt(n, dec, lang) + ' ' + suffix;
}

/**
 * Kwota różnicy ze znakiem, np. "+12 340 zł" / "-8 500 zł" — fmtC celowo
 * przycina ujemne liczby do zera (bo zwykle pokazuje kwoty typu saldo czy
 * odsetki, które w tym kalkulatorze nie bywają ujemne), więc reużycie jej
 * wprost do wyświetlenia rzeczywistej różnicy (dodatniej lub ujemnej —
 * "o ile drożej/taniej") po cichu gubiło znak minus i pokazywało "0 zł"
 * zamiast korzystnej, ujemnej wartości.
 */
export function fmtSignedC(n: number, lang: Lang = 'pl', dec = 0): string {
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return sign + fmtC(Math.abs(n), lang, dec);
}

/**
 * W polskim nawyku separatorem dziesiętnym jest przecinek, ale pola
 * liczbowe w tym kalkulatorze parsowały wartość przez parseFloat, który
 * rozumie tylko kropkę — "7,5" ciszej stawało się "7".
 */
export function parseLocaleNumber(value: string): number {
  return parseFloat(value.replace(',', '.'));
}

/** "grudzień 2044" / "December 2044" — miesiąc i rok spłaty kredytu. */
export function fmtMonthYear(date: Date, lang: Lang = 'pl'): string {
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'pl-PL', { month: 'long', year: 'numeric' });
}

/**
 * `new Date('YYYY-MM-DD')` parsuje datę jako północ UTC, nie lokalny czas —
 * dla odbiorcy w strefie czasowej na zachód od UTC (np. Ameryki) północ UTC
 * to wciąż poprzedni dzień lokalnie, więc wyświetlony miesiąc/rok potrafi się
 * cofnąć o jeden dzień względem tego, co faktycznie wpisano w danych (np.
 * BankOffer.validUntil). Ta funkcja buduje Date z lokalnych roku/miesiąca/dnia,
 * tak samo jak już robi to payoffDate() w mortgage.ts.
 */
export function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

/**
 * ";" jako separator kolumn + przecinek dziesiętny to jedyny sposób, żeby
 * Excel z polskimi ustawieniami regionalnymi poprawnie rozbił plik na kolumny
 * i rozpoznał liczby (inaczej "1234.56" wczytuje się jako tekst). Wersja
 * angielska interfejsu ma jednak angielskich odbiorców z odwrotną konwencją
 * regionalną (przecinek jako separator kolumn/tysięcy, kropka dziesiętna) —
 * eksport z polskimi nagłówkami, ale w formacie EN, mieszałby dwie konwencje
 * naraz i psuł się dokładnie tak samo jak przy polskich ustawieniach na odwrót.
 */
export const csvDec = (n: number, lang: Lang = 'pl') =>
  lang === 'en' ? n.toFixed(2) : n.toFixed(2).replace('.', ',');
