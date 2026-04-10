'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { regions } from '@/lib/data/regions';

export function RegionSelector() {
  const { setRegion } = useApp();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  // Filter: match displayName, alternateNames, stateTerritory, countryDescription
  const notListed = regions.find((r) => r.id === 'not_listed')!;
  const searchable = regions.filter((r) => r.id !== 'not_listed');

  const results =
    q.length === 0
      ? []
      : searchable.filter((r) => {
          if (r.displayName.toLowerCase().includes(q)) return true;
          if (r.stateTerritory.toLowerCase().includes(q)) return true;
          if (r.countryDescription.toLowerCase().includes(q)) return true;
          if (r.alternateNames?.some((n) => n.toLowerCase().includes(q))) return true;
          return false;
        });

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

      {/* Search input */}
      <div className="relative mb-2">
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200
            ${focused
              ? 'border-white/20 bg-white/[0.06]'
              : 'border-white/[0.08] bg-white/[0.03]'
            }`}
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
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. Noongar, Yolngu, Wiradjuri…"
            className="flex-1 bg-transparent text-white/85 placeholder:text-white/25 text-base
              outline-none caret-white/50"
            autoComplete="off"
            spellCheck={false}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/25 hover:text-white/50 transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {q.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {results.length === 0 ? (
            <p className="text-center text-white/25 text-sm py-6">
              No language groups found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((region) => (
              <button
                key={region.id}
                onClick={() => handleSelect(region.id)}
                className="group w-full text-left px-4 py-3.5 rounded-xl border border-white/[0.06]
                  bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/[0.14]
                  transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-white/85 group-hover:text-white/95 font-medium transition-colors">
                      {region.displayName}
                    </span>
                    {region.stateTerritory && (
                      <span className="block text-white/30 text-xs mt-0.5 group-hover:text-white/40 transition-colors">
                        {region.countryDescription}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-white/20 text-xs mt-0.5 group-hover:text-white/35 transition-colors">
                    {region.stateTerritory}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-white/20 text-xs">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Not listed fallback — always visible */}
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
