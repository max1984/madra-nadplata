/**
 * Wspólna paleta wykresów, spójna z jasnym motywem z index.css.
 * Chart.js nie czyta zmiennych CSS, więc kolory muszą być tu zduplikowane —
 * przy zmianie motywu trzeba ruszyć oba pliki.
 */
export const CHART = {
  /** Scenariusz bazowy — bez nadpłaty. Czerwień = koszt. */
  base: '#dc2626',
  baseFill: 'rgba(220,38,38,.08)',
  baseBar: 'rgba(220,38,38,.55)',
  /** Scenariusz z nadpłatą. Zieleń = oszczędność. */
  over: '#047857',
  overFill: 'rgba(4,120,87,.10)',
  overBar: 'rgba(4,120,87,.45)',
  /** Kapitał — neutralny, żeby nie konkurował z odsetkami. */
  capitalBase: 'rgba(100,116,139,.28)',
  capitalOver: 'rgba(37,99,235,.55)',
  /** Elementy opisowe. */
  legend: '#475569',
  ticks: '#64748b',
  grid: 'rgba(15,23,42,.07)',
} as const;
