'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';

export default function Home() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.initialized) return;
    if (state.selectedRegion) {
      router.replace('/canvas');
    } else {
      router.replace('/onboarding');
    }
  }, [state.initialized, state.selectedRegion, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-white/40 animate-star-pulse" />
        <p className="text-white/30 text-sm tracking-widest uppercase">
          Loading...
        </p>
      </div>
    </div>
  );
}
