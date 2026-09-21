import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Lang } from '../lib/i18n';
import { t as translate, type TranslationKey } from '../lib/i18n';
import { fmt as formatNum, fmtC as formatCurrency, fmtSignedC as formatSignedCurrency } from '../lib/format';
import { safeGetItem, safeSetItem } from '../lib/safeStorage';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  fmt: (n: number, dec?: number) => string;
  fmtC: (n: number, dec?: number) => string;
  fmtSignedC: (n: number, dec?: number) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

/**
 * ?lang= ma pierwszeństwo przed localStorage — udostępniony link do
 * scenariusza (Calculator.tsx) niesie ten parametr, żeby odbiorca zobaczył
 * kalkulator w tym samym języku, w którym go wysłano, a nie w swoim
 * domyślnym/poprzednio zapamiętanym. Wydzielone jako czysta funkcja, żeby dało
 * się to przetestować bez renderowania LangProvider.
 */
export function resolveInitialLang(search: string, stored: string | null): Lang {
  const fromUrl = new URLSearchParams(search).get('lang');
  if (fromUrl === 'en' || fromUrl === 'pl') return fromUrl;
  return (stored === 'en' || stored === 'pl') ? stored : 'pl';
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    resolveInitialLang(window.location.search, safeGetItem('lang')),
  );

  const setLang = (l: Lang) => {
    safeSetItem('lang', l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LangContextValue>(() => ({
    lang,
    setLang,
    t: (key) => translate(lang, key),
    fmt: (n, dec = 0) => formatNum(n, dec, lang),
    fmtC: (n, dec = 0) => formatCurrency(n, lang, dec),
    fmtSignedC: (n, dec = 0) => formatSignedCurrency(n, lang, dec),
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
