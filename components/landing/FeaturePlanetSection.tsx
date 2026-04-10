'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

export interface PlanetFeature {
  id: string;
  name: string;
  subheading: string;
  description: string;
  color: string;
  glowColor: string;
  darkColor: string;
  hasRings?: boolean;
  ringTilt?: string;
  figurePlaceholder: string;
  figureRole: string;
  flip?: boolean;
}

const FIGURE_PHOTOS: Record<string, string> = {
  noongar:  '/man.png',
  yolngu:   '/woman.png',
  dharawal: '/girl.png',
  warlpiri: '/guy.avif',
};

// ─── colour helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── atmospheric band configs ─────────────────────────────────────────────────
// y  = band centre as fraction of planet diameter (0 = top, 1 = bottom)
// h  = band height as fraction of planet diameter
// col, a = colour + base alpha
// amp/freq = sinusoidal edge turbulence (px amplitude, spatial frequency)
// sp  = differential rotation speed multiplier

interface Band { y:number; h:number; col:string; a:number; amp:number; freq:number; sp:number }

const BANDS: Record<string, Band[]> = {
  // ── Noongar: 10-band heavy rendering — near-black polar → dark chocolate → muted
  //    amber-tan belts → soft beige-yellow zones → warm tan → dark rust → deep brown ──
  noongar: [
    { y:0.09, h:0.09, col:'#1A0800', a:0.97, amp:2,  freq:0.020, sp:0.89 }, // near-black polar cap
    { y:0.18, h:0.10, col:'#5A2C08', a:0.93, amp:4,  freq:0.024, sp:1.09 }, // dark brown belt
    { y:0.27, h:0.05, col:'#C87C10', a:0.90, amp:5,  freq:0.031, sp:0.93 }, // thin burnt-orange divider
    { y:0.32, h:0.15, col:'#FFD84A', a:0.96, amp:8,  freq:0.018, sp:1.11 }, // MAIN — saturated golden yellow
    { y:0.46, h:0.06, col:'#FFF0A0', a:0.72, amp:4,  freq:0.035, sp:0.90 }, // bright highlight zone
    { y:0.51, h:0.14, col:'#FADE77', a:0.92, amp:9,  freq:0.020, sp:1.07 }, // second wide belt
    { y:0.64, h:0.05, col:'#E8A020', a:0.80, amp:3,  freq:0.033, sp:0.93 }, // vivid amber accent
    { y:0.69, h:0.11, col:'#6A2C08', a:0.91, amp:6,  freq:0.022, sp:1.10 }, // dark brown-rust belt
    { y:0.79, h:0.09, col:'#2A0A00', a:0.95, amp:3,  freq:0.020, sp:0.91 }, // near-black lower polar
    { y:0.87, h:0.06, col:'#FADE77', a:0.55, amp:2,  freq:0.027, sp:1.03 }, // faint #FADE77 glow at base
  ],
  // ── Yolngu: void navy → teal → gold accent → bright aqua → dark → cream highlight ──
  yolngu: [
    { y:0.13, h:0.12, col:'#001520', a:0.95, amp:3,  freq:0.018, sp:0.90 },
    { y:0.24, h:0.14, col:'#0D6858', a:0.88, amp:6,  freq:0.022, sp:1.11 },
    { y:0.37, h:0.07, col:'#C8922A', a:0.72, amp:4,  freq:0.030, sp:1.16 }, // GOLD accent stripe
    { y:0.43, h:0.17, col:'#3ABFB8', a:0.78, amp:10, freq:0.016, sp:0.95 },
    { y:0.58, h:0.13, col:'#084840', a:0.92, amp:6,  freq:0.021, sp:1.07 },
    { y:0.70, h:0.07, col:'#D8FFF5', a:0.42, amp:3,  freq:0.028, sp:0.93 }, // cream-white highlight
    { y:0.77, h:0.11, col:'#1A7268', a:0.84, amp:4,  freq:0.023, sp:1.03 },
  ],
  // ── D'harawal: void purple → deep violet → gold accent → main purple → indigo → lavender ──
  dharawal: [
    { y:0.13, h:0.12, col:'#100025', a:0.96, amp:3,  freq:0.018, sp:0.89 },
    { y:0.24, h:0.14, col:'#481898', a:0.88, amp:7,  freq:0.022, sp:1.12 },
    { y:0.37, h:0.07, col:'#C8922A', a:0.68, amp:4,  freq:0.030, sp:1.17 }, // GOLD accent stripe
    { y:0.43, h:0.17, col:'#8848C8', a:0.78, amp:11, freq:0.016, sp:0.94 },
    { y:0.58, h:0.13, col:'#2C0870', a:0.92, amp:7,  freq:0.021, sp:1.09 },
    { y:0.70, h:0.07, col:'#ECC8FF', a:0.42, amp:3,  freq:0.028, sp:0.92 }, // lavender highlight
    { y:0.77, h:0.11, col:'#5C28A8', a:0.82, amp:4,  freq:0.023, sp:1.02 },
  ],
  // ── Warlpiri: deep brown → rich brown → gold-yellow accent → red-orange → dark crimson → ochre → orange glow ──
  warlpiri: [
    { y:0.13, h:0.12, col:'#280500', a:0.96, amp:3,  freq:0.018, sp:0.91 },
    { y:0.24, h:0.13, col:'#6E1E08', a:0.88, amp:6,  freq:0.022, sp:1.10 },
    { y:0.36, h:0.07, col:'#C88018', a:0.75, amp:4,  freq:0.030, sp:1.16 }, // GOLD-YELLOW accent stripe
    { y:0.42, h:0.16, col:'#CC4828', a:0.80, amp:10, freq:0.016, sp:0.95 },
    { y:0.56, h:0.07, col:'#FFCC50', a:0.50, amp:3,  freq:0.032, sp:1.18 }, // bright yellow stripe
    { y:0.62, h:0.13, col:'#902018', a:0.90, amp:7,  freq:0.021, sp:1.06 },
    { y:0.74, h:0.10, col:'#5A1008', a:0.92, amp:4,  freq:0.019, sp:0.92 },
    { y:0.83, h:0.08, col:'#E07030', a:0.55, amp:3,  freq:0.025, sp:1.03 }, // orange glow
  ],
};

