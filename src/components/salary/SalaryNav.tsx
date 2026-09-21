import { useLang } from '../../contexts/LangContext';

/**
 * Lekki nav dla drugiej podstrony — reużywa istniejące klasy CSS z
 * index.css (nav-logo, nav-links, lang-toggle), ale bez hamburgera/menu
 * mobilnego: tu jest tylko jeden link powrotny + przełącznik języka, więc
 * mobilne rozwijane menu (i jego znane pułapki, patrz Nav.tsx) jest
 * niepotrzebne.
 */
export default function SalaryNav() {
  const { lang, setLang, t } = useLang();

  return (
    <nav>
      <div className="nav-logo">
        <span className="nav-logo-mark" aria-hidden="true">💼</span>
        <span>{t('salary_page_title')}</span>
      </div>
      <div className="nav-links nav-links-compact">
        <a href="/">{t('salary_nav_back')}</a>
        <a href="/zdolnosc-kredytowa.html">{t('nav_creditworthiness_calc')}</a>
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
