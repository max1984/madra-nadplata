import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
export default function Nav() {
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = (
    <>
      <span className="nav-sec-label">{t('nav_knowledge')}</span>
      <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{t('nav_how')}</a>
      <a href="#example" onClick={() => setMenuOpen(false)}>{t('nav_example')}</a>
      <a href="#faq" onClick={() => setMenuOpen(false)}>{t('nav_faq')}</a>
      <div className="nav-sep" />
      <span className="nav-sec-label">{t('nav_tools')}</span>
      <a href="#calculator" onClick={() => setMenuOpen(false)}>{t('nav_calc')}</a>
      <a href="#schedule" onClick={() => setMenuOpen(false)}>{t('nav_schedule')}</a>
      <div className="lang-toggle" role="group" aria-label="Language">
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
    </>
  );

  return (
    <nav>
      <div className="nav-logo">💰 Mądra Nadpłata</div>

      <div className="nav-mobile-right">
        <div className="lang-toggle" role="group" aria-label="Language">
          <button className={`lang-btn${lang === 'pl' ? ' active' : ''}`} aria-pressed={lang === 'pl'} onClick={() => setLang('pl')}>PL</button>
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
        </div>
        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-links"
        >
          <span /><span /><span />
        </button>
      </div>

      <div className="nav-links">{links}</div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav-links"
            className="nav-links mobile-open"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {links}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
