import { createContext, useContext, useState, useMemo } from 'react';
import type { Lang } from '../lib/i18n';
import { t as translate, type TranslationKey } from '../lib/i18n';
import { fmt as formatNum, fmtC as formatCurrency } from '../lib/format';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  fmt: (n: number, dec?: number) => string;
  fmtC: (n: number) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang');
    return (stored === 'en' || stored === 'pl') ? stored : 'pl';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l);
    setLangState(l);
  };

  const value = useMemo<LangContextValue>(() => ({
    lang,
    setLang,
    t: (key) => translate(lang, key),
    fmt: (n, dec = 0) => formatNum(n, dec, lang),
    fmtC: (n) => formatCurrency(n, lang),
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
