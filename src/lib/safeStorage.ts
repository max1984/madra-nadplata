/**
 * localStorage rzuca wyjątkiem (nie tylko cicho nic nie robi) w części
 * przeglądarek/trybów prywatnych oraz gdy polityka firmowa blokuje storage.
 * LangProvider i AdConsent czytają go w inicjalizatorze useState, więc bez
 * przechwycenia błędu cała strona padała na ErrorBoundary zamiast po prostu
 * działać bez zapamiętanej preferencji.
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Zwraca, czy zapis się udał — dla większości wywołań (preferencje) nikogo
 * to nie obchodzi, ale przy zapisywaniu scenariusza (persistScenarios) cichy
 * fail przy pełnym/zablokowanym storage wyglądał w UI jak sukces, mimo że
 * scenariusz znikał po odświeżeniu strony bez żadnego ostrzeżenia.
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // jw.
  }
}
