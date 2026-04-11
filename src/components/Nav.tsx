import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import type { Lang } from '../lib/i18n';

export default function Nav() {
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLang = (l: Lang) => {
    setLang(l);
    document.documentElement.lang = l;
  };

  const links = (
    <>
      <span className="nav-sec-label">{t('nav_knowledge')}</span>
      <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{t('nav_how')}</a>
      <a href="#example" onClick={() => setMenuOpen(false)}>{t('nav_example')}</a>
      <a href="#faq" onClick={() => setMenuOpen(false)}>{t('nav_faq')}</a>
      <div className="nav-sep" />
      <span className="nav-sec-label">{t('nav_tools')}</span>
      <a href="#calculator" onClick={() => setMenuOpen(false)}>{t('nav_calc')}</a>
      <a href="#comparison" onClick={() => setMenuOpen(false)}>{t('compare_section_label')}</a>
      <a href="#schedule" onClick={() => setMenuOpen(false)}>{t('nav_schedule')}</a>
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
    </>
  );

  return (
    <nav>
      <div className="nav-logo">💰 Mądra Nadpłata</div>

      <button
        className={`hamburger${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

      <div className="nav-links">{links}</div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
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
