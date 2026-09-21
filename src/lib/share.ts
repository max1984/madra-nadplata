/**
 * navigator.share() istnieje głównie na przeglądarkach mobilnych (i części
 * desktopowych z integracją systemowego arkusza udostępniania) — wydzielone
 * jako funkcja przyjmująca navigator jako argument, żeby dało się to
 * przetestować bez mockowania globalnego obiektu window.
 *
 * Wspólne dla wszystkich trzech kalkulatorów (przeniesione z Calculator.tsx,
 * które re-eksportuje tę funkcję dla zgodności wstecznej z istniejącym
 * importem w Calculator.test.ts) — importowanie z pliku komponentu
 * mortgage-kalkulatora do salary/creditworthiness ciągnęłoby cały jego
 * moduł do ich osobnych chunków builda.
 */
export function canUseNativeShare(nav: unknown): boolean {
  return typeof (nav as { share?: unknown } | null | undefined)?.share === 'function';
}
