'use client';

import { useEffect, useRef } from 'react';

// More color-rich palette than the landing page — deeper purples, warm golds, teal
const STAR_COLORS = [
  'rgba(255,255,255,',       // pure white
  'rgba(255,248,220,',       // warm cream
  'rgba(212,164,84,',        // gold
  'rgba(255,220,120,',       // pale gold
  'rgba(180,210,255,',       // cool blue
  'rgba(140,170,230,',       // blue-purple
  'rgba(200,160,255,',       // lavender
  'rgba(160,220,200,',       // teal-mint
  'rgba(255,160,140,',       // rose-pink
  'rgba(130,200,255,',       // sky blue
];

interface Star {
  x: number; y: number;
  radius: number; opacity: number;
  color: string;
  twinkleSpeed: number; twinkleOffset: number;
  points: number; // 0 = circle, 4 = 4-pointed star
  angle: number; angleSpeed: number;
}

interface Shooting {
  x: number; y: number;
  vx: number; vy: number;
  length: number;
  life: number; maxLife: number;
  color: string;
}

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radius: number, points: number,
  angle: number, color: string, opacity: number,
) {
  if (points === 0) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color + opacity + ')';
    ctx.fill();
    // Cross gleam on brighter stars
    if (radius > 1.4 && opacity > 0.4) {
      const spread = radius * 3.5;
      for (let dir = 0; dir < 2; dir++) {
        const grd = ctx.createLinearGradient(
          dir === 0 ? x - spread : x, dir === 0 ? y : y - spread,
          dir === 0 ? x + spread : x, dir === 0 ? y : y + spread,
        );
        grd.addColorStop(0, color + '0)');
        grd.addColorStop(0.5, color + (opacity * 0.45) + ')');
        grd.addColorStop(1, color + '0)');
        ctx.strokeStyle = grd as unknown as string;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        if (dir === 0) { ctx.moveTo(x - spread, y); ctx.lineTo(x + spread, y); }
        else           { ctx.moveTo(x, y - spread); ctx.lineTo(x, y + spread); }
        ctx.stroke();
      }
    }
    return;
  }

  // 4-pointed star
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const inner = radius * 0.38;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const a = (i * Math.PI) / points;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color + opacity + ')';
  ctx.fill();
  ctx.restore();
}

export function StarFieldBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingRef = useRef<Shooting[]>([]);
  const frameRef = useRef(0);
  const lastShootingRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Non-null aliases for use inside inner functions (TypeScript narrowing doesn't carry through)
    const cvs = canvas;
    const gfx = ctx;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate stars deterministically
    const rng = seeded(42);
    const count = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 3200), 480);
    starsRef.current = Array.from({ length: count }, () => {
      const radius = rng() < 0.08 ? rng() * 1.8 + 1.4   // bright feature star
                   : rng() < 0.35 ? rng() * 0.9 + 0.6   // medium
                   :                rng() * 0.5 + 0.2;   // dim distant
      return {
        x: rng() * window.innerWidth,
        y: rng() * window.innerHeight,
        radius,
        opacity: rng() * 0.45 + (radius > 1.4 ? 0.35 : 0.1),
        color: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
        twinkleSpeed: rng() * 0.018 + 0.004,
        twinkleOffset: rng() * Math.PI * 2,
        points: rng() < 0.12 ? 4 : 0,
        angle: rng() * Math.PI,
        angleSpeed: (rng() - 0.5) * 0.004,
      };
    });

    function spawnShooting(now: number) {
      if (now - lastShootingRef.current < 3500 + Math.random() * 6000) return;
      lastShootingRef.current = now;
      const fromTop = Math.random() < 0.6;
      const colorIdx = Math.floor(Math.random() * STAR_COLORS.length);
      const speed = 4.5 + Math.random() * 5;
      const angle = fromTop
        ? (Math.PI / 6) + Math.random() * (Math.PI / 4)  // downward diagonal
        : (Math.PI * 1.1) + Math.random() * (Math.PI / 5);
      const w = cvs.width;
      const h = cvs.height;
      shootingRef.current.push({
        x: fromTop ? Math.random() * w : -20,
        y: fromTop ? -20 : Math.random() * h * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 60 + Math.random() * 80,
        life: 0,
        maxLife: 55 + Math.random() * 35,
        color: STAR_COLORS[colorIdx],
      });
    }

    function draw(now: number) {
      frameRef.current = requestAnimationFrame(draw);
      gfx.clearRect(0, 0, cvs.width, cvs.height);

      const t = now * 0.001;

      // Stars
      for (const star of starsRef.current) {
        const tw = Math.sin(t * star.twinkleSpeed * 60 + star.twinkleOffset);
        const op = Math.max(0.05, star.opacity + tw * (star.opacity * 0.55));
        star.angle += star.angleSpeed;
        drawStarShape(gfx, star.x, star.y, star.radius, star.points, star.angle, star.color, op);
      }

      // Shooting stars
      spawnShooting(now);
      for (let i = shootingRef.current.length - 1; i >= 0; i--) {
        const s = shootingRef.current[i];
        s.x += s.vx; s.y += s.vy; s.life++;
        if (s.life > s.maxLife) { shootingRef.current.splice(i, 1); continue; }

        const progress = s.life / s.maxLife;
        const fadeIn  = Math.min(progress * 5, 1);
        const fadeOut = 1 - Math.max((progress - 0.6) / 0.4, 0);
        const alpha   = fadeIn * fadeOut * 0.9;

        const tx = s.x - s.vx / Math.hypot(s.vx, s.vy) * s.length;
        const ty = s.y - s.vy / Math.hypot(s.vx, s.vy) * s.length;

        const grad = gfx.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, s.color + '0)');
        grad.addColorStop(0.6, s.color + (alpha * 0.4) + ')');
        grad.addColorStop(1, s.color + alpha + ')');

        gfx.beginPath();
        gfx.strokeStyle = grad as unknown as string;
        gfx.lineWidth = 1.5;
        gfx.moveTo(tx, ty);
        gfx.lineTo(s.x, s.y);
        gfx.stroke();

        // Bright head dot
        gfx.beginPath();
        gfx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
        gfx.fillStyle = s.color + (alpha * 1.2) + ')';
        gfx.fill();
      }
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2, opacity: 0.9 }}
    />
  );
}
