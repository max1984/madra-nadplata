import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../contexts/LangContext';

function resetAdConsent() {
  localStorage.removeItem('ad_consent_v1');
  window.location.hash = '';
  window.location.reload();
}

function close() {
  window.history.pushState('', document.title, window.location.pathname + window.location.search);
}

const OWNER = 'Bartłomiej Derda';
const EMAIL = 'bartlomiej.derda@gmail.com';
const SITE = 'nadplata.org';
const UPDATED = '7 maja 2026';
const UPDATED_EN = 'May 7, 2026';

function ContentPL() {
  return (
    <div className="pp-body">
      <p className="pp-updated">Ostatnia aktualizacja: {UPDATED}</p>

      <h2>1. Administrator danych</h2>
      <p>
        Administratorem danych osobowych w rozumieniu RODO jest:<br />
        <strong>{OWNER}</strong><br />
        Kontakt: <a href={`mailto:${EMAIL}`}>{EMAIL}</a><br />
        Serwis: <strong>{SITE}</strong>
      </p>

      <h2>2. Jakie dane są zbierane</h2>
      <p>
        Serwis korzysta z <strong>Google AdSense</strong> — usługi reklamowej Google LLC
        (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA). Google może zbierać
        i przetwarzać następujące dane w związku z wyświetlaniem reklam:
      </p>
      <ul>
        <li>pliki cookies i podobne technologie śledzące,</li>
        <li>adres IP,</li>
        <li>informacje o urządzeniu i przeglądarce,</li>
        <li>dane o aktywności na stronie (wyświetlone reklamy, kliknięcia).</li>
      </ul>
      <p>
        Sam serwis <strong>nie zbiera</strong> żadnych danych osobowych — nie prowadzi kont
        użytkowników, formularzy kontaktowych ani analityki ruchu.
      </p>

      <h2>3. Cel i podstawa prawna przetwarzania</h2>
      <p>
        Dane przetwarzane przez Google AdSense służą wyświetlaniu reklam, w tym reklam
        spersonalizowanych na podstawie zainteresowań użytkownika.<br />
        Podstawa prawna: <strong>zgoda osoby, której dane dotyczą</strong> (art. 6 ust. 1 lit. a RODO).
      </p>
      <p>
        <strong>Bez wyrażenia zgody</strong> wyświetlane są reklamy <em>niespersonalizowane</em>
        (Google nie łączy ich z profilem użytkownika, ale nadal może korzystać z cookies
        niezbędnych technicznie do serwowania reklam).
      </p>

      <h2>4. Cookies</h2>
      <p>
        Google AdSense umieszcza pliki cookies na urządzeniu użytkownika. Szczegółowy wykaz
        cookies Google dostępny jest w{' '}
        <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
          Polityce cookies Google
        </a>.
      </p>
      <p>
        Serwis przechowuje w <code>localStorage</code> przeglądarki wyłącznie Twój wybór
        dotyczący zgody na reklamy (klucz <code>ad_consent_v1</code>) oraz preferencję
        językową (<code>lang</code>). Dane te nie są przesyłane na żaden serwer.
      </p>

      <h2>5. Przekazywanie danych do państw trzecich</h2>
      <p>
        Google LLC ma siedzibę w USA. Dane mogą być przetwarzane poza EOG. Google
        uczestniczy w programie Data Privacy Framework, co stanowi odpowiednią gwarancję
        zgodnie z art. 46 RODO. Więcej informacji:{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Polityka prywatności Google
        </a>.
      </p>

      <h2>6. Prawa użytkownika</h2>
      <p>Przysługują Ci następujące prawa:</p>
      <ul>
        <li>prawo dostępu do danych,</li>
        <li>prawo do sprostowania danych,</li>
        <li>prawo do usunięcia danych (<em>„prawo do bycia zapomnianym"</em>),</li>
        <li>prawo do ograniczenia przetwarzania,</li>
        <li>prawo do przenoszenia danych,</li>
        <li>prawo do wycofania zgody w dowolnym momencie (bez wpływu na zgodność z prawem przetwarzania sprzed wycofania),</li>
        <li>prawo wniesienia skargi do Prezesa UODO (<a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer">uodo.gov.pl</a>).</li>
      </ul>
      <p>
        W kwestii danych przetwarzanych przez Google należy kontaktować się bezpośrednio
        z Google: <a href="https://myaccount.google.com/data-and-privacy" target="_blank" rel="noopener noreferrer">
          Moje dane i prywatność Google
        </a>.
      </p>

      <h2>7. Wycofanie zgody na reklamy</h2>
      <p>
        Możesz w każdej chwili wycofać zgodę na spersonalizowane reklamy. Po wycofaniu
        zgody nadal mogą być wyświetlane reklamy niespersonalizowane.
      </p>
      <button type="button" className="copy-link-btn" style={{ marginTop: 4 }} onClick={resetAdConsent}>
        Resetuj preferencje reklam
      </button>

      <h2>8. Kontakt</h2>
      <p>
        W sprawach dotyczących polityki prywatności skontaktuj się pod adresem:{' '}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </p>
    </div>
  );
}

function ContentEN() {
  return (
    <div className="pp-body">
      <p className="pp-updated">Last updated: {UPDATED_EN}</p>

      <h2>1. Data Controller</h2>
      <p>
        The data controller within the meaning of the GDPR is:<br />
        <strong>{OWNER}</strong><br />
        Contact: <a href={`mailto:${EMAIL}`}>{EMAIL}</a><br />
        Website: <strong>{SITE}</strong>
      </p>

      <h2>2. What data is collected</h2>
      <p>
        This site uses <strong>Google AdSense</strong> — an advertising service by Google LLC
        (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA). Google may collect and
        process the following data in connection with ad display:
      </p>
      <ul>
        <li>cookies and similar tracking technologies,</li>
        <li>IP address,</li>
        <li>device and browser information,</li>
        <li>activity data (ads shown, clicks).</li>
      </ul>
      <p>
        The site itself <strong>does not collect</strong> any personal data — there are no
        user accounts, contact forms or traffic analytics.
      </p>

      <h2>3. Purpose and legal basis</h2>
      <p>
        Data processed by Google AdSense is used to display advertisements, including
        interest-based personalized ads.<br />
        Legal basis: <strong>consent of the data subject</strong> (Article 6(1)(a) GDPR).
      </p>
      <p>
        <strong>Without consent</strong>, only <em>non-personalized</em> ads are shown
        (Google does not link them to a user profile, but may still use technically
        necessary cookies for ad serving).
      </p>

      <h2>4. Cookies</h2>
      <p>
        Google AdSense places cookies on your device. A full list of Google cookies is
        available in the{' '}
        <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
          Google Cookie Policy
        </a>.
      </p>
      <p>
        This site stores only your ad consent choice (<code>ad_consent_v1</code>) and
        language preference (<code>lang</code>) in the browser's <code>localStorage</code>.
        This data is never sent to any server.
      </p>

      <h2>5. International data transfers</h2>
      <p>
        Google LLC is based in the USA. Data may be processed outside the EEA. Google
        participates in the Data Privacy Framework, providing adequate safeguards under
        Article 46 GDPR. More information:{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google Privacy Policy
        </a>.
      </p>

      <h2>6. Your rights</h2>
      <p>You have the following rights:</p>
      <ul>
        <li>right of access to your data,</li>
        <li>right to rectification,</li>
        <li>right to erasure (<em>"right to be forgotten"</em>),</li>
        <li>right to restriction of processing,</li>
        <li>right to data portability,</li>
        <li>right to withdraw consent at any time (without affecting the lawfulness of processing prior to withdrawal),</li>
        <li>right to lodge a complaint with your national data protection authority.</li>
      </ul>
      <p>
        For data processed by Google, contact Google directly:{' '}
        <a href="https://myaccount.google.com/data-and-privacy" target="_blank" rel="noopener noreferrer">
          Google Data & Privacy
        </a>.
      </p>

      <h2>7. Withdrawing ad consent</h2>
      <p>
        You can withdraw your consent to personalized ads at any time. Non-personalized
        ads may still be shown after withdrawal.
      </p>
      <button type="button" className="copy-link-btn" style={{ marginTop: 4 }} onClick={resetAdConsent}>
        Reset ad preferences
      </button>

      <h2>8. Contact</h2>
      <p>
        For privacy-related inquiries, contact:{' '}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </p>
    </div>
  );
}

export default function PrivacyPolicy() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(() => window.location.hash === '#privacy');

  const onHashChange = useCallback(() => {
    setVisible(window.location.hash === '#privacy');
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [onHashChange]);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    if (visible) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(5, 8, 22, 0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, maxWidth: 720, width: '100%',
        padding: '32px 36px', position: 'relative',
      }}>
        <button
          type="button"
          onClick={close}
          aria-label="Zamknij"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', fontSize: '1.4rem', lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
        <div style={{
          fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '.8px', color: 'var(--text3)', marginBottom: 8,
        }}>
          {lang === 'pl' ? 'Polityka prywatności' : 'Privacy Policy'}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text1)', margin: '0 0 24px' }}>
          {lang === 'pl' ? 'Jak używamy danych i reklam' : 'How we use data and ads'}
        </h1>
        {lang === 'pl' ? <ContentPL /> : <ContentEN />}
      </div>
    </div>
  );
}
