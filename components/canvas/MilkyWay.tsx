'use client';

import { useMemo } from 'react';

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface MilkyWayProps {
  width: number;
  height: number;
  onClick: () => void;
}

export function MilkyWay({ width, height, onClick }: MilkyWayProps) {
  const particles = useMemo(() => {
    if (width === 0 || height === 0) return [];
    const rng = seededRandom(137);
    const count = 300;
    const result: { cx: number; cy: number; r: number; opacity: number }[] = [];

    for (let i = 0; i < count; i++) {
      // Band runs from top-left to bottom-right diagonally
      const t = rng();
      const bandX = t * width;
      const bandY = t * height;
      // Spread perpendicular to the band
      const spread = (rng() - 0.5) * Math.min(width, height) * 0.18;
      const angle = Math.PI / 4; // 45 degrees
      const cx = bandX + spread * Math.cos(angle + Math.PI / 2);
      const cy = bandY + spread * Math.sin(angle + Math.PI / 2);
      // Gaussian-like density toward center of band
      const distFromCenter = Math.abs(spread) / (Math.min(width, height) * 0.09);
      const density = Math.exp(-distFromCenter * distFromCenter);

      result.push({
        cx,
        cy,
        r: rng() * 1.4 + 0.2,
        opacity: density * (rng() * 0.12 + 0.02),
      });
    }
    return result;
  }, [width, height]);

  if (width === 0) return null;

  return (
    <g
      className="cursor-pointer animate-milkyway"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Milky Way — River of Stories. Click to view recent stories."
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Main glow band */}
      <line
        x1={0}
        y1={0}
        x2={width}
        y2={height}
        stroke="url(#milkywayGradient)"
        strokeWidth={Math.min(width, height) * 0.15}
        strokeLinecap="round"
        opacity={0.04}
      />
      {/* Particles */}
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="#c8d0f0"
          opacity={p.opacity}
        />
      ))}
      <defs>
        <linearGradient id="milkywayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a0b0d0" stopOpacity={0} />
          <stop offset="30%" stopColor="#c8d0f0" stopOpacity={1} />
          <stop offset="70%" stopColor="#c8d0f0" stopOpacity={1} />
          <stop offset="100%" stopColor="#a0b0d0" stopOpacity={0} />
        </linearGradient>
      </defs>
    </g>
  );
}
