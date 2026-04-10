'use client';

import { useMemo } from 'react';

interface Dot {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity: number;
}

const CX = 500;
const CY = 500;

const GOLD  = '#FFD98A';
const OCHRE = '#D4863C';
const AMBER = '#C8871A';
const CREAM = '#F5E6C8';
const TERRA = '#C25E35';
const DIM   = '#8B5A2A';

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/** Dots placed along an Archimedes spiral arm with optional sinusoidal waver */
function spiralDots(
  cx: number, cy: number,
  angleStart: number, angleEnd: number,
  rStart: number, rEnd: number,
  steps: number,
  color: string,
  opacity: number,
  rDot: number,
  waverAmp = 0,
  waverFreq = 5,
): Dot[] {
  return Array.from({ length: steps }, (_, i) => {
    const t       = i / (steps - 1);
    const angle   = angleStart + (angleEnd - angleStart) * t;
    const radius  = rStart + (rEnd - rStart) * t;
    const perp    = angle + Math.PI / 2;
    const waver   = waverAmp * Math.sin(t * Math.PI * waverFreq);
    return {
      cx: r4(cx + radius * Math.cos(angle) + waver * Math.cos(perp)),
      cy: r4(cy + radius * Math.sin(angle) + waver * Math.sin(perp)),
      r: r4(rDot * (0.75 + 0.25 * Math.sin(t * Math.PI))),
      color,
      opacity: r4(opacity * (0.65 + 0.35 * (1 - t * 0.35))),
    };
  });
}

/** Evenly-spaced dots around a circle */
function ringDots(
  cx: number, cy: number,
  r: number, spacing: number,
  color: string, opacity = 1, rDot = 4,
): Dot[] {
  const count = Math.max(6, Math.round((2 * Math.PI * r) / spacing));
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      cx: r4(cx + r * Math.cos(angle)),
      cy: r4(cy + r * Math.sin(angle)),
      r: rDot,
      color,
      opacity,
    };
  });
}

/** Random scatter cloud */
function scatter(
  cx: number, cy: number,
  count: number, spread: number,
  color: string, seed = 1,
): Dot[] {
  let s = seed * 9301 + 49297;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: count }, () => {
    const angle = rng() * Math.PI * 2;
    const dist  = Math.sqrt(rng()) * spread;
    return {
      cx: r4(cx + Math.cos(angle) * dist),
      cy: r4(cy + Math.sin(angle) * dist),
      r:  r4(rng() * 2.2 + 1.2),
      color,
      opacity: r4(rng() * 0.28 + 0.12),
    };
  });
}

/** A "sacred site" — concentric rings of dots */
function sacredSite(
  cx: number, cy: number,
  rings: [number, string, number, number][],  // [radius, color, opacity, rDot]
): Dot[] {
  return rings.flatMap(([r, color, opacity, rDot]) =>
    ringDots(cx, cy, r, r < 40 ? 10 : 13, color, opacity, rDot),
  );
}

