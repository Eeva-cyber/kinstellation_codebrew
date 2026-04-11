'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { GalaxyBackground } from '@/components/landing/GalaxyBackground';
import { SignInModal } from '@/components/auth/SignInModal';

export function SplashScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
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

      <GalaxyBackground />

      {/* Nebula colour blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 18% 72%, rgba(107,47,212,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 45% 35% at 82% 18%, rgba(212,164,84,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 78% 82%, rgba(180,40,80,0.10) 0%, transparent 70%),
            radial-gradient(ellipse 30% 25% at 25% 25%, rgba(90,30,180,0.10) 0%, transparent 70%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        {/* Logo icon */}
        <div
          className={`mb-6 transition-all duration-1000 ${
            phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <div className="relative" style={{ width: 140, height: 140 }}>
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
              style={{ filter: 'drop-shadow(0 0 20px rgba(212,164,84,0.5))' }}
            />
          </div>
        </div>

        {/* Wordmark */}
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

        {/* Buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-4 mt-12 transition-all duration-1000 delay-1000 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* "Begin" → full onboarding (profile + account creation) */}
          <button
            onClick={() => router.push('/onboarding')}
            className="px-8 py-3.5 rounded-2xl text-sm font-medium tracking-wide transition-all duration-200"
            style={{
              background: 'rgba(88,28,135,0.55)',
              border: '1px solid rgba(212,164,84,0.3)',
              color: '#FFE599',
              boxShadow: '0 4px 24px rgba(88,28,135,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(109,40,217,0.7)';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(88,28,135,0.55)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Begin your constellation
          </button>

          <button
            onClick={() => setShowSignIn(true)}
            className="px-6 py-3 rounded-2xl text-sm tracking-wide transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            Sign in
          </button>
        </div>

        {/* Subtitle */}
        <div
          className={`transition-all duration-1000 delay-1200 mt-3 ${
            phase >= 2 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Constellation &middot; Kinship &middot; Country
          </p>
        </div>
      </div>

      {showSignIn && (
        <SignInModal
          defaultView="signin"
          onClose={() => setShowSignIn(false)}
          onSuccess={() => router.push('/canvas')}
        />
      )}
    </div>
  );
}
