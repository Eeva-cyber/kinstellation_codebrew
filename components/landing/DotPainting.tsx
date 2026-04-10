'use client';

import { useMemo } from 'react';

interface Dot {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
}

interface UShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

const CX = 500;
const CY = 500;

const OCHRE   = '#D4863C';
const GOLD    = '#D4A454';
const TERRA   = '#C25E35';
const CREAM   = '#F5E6C8';
const DEEP    = '#8B3A1A';
const PURPLE  = '#6B2FD4';
const TEAL    = '#4ECDC4';

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

function ringDots(cx: number, cy: number, r: number, spacing: number, color: string, opacity = 1, rDot = 4): Dot[] {
  const count = Math.max(6, Math.round((2 * Math.PI * r) / spacing));
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return { cx: r4(cx + r * Math.cos(angle)), cy: r4(cy + r * Math.sin(angle)), r: rDot, color, opacity };
  });
}

function pathDots(
  x1: number, y1: number,
  cpx: number, cpy: number,
  x2: number, y2: number,
  steps: number,
  color: string,
  opacity = 0.8,
  rDot = 3
): Dot[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const mt = 1 - t;
    const x = mt * mt * x1 + 2 * mt * t * cpx + t * t * x2;
    const y = mt * mt * y1 + 2 * mt * t * cpy + t * t * y2;
    return { cx: r4(x), cy: r4(y), r: rDot, color, opacity };
  });
}

function clusterDots(cx: number, cy: number, count: number, spread: number, color: string, seed = 1): Dot[] {
  let s = seed * 9301 + 49297;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: count }, () => {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * spread;
    return {
      cx: r4(cx + Math.cos(angle) * dist),
      cy: r4(cy + Math.sin(angle) * dist),
      r: r4(rng() * 3 + 2),
      color,
      opacity: r4(rng() * 0.5 + 0.4),
    };
  });
}

function uShapes(positions: [number, number, number, string][]): UShape[] {
  return positions.map(([x, y, rot, color]) => ({
    x, y, rotation: rot, size: 28, color,
  }));
}

