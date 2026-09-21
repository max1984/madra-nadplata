/**
 * Segmenty paska rozbicia wyniku (np. brutto -> ZUS/zdrowotna/PIT/netto) —
 * czysta funkcja, żeby dało się sprawdzić testem, że segmenty faktycznie
 * sumują się do 100% niezależnie od kształtu wyniku (umowa o pracę/zlecenie/
 * dzieło/B2B mają różne pola: dzieło nie ma ZUS/zdrowotnej, B2B ma koszty
 * firmowe, których pozostałe trzy formy nie mają).
 */
export interface BarSegment {
  key: string;
  amount: number;
  pct: number;
}

export function barSegments(base: number, parts: Record<string, number>): BarSegment[] {
  if (base <= 0) return [];
  const entries = Object.entries(parts).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 0) return [];
  // Ostatni segment dobiera resztę do 100% zamiast własnego zaokrąglenia —
  // inaczej suma zaokrąglonych procentów (np. 33.3+33.3+33.3) potrafi wyjść
  // 99.9 zamiast 100, co przy pasku wypełnionym do pełnej szerokości
  // zostawiłoby ułamkowy prześwit.
  const segments: BarSegment[] = [];
  let usedPct = 0;
  entries.forEach(([key, amount], i) => {
    const isLast = i === entries.length - 1;
    const pct = isLast ? Math.max(0, 100 - usedPct) : Math.round((amount / total) * 1000) / 10;
    usedPct += pct;
    segments.push({ key, amount, pct });
  });
  return segments;
}

/** Pasek porównania kilku wartości do wspólnej skali (np. rata vs. limity) — nie sumuje się do 100%. */
export interface ComparisonBar {
  key: string;
  amount: number;
  pct: number; // względem największej wartości w zestawie
}

export function comparisonBars(values: Record<string, number>): ComparisonBar[] {
  const entries = Object.entries(values).map(([key, amount]) => [key, Math.max(0, amount)] as const);
  const max = Math.max(0, ...entries.map(([, v]) => v));
  if (max <= 0) return entries.map(([key]) => ({ key, amount: 0, pct: 0 }));
  return entries.map(([key, amount]) => ({ key, amount, pct: Math.round((amount / max) * 1000) / 10 }));
}
