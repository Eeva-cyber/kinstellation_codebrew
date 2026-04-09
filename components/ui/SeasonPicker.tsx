'use client';

import { useApp } from '@/lib/store/AppContext';

interface SeasonPickerProps {
  value: string;
  onChange: (seasonId: string) => void;
}

export function SeasonPicker({ value, onChange }: SeasonPickerProps) {
  const { state } = useApp();
  const seasons = state.seasonalCalendar?.seasons ?? [];

  return (
    <div className="space-y-2">
      <label className="block text-xs text-white/40 uppercase tracking-wider">
        Which season does this story belong to?
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {seasons.map((season) => (
          <button
            key={season.id}
            type="button"
            onClick={() => onChange(season.id)}
            className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
              value === season.id
                ? 'border-white/20 bg-white/[0.08]'
                : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: season.colorPalette.accentColor }}
              />
              <span>
                <span className={`block ${value === season.id ? 'text-white/80' : 'text-white/50'}`}>
                  {season.name}
                </span>
                <span className="block text-white/25 text-[10px]">
                  {season.nameEnglish}
                </span>
              </span>
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange('unsure')}
          className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${
            value === 'unsure'
              ? 'border-white/20 bg-white/[0.08]'
              : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]'
          }`}
        >
          <span className={`${value === 'unsure' ? 'text-white/70' : 'text-white/40'}`}>
            I&apos;m not sure yet
          </span>
        </button>
      </div>
    </div>
  );
}
