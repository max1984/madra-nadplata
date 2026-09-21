import { useLang } from '../../contexts/LangContext';

/**
 * Jak SalaryNav.tsx — lekki nav dla trzeciej podstrony, bez hamburgera/menu
 * mobilnego (tylko link powrotny + przełącznik języka).
 */
export default function CreditworthinessNav() {
  const { lang, setLang, t } = useLang();

  return (
    <nav>
      <div className="nav-logo">
        <span className="nav-logo-mark" aria-hidden="true">🏦</span>
        <span>{t('cw_page_title')}</span>
      </div>
      <div className="nav-links nav-links-compact">
        <a href="/">{t('cw_nav_back')}</a>
        <a href="/wynagrodzenia.html">{t('nav_salary_calc')}</a>
        <div className="lang-toggle" role="group" aria-label={t('nav_lang_group')}>
          <button
            className={`lang-btn${lang === 'pl' ? ' active' : ''}`}
            aria-pressed={lang === 'pl'}
            onClick={() => setLang('pl')}
          >PL</button>
          <button
            className={`lang-btn${lang === 'en' ? ' active' : ''}`}
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
          >EN</button>
        </div>
      </div>
    </nav>
  );
}
