/**
 * Wspólna logika unikalności nazw scenariuszy, dzielona przez trzy
 * kalkulatory (nadpłata/wynagrodzenia/zdolność) — bez tego kilka
 * scenariuszy o identycznej nazwie jest nierozróżnialnych na liście.
 * Porównanie ignoruje wielkość liter i białe znaki na brzegach, bo to
 * najczęstsza forma "przypadkowego" duplikatu (np. "Wariant A" vs "wariant a").
 */
export function uniqueScenarioName(existing: string[], desired: string): string {
  const taken = new Set(existing.map((n) => n.trim().toLowerCase()));
  const base = desired.trim();
  if (!taken.has(base.toLowerCase())) return base;
  let n = 2;
  while (taken.has(`${base} (${n})`.toLowerCase())) n++;
  return `${base} (${n})`;
}
