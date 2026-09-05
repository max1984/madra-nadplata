import { useLang } from '../contexts/LangContext';

/**
 * Linki do statycznych podstron generowanych przez scripts/build-seo.mjs.
 * Bez odnośnika ze strony głównej Google nie ma jak ich znaleźć — sitemap
 * sam z siebie nie wystarcza, żeby uznać stronę za wartą zaindeksowania.
 * Treść jest wyłącznie polska, więc w wersji angielskiej blok się nie pokazuje.
 */
const SEO_LINKS = [
  { href: '/czy-oplaca-sie-nadplacac-kredyt-hipoteczny/', label: 'Czy opłaca się nadpłacać?' },
  { href: '/skrocic-okres-czy-zmniejszyc-rate/', label: 'Skrócić okres czy zmniejszyć ratę?' },
  { href: '/kiedy-zaczac-nadplacac-kredyt/', label: 'Kiedy zacząć nadpłacać?' },
  { href: '/nadplata-kredytu-czy-inwestowanie/', label: 'Nadpłata czy inwestowanie?' },
  { href: '/prowizja-za-wczesniejsza-splate-kredytu/', label: 'Prowizja za wcześniejszą spłatę' },
  { href: '/kalkulator-nadplaty-200000-zl/', label: 'Nadpłata 200 000 zł' },
  { href: '/kalkulator-nadplaty-300000-zl/', label: 'Nadpłata 300 000 zł' },
  { href: '/kalkulator-nadplaty-400000-zl/', label: 'Nadpłata 400 000 zł' },
  { href: '/kalkulator-nadplaty-500000-zl/', label: 'Nadpłata 500 000 zł' },
  { href: '/kalkulator-nadplaty-700000-zl/', label: 'Nadpłata 700 000 zł' },
];

export default function Footer() {
  const { t, lang } = useLang();

  return (
    <footer>
      {lang === 'pl' && (
        <div className="footer-links" role="navigation" aria-label="Poradniki">
          {SEO_LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
      )}

      <div className="footer-logo">💰 Mądra Nadpłata</div>
      <p dangerouslySetInnerHTML={{ __html: t('footer_disclaimer') }} />
      <div className="footer-author" style={{ marginTop: 16 }}>
        {t('footer_author')} <strong style={{ color: 'var(--text2)' }}>Bartłomiej Derda</strong>
      </div>
      <div style={{ marginTop: 12 }}>
        <a
          href="https://buymeacoffee.com/bderda"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-donate"
        >
          {t('footer_donate')}
        </a>
      </div>
      <div style={{ marginTop: 12 }}>
        <a
          href="mailto:bartlomiej.derda@gmail.com"
          style={{ color: 'var(--text3)', fontSize: '0.8rem', textDecoration: 'none', opacity: 0.7 }}
        >
          bartlomiej.derda@gmail.com
        </a>
      </div>
      <div style={{ marginTop: 12 }}>
        <a
          href="#privacy"
          style={{ color: 'var(--text3)', fontSize: '0.75rem', textDecoration: 'none', opacity: 0.6 }}
        >
          Polityka prywatności / Privacy Policy
        </a>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text3)', opacity: 0.4 }}>
        v{__APP_VERSION__}
      </div>
    </footer>
  );
}