export function DotPainting({ opacity = 1 }: { opacity?: number }) {
  const { dots, ushapes, starPoints } = useMemo(() => {
    const d: Dot[] = [];

    // ─── Central concentric rings (watering hole / meeting place) ───
    d.push(...ringDots(CX, CY,  35, 14, GOLD,   1.0, 5));
    d.push(...ringDots(CX, CY,  65, 14, OCHRE,  0.9, 4.5));
    d.push(...ringDots(CX, CY,  95, 14, TERRA,  0.85, 4));
    d.push(...ringDots(CX, CY, 125, 14, OCHRE,  0.8, 3.5));
    d.push(...ringDots(CX, CY, 160, 14, DEEP,   0.7, 3));
    d.push(...ringDots(CX, CY, 195, 14, TERRA,  0.5, 2.5));

    // ─── 4 Songline paths radiating from center ───
    // Top-right (Noongar - amber)
    d.push(...pathDots(CX, CY - 200, CX + 120, CY - 340, 870, 100, 28, OCHRE, 0.75, 3.5));
    // Bottom-right (Yolngu - teal)
    d.push(...pathDots(CX, CY + 200, CX + 200, CY + 320, 900, 880, 26, TEAL,  0.65, 3));
    // Bottom-left (D'harawal - gold)
    d.push(...pathDots(CX, CY + 200, CX - 200, CY + 300, 100, 880, 26, GOLD,  0.65, 3));
    // Top-left (Warlpiri - terra)
    d.push(...pathDots(CX, CY - 200, CX - 140, CY - 350, 130, 100, 28, TERRA, 0.75, 3.5));

    // ─── Destination clusters at path ends ───
    d.push(...clusterDots(870,  80, 18, 45, OCHRE,  1));
    d.push(...clusterDots(900, 880, 18, 45, TEAL,   2));
    d.push(...clusterDots(100, 880, 18, 45, GOLD,   3));
    d.push(...clusterDots(130,  80, 18, 45, TERRA,  4));

    // ─── Secondary rings at each cluster ───
    d.push(...ringDots(870, 80,  25, 12, OCHRE, 0.7, 3));
    d.push(...ringDots(870, 80,  45, 12, OCHRE, 0.5, 2.5));
    d.push(...ringDots(900, 880, 25, 12, TEAL,  0.7, 3));
    d.push(...ringDots(900, 880, 45, 12, TEAL,  0.5, 2.5));
    d.push(...ringDots(100, 880, 25, 12, GOLD,  0.7, 3));
    d.push(...ringDots(100, 880, 45, 12, GOLD,  0.5, 2.5));
    d.push(...ringDots(130, 80,  25, 12, TERRA, 0.7, 3));
    d.push(...ringDots(130, 80,  45, 12, TERRA, 0.5, 2.5));

    // ─── Mid-path scatter dots ───
    d.push(...clusterDots(680, 230, 12, 35, CREAM, 5));
    d.push(...clusterDots(310, 250, 12, 35, CREAM, 6));
    d.push(...clusterDots(700, 700, 12, 35, CREAM, 7));
    d.push(...clusterDots(290, 720, 12, 35, CREAM, 8));

    // ─── Outer border ring ───
    d.push(...ringDots(CX, CY, 460, 18, CREAM, 0.25, 2));
    d.push(...ringDots(CX, CY, 480, 22, OCHRE, 0.2,  2));

    // ─── Cosmic scatter (purple/teal overlay) ───
    d.push(...clusterDots(500, 500, 40, 480, PURPLE, 9));

    const us = uShapes([
      // 8 U-shapes around the inner ring
      [CX,       CY - 220, 0,   CREAM],
      [CX + 155, CY - 155, 45,  CREAM],
      [CX + 220, CY,       90,  OCHRE],
      [CX + 155, CY + 155, 135, CREAM],
      [CX,       CY + 220, 180, OCHRE],
      [CX - 155, CY + 155, 225, CREAM],
      [CX - 220, CY,       270, OCHRE],
      [CX - 155, CY - 155, 315, CREAM],
    ]);

    // ─── 4-pointed star shapes ───
    const sp = [
      { x: 500, y: 50 }, { x: 950, y: 500 }, { x: 500, y: 950 }, { x: 50, y: 500 },
      { x: 750, y: 200 }, { x: 800, y: 780 }, { x: 220, y: 760 }, { x: 200, y: 230 },
    ];

    return { dots: d, ushapes: us, starPoints: sp };
  }, []);

  return (
    <svg
      viewBox="0 0 1000 1000"
      className="absolute inset-0 w-full h-full"
      style={{ opacity, transition: 'opacity 0.5s ease' }}
      aria-hidden="true"
    >
      {/* Cosmic glow at center */}
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={GOLD}   stopOpacity="0.25" />
          <stop offset="40%"  stopColor={TERRA}  stopOpacity="0.12" />
          <stop offset="70%"  stopColor={PURPLE} stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000"   stopOpacity="0" />
        </radialGradient>
        <radialGradient id="clusterGlowNE" cx="87%" cy="8%"  r="15%">
          <stop offset="0%" stopColor={OCHRE} stopOpacity="0.2" />
          <stop offset="100%" stopColor={OCHRE} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="clusterGlowSE" cx="90%" cy="88%" r="15%">
          <stop offset="0%" stopColor={TEAL}  stopOpacity="0.2" />
          <stop offset="100%" stopColor={TEAL}  stopOpacity="0" />
        </radialGradient>
        <radialGradient id="clusterGlowSW" cx="10%" cy="88%" r="15%">
          <stop offset="0%" stopColor={GOLD}  stopOpacity="0.2" />
          <stop offset="100%" stopColor={GOLD}  stopOpacity="0" />
        </radialGradient>
        <radialGradient id="clusterGlowNW" cx="13%" cy="8%"  r="15%">
          <stop offset="0%" stopColor={TERRA} stopOpacity="0.2" />
          <stop offset="100%" stopColor={TERRA} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow blobs */}
      <rect x="0" y="0" width="1000" height="1000" fill="url(#centerGlow)" />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#clusterGlowNE)" />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#clusterGlowSE)" />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#clusterGlowSW)" />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#clusterGlowNW)" />

      {/* All dots */}
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={d.color}
          opacity={d.opacity}
        />
      ))}

      {/* U-shapes (people) */}
      {ushapes.map((u, i) => (
        <g key={`u-${i}`} transform={`translate(${u.x},${u.y}) rotate(${u.rotation})`}>
          <path
            d={`M ${-u.size / 2} ${u.size * 0.4} Q ${-u.size / 2} ${-u.size * 0.5} 0 ${-u.size * 0.5} Q ${u.size / 2} ${-u.size * 0.5} ${u.size / 2} ${u.size * 0.4}`}
            fill="none"
            stroke={u.color}
            strokeWidth="4"
            opacity="0.7"
          />
          {/* dot legs */}
          <circle cx={-u.size / 2} cy={u.size * 0.5} r="3" fill={u.color} opacity="0.7" />
          <circle cx={u.size / 2}  cy={u.size * 0.5} r="3" fill={u.color} opacity="0.7" />
        </g>
      ))}

      {/* Star / diamond shapes at compass points */}
      {starPoints.map((s, i) => (
        <g key={`star-${i}`} transform={`translate(${s.x},${s.y})`} opacity="0.5">
          <polygon
            points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
            fill={GOLD}
          />
        </g>
      ))}

      {/* Central inner fill circle */}
      <circle cx={CX} cy={CY} r={28} fill={GOLD} opacity="0.15" />
      <circle cx={CX} cy={CY} r={14} fill={GOLD} opacity="0.35" />
      <circle cx={CX} cy={CY} r={5}  fill={CREAM} opacity="0.8" />
    </svg>
  );
}
