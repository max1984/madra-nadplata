import { useEffect, useRef, useState } from 'react';

/**
 * Czysta funkcja interpolacji — wydzielona z hooka, żeby dało się ją
 * przetestować bez montowania komponentu/mockowania requestAnimationFrame.
 * progress01 spoza [0,1] jest clampowany, żeby ewentualny błąd zaokrąglenia
 * w wywołującym (np. (now-start)/duration nieznacznie > 1) nigdy nie
 * przestrzelił końcowej wartości.
 */
export function countUpValue(from: number, to: number, progress01: number): number {
  const p = Math.min(1, Math.max(0, progress01));
  return from + (to - from) * p;
}

const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animuje liczbę od poprzedniej do nowej wartości przy każdej zmianie `value`
 * — używane przy kluczowych wynikach (zaoszczędzone odsetki, netto, max.
 * kwota kredytu), żeby przeliczenie miało "wagę" zamiast statycznego skoku.
 * Respektuje prefers-reduced-motion (skacze od razu do wartości końcowej —
 * MotionConfig reducedMotion="user" w App.tsx obsługuje to dla framer-motion,
 * ale ten hook nie jest framer-motion, więc pilnuje tego sam) i NIE ogłasza
 * pośrednich klatek przez aria-live (wywołujący ogłasza końcową wartość).
 */
export function useCountUp(value: number, durationMs = 600): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || !Number.isFinite(value)) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = EASE_OUT_CUBIC(Math.min(1, (now - start) / durationMs));
      setDisplay(countUpValue(from, value, progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return display;
}
