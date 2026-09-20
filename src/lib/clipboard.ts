/**
 * navigator.clipboard.writeText wymaga bezpiecznego kontekstu i bywa
 * niedostępne (starsze przeglądarki, brak fokusu dokumentu) — fallback przez
 * ukryty textarea + document.execCommand('copy') działa wszędzie tam, gdzie
 * pierwsza metoda zawiedzie.
 */
export function copyToClipboard(text: string, onDone: () => void): void {
  navigator.clipboard.writeText(text).then(onDone).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    onDone();
  });
}
