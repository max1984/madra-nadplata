export type BrandVariant = 'mortgage' | 'salary' | 'creditworthiness';

/**
 * Jedna spójna rodzina ikon logotypu (ten sam viewBox/stroke/zaokrąglenie)
 * zamiast emoji (💰/💼/🏦) — emoji renderują się inaczej na Windows/macOS/
 * Linux/różnych przeglądarkach, więc trzy aplikacje wyglądały niespójnie
 * między systemami. `currentColor` dziedziczy kolor z .nav-logo-mark/
 * .footer-logo (białe na gradiencie, ciemne na tle stopki).
 */
export default function BrandMark({ variant }: { variant: BrandVariant }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (variant === 'salary') {
    return (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <circle cx="12" cy="12" r="2.3" />
        <path d="M6.5 7v10M17.5 7v10" />
      </svg>
    );
  }

  if (variant === 'creditworthiness') {
    return (
      <svg {...common}>
        <path d="M3 10 12 4l9 6" />
        <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
        <path d="M3 20h18" />
      </svg>
    );
  }

  // 'mortgage' — dom + strzałka w dół (malejące zadłużenie po nadpłacie)
  return (
    <svg {...common}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M12 12v5" />
      <path d="M9.5 14.5 12 17l2.5-2.5" />
    </svg>
  );
}
