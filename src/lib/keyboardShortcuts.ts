/**
 * Ctrl/Cmd+Enter jako skrót do "Oblicz" — zwykły Enter w polu formularza
 * już commituje wartość (onBlur), więc podpięcie go pod przeliczenie
 * skasowałoby możliwość przejścia Tab-em między polami bez przeliczania
 * po każdym z osobna. Modyfikator odróżnia "zatwierdź to pole" od
 * "przelicz cały formularz".
 *
 * Wspólne dla wszystkich trzech kalkulatorów (przeniesione z Calculator.tsx,
 * które re-eksportuje tę funkcję dla zgodności wstecznej z istniejącym
 * importem w Calculator.test.ts) — jak canUseNativeShare w share.ts.
 */
export function isCalculateShortcut(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey'>): boolean {
  return e.key === 'Enter' && (e.ctrlKey || e.metaKey);
}
