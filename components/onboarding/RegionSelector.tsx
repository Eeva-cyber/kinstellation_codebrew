'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { regions } from '@/lib/data/regions';

export function RegionSelector() {
  const { setRegion } = useApp();
  const router = useRouter();

  function handleSelect(regionId: string) {
    setRegion(regionId);
    router.push('/canvas');
  }

  return (
    <div className="max-w-3xl w-full animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-2 h-2 rounded-full bg-white/60 mx-auto mb-6 animate-star-pulse" />
        <h1 className="text-3xl font-light tracking-tight text-white/90 mb-3">
          Where is your Country?
        </h1>
        <p className="text-white/40 text-base max-w-md mx-auto leading-relaxed">
          Select your region or language group. This loads your community&apos;s
          kinship structure and seasonal calendar. You can change this later.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => handleSelect(region.id)}
            className="group text-left p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]
              hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300
              focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <h2 className="text-lg font-medium text-white/80 group-hover:text-white/95 transition-colors mb-1.5">
              {region.displayName}
            </h2>
            <p className="text-sm text-white/30 group-hover:text-white/45 transition-colors leading-relaxed">
              {region.description}
            </p>
          </button>
        ))}
      </div>

      <p className="text-center text-white/20 text-xs mt-8 max-w-lg mx-auto leading-relaxed">
        Seasonal calendars are knowledge systems belonging to specific communities.
        This platform does not claim ownership of this knowledge &mdash; it provides
        a structure for communities to use their own.
      </p>
    </div>
  );
}
