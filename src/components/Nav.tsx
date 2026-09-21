import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LangContext';
import BrandMark from './BrandMark';

/**
 * Media query mobilnego menu w index.css to @media(max-width:700px) —
 * .nav-links.mobile-open dostaje position:fixed/display:flex tylko w jej
 * obrębie. Poza nią .nav-links.mobile-open nadal pasuje do bazowej reguły
 * .nav-links{display:flex}, więc otwarte menu przetrwałe z telefonu po
 * zmianie orientacji/rozszerzeniu okna do szerokości desktopowej renderowało
 * się jako drugi, zduplikowany rząd linków w normalnym przepływie strony
 * (i podwajało kolejność Tab), zamiast zniknąć razem z hamburgerem.
 */
const MOBILE_NAV_BREAKPOINT_PX = 700;
export function shouldCloseMobileNav(viewportWidth: number): boolean {
  return viewportWidth > MOBILE_NAV_BREAKPOINT_PX;
}

// Panel mobilny renderuje się jako rodzeństwo <nav>, nie jego potomek (patrz
// index.css .nav-overlay/.nav-links.mobile-open) — kliknięcie poza obiema
// częściami zamyka menu.
export function shouldCloseOnOutsidePointer(navContains: boolean, panelContains: boolean): boolean {
  return !navContains && !panelContains;
}

export default function Nav() {
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Rozwinięte menu mobilne zamyka się też kliknięciem poza nim i Escape —
  // inaczej jedyny sposób zamknięcia to ponowne dotknięcie hamburgera.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const insideNav = !!navRef.current?.contains(target);
      const insidePanel = !!panelRef.current?.contains(target);
      if (shouldCloseOnOutsidePointer(insideNav, insidePanel)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    // Bez tego menu otwarte na telefonie zostawało "otwarte" w stanie po
    // zmianie orientacji/rozszerzeniu okna poza breakpoint mobilny (patrz
    // shouldCloseMobileNav) i renderowało się jako zduplikowany rząd linków.
    const onResize = () => {
      if (shouldCloseMobileNav(window.innerWidth)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const links = (
    <>
      <span className="nav-sec-label">{t('nav_knowledge')}</span>
      <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{t('nav_how')}</a>
      <a href="#example" onClick={() => setMenuOpen(false)}>{t('nav_example')}</a>
      <a href="#support" onClick={() => setMenuOpen(false)}>{t('nav_support')}</a>
      <a href="#faq" onClick={() => setMenuOpen(false)}>{t('nav_faq')}</a>
      <div className="nav-sep" />
      <span className="nav-sec-label">{t('nav_tools')}</span>
      <a href="#calculator" onClick={() => setMenuOpen(false)}>{t('nav_calc')}</a>
      <a href="#schedule" onClick={() => setMenuOpen(false)}>{t('nav_schedule')}</a>
      <a href="/wynagrodzenia.html">{t('nav_salary_calc')}</a>
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
    </>
  );

  return (
    <>
      <nav ref={navRef}>
        <div className="nav-logo">
          <span className="nav-logo-mark"><BrandMark variant="mortgage" /></span>
          <span>Mądra Nadpłata</span>
        </div>

        <div className="nav-mobile-right">
          <div className="lang-toggle" role="group" aria-label={t('nav_lang_group')}>
            <button className={`lang-btn${lang === 'pl' ? ' active' : ''}`} aria-pressed={lang === 'pl'} onClick={() => setLang('pl')}>PL</button>
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
          </div>
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t('nav_menu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-links"
          >
            <span /><span /><span />
          </button>
        </div>

        <div className="nav-links">{links}</div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="nav-overlay"
              aria-hidden="true"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            />
            <motion.div
              id="mobile-nav-links"
              ref={panelRef}
              className="nav-links mobile-open"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {links}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