// ─── canvas planet hook ───────────────────────────────────────────────────────

function usePlanetCanvas(planet: PlanetFeature, visible: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;

    const SIZE = 380;
    const dpr  = Math.min(window.devicePixelRatio ?? 1, 2);
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const cx = SIZE / 2;          // 190
    const cy = SIZE / 2;          // 190
    const PR = 120;               // planet radius (px)

    // Ring geometry — a tilted circle viewed as an ellipse
    const RX  = 158;              // half-major-axis  (horizontal)
    const RY  = 28;               // half-minor-axis  (very flat, elegant)
    const RCY = cy - 6;           // ring centre — slightly above planet centre
    const N   = 46;               // number of dots in ring
    const DR  = 3.0;              // ring dot radius (px)

    let scroll = 0;

    // ── helpers ──
    const dot = (x: number, y: number, r: number, col: string, a: number) => {
      const [rv, gv, bv] = hexToRgb(col);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rv},${gv},${bv},${a})`;
      ctx.fill();
    };

    // 3-D sphere dot for the ring
    const ringDot = (x: number, y: number, front: boolean) => {
      const alpha = front ? 0.90 : 0.48;
      const size  = front ? DR  : DR * 0.80;
      const grd = ctx.createRadialGradient(
        x - size * 0.30, y - size * 0.30, 0,
        x,               y,               size,
      );
      grd.addColorStop(0.00, `rgba(255,255,255,${alpha * 0.92})`);
      grd.addColorStop(0.28, rgba(planet.glowColor, alpha * 0.82));
      grd.addColorStop(0.65, rgba(planet.color,     alpha * 0.55));
      grd.addColorStop(1.00, rgba(planet.darkColor, 0));
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    };

    // One pass through the ring dots — either front or back half
    const drawRingHalf = (front: boolean) => {
      for (let i = 0; i < N; i++) {
        const theta = (i / N) * Math.PI * 2;
        const x = cx + RX * Math.cos(theta);
        const y = RCY + RY * Math.sin(theta);
        const isFront = Math.sin(theta) > 0; // bottom arc = front (near viewer)
        if (isFront !== front) continue;
        // back-half dots occluded by the planet sphere are skipped
        if (!front) {
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy < PR * PR * 0.80) continue;
        }
        ringDot(x, y, front);
      }
    };

    // ── gold ring (Warlpiri) — drawn in two passes: back then front ──
    // A continuous stroke ring in gold, perspective-shaded so front is bright, back is dim.
    const drawGoldRingHalf = (front: boolean) => {
      const steps = 220;
      ctx.lineCap = 'round';
      for (let i = 0; i < steps; i++) {
        const t0 = (i       / steps) * Math.PI * 2;
        const t1 = ((i + 1) / steps) * Math.PI * 2;
        const isFront = Math.sin((t0 + t1) / 2) > 0;
        if (isFront !== front) continue;

        const x0 = cx  + RX * Math.cos(t0), y0 = RCY + RY * Math.sin(t0);
        const x1 = cx  + RX * Math.cos(t1), y1 = RCY + RY * Math.sin(t1);

        // occlude back segments that sit behind the planet sphere
        if (!front) {
          const mx = (x0 + x1) / 2 - cx, my = (y0 + y1) / 2 - cy;
          if (mx * mx + my * my < PR * PR * 0.85) continue;
        }

        const alpha = front ? 0.90 : 0.22;

        // wide soft glow pass
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.strokeStyle = `rgba(255,190,30,${alpha * 0.30})`;
        ctx.lineWidth = 5.5;
        ctx.stroke();

        // crisp bright core pass
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.strokeStyle = `rgba(255,215,80,${alpha})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    };

    // ── atmospheric bands ──
    const drawBands = () => {
      const bands = BANDS[planet.id] ?? BANDS['noongar'];
      const [dr, dg, db] = hexToRgb(planet.darkColor);
      ctx.fillStyle = `rgb(${dr},${dg},${db})`;
      ctx.fillRect(cx - PR, cy - PR, PR * 2, PR * 2);

      bands.forEach(b => {
        const sc    = scroll * b.sp;
        const centY = cy - PR + b.y * PR * 2;
        const hh    = (b.h * PR * 2) / 2;
        const [r, g, bv] = hexToRgb(b.col);
        ctx.fillStyle = `rgba(${r},${g},${bv},${b.a})`;
        ctx.beginPath();
        for (let x = 0; x <= PR * 2; x += 2) {
          const yt = centY - hh + Math.sin((x + sc) * b.freq) * b.amp;
          if (x === 0) ctx.moveTo(cx - PR, yt);
          else         ctx.lineTo(cx - PR + x, yt);
        }
        for (let x = PR * 2; x >= 0; x -= 2) {
          const yb = centY + hh + Math.sin((x + sc * 0.80) * b.freq * 1.18 + 1.9) * b.amp;
          ctx.lineTo(cx - PR + x, yb);
        }
        ctx.closePath();
        ctx.fill();
      });
    };

    // ── Aboriginal surface patterns ──────────────────────────────────────────
    // All patterns tile horizontally; `scroll` drives the x-offset.

    // Helper: canonical surface X → canvas X (with wrapping)
    const surfX = (rawX: number, speed = 1.0) => {
      const w = PR * 2;
      return cx - PR + ((rawX - scroll * speed % w + w * 4) % w);
    };

    // Noongar — watering-hole concentric rings + wavy songlines
    const drawNoongar = () => {
      const C = '#FBF5D0';
      const spacing = PR * 1.55;
      for (let i = -1; i <= 3; i++) {
        const px = surfX(i * spacing, 0.38);
        const py = cy + Math.sin(px * 0.007) * 14;
        if (px < cx - PR - 65 || px > cx + PR + 65) continue;
        [12, 23, 35, 47].forEach((r, ri) => {
          const n = Math.max(8, Math.round((2 * Math.PI * r) / 9));
          for (let j = 0; j < n; j++) {
            const a = (j / n) * Math.PI * 2;
            dot(px + r * Math.cos(a), py + r * Math.sin(a), 2.2 - ri * 0.35, C, 0.88 - ri * 0.16);
          }
        });
        dot(px, py, 4.2, C, 0.96);
      }
      // songline wave
      for (let x = cx - PR; x <= cx + PR; x += 6) {
        const sx = ((x - cx + PR + scroll * 0.19) % (PR * 2) + PR * 2) % (PR * 2);
        dot(x, cy + Math.sin(sx * 0.036) * 22 + 28, 1.4, C, 0.40);
      }
    };

    // Yolngu — diamond crosshatch (bark painting) + ring clusters
    const drawYolngu = () => {
      const C = '#C8FFF8';
      const cell = 42;
      const sc   = scroll * 0.38;
      ctx.strokeStyle = rgba(C, 0.20);
      ctx.lineWidth   = 0.85;
      for (let x = -cell * 2; x <= PR * 2 + cell * 2; x += cell) {
        const sx = cx - PR + ((x - sc % cell + cell * 4) % (PR * 2 + cell * 2));
        ctx.beginPath(); ctx.moveTo(sx, cy - PR); ctx.lineTo(sx - cell * 0.9, cy + PR); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx, cy - PR); ctx.lineTo(sx + cell * 0.9, cy + PR); ctx.stroke();
      }
      // dot clusters at diamond vertices
      for (let i = -1; i <= 4; i++) {
        for (let j = 0; j < 3; j++) {
          const px = surfX(i * cell * 2, 0.38);
          const py = cy - PR * 0.62 + j * cell * 1.08;
          if (px < cx - PR - 20 || px > cx + PR + 20) continue;
          [8, 16].forEach((r, ri) => {
            const n = Math.round((2 * Math.PI * r) / 8);
            for (let k = 0; k < n; k++) {
              dot(px + r * Math.cos((k / n) * Math.PI * 2), py + r * Math.sin((k / n) * Math.PI * 2), 1.9 - ri * 0.35, C, 0.74 - ri * 0.20);
            }
          });
          dot(px, py, 3, C, 0.88);
        }
      }
    };

    // D'harawal — twin spiral arms radiating from centres
    const drawDharawal = () => {
      const C = '#EED0FF';
      const spacing = PR * 1.6;
      for (let i = -1; i <= 3; i++) {
        const px = surfX(i * spacing, 0.35);
        const py = cy;
        if (px < cx - PR - 80 || px > cx + PR + 80) continue;
        for (let arm = 0; arm < 2; arm++) {
          for (let s = 0; s < 68; s++) {
            const t     = s / 68;
            const angle = arm * Math.PI + t * Math.PI * 4;
            const r     = 5 + t * 54;
            dot(px + r * Math.cos(angle), py + r * Math.sin(angle), 2.3 - t * 1.1, C, 0.82 - t * 0.50);
          }
        }
        dot(px, py, 4.5, C, 0.96);
      }
      // scattered field dots
      for (let x = cx - PR; x <= cx + PR; x += 18) {
        for (let y = cy - PR; y <= cy + PR; y += 22) {
          const sx = ((x - cx + PR + scroll * 0.18) % (PR * 2) + PR * 2) % (PR * 2);
          dot(x, y + Math.sin(sx * 0.05 + y * 0.04) * 6, 0.9, C, 0.18);
        }
      }
    };

    // Warlpiri — dot-row bands + concentric emblems
    const drawWarlpiri = () => {
      const C = '#FFE0B8';
      [0.30, 0.50, 0.70].forEach(yFrac => {
        const py = cy - PR + yFrac * PR * 2;
        for (let x = cx - PR; x <= cx + PR; x += 9) {
          const sx = ((x - cx + PR - scroll * 0.40) % (PR * 2) + PR * 2) % (PR * 2);
          dot(x, py + Math.sin(sx * 0.042) * 5, 1.7, C, 0.48);
        }
      });
      const spacing = PR * 1.45;
      for (let i = -1; i <= 3; i++) {
        const px = surfX(i * spacing, 0.40);
        const py = cy + Math.sin(i * 1.6) * 20;
        if (px < cx - PR - 60 || px > cx + PR + 60) continue;
        [10, 21, 32].forEach((r, ri) => {
          const n = Math.round((2 * Math.PI * r) / 9);
          for (let k = 0; k < n; k++) {
            dot(px + r * Math.cos((k / n) * Math.PI * 2), py + r * Math.sin((k / n) * Math.PI * 2), 1.9 - ri * 0.28, C, 0.84 - ri * 0.20);
          }
        });
        dot(px, py, 3.5, C, 0.93);
      }
    };

    const PATTERNS: Record<string, () => void> = {
      noongar: drawNoongar, yolngu: drawYolngu, dharawal: drawDharawal, warlpiri: drawWarlpiri,
    };

    // ── 3-D sphere shading (drawn inside clip) ──
    const drawShading = () => {
      // Terminator — dark right side, lit left
      const term = ctx.createLinearGradient(cx - PR, 0, cx + PR, 0);
      term.addColorStop(0.00, 'rgba(0,0,0,0)');
      term.addColorStop(0.44, 'rgba(0,0,0,0)');
      term.addColorStop(0.64, 'rgba(0,0,0,0.18)');
      term.addColorStop(0.80, 'rgba(0,0,0,0.55)');
      term.addColorStop(1.00, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = term;
      ctx.fillRect(cx - PR, cy - PR, PR * 2, PR * 2);

      // Limb darkening — edges of sphere
      const limb = ctx.createRadialGradient(cx - PR * 0.16, cy - PR * 0.10, PR * 0.40, cx, cy, PR);
      limb.addColorStop(0.00, 'rgba(0,0,0,0)');
      limb.addColorStop(0.74, 'rgba(0,0,0,0.06)');
      limb.addColorStop(0.88, 'rgba(0,0,0,0.32)');
      limb.addColorStop(1.00, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = limb;
      ctx.beginPath(); ctx.arc(cx, cy, PR, 0, Math.PI * 2); ctx.fill();

      // Polar darkening
      const [dr, dg, db] = hexToRgb(planet.darkColor);
      const tp = ctx.createLinearGradient(0, cy - PR, 0, cy - PR * 0.70);
      tp.addColorStop(0, `rgba(${dr >> 1},${dg >> 1},${db >> 1},0.90)`);
      tp.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = tp;
      ctx.fillRect(cx - PR, cy - PR, PR * 2, PR * 0.30);

      const bp = ctx.createLinearGradient(0, cy + PR * 0.70, 0, cy + PR);
      bp.addColorStop(0, 'rgba(0,0,0,0)');
      bp.addColorStop(1, `rgba(${dr >> 1},${dg >> 1},${db >> 1},0.90)`);
      ctx.fillStyle = bp;
      ctx.fillRect(cx - PR, cy + PR * 0.70, PR * 2, PR * 0.30);

      // Specular highlight — top-left bright spot
      const spec = ctx.createRadialGradient(cx - PR * 0.30, cy - PR * 0.28, 0, cx - PR * 0.30, cy - PR * 0.28, PR * 0.28);
      spec.addColorStop(0.00, 'rgba(255,255,255,0.22)');
      spec.addColorStop(0.40, 'rgba(255,255,255,0.08)');
      spec.addColorStop(1.00, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.fillRect(cx - PR, cy - PR, PR * 2, PR * 2);
    };

    // ── main animation loop ──────────────────────────────────────────────────
    const frame = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // 1 — diffuse outer glow
      const glow = ctx.createRadialGradient(cx, cy, PR * 0.82, cx, cy, PR * 1.62);
      glow.addColorStop(0.00, rgba(planet.glowColor, 0));
      glow.addColorStop(0.45, rgba(planet.glowColor, 0.09));
      glow.addColorStop(1.00, rgba(planet.glowColor, 0));
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, PR * 1.62, 0, Math.PI * 2); ctx.fill();

      // 2 — back ring dots + back gold ring (behind planet)
      drawRingHalf(false);
      if (planet.id === 'warlpiri') drawGoldRingHalf(false);

      // 3 — planet sphere
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, PR, 0, Math.PI * 2); ctx.clip();
      drawBands();
      (PATTERNS[planet.id] ?? drawNoongar)();
      drawShading();
      ctx.restore();

      // 4 — atmosphere rim glow (outside clip so it sits on planet edge)
      const rim = ctx.createRadialGradient(cx, cy, PR - 4, cx, cy, PR + 22);
      rim.addColorStop(0.00, rgba(planet.glowColor, 0.65));
      rim.addColorStop(0.40, rgba(planet.glowColor, 0.28));
      rim.addColorStop(1.00, rgba(planet.glowColor, 0));
      ctx.beginPath(); ctx.arc(cx, cy, PR + 22, 0, Math.PI * 2);
      ctx.fillStyle = rim; ctx.fill();

      // 5 — front ring dots, then gold ring on top (Warlpiri)
      drawRingHalf(true);
      if (planet.id === 'warlpiri') drawGoldRingHalf(true);

      scroll += 0.28; // slow, majestic
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [planet, visible]);

  return canvasRef;
}

