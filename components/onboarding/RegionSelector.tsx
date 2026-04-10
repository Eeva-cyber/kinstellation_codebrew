'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { regions } from '@/lib/data/regions';
import type { Region } from '@/lib/types';

export function RegionSelector() {
  const { setRegion } = useApp();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const notListed = regions.find((r) => r.id === 'not_listed')!;
  const searchable = regions.filter((r) => r.id !== 'not_listed');

  // All regions grouped by state/territory for browse view
  const grouped = searchable.reduce<Record<string, Region[]>>((acc, r) => {
    const key = r.stateTerritory || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort();

  // Filtered results when searching
  const filtered =
    q.length === 0
      ? []
      : searchable.filter((r) => {
          if (r.displayName.toLowerCase().includes(q)) return true;
          if (r.stateTerritory.toLowerCase().includes(q)) return true;
          if (r.countryDescription.toLowerCase().includes(q)) return true;
          if (r.alternateNames?.some((n) => n.toLowerCase().includes(q))) return true;
          return false;
        });

  const showDropdown = open;
  const showFiltered = q.length > 0;

  function handleSelect(regionId: string) {
    setRegion(regionId);
    router.push('/canvas');
  }

  return (
    <div className="max-w-xl w-full animate-fade-in">

      {/* Heading */}
      <div className="text-center mb-10">
        <div className="w-2 h-2 rounded-full bg-white/60 mx-auto mb-6 animate-star-pulse" />
        <h1 className="text-3xl font-light tracking-tight text-white/90 mb-3">
          Which Country are you from?
        </h1>
        <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
          Search your language group, nation or Country name. This loads your
          community&apos;s kinship structure. You can change this anytime.
        </p>
      </div>

      {/* Search + dropdown */}
      <div ref={containerRef} className="relative mb-2">
        {/* Input row */}
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200
            ${open || q
              ? 'border-white/20 bg-white/[0.06]'
              : 'border-white/[0.08] bg-white/[0.03]'
            }
            ${showDropdown ? 'rounded-b-none border-b-transparent' : ''}`}
        >
          {/* Search icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-white/30 shrink-0"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="e.g. Noongar, Yolngu, Wiradjuri…"
            className="flex-1 bg-transparent text-white/85 placeholder:text-white/25 text-base
              outline-none caret-white/50"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
          />

          {/* Clear button */}
          {query && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setQuery(''); inputRef.current?.focus(); }}
              className="text-white/25 hover:text-white/50 transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Chevron toggle */}
          <button
            onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); inputRef.current?.focus(); }}
            className="text-white/25 hover:text-white/50 transition-all"
            aria-label={open ? 'Close dropdown' : 'Browse all countries'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            >
              <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Dropdown panel */}
        {showDropdown && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full z-50
              rounded-b-xl border border-t-0 border-white/20 bg-[#0a0d1a]/95
              backdrop-blur-xl overflow-y-auto shadow-2xl"
            style={{ maxHeight: '340px' }}
          >
            {showFiltered ? (
              /* Filtered results */
              filtered.length === 0 ? (
                <p className="text-center text-white/25 text-sm py-6">
                  No language groups found for &ldquo;{query}&rdquo;
                </p>
              ) : (
                <div className="p-1.5 space-y-0.5">
                  {filtered.map((region) => (
                    <RegionOption
                      key={region.id}
                      region={region}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Browse all, grouped by state/territory */
              <div className="p-1.5">
                {groupKeys.map((state) => (
                  <div key={state}>
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-[10px] text-white/25 uppercase tracking-widest">
                        {state}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {grouped[state].map((region) => (
                        <RegionOption
                          key={region.id}
                          region={region}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-white/20 text-xs">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Not listed fallback */}
      <button
        onClick={() => handleSelect(notListed.id)}
        className="group w-full text-left px-4 py-3.5 rounded-xl border border-white/[0.04]
          bg-transparent hover:bg-white/[0.04] hover:border-white/[0.08]
          transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white/10"
      >
        <span className="block text-white/40 group-hover:text-white/60 font-medium transition-colors">
          My group isn&apos;t listed
        </span>
        <span className="block text-white/20 text-xs mt-0.5 group-hover:text-white/35 transition-colors">
          {notListed.description}
        </span>
      </button>

      {/* Attribution */}
      <p className="text-center text-white/15 text-xs mt-8 leading-relaxed max-w-sm mx-auto">
        Language groups sourced from the AIATSIS Map of Indigenous Australia. Seasonal calendars
        are knowledge systems belonging to specific communities — this platform holds no ownership
        of that knowledge.
      </p>
    </div>
  );
}

function RegionOption({
  region,
  onSelect,
}: {
  region: Region;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      role="option"
      onClick={() => onSelect(region.id)}
      className="group w-full text-left px-3 py-2.5 rounded-lg
        hover:bg-white/[0.07] transition-all duration-150
        focus:outline-none focus:bg-white/[0.07]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-white/80 group-hover:text-white/95 text-sm font-medium transition-colors">
          {region.displayName}
        </span>
        <span className="shrink-0 text-white/20 text-[10px] group-hover:text-white/35 transition-colors">
          {region.stateTerritory}
        </span>
      </div>
      {region.countryDescription && (
        <span className="block text-white/30 text-xs mt-0.5 group-hover:text-white/45 transition-colors leading-snug">
          {region.countryDescription}
        </span>
      )}
    </button>
  );
}
