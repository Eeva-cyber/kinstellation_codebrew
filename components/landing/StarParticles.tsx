'use client';

import { useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  delay: number;
  dur: number;
}

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

export function StarParticles({ count = 300 }: { count?: number }) {
  const stars: Star[] = useMemo(() => {
    const rng = seeded(77);
    return Array.from({ length: count }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      r: rng() * 1.4 + 0.3,
      opacity: rng() * 0.6 + 0.1,
      delay: rng() * 8,
      dur: rng() * 4 + 3,
    }));
  }, [count]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.r}
          fill="white"
          opacity={s.opacity}
          style={{
            animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </svg>
  );
}
