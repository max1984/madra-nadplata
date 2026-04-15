import type { Lang } from './i18n';

export function fmt(n: number, dec = 0, lang: Lang = 'pl'): string {
  return (isFinite(n) ? Math.max(0, n) : 0).toLocaleString(
    lang === 'en' ? 'en-US' : 'pl-PL',
    { minimumFractionDigits: dec, maximumFractionDigits: dec }
  );
}

export function fmtC(n: number, lang: Lang = 'pl', dec = 0): string {
  if (lang === 'en') return '$\u00a0' + fmt(n, dec, lang);
  return fmt(n, dec, lang) + '\u00a0zł';
}
