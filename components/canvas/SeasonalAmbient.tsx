'use client';

import { useApp } from '@/lib/store/AppContext';
import { getSeasonById } from '@/lib/utils/season';

export function SeasonalAmbient() {
  const { state } = useApp();
  const season =
    state.seasonalCalendar && state.currentSeasonId
      ? getSeasonById(state.seasonalCalendar, state.currentSeasonId)
      : null;

  const bgFrom = season?.colorPalette.bgFrom ?? '#080b14';
  const bgTo = season?.colorPalette.bgTo ?? '#0d0a14';

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-all duration-[3000ms]"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${bgFrom} 0%, ${bgTo} 100%)`,
      }}
    />
  );
}
