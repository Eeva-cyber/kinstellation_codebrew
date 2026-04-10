'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store/AppContext';

interface SeasonPickerProps {
  value: string;
  onChange: (seasonId: string) => void;
}

export function SeasonPicker({ value, onChange }: SeasonPickerProps) {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seasons = state.seasonalCalendar?.seasons ?? [];

  const selected = seasons.find((s) => s.id === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs text-white/30 mb-1.5">
        Which season does this story belong to?
      </label>

      {/* Trigger */}
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
          bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12]
          text-sm text-white/70 transition-colors text-left focus:outline-none"
      >
        {selected ? (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: selected.colorPalette.accentColor }}
          />
        ) : (
          <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
        )}
        <span className="flex-1 truncate text-sm">
          {selected ? `${selected.name} — ${selected.nameEnglish}` : "I'm not sure yet"}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`text-white/30 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full mt-1 w-full rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(8, 11, 20, 0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* "Unsure" option */}
          <button
            type="button"
            onClick={() => handleSelect('unsure')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors
              ${value === 'unsure'
                ? 'bg-white/[0.07] text-white/80'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/65'}`}
          >
            <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
            <span>I&apos;m not sure yet</span>
          </button>

          {seasons.length > 0 && (
            <div className="h-px mx-3" style={{ background: 'rgba(255,255,255,0.05)' }} />
          )}

          {seasons.map((season) => (
            <button
              key={season.id}
              type="button"
              onClick={() => handleSelect(season.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors
                ${value === season.id
                  ? 'bg-white/[0.07] text-white/80'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/65'}`}
            >
              {/* Color swatch with subtle glow */}
              <span className="relative shrink-0">
                <span
                  className="block w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: season.colorPalette.accentColor,
                    boxShadow: `0 0 6px ${season.colorPalette.accentColor}88`,
                  }}
                />
              </span>
              <div className="min-w-0">
                <span className="block text-sm truncate leading-snug">{season.name}</span>
                <span className="block text-[10px] text-white/25 truncate">{season.nameEnglish}</span>
              </div>
              {value === season.id && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto shrink-0 text-white/40">
                  <path d="M2 5.5l2.5 2.5 4-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected season hint */}
      {selected && !open && (
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: selected.colorPalette.accentColor,
              boxShadow: `0 0 4px ${selected.colorPalette.accentColor}80`,
            }}
          />
          <span className="text-[10px] text-white/25 leading-snug">
            {selected.description.split('.')[0]}.
          </span>
        </div>
      )}
    </div>
  );
}
