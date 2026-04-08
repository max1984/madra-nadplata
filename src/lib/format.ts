import type { Lang } from './i18n';

export function fmt(n: number, dec = 0, lang: Lang = 'pl'): string {
  return (isFinite(n) ? Math.max(0, n) : 0).toLocaleString(
    lang === 'en' ? 'en-GB' : 'pl-PL',
    { minimumFractionDigits: dec, maximumFractionDigits: dec }
  );
}

export function fmtC(n: number, lang: Lang = 'pl', currency = lang === 'en' ? 'PLN' : 'zł'): string {
  return fmt(n, 0, lang) + ' ' + currency;
}
