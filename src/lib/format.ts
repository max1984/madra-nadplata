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
