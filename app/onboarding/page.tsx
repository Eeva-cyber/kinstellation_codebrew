import { RegionSelector } from '@/components/onboarding/RegionSelector';
import { GalaxyBackground } from '@/components/landing/GalaxyBackground';

export default function OnboardingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Deep space background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% 0%, #100508 0%, #04030A 50%),
            radial-gradient(ellipse 60% 40% at 10% 60%, #0D0520 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 90% 40%, #100508 0%, transparent 60%),
            #04030A
          `,
        }}
      />

      {/* Animated star field + shooting stars */}
      <GalaxyBackground />

      {/* Nebula blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 40% 30% at 15% 70%, rgba(107,47,212,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 35% at 85% 30%, rgba(212,164,84,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 75% 85%, rgba(78,205,196,0.05) 0%, transparent 70%)
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <RegionSelector />
      </div>
    </div>
  );
}
