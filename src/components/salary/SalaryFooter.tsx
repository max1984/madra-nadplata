import { useLang } from '../../contexts/LangContext';
import BrandMark from '../BrandMark';

/**
 * Jak Footer.tsx, ale bez SEO_LINKS (lista podstron kredytowych nie ma tu
 * sensu) — reszta (autor/donate/kontakt/wersja) jest identyczna, więc nie
 * warto parametryzować istniejącego Footer.tsx propsem tylko dla tej różnicy.
 */
export default function SalaryFooter() {
  const { t } = useLang();

  return (
    <footer>
      <div className="footer-logo"><BrandMark variant="salary" /> {t('salary_page_title')}</div>
      <p dangerouslySetInnerHTML={{ __html: t('salary_footer_disclaimer') }} />
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
          style={{ color: 'var(--text3)', fontSize: '0.8rem', textDecoration: 'none' }}
        >
          bartlomiej.derda@gmail.com
        </a>
      </div>
      <div style={{ marginTop: 12 }}>
        <a
          href="/#privacy"
          style={{ color: 'var(--text3)', fontSize: '0.75rem', textDecoration: 'none' }}
        >
          Polityka prywatności / Privacy Policy
        </a>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text3)' }}>
        v{__APP_VERSION__}
      </div>
    </footer>
  );
}
