import { useLang } from '../contexts/LangContext';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>💰 Mądra Nadpłata</div>
      <p dangerouslySetInnerHTML={{ __html: t('footer_disclaimer') }} />
      <div className="footer-author" style={{ marginTop: 16 }}>
        {t('footer_author')} <strong style={{ color: 'var(--text2)' }}>Bartłomiej Derda</strong>
      </div>
    </footer>
  );
}
