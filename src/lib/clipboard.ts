/**
 * navigator.clipboard.writeText wymaga bezpiecznego kontekstu i bywa
 * niedostępne (starsze przeglądarki, brak fokusu dokumentu) — fallback przez
 * ukryty textarea + document.execCommand('copy') działa wszędzie tam, gdzie
 * pierwsza metoda zawiedzie.
 *
 * navigator.clipboard samo w sobie bywa całkiem nieobecne (nie tylko
 * writeText odrzucone) — np. kontekst bez HTTPS albo starsze przeglądarki.
 * Odwołanie się wtedy wprost do .writeText rzuca synchroniczny TypeError
 * zamiast odrzuconego Promise, więc omija .catch() i całą tę funkcję,
 * zamiast skorzystać z zadeklarowanego fallbacku.
 */
export function copyToClipboard(text: string, onDone: () => void): void {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    onDone();
  };
  if (!navigator.clipboard?.writeText) {
    fallback();
    return;
  }
  navigator.clipboard.writeText(text).then(onDone).catch(fallback);
}
