'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { regions } from '@/lib/data/regions';
import type { Region, Person } from '@/lib/types';

const TOTAL_STEPS = 3;

export function OnboardOverlay({ onComplete }: { onComplete: () => void }) {
  const { dispatch, setRegion } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [country, setCountry] = useState<Region | null>(null);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);

  const advance = useCallback(() => {
    if (animating) return;
    if (step === 0) {
      if (!name.trim()) return;
      // Create the person star
      const selfId = crypto.randomUUID();
      const selfPerson: Person = {
        id: selfId,
        displayName: name.trim(),
        regionSelectorValue: '',
        isDeceased: false,
        stories: [],
        visibility: 'public',
        lastUpdated: new Date().toISOString(),
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      };
      dispatch({ type: 'ADD_PERSON', payload: selfPerson });
      localStorage.setItem('kinstellation_self_id', selfId);
      localStorage.setItem('kinstellation_profile', JSON.stringify({ name: name.trim() }));
    }
    if (step === 1 && country) {
      setRegion(country.id);
      localStorage.setItem('kinstellation_region', country.id);
    }
    if (step >= TOTAL_STEPS - 1) {
      onComplete();
      return;
    }
    setDir(1);
    setAnimating(true);
    setTimeout(() => { setStep((s) => s + 1); setAnimating(false); }, 250);
  }, [step, name, country, animating, dispatch, setRegion, onComplete]);

  const back = useCallback(() => {
    if (animating || step === 0) return;
    setDir(-1);
    setAnimating(true);
    setTimeout(() => { setStep((s) => s - 1); setAnimating(false); }, 250);
  }, [animating, step]);

  const canContinue = [
    name.trim().length > 0,
    true, // country is optional (skip allowed)
    true, // pointer step always passable
  ][step];

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{ background: step < 2 ? 'rgba(0,0,0,0.45)' : 'transparent', transition: 'background 0.5s' }}
      />

      {step < 2 ? (
        /* Steps 0-1: Side panel */
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 w-full max-w-md pointer-events-auto"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${dir * 40}px) translateY(-50%)`
              : 'translateX(0) translateY(-50%)',
            transition: 'opacity 0.25s, transform 0.25s',
          }}
        >
          <div
            className="rounded-2xl border p-8"
            style={{
              background: 'rgba(10,5,20,0.85)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(139,92,246,0.2)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.4), 0 0 60px rgba(88,28,135,0.1)',
            }}
          >
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: i === step ? 28 : 8,
                    height: 8,
                    background:
                      i === step
                        ? '#D4A454'
                        : i < step
                          ? 'rgba(139,92,246,0.6)'
                          : 'rgba(255,255,255,0.10)',
                    boxShadow: i === step ? '0 0 12px rgba(212,164,84,0.55)' : 'none',
                  }}
                />
              ))}
            </div>

            {step === 0 && <NameStep name={name} onChange={setName} onSubmit={advance} />}
            {step === 1 && <CountryStep selected={country} onSelect={setCountry} />}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={back}
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(139,92,246,0.5)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(139,92,246,0.8)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(139,92,246,0.5)'; }}
                >
                  &larr; Back
                </button>
              ) : <div />}
              <div className="flex items-center gap-3">
                {step === 1 && !country && (
                  <button
                    onClick={advance}
                    className="text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={advance}
                  disabled={!canContinue}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-30"
                  style={{
                    background: 'rgba(88,28,135,0.55)',
                    border: '1px solid rgba(212,164,84,0.3)',
                    color: '#FFE599',
                  }}
                  onMouseEnter={(e) => {
                    if (canContinue) e.currentTarget.style.background = 'rgba(109,40,217,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(88,28,135,0.55)';
                  }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Step 2: Floating tooltip pointing at the + button */
        <PointerStep onDone={advance} />
      )}
    </div>
  );
}

/* ── Step 0: Name ─────────────────────────────────────────────── */

