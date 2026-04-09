'use client';

import { useApp } from '@/lib/store/AppContext';
import { getSeasonById } from '@/lib/utils/season';

export function SeasonIndicator() {
  const { state } = useApp();
  const season =
    state.seasonalCalendar && state.currentSeasonId
      ? getSeasonById(state.seasonalCalendar, state.currentSeasonId)
      : null;

  if (!season) return null;

  return (
    <div className="absolute bottom-4 left-4 z-20 animate-fade-in">
      <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full animate-star-pulse"
            style={{ backgroundColor: season.colorPalette.accentColor }}
          />
          <div>
            <span className="text-xs font-medium text-white/70 tracking-wide">
              {season.name}
            </span>
            <span className="text-xs text-white/30 ml-1.5">
              {season.nameEnglish}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-white/20 mt-1 max-w-[220px] leading-relaxed">
          {season.description.split('.')[0]}.
        </p>
      </div>
    </div>
  );
}
