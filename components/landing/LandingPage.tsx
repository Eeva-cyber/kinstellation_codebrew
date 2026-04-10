'use client';

import { useRef, useState, useEffect } from 'react';
import { HeroSection } from './HeroSection';
import { FeaturePlanetSection, type PlanetFeature } from './FeaturePlanetSection';
import { CTASection } from './CTASection';
import { GalaxyBackground } from './GalaxyBackground';

const PLANETS: PlanetFeature[] = [
  {
    id: 'noongar',
    name: 'Noongar Country',
    subheading: 'Six seasons,\none story.',
    description:
      'Stories are tagged to Indigenous seasons — not months. Birak\'s heat, Kambarang\'s wildflowers. Each season holds its own memories, its own voice. Time as your ancestors understood it.',
    color: '#FADE77',
    glowColor: '#FFD84A',
    darkColor: '#1E0A00',
    hasRings: true,
    ringTilt: 'rotateX(70deg) rotateZ(-20deg)',
    figurePlaceholder: 'Elder figure — portrait coming',
    figureRole: 'Knowledge Keeper',
    flip: false,
  },
  {
    id: 'yolngu',
    name: 'Yolngu Country',
    subheading: 'Kinship written\nin the stars.',
    description:
      'Map the complex threads of family. Moiety lines, skin names, and clan connections become constellations — non-hierarchical, organic, alive. Your law, visible in the sky.',
    color: '#4ECDC4',
    glowColor: '#7FFFD4',
    darkColor: '#002B28',
    hasRings: true,
    figurePlaceholder: 'Family group — portrait coming',
    figureRole: 'Clan Elder',
    flip: true,
  },
  {
    id: 'dharawal',
    name: "D'harawal Country",
    subheading: 'Voices that\noutlast time.',
    description:
      'Record audio, photos, and text. Every story lights a new star. The more your family shares, the brighter your constellation shines — a living archive that grows across generations.',
    color: '#9B5DD4',
    glowColor: '#C490E8',
    darkColor: '#1A0035',
    hasRings: true,
    figurePlaceholder: 'Storyteller — portrait coming',
    figureRole: 'Oral Historian',
    flip: false,
  },
  {
    id: 'warlpiri',
    name: 'Warlpiri Country',
    subheading: 'Protected,\nprivate, yours.',
    description:
      'Sacred knowledge stays sacred. Control exactly who sees what — public, family-only, restricted, or gendered. Your boundaries are built into every star, every story, every connection.',
    color: '#E17055',
    glowColor: '#FF9966',
    darkColor: '#3D0E00',
    hasRings: true,
    figurePlaceholder: 'Community elder — portrait coming',
    figureRole: 'Cultural Custodian',
    flip: true,
  },
];

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-y-auto overflow-x-hidden"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Persistent deep-space background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 80% at 50% 0%,   #100508 0%, #04030A 50%),
              radial-gradient(ellipse 60%  40% at 10% 60%,  #0D0520 0%, transparent 60%),
              radial-gradient(ellipse 60%  40% at 90% 40%,  #100508 0%, transparent 60%),
              #04030A
            `,
          }}
        />
        {/* Animated stars + shooting stars — persists across all sections */}
        <GalaxyBackground />

        {/* Drifting nebula blobs */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 40% 30% at 15% 70%, rgba(107,47,212,0.06) 0%, transparent 70%),
              radial-gradient(ellipse 50% 35% at 85% 30%, rgba(212,164,84,0.05) 0%, transparent 70%),
              radial-gradient(ellipse 40% 30% at 75% 85%, rgba(78,205,196,0.04) 0%, transparent 70%)
            `,
          }}
        />
      </div>

      {/* Scrollable content */}
      <div className="relative" style={{ zIndex: 1 }}>
        <HeroSection scrollY={scrollY} />

        {/* Galaxy transition band */}
        <div
          className="w-full flex justify-center items-center py-10 gap-4"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(212,164,84,0.03), transparent)',
          }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i % 5 === 2 ? 6 : 3,
                height: i % 5 === 2 ? 6 : 3,
                background: '#D4A454',
                opacity: i % 5 === 2 ? 0.5 : 0.15,
                boxShadow: i % 5 === 2 ? '0 0 6px #D4A454' : undefined,
              }}
            />
          ))}
        </div>

        {/* 4 Feature planet sections */}
        {PLANETS.map((planet) => (
          <FeaturePlanetSection key={planet.id} planet={planet} />
        ))}

        {/* Final CTA */}
        <CTASection />
      </div>
    </div>
  );
}
