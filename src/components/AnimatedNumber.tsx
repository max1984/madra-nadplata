import { useCountUp } from '../hooks/useCountUp';

/**
 * Licznik animujący przejście do nowej wartości kluczowego wyniku
 * (zaoszczędzone odsetki, netto, maksymalna kwota kredytu) zamiast
 * statycznego skoku liczby po przeliczeniu. Osobny komponent (nie wywołanie
 * useCountUp wprost w funkcjach pomocniczych typu renderStats) celowo —
 * niektóre miejsca użycia renderują wynik przez zwykłe funkcje wywoływane
 * warunkowo (nie komponenty), gdzie bezpośrednie wywołanie hooka złamałoby
 * Rules of Hooks. Jako element JSX <AnimatedNumber> jest bezpieczny
 * wszędzie, bo hook uruchamia się dopiero wtedy, gdy React faktycznie
 * renderuje TĘ instancję komponentu.
 *
 * Wartość pośrednia (mid-animacja) nigdy nie trafia do aria-live/ogłoszeń —
 * wywołujący, jeśli chce ogłosić wynik czytnikowi ekranu, robi to osobno
 * z docelowej `value`, nie z tego, co renderuje ten komponent.
 */
export default function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const animated = useCountUp(value);
  return <>{format(animated)}</>;
}
