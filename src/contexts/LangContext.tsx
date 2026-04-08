import { createContext, useContext, useState } from 'react';
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
  const [lang, setLang] = useState<Lang>('pl');

  const value: LangContextValue = {
    lang,
    setLang,
    t: (key) => translate(lang, key),
    fmt: (n, dec = 0) => formatNum(n, dec, lang),
    fmtC: (n) => formatCurrency(n, lang),
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
