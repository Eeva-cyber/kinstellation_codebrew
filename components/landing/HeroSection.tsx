'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DotPainting } from './DotPainting';
import { GalaxyBackground } from './GalaxyBackground';

interface HeroSectionProps {
  scrollY: number;
}

export function HeroSection({ scrollY }: HeroSectionProps) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  // Fade the dot painting as user scrolls down
  const dotOpacity   = Math.max(0, 1 - scrollY / 500);
  const starsOpacity = Math.min(1, 0.3 + scrollY / 400);
  const textOpacity  = Math.max(0, 1 - scrollY / 300);
  const textY        = Math.min(0, -scrollY * 0.3);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden flex-shrink-0">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 45%,
            #1C0A02 0%,
            #0F0418 30%,
            #04030A 62%,
            #020208 100%)`,
        }}
      />

      {/* Animated star field + shooting stars */}
      <GalaxyBackground />

      {/* Aboriginal dot painting — fades out on scroll */}
      <div className="absolute inset-0" style={{ opacity: dotOpacity }}>
        <DotPainting />
        {/* Radial vignette — hides rotating square corners */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 62% 62% at 50% 50%, transparent 42%, #04030A 70%)',
          }}
        />
      </div>

      {/* Nebula color blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 18% 72%, rgba(107,47,212,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 45% 35% at 82% 18%, rgba(212,164,84,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 78% 82%, rgba(180,40,80,0.10) 0%, transparent 70%),
            radial-gradient(ellipse 30% 25% at 25% 25%, rgba(90,30,180,0.10) 0%, transparent 70%)
          `,
          opacity: starsOpacity,
        }}
      />

      {/* Logo + title — translates up as you scroll */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        {/* Logo icon (picture.png — turtle constellation) */}
        <div
          className={`mb-6 transition-all duration-1000 ${
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <div className="relative" style={{ width: 140, height: 140 }}>
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: '0 0 50px rgba(212,164,84,0.45), 0 0 100px rgba(212,164,84,0.2)',
                animation: 'spin 25s linear infinite',
                border: '1px dashed rgba(212,164,84,0.35)',
                borderRadius: '50%',
              }}
            />
            <Image
              src="/betterpic.png"
              alt="Kinstellation logo"
              width={140}
              height={140}
              className="rounded-full"
              priority
              style={{
                filter: 'drop-shadow(0 0 20px rgba(212,164,84,0.5))',
              }}
            />
          </div>
        </div>

        {/* Logo text (logo.png — Kinstellation wordmark) */}
        <div
          className={`transition-all duration-1000 delay-300 ${
            phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <Image
            src="/betterlogo.png"
            alt="Kinstellation"
            width={520}
            height={100}
            priority
            style={{
              maxWidth: '88vw',
              height: 'auto',
              /* drop-shadow follows the alpha channel — glows on the letters, not the image box */
              filter: [
                'drop-shadow(0 0 6px rgba(255,220,140,1))',
                'drop-shadow(0 0 14px rgba(212,164,84,0.9))',
                'drop-shadow(0 0 30px rgba(212,164,84,0.6))',
                'drop-shadow(0 0 55px rgba(212,164,84,0.3))',
              ].join(' '),
            }}
          />
        </div>

        {/* Tagline */}
        <div
          className={`transition-all duration-1000 delay-700 mt-5 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p
            className="text-base sm:text-lg font-light tracking-[0.35em] uppercase"
            style={{
              color: '#FFE599',
              textShadow: '0 0 24px rgba(212,164,84,0.8), 0 1px 6px rgba(0,0,0,1)',
            }}
          >
            Where people are stars
          </p>
        </div>

        {/* Dot art attribution line */}
        <div
          className={`transition-all duration-1000 delay-1000 mt-3 ${
            phase >= 2 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 6px rgba(0,0,0,1)' }}
          >
            Constellation · Kinship · Country
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          className={`mt-16 flex flex-col items-center gap-2 transition-all duration-1000 delay-1500 ${
            phase >= 2 ? 'opacity-60' : 'opacity-0'
          }`}
        >
          <p
            className="text-xs tracking-[0.3em] uppercase animate-pulse"
            style={{ color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 6px rgba(0,0,0,1)' }}
          >
            Scroll to explore
          </p>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}
