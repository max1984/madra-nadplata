import { useLang } from '../contexts/LangContext';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer>
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
