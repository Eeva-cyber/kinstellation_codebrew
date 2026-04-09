'use client';

import { useMemo } from 'react';

// Deterministic pseudo-random from seed
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function StarFieldBg() {
  const stars = useMemo(() => {
    const rng = seededRandom(42);
    return Array.from({ length: 200 }, (_, i) => ({
      id: i,
      cx: rng() * 100,
      cy: rng() * 100,
      r: rng() * 1.2 + 0.3,
      opacity: rng() * 0.4 + 0.1,
      delay: rng() * 6,
    }));
  }, []);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      {stars.map((s) => (
        <circle
          key={s.id}
          cx={`${s.cx}%`}
          cy={`${s.cy}%`}
          r={s.r}
          fill="white"
          opacity={s.opacity}
          className="animate-twinkle"
          style={{ animationDelay: `${s.delay}s` }}
        />
      ))}
    </svg>
  );
}
