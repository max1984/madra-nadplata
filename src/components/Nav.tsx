import { useLang } from '../contexts/LangContext';
import type { Lang } from '../lib/i18n';

export default function Nav() {
  const { lang, setLang, t } = useLang();

  const handleLang = (l: Lang) => {
    setLang(l);
    document.documentElement.lang = l;
  };

  return (
    <nav>
      <div className="nav-logo">💰 Mądra Nadpłata</div>
      <div className="nav-links">
        <span className="nav-sec-label">{t('nav_knowledge')}</span>
        <a href="#jak-to-dziala">{t('nav_how')}</a>
        <a href="#przyklad">{t('nav_example')}</a>
        <a href="#faq">{t('nav_faq')}</a>
        <div className="nav-sep" />
        <span className="nav-sec-label">{t('nav_tools')}</span>
        <a href="#kalkulator">{t('nav_calc')}</a>
        <a href="#harmonogram">{t('nav_schedule')}</a>
        <div className="lang-toggle">
          <button
            className={`lang-btn${lang === 'pl' ? ' active' : ''}`}
            onClick={() => handleLang('pl')}
          >PL</button>
          <button
            className={`lang-btn${lang === 'en' ? ' active' : ''}`}
            onClick={() => handleLang('en')}
          >EN</button>
        </div>
      </div>
    </nav>
  );
}