function NameStep({ name, onChange, onSubmit }: { name: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div>
      <h2
        className="text-xl font-light tracking-wide mb-2"
        style={{ color: '#FFE599' }}
      >
        What&apos;s your name?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
        This will be your star in the sky.
      </p>
      <div
        className="flex items-center px-5 py-4 rounded-2xl border transition-all duration-300"
        style={{
          borderColor: focused ? 'rgba(139,92,246,0.6)' : 'rgba(88,28,135,0.3)',
          background: focused ? 'rgba(88,28,135,0.10)' : 'rgba(88,28,135,0.05)',
          boxShadow: focused ? '0 0 0 3px rgba(88,28,135,0.15)' : 'none',
        }}
      >
        <input
          ref={ref}
          type="text"
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSubmit(); }}
          placeholder="Your name"
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/20 text-lg outline-none caret-amber-400"
          autoComplete="off"
          autoCapitalize="sentences"
          spellCheck={false}
        />
        {name && (
          <button onClick={() => onChange('')} className="text-white/20 hover:text-white/45 transition-colors ml-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step 1: Country search ───────────────────────────────────── */

function CountryStep({ selected, onSelect }: { selected: Region | null; onSelect: (r: Region) => void }) {
  const [query, setQuery] = useState(selected?.displayName ?? '');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const q = query.trim().toLowerCase();
  const notListed = regions.find((r) => r.id === 'not_listed')!;
  const searchable = regions.filter((r) => r.id !== 'not_listed');
  const results =
    q.length < 1
      ? []
      : searchable
          .filter(
            (r) =>
              r.displayName.toLowerCase().includes(q) ||
              r.stateTerritory.toLowerCase().includes(q) ||
              r.countryDescription.toLowerCase().includes(q) ||
              r.alternateNames?.some((n) => n.toLowerCase().includes(q)),
          )
          .slice(0, 6);

  function handlePick(r: Region) {
    setQuery(r.displayName);
    onSelect(r);
  }

  return (
    <div>
      <h2 className="text-xl font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
        Where is your Country?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
        This shapes the kinship and seasons in your sky.
      </p>

      <div className="space-y-2">
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300"
          style={{
            borderColor: focused ? 'rgba(139,92,246,0.6)' : selected ? 'rgba(139,92,246,0.35)' : 'rgba(88,28,135,0.3)',
            background: focused ? 'rgba(88,28,135,0.10)' : selected ? 'rgba(88,28,135,0.07)' : 'rgba(88,28,135,0.04)',
            boxShadow: focused ? '0 0 0 3px rgba(88,28,135,0.15)' : 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'rgba(139,92,246,0.5)', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={ref}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="e.g. Noongar, Yolngu, Wiradjuri\u2026"
            className="flex-1 bg-transparent text-white/90 placeholder:text-white/22 text-lg outline-none caret-violet-400"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); onSelect(null as unknown as Region); }}
              className="text-white/20 hover:text-white/45 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Search results */}
        {q.length > 0 && !selected && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-center text-sm py-3" style={{ color: 'rgba(139,92,246,0.4)' }}>
                No Country found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  onMouseDown={() => handlePick(r)}
                  className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none"
                  style={{ borderColor: 'rgba(88,28,135,0.2)', background: 'rgba(88,28,135,0.04)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(88,28,135,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(88,28,135,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(88,28,135,0.2)';
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="block text-white/85 font-medium">{r.displayName}</span>
                      <span className="block text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.5)' }}>
                        {r.countryDescription}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                      {r.stateTerritory}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {selected && (
          <div className="px-4 py-3 rounded-xl border" style={{ borderColor: 'rgba(139,92,246,0.25)', background: 'rgba(88,28,135,0.06)' }}>
            <p className="text-xs" style={{ color: 'rgba(139,92,246,0.55)' }}>{selected.countryDescription}</p>
          </div>
        )}

        {notListed && (
          <button
            onMouseDown={() => handlePick(notListed)}
            className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 mt-1"
            style={{ borderColor: 'rgba(88,28,135,0.15)', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="text-sm" style={{ color: 'rgba(139,92,246,0.4)' }}>
              My Country isn&apos;t listed
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step 2: Pointer to + button ──────────────────────────────── */

function PointerStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="absolute bottom-28 right-24 pointer-events-auto animate-fade-in">
      <div
        className="rounded-2xl border px-6 py-5 max-w-xs"
        style={{
          background: 'rgba(10,5,20,0.88)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(212,164,84,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(88,28,135,0.1)',
        }}
      >
        <p className="text-sm font-light mb-1" style={{ color: '#FFE599' }}>
          Add a family member
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Press the + button to add someone to your constellation.
        </p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Step 3 of 3
          </span>
          <button
            onClick={onDone}
            className="text-sm transition-colors"
            style={{ color: 'rgba(212,164,84,0.7)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(212,164,84,1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(212,164,84,0.7)'; }}
          >
            Got it &rarr;
          </button>
        </div>
      </div>
      {/* Arrow pointing right toward the + button */}
      <div
        className="absolute -right-4 top-1/2 -translate-y-1/2"
        style={{
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '10px solid rgba(212,164,84,0.25)',
        }}
      />
    </div>
  );
}
