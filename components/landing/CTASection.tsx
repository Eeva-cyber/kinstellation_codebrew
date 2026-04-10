'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative w-full min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden flex-shrink-0"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 30% 50%, rgba(212,164,84,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 40%, rgba(107,47,212,0.07) 0%, transparent 70%)
          `,
        }}
      />

      {/* Dot art top border */}
      <div className="absolute top-0 left-0 right-0 flex justify-center gap-2 py-4 opacity-20">
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i % 5 === 0 ? 6 : 3,
              height: i % 5 === 0 ? 6 : 3,
              background: '#D4A454',
              opacity: i % 5 === 0 ? 0.9 : 0.4,
            }}
          />
        ))}
      </div>

      <div
        className={`relative z-10 max-w-6xl w-full grid lg:grid-cols-2 gap-16 lg:gap-24 items-center transition-all duration-1000 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        {/* ── Left: CTA text ── */}
        <div className="flex flex-col gap-8">
          {/* Decorative constellation lines */}
          <svg
            width="120"
            height="60"
            viewBox="0 0 120 60"
            className="opacity-40"
            aria-hidden="true"
          >
            <circle cx="10"  cy="30" r="3" fill="#D4A454" />
            <circle cx="50"  cy="10" r="5" fill="#D4A454" />
            <circle cx="90"  cy="45" r="4" fill="#D4A454" />
            <circle cx="115" cy="20" r="3" fill="#D4A454" />
            <line x1="10" y1="30" x2="50"  y2="10" stroke="#D4A454" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
            <line x1="50" y1="10" x2="90"  y2="45" stroke="#D4A454" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
            <line x1="90" y1="45" x2="115" y2="20" stroke="#D4A454" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
            {/* Glow on center star */}
            <circle cx="50" cy="10" r="8" fill="#D4A454" opacity="0.15" />
          </svg>

          <div>
            <p
              className="text-xs tracking-[0.4em] uppercase mb-4"
              style={{ color: 'rgba(212,164,84,0.6)' }}
            >
              Begin your journey
            </p>
            <h2
              className="text-5xl sm:text-6xl font-extralight text-white/90 leading-tight"
              style={{ textShadow: '0 0 60px rgba(212,164,84,0.2)' }}
            >
              Your ancestors<br />
              <span style={{ color: '#D4A454' }}>are already</span><br />
              in the stars.
            </h2>
          </div>

          <p className="text-white/40 text-base leading-relaxed max-w-md">
            Kinstellation gives your community the tools to map kinship, carry oral histories,
            and keep culture alive across generations — on Country and beyond.
          </p>

          {/* Dot art row */}
          <div className="flex gap-2 items-center">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: i === 3 ? 8 : 4,
                  height: i === 3 ? 8 : 4,
                  background: '#D4A454',
                  opacity: i === 3 ? 0.9 : 0.35,
                  boxShadow: i === 3 ? '0 0 8px #D4A454' : undefined,
                }}
              />
            ))}
          </div>

          {/* CTA button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/onboarding')}
              className="group relative px-8 py-4 rounded-full font-light tracking-widest uppercase text-sm transition-all duration-300 overflow-hidden"
              style={{
                border: '1px solid rgba(212,164,84,0.5)',
                color: '#D4A454',
                background: 'rgba(212,164,84,0.05)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = 'rgba(212,164,84,0.15)';
                el.style.boxShadow = '0 0 40px rgba(212,164,84,0.3)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = 'rgba(212,164,84,0.05)';
                el.style.boxShadow = 'none';
              }}
            >
              Weave your constellation
            </button>
          </div>
        </div>

        {/* ── Right: Sign-up placeholder (teammate's work) ── */}
        <div
          className="rounded-2xl p-8 flex flex-col gap-6"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 0 40px rgba(212,164,84,0.03)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#D4A454', boxShadow: '0 0 6px #D4A454' }}
            />
            <span className="text-white/50 text-sm tracking-wider">Join early access</span>
          </div>

          {/* Placeholder form fields */}
          <div className="flex flex-col gap-4">
            {['Full name', 'Email address', 'Community / Country'].map((label) => (
              <div key={label} className="flex flex-col gap-2">
                <label className="text-xs tracking-widest text-white/30 uppercase">{label}</label>
                <div
                  className="w-full h-11 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Submit placeholder */}
          <div
            className="w-full h-12 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(212,164,84,0.08)',
              border: '1px dashed rgba(212,164,84,0.3)',
            }}
          >
            <span className="text-xs tracking-[0.3em] uppercase text-white/20">
              Sign-up — coming soon
            </span>
          </div>

          <p className="text-xs text-white/15 text-center leading-relaxed">
            Sign-up form in progress. Your teammate is building this section.
          </p>
        </div>
      </div>

      {/* Bottom credits */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <p className="text-xs text-white/12 tracking-widest text-center max-w-lg px-6">
          Seasonal knowledge belongs to specific communities. Kinstellation provides structure — not ownership.
        </p>
      </div>
    </section>
  );
}
