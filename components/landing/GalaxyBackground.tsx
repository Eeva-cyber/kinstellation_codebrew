'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  spinAngle: number;
  spinSpeed: number;
  points: number; // 0 = circle, 4 = 4-pointed star
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

const STAR_COLORS = [
  'rgba(255, 255, 255,',
  'rgba(255, 235, 180,',
  'rgba(212, 164, 84,',
  'rgba(200, 220, 255,',
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  points: number,
  rotation: number,
  color: string,
  opacity: number,
) {
  if (points === 0) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color + opacity + ')';
    ctx.fill();
    // Tiny cross gleam on larger stars
    if (radius > 1.2) {
      const grd = ctx.createLinearGradient(x - radius * 2.5, y, x + radius * 2.5, y);
      grd.addColorStop(0,   color + '0)');
      grd.addColorStop(0.5, color + (opacity * 0.6) + ')');
      grd.addColorStop(1,   color + '0)');
      ctx.beginPath();
      ctx.strokeStyle = color + (opacity * 0.4) + ')';
      ctx.lineWidth = 0.5;
      ctx.moveTo(x - radius * 3, y);
      ctx.lineTo(x + radius * 3, y);
      ctx.stroke();
      ctx.moveTo(x, y - radius * 3);
      ctx.lineTo(x, y + radius * 3);
      ctx.stroke();
    }
    return;
  }

  // 4-pointed star shape
  const outer = radius;
  const inner = radius * 0.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / points;
    if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color + opacity + ')';
  ctx.fill();

  // Gleam lines
  ctx.strokeStyle = color + (opacity * 0.35) + ')';
  ctx.lineWidth = 0.6;
  ctx.moveTo(-outer * 2.5, 0); ctx.lineTo(outer * 2.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -outer * 2.5); ctx.lineTo(0, outer * 2.5);
  ctx.stroke();

  ctx.restore();
}

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Build star field
    const rng = seeded(42);
    starsRef.current = Array.from({ length: 280 }, () => {
      const isStar = rng() > 0.55;
      return {
        x: rng() * window.innerWidth,
        y: rng() * window.innerHeight,
        radius: isStar ? rng() * 1.8 + 0.8 : rng() * 0.9 + 0.3,
        opacity: rng() * 0.5 + 0.15,
        twinkleSpeed: rng() * 0.012 + 0.004,
        twinkleOffset: rng() * Math.PI * 2,
        spinAngle: rng() * Math.PI * 2,
        spinSpeed: (rng() - 0.5) * 0.015,
        points: isStar ? 4 : 0,
        color: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
      };
    });

    const spawnShootingStar = () => {
      const fromTop = Math.random() > 0.4;
      const color = Math.random() > 0.5
        ? 'rgba(255, 230, 160,'
        : 'rgba(255, 255, 255,';
      const speed = Math.random() * 6 + 5;
      const angle = (Math.random() * 30 + 20) * (Math.PI / 180);

      shootingStarsRef.current.push({
        x: fromTop
          ? Math.random() * canvas.width
          : -20,
        y: fromTop
          ? -20
          : Math.random() * canvas.height * 0.5,
        vx:  Math.cos(angle) * speed,
        vy:  Math.sin(angle) * speed,
        length: Math.random() * 120 + 80,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 50,
        color,
      });
    };

    let lastShoot = 0;
    let shootInterval = Math.random() * 3000 + 2000;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Twinkling / spinning stars ──
      starsRef.current.forEach((star) => {
        const t = time * 0.001;
        const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed * 60 + star.twinkleOffset);
        const opacity = star.opacity * (0.4 + 0.6 * twinkle);
        star.spinAngle += star.spinSpeed;

        // Soft halo on bigger stars
        if (star.radius > 1.2) {
          const halo = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 5);
          halo.addColorStop(0,   star.color + (opacity * 0.3) + ')');
          halo.addColorStop(1,   star.color + '0)');
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 5, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();
        }

        drawStar(ctx, star.x, star.y, star.radius, star.points, star.spinAngle, star.color, opacity);
      });

      // ── Shooting stars ──
      if (time - lastShoot > shootInterval) {
        spawnShootingStar();
        lastShoot = time;
        shootInterval = Math.random() * 3500 + 1500;
      }

      shootingStarsRef.current = shootingStarsRef.current.filter((ss) => ss.life < ss.maxLife);
      shootingStarsRef.current.forEach((ss) => {
        ss.life++;
        const progress = ss.life / ss.maxLife;
        const fade = progress < 0.2
          ? progress / 0.2
          : 1 - (progress - 0.2) / 0.8;
        const opacity = fade * 0.9;

        // Tail
        const tailX = ss.x - (ss.vx / Math.hypot(ss.vx, ss.vy)) * ss.length * fade;
        const tailY = ss.y - (ss.vy / Math.hypot(ss.vx, ss.vy)) * ss.length * fade;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0,   ss.color + '0)');
        grad.addColorStop(0.6, ss.color + (opacity * 0.3) + ')');
        grad.addColorStop(1,   ss.color + opacity + ')');

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = ss.color + opacity + ')';
        ctx.fill();

        ss.x += ss.vx;
        ss.y += ss.vy;
      });

      frameRef.current = requestAnimationFrame(draw);
    };

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
      style={{ opacity: 0.85 }}
    />
  );
}
