'use client';

import { useRef, useEffect, useState } from 'react';

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
  flip?: boolean; // alternate layout
}

function PlanetOrb({ planet, visible }: { planet: PlanetFeature; visible: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 340, height: 340 }}>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${planet.glowColor}30 0%, transparent 70%)`,
          transform: visible ? 'scale(1.4)' : 'scale(0.8)',
          opacity: visible ? 1 : 0,
          animation: 'planetGlow 4s ease-in-out infinite',
        }}
      />

      {/* Ring (if applicable) */}
      {planet.hasRings && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: 420,
            height: 60,
            border: `2px solid ${planet.color}55`,
            borderRadius: '50%',
            transform: planet.ringTilt ?? 'rotateX(72deg) rotateZ(-15deg)',
            boxShadow: `0 0 20px ${planet.color}33, inset 0 0 10px ${planet.color}22`,
            transition: 'all 1s ease',
            opacity: visible ? 1 : 0,
          }}
        />
      )}

      {/* Planet sphere */}
      <div
        className="relative rounded-full"
        style={{
          width: 220,
          height: 220,
          background: `radial-gradient(circle at 35% 30%,
            ${planet.glowColor} 0%,
            ${planet.color} 35%,
            ${planet.darkColor} 70%,
            #060408 100%)`,
          boxShadow: `
            0 0 60px ${planet.color}55,
            0 0 100px ${planet.color}25,
            inset -30px -30px 60px rgba(0,0,0,0.6),
            inset 5px 5px 20px rgba(255,255,255,0.05)
          `,
          animation: 'planetFloat 6s ease-in-out infinite, planetSpin 30s linear infinite',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.6)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Surface detail — subtle dot pattern */}
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, ${planet.glowColor} 1px, transparent 1px)`,
            backgroundSize: '18px 18px',
          }}
        />
        {/* Highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: '12%',
            left: '18%',
            width: '35%',
            height: '25%',
            background: `radial-gradient(ellipse, rgba(255,255,255,0.18), transparent)`,
          }}
        />
      </div>

      {/* Orbit sparkle dots */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <div
          key={deg}
          className="absolute rounded-full"
          style={{
            width: 4,
            height: 4,
            background: planet.color,
            boxShadow: `0 0 6px ${planet.color}`,
            top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 155}px)`,
            left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 155}px)`,
            opacity: visible ? 0.7 : 0,
            transition: `opacity 1s ease ${deg * 3}ms`,
            animation: `orbitPulse ${2 + (deg / 100)}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FigurePlaceholder({ planet, visible }: { planet: PlanetFeature; visible: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-4 transition-all duration-1000"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: '200ms',
      }}
    >
      {/* Circular figure frame */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 120,
          height: 120,
          border: `2px solid ${planet.color}60`,
          boxShadow: `0 0 30px ${planet.color}30, inset 0 0 20px rgba(0,0,0,0.5)`,
          background: `radial-gradient(circle at 40% 35%, ${planet.darkColor}40, rgba(4,3,10,0.8))`,
        }}
      >
        {/* Decorative dot ring */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 120 120"
          style={{ animation: 'spin 25s linear infinite' }}
        >
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={Math.round((60 + Math.cos(angle) * 56) * 1e4) / 1e4}
                cy={Math.round((60 + Math.sin(angle) * 56) * 1e4) / 1e4}
                r="2"
                fill={planet.color}
                opacity={i % 3 === 0 ? 0.8 : 0.3}
              />
            );
          })}
        </svg>

        {/* Silhouette placeholder — Aboriginal elder figure */}
        <svg viewBox="0 0 60 80" width="50" height="65" style={{ opacity: 0.7 }}>
          {/* Head */}
          <circle cx="30" cy="14" r="10" fill={planet.color} opacity="0.8" />
          {/* Body */}
          <path
            d="M18 28 Q30 24 42 28 L46 60 Q38 65 30 64 Q22 65 14 60 Z"
            fill={planet.color}
            opacity="0.7"
          />
          {/* Arms */}
          <path d="M18 32 Q10 40 8 52" stroke={planet.color} strokeWidth="3" fill="none" opacity="0.6" />
          <path d="M42 32 Q50 40 52 52" stroke={planet.color} strokeWidth="3" fill="none" opacity="0.6" />
        </svg>

        {/* "Photo coming soon" label */}
        <div className="absolute -bottom-1 -right-1 bg-white/5 rounded-full px-2 py-0.5 border border-white/10">
          <span className="text-[9px] text-white/30 tracking-wider">Soon</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs tracking-widest uppercase" style={{ color: `${planet.color}90` }}>
          {planet.figureRole}
        </p>
        <p className="text-[11px] text-white/25 mt-0.5 italic">{planet.figurePlaceholder}</p>
      </div>
    </div>
  );
}

export function FeaturePlanetSection({ planet }: { planet: PlanetFeature }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.25 }
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
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at ${isFlipped ? '80%' : '20%'} 50%,
            ${planet.color}0C 0%, transparent 70%)`,
        }}
      />

      {/* Dot art divider line at top */}
      <div className="absolute top-0 left-0 right-0 flex justify-center gap-2 py-4 opacity-20">
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{ width: 3, height: 3, background: planet.color, opacity: i % 3 === 0 ? 1 : 0.4 }}
          />
        ))}
      </div>

      <div
        className={`relative z-10 max-w-5xl w-full flex flex-col ${
          isFlipped ? 'lg:flex-row-reverse' : 'lg:flex-row'
        } items-center gap-16 lg:gap-20`}
      >
        {/* Planet visual */}
        <div className="flex-shrink-0">
          <PlanetOrb planet={planet} visible={visible} />
        </div>

        {/* Text + Figure */}
        <div className="flex flex-col gap-8 flex-1">
          {/* Region label */}
          <div
            className="transition-all duration-1000"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : `translateX(${isFlipped ? '40px' : '-40px'})`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: planet.color, boxShadow: `0 0 6px ${planet.color}` }}
              />
              <span
                className="text-xs tracking-[0.35em] uppercase font-light"
                style={{ color: planet.color }}
              >
                {planet.name}
              </span>
            </div>

            <h2
              className="text-4xl sm:text-5xl font-extralight text-white/90 leading-tight mb-4"
              style={{ textShadow: `0 0 40px ${planet.color}30` }}
            >
              {planet.subheading}
            </h2>

            <p className="text-white/45 text-base leading-relaxed max-w-lg">
              {planet.description}
            </p>

            {/* Dot art decorative row */}
            <div className="flex gap-1.5 mt-6">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: i % 3 === 0 ? 6 : 4,
                    height: i % 3 === 0 ? 6 : 4,
                    background: planet.color,
                    opacity: i % 3 === 0 ? 0.7 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Historical figure */}
          <FigurePlaceholder planet={planet} visible={visible} />
        </div>
      </div>
    </section>
  );
}
