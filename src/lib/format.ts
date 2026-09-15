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
