export default function Hero3D() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 600 600"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 100vw)',
          height: 'min(600px, 100vh)',
          opacity: 0.55,
        }}
      >
        {/* Outer torus ring – slow spin */}
        <g style={{ transformOrigin: '300px 300px', animation: 'hero3d-spin-slow 18s linear infinite' }}>
          <ellipse cx="300" cy="300" rx="230" ry="75" fill="none" stroke="#a78bfa" strokeWidth="1.2" opacity="0.35" />
          <ellipse cx="300" cy="300" rx="230" ry="75" fill="none" stroke="#a78bfa" strokeWidth="0.6" opacity="0.15"
            transform="rotate(60 300 300)" />
        </g>
        {/* Inner torus ring – opposite spin */}
        <g style={{ transformOrigin: '300px 300px', animation: 'hero3d-spin-rev 12s linear infinite' }}>
          <ellipse cx="300" cy="300" rx="175" ry="55" fill="none" stroke="#06b6d4" strokeWidth="0.8" opacity="0.22" />
          <ellipse cx="300" cy="300" rx="175" ry="55" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.12"
            transform="rotate(90 300 300)" />
        </g>
        {/* Wireframe icosahedron approximation – floating */}
        <g style={{ transformOrigin: '300px 300px', animation: 'hero3d-float 5s ease-in-out infinite' }}>
          {/* top cap */}
          <line x1="300" y1="190" x2="245" y2="268" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.6" />
          <line x1="300" y1="190" x2="300" y2="258" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.6" />
          <line x1="300" y1="190" x2="355" y2="268" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.6" />
          {/* middle band */}
          <line x1="245" y1="268" x2="300" y2="258" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.5" />
          <line x1="300" y1="258" x2="355" y2="268" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.5" />
          <line x1="245" y1="268" x2="230" y2="330" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.5" />
          <line x1="245" y1="268" x2="300" y2="340" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.45" />
          <line x1="300" y1="258" x2="300" y2="340" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.45" />
          <line x1="355" y1="268" x2="300" y2="340" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.45" />
          <line x1="355" y1="268" x2="370" y2="330" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.5" />
          <line x1="230" y1="330" x2="300" y2="340" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.4" />
          <line x1="370" y1="330" x2="300" y2="340" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.4" />
          <line x1="230" y1="330" x2="370" y2="330" stroke="#4f8ef7" strokeWidth="0.6" opacity="0.3" />
          {/* bottom cap */}
          <line x1="300" y1="340" x2="300" y2="415" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.5" />
          <line x1="230" y1="330" x2="300" y2="415" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.4" />
          <line x1="370" y1="330" x2="300" y2="415" stroke="#4f8ef7" strokeWidth="0.9" opacity="0.4" />
        </g>
      </svg>
      <style>{`
        @keyframes hero3d-spin-slow { to { transform: rotate(360deg); } }
        @keyframes hero3d-spin-rev  { to { transform: rotate(-360deg); } }
        @keyframes hero3d-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="hero3d"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