// ─── PlanetOrb ────────────────────────────────────────────────────────────────

function PlanetOrb({ planet, visible }: { planet: PlanetFeature; visible: boolean }) {
  const canvasRef = usePlanetCanvas(planet, visible);

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{
        width: 380, height: 380,
        animation: visible ? 'planetFloatOnly 7s ease-in-out infinite' : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: 380, height: 380,
          opacity:   visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.52)',
          transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
    </div>
  );
}

// ─── Figure placeholder ───────────────────────────────────────────────────────

function FigurePlaceholder({ planet, visible }: { planet: PlanetFeature; visible: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-4 transition-all duration-1000"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: '300ms',
      }}
    >
      {/* Outer spinning dot ring */}
      <div className="relative" style={{ width: 136, height: 136 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 136 136"
          style={{ animation: 'spin 18s linear infinite' }}>
          {Array.from({ length: 32 }, (_, i) => {
            const angle = (i / 32) * Math.PI * 2;
            return (
              <circle key={i}
                cx={Math.round((68 + Math.cos(angle) * 64) * 1e4) / 1e4}
                cy={Math.round((68 + Math.sin(angle) * 64) * 1e4) / 1e4}
                r={i % 4 === 0 ? 2.5 : 1.5}
                fill={planet.color}
                opacity={i % 4 === 0 ? 0.85 : 0.30}
              />
            );
          })}
        </svg>

        {/* Photo circle */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            width: 112, height: 112,
            top: 12, left: 12,
            border: `2px solid ${planet.color}70`,
            boxShadow: `0 0 24px ${planet.color}40, 0 0 6px ${planet.color}60`,
          }}
        >
          <Image
            src={FIGURE_PHOTOS[planet.id] ?? '/man.png'}
            alt={planet.figureRole}
            fill
            className="object-cover object-top"
          />
          {/* Subtle colour tint overlay to blend with planet theme */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 60% 100%, ${planet.color}22 0%, transparent 65%)`,
            }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs tracking-widest uppercase" style={{ color: `${planet.color}90` }}>{planet.figureRole}</p>
        <p className="text-[11px] text-white/25 mt-0.5 italic">{planet.figurePlaceholder}</p>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function FeaturePlanetSection({ planet }: { planet: PlanetFeature }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const isFlipped = planet.flip;

  return (
    <section
      ref={ref}
      className="relative w-full min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden flex-shrink-0"
    >
      {/* Section ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 80% 60% at ${isFlipped ? '80%' : '20%'} 50%, ${planet.color}0D 0%, transparent 70%)`,
      }} />

      {/* Dot divider */}
      <div className="absolute top-0 left-0 right-0 flex justify-center gap-2 py-4 opacity-20">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="rounded-full"
            style={{ width: 3, height: 3, background: planet.color, opacity: i % 3 === 0 ? 1 : 0.4 }} />
        ))}
      </div>

      <div className={`relative z-10 max-w-5xl w-full flex flex-col ${isFlipped ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-20`}>
        <div className="flex-shrink-0">
          <PlanetOrb planet={planet} visible={visible} />
        </div>

        <div className="flex flex-col gap-8 flex-1">
          <div className="transition-all duration-1000" style={{
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : `translateX(${isFlipped ? '40px' : '-40px'})`,
          }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: planet.color, boxShadow: `0 0 6px ${planet.color}` }} />
              <span className="text-xs tracking-[0.35em] uppercase font-light" style={{ color: planet.color }}>
                {planet.name}
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extralight text-white/90 leading-tight mb-4"
              style={{ textShadow: `0 0 40px ${planet.color}30` }}>
              {planet.subheading}
            </h2>
            <p className="text-white/45 text-base leading-relaxed max-w-lg">{planet.description}</p>
            <div className="flex gap-1.5 mt-6">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="rounded-full" style={{
                  width: i % 3 === 0 ? 6 : 4, height: i % 3 === 0 ? 6 : 4,
                  background: planet.color, opacity: i % 3 === 0 ? 0.7 : 0.3,
                }} />
              ))}
            </div>
          </div>
          <FigurePlaceholder planet={planet} visible={visible} />
        </div>
      </div>
    </section>
  );
}