export function DotPainting({ opacity = 1 }: { opacity?: number }) {
  const { bgDots, siteDots } = useMemo(() => {
    const bg: Dot[] = [];

    // ── Ambient galaxy haze ──────────────────────────────────────────────────
    bg.push(...scatter(CX, CY, 90, 490, AMBER, 99));
    bg.push(...scatter(CX, CY, 40, 200, GOLD,  77));

    // ── Spiral Arm 1 (lower-left → upper-right, main arm) ───────────────────
    bg.push(...spiralDots(CX, CY, Math.PI * 1.15, Math.PI * 3.1,  45, 390, 100, GOLD,  0.95, 5,   18, 5));
    bg.push(...spiralDots(CX, CY, Math.PI * 1.2,  Math.PI * 2.9,  80, 360,  80, OCHRE, 0.75, 4,   14, 5));
    bg.push(...spiralDots(CX, CY, Math.PI * 1.25, Math.PI * 2.7, 115, 430,  55, TERRA, 0.45, 3,    8, 5));

    // ── Spiral Arm 2 (upper-left → lower-right, counter arm) ────────────────
    bg.push(...spiralDots(CX, CY, Math.PI * 0.15, Math.PI * 2.05,  45, 380, 95, GOLD,  0.9,  4.5, 18, 5));
    bg.push(...spiralDots(CX, CY, Math.PI * 0.2,  Math.PI * 1.85,  78, 350, 75, OCHRE, 0.7,  3.5, 14, 5));
    bg.push(...spiralDots(CX, CY, Math.PI * 0.25, Math.PI * 1.65, 112, 415, 50, TERRA, 0.4,  2.5,  8, 5));

    // ── Outer galaxy border ring ─────────────────────────────────────────────
    bg.push(...ringDots(CX, CY, 445, 21, CREAM, 0.22, 2.5));
    bg.push(...ringDots(CX, CY, 468, 25, OCHRE, 0.16, 2));
    bg.push(...ringDots(CX, CY, 490, 30, DIM,   0.11, 2));

    // ── Sacred sites ─────────────────────────────────────────────────────────
    const site: Dot[] = [
      // Centre — 6 concentric rings, the meeting place
      ...sacredSite(CX, CY, [
        [26,  GOLD,  1.00, 5.5],
        [50,  OCHRE, 0.90, 5.0],
        [76,  TERRA, 0.80, 4.5],
        [104, OCHRE, 0.68, 4.0],
        [134, DIM,   0.50, 3.5],
        [164, TERRA, 0.30, 3.0],
      ]),
      // NE arm — 4 rings
      ...sacredSite(668, 228, [
        [20,  GOLD,  1.00, 5.0],
        [40,  OCHRE, 0.85, 4.5],
        [60,  TERRA, 0.70, 4.0],
        [82,  DIM,   0.50, 3.5],
      ]),
      // SW arm — 4 rings
      ...sacredSite(328, 774, [
        [20,  GOLD,  1.00, 5.0],
        [40,  OCHRE, 0.85, 4.5],
        [60,  TERRA, 0.70, 4.0],
        [82,  DIM,   0.50, 3.5],
      ]),
      // NW arm — 3 rings (smaller satellite)
      ...sacredSite(262, 308, [
        [16,  OCHRE, 0.88, 4.5],
        [33,  TERRA, 0.72, 4.0],
        [51,  DIM,   0.52, 3.5],
      ]),
      // SE arm — 3 rings
      ...sacredSite(744, 682, [
        [16,  OCHRE, 0.88, 4.5],
        [33,  TERRA, 0.72, 4.0],
        [51,  DIM,   0.52, 3.5],
      ]),
    ];

    return { bgDots: bg, siteDots: site };
  }, []);

  return (
    <svg
      viewBox="0 0 1000 1000"
      className="absolute inset-0 w-full h-full"
      style={{
        opacity,
        transition: 'opacity 0.6s ease',
        animation: 'spin 140s linear infinite',
        transformOrigin: '50% 50%',
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Warm galaxy core */}
        <radialGradient id="dpGalaxyCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE090" stopOpacity="0.5"  />
          <stop offset="12%"  stopColor="#D4863C" stopOpacity="0.32" />
          <stop offset="30%"  stopColor="#7B3FD4" stopOpacity="0.16" />
          <stop offset="55%"  stopColor="#2A0A50" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000"    stopOpacity="0"    />
        </radialGradient>

        {/* Purple nebula blobs that bleed through like in the reference */}
        <radialGradient id="dpNebulaA" cx="28%" cy="22%" r="45%">
          <stop offset="0%"   stopColor="#8B3FC8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000"    stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="dpNebulaB" cx="72%" cy="78%" r="42%">
          <stop offset="0%"   stopColor="#C83060" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#000"    stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="dpNebulaC" cx="75%" cy="20%" r="35%">
          <stop offset="0%"   stopColor="#D4863C" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000"    stopOpacity="0"    />
        </radialGradient>

        {/* Site glow halos */}
        <radialGradient id="dpGlowNE" cx="66.8%" cy="22.8%" r="16%">
          <stop offset="0%"   stopColor={GOLD} stopOpacity="0.4"  />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="dpGlowSW" cx="32.8%" cy="77.4%" r="16%">
          <stop offset="0%"   stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Atmospheric galaxy glow layers */}
      <rect x="0" y="0" width="1000" height="1000" fill="url(#dpGalaxyCore)" />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#dpNebulaA)"    />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#dpNebulaB)"    />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#dpNebulaC)"    />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#dpGlowNE)"     />
      <rect x="0" y="0" width="1000" height="1000" fill="url(#dpGlowSW)"     />

      {/* Spiral arm dots */}
      {bgDots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.color} opacity={d.opacity} />
      ))}

      {/* Sacred site rings — drawn on top of arms */}
      {siteDots.map((d, i) => (
        <circle key={`s${i}`} cx={d.cx} cy={d.cy} r={d.r} fill={d.color} opacity={d.opacity} />
      ))}

      {/* Bright cores for each site */}
      {/* Centre */}
      <circle cx={CX}  cy={CY}  r={14} fill={GOLD}  opacity="0.28" />
      <circle cx={CX}  cy={CY}  r={7}  fill={GOLD}  opacity="0.55" />
      <circle cx={CX}  cy={CY}  r={2.5} fill={CREAM} opacity="0.95" />
      {/* NE */}
      <circle cx={668} cy={228} r={8}  fill={GOLD}  opacity="0.35" />
      <circle cx={668} cy={228} r={3}  fill={CREAM} opacity="0.85" />
      {/* SW */}
      <circle cx={328} cy={774} r={8}  fill={GOLD}  opacity="0.35" />
      <circle cx={328} cy={774} r={3}  fill={CREAM} opacity="0.85" />
      {/* NW */}
      <circle cx={262} cy={308} r={6}  fill={GOLD}  opacity="0.3"  />
      <circle cx={262} cy={308} r={2.5} fill={CREAM} opacity="0.75" />
      {/* SE */}
      <circle cx={744} cy={682} r={6}  fill={GOLD}  opacity="0.3"  />
      <circle cx={744} cy={682} r={2.5} fill={CREAM} opacity="0.75" />
    </svg>
  );
}
