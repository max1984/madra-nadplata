import { useLang } from '../contexts/LangContext';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer>
      <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: '"Inter", system-ui, sans-serif', marginBottom: 8, background: 'linear-gradient(135deg, #4f8ef7 0%, #a78bfa 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
        💰 Mądra Nadpłata
      </div>
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
    </footer>
  );
}
