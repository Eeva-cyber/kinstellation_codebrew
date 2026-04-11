'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { regions } from '@/lib/data/regions';
import { kinshipTemplates } from '@/lib/data/kinship-templates';
import { mobGroups, type MobGroup } from '@/lib/data/mob-groups';
import type { Region, Person } from '@/lib/types';

// ─── step definitions ─────────────────────────────────────────────────────────

const STEPS = ['name', 'country', 'mob', 'moiety', 'skinname'] as const;
type Step = typeof STEPS[number];

// ─── progressive constellation icon ──────────────────────────────────────────
// 5-star pentagon that grows one star per step

const CONSTELLATION_STARS = [
  { cx: 44, cy:  8 }, // top      — name
  { cx: 76, cy: 30 }, // right    — country
  { cx: 62, cy: 60 }, // bot-right — mob
  { cx: 26, cy: 60 }, // bot-left  — moiety
  { cx: 12, cy: 30 }, // left      — skinname
] as const;

const CONSTELLATION_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
];
// line i becomes visible when step >= LINE_THRESHOLD[i]
const LINE_THRESHOLD = [1, 2, 3, 4, 4];

function ConstellationProgress({ step }: { step: number }) {
  const visibleCount = step + 1;
  return (
    <div className="flex justify-center mb-8" aria-hidden="true">
      <svg width="88" height="72" viewBox="0 0 88 72">
        {/* Ambient nebula glow behind whole constellation */}
        <ellipse cx="44" cy="36" rx="40" ry="32"
          fill="rgba(88,28,135,0.06)" />

        {/* Lines */}
        {CONSTELLATION_LINES.map(([a, b], i) => {
          const visible = step >= LINE_THRESHOLD[i];
          if (!visible) return null;
          const sa = CONSTELLATION_STARS[a];
          const sb = CONSTELLATION_STARS[b];
          return (
            <g key={i}>
              {/* Glow layer */}
              <line x1={sa.cx} y1={sa.cy} x2={sb.cx} y2={sb.cy}
                stroke="rgba(139,92,246,0.25)" strokeWidth={3}
                strokeLinecap="round" />
              {/* Crisp line */}
              <line x1={sa.cx} y1={sa.cy} x2={sb.cx} y2={sb.cy}
                stroke="rgba(139,92,246,0.55)" strokeWidth={0.8}
                strokeLinecap="round" />
            </g>
          );
        })}

        {/* Stars */}
        {CONSTELLATION_STARS.map((s, i) => {
          const visible = i < visibleCount;
          if (!visible) return null;
          const isCurrent  = i === step;
          const isComplete = i < step;

          return (
            <g key={i}>
              {/* Outer corona */}
              <circle cx={s.cx} cy={s.cy}
                r={isCurrent ? 10 : 7}
                fill={isCurrent ? 'rgba(212,164,84,0.18)' : 'rgba(212,164,84,0.10)'}
                className={isCurrent ? 'animate-star-pulse' : ''} />
              {/* Mid glow */}
              <circle cx={s.cx} cy={s.cy}
                r={isCurrent ? 6 : 4}
                fill={isCurrent ? 'rgba(212,164,84,0.32)' : 'rgba(212,164,84,0.22)'} />
              {/* Main body */}
              <circle cx={s.cx} cy={s.cy}
                r={isCurrent ? 3.5 : isComplete ? 3 : 2.5}
                fill={isComplete ? 'rgba(212,164,84,0.95)' : isCurrent ? 'rgba(255,220,130,0.92)' : 'rgba(212,164,84,0.5)'} />
              {/* White core for completed */}
              {isComplete && (
                <circle cx={s.cx} cy={s.cy} r={1.3} fill="white" opacity={0.85} />
              )}
              {/* Bright specular for current */}
              {isCurrent && (
                <circle cx={s.cx - 1} cy={s.cy - 1} r={1} fill="white" opacity={0.7} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── step indicator ───────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-3 justify-center mb-8">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="rounded-full transition-all duration-500"
            style={{
              width:   i === current ? 28 : 8,
              height:  8,
              background: i === current
                ? '#D4A454'
                : i < current
                  ? 'rgba(139,92,246,0.6)'
                  : 'rgba(255,255,255,0.10)',
              boxShadow: i === current ? '0 0 12px rgba(212,164,84,0.55)' : 'none',
            }}
          />
          {i < STEPS.length - 1 && (
            <div
              className="h-px transition-all duration-500"
              style={{
                width: 20,
                background: i < current
                  ? 'rgba(139,92,246,0.45)'
                  : 'rgba(255,255,255,0.06)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── text input field ─────────────────────────────────────────────────────────

function TextField({
  value, onChange, placeholder, autoFocus, hint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);

  return (
    <div className="w-full">
      <div
        className="relative flex items-center px-5 py-4 rounded-2xl border transition-all duration-300"
        style={{
          borderColor: focused ? 'rgba(139,92,246,0.6)' : 'rgba(88,28,135,0.3)',
          background:  focused ? 'rgba(88,28,135,0.10)' : 'rgba(88,28,135,0.05)',
          boxShadow:   focused ? '0 0 0 3px rgba(88,28,135,0.15), 0 0 24px rgba(88,28,135,0.10)' : 'none',
        }}
      >
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value;
            onChange(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/20 text-lg outline-none caret-amber-400"
          autoComplete="off"
          autoCapitalize="sentences"
          spellCheck={false}
        />
        {value && (
          <button onClick={() => onChange('')} className="text-white/20 hover:text-white/45 transition-colors ml-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {hint && <p className="mt-2.5 text-xs leading-relaxed" style={{ color: 'rgba(139,92,246,0.5)' }}>{hint}</p>}
    </div>
  );
}

// ─── shared search input style ────────────────────────────────────────────────

const searchInputStyle = (focused: boolean, hasValue: boolean) => ({
  borderColor: focused
    ? 'rgba(139,92,246,0.6)'
    : hasValue
      ? 'rgba(139,92,246,0.35)'
      : 'rgba(88,28,135,0.3)',
  background: focused
    ? 'rgba(88,28,135,0.10)'
    : hasValue
      ? 'rgba(88,28,135,0.07)'
      : 'rgba(88,28,135,0.04)',
  boxShadow: focused ? '0 0 0 3px rgba(88,28,135,0.15)' : 'none',
});

// ─── country search step ──────────────────────────────────────────────────────

function CountrySearch({
  selected, onSelect,
}: {
  selected: Region | null;
  onSelect: (r: Region) => void;
}) {
  const [query, setQuery]     = useState(selected?.displayName ?? '');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const q        = query.trim().toLowerCase();
  const notListed = regions.find(r => r.id === 'not_listed')!;
  const searchable = regions.filter(r => r.id !== 'not_listed');
  const results = q.length < 1 ? [] : searchable.filter(r =>
    r.displayName.toLowerCase().includes(q) ||
    r.stateTerritory.toLowerCase().includes(q) ||
    r.countryDescription.toLowerCase().includes(q) ||
    r.alternateNames?.some(n => n.toLowerCase().includes(q))
  ).slice(0, 6);

  const handlePick = (r: Region) => {
    setQuery(r.displayName);
    onSelect(r);
  };

  const style = searchInputStyle(focused, !!selected);

  return (
    <div className="w-full space-y-2">
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300"
        style={style}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ color: 'rgba(139,92,246,0.5)', flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          ref={ref}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="e.g. Noongar, Yolngu, Wiradjuri…"
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/22 text-lg outline-none caret-violet-400"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button onClick={() => { setQuery(''); onSelect(null as unknown as Region); }}
            className="text-white/20 hover:text-white/45 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {q.length > 0 && !selected && (
        <div className="space-y-1">
          {results.length === 0 ? (
            <p className="text-center text-sm py-5" style={{ color: 'rgba(139,92,246,0.4)' }}>
              No Country found for &ldquo;{query}&rdquo;
            </p>
          ) : results.map(r => (
            <button key={r.id} onMouseDown={() => handlePick(r)}
              className="group w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 focus:outline-none"
              style={{ borderColor: 'rgba(88,28,135,0.2)', background: 'rgba(88,28,135,0.04)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(88,28,135,0.2)';
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="block text-white/85 font-medium">{r.displayName}</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.5)' }}>{r.countryDescription}</span>
                </div>
                <span className="shrink-0 text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.4)' }}>{r.stateTerritory}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="px-4 py-3 rounded-xl border"
          style={{ borderColor: 'rgba(139,92,246,0.25)', background: 'rgba(88,28,135,0.06)' }}>
          <p className="text-xs" style={{ color: 'rgba(139,92,246,0.55)' }}>{selected.countryDescription}</p>
        </div>
      )}

      <button onMouseDown={() => handlePick(notListed)}
        className="group w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 mt-1"
        style={{ borderColor: 'rgba(88,28,135,0.15)', background: 'transparent' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span className="text-sm" style={{ color: 'rgba(139,92,246,0.4)' }}>
          My Country isn&apos;t listed
        </span>
      </button>
    </div>
  );
}

// ─── mob / language group search ──────────────────────────────────────────────

function MobSearch({
  value, onSelect,
}: {
  value: string;
  onSelect: (name: string, group?: MobGroup) => void;
}) {
  const [query, setQuery]         = useState(value);
  const [focused, setFocused]     = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const q = query.trim().toLowerCase();

  const results = q.length < 1 ? [] : mobGroups.filter(g =>
    g.name.toLowerCase().includes(q) ||
    g.alternateNames?.some(n => n.toLowerCase().includes(q)) ||
    g.description?.toLowerCase().includes(q) ||
    g.stateTerritory.toLowerCase().includes(q)
  ).slice(0, 8);

  function handlePick(g: MobGroup) {
    setQuery(g.name);
    setSelectedId(g.id);
    onSelect(g.name, g);
  }

  function handleCustom(v: string) {
    const cap = v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v;
    setQuery(cap);
    setSelectedId(null);
    onSelect(cap, undefined);
  }

  const TYPE_LABEL: Record<string, string> = {
    language_group: 'Language group',
    clan: 'Clan',
    community: 'Community',
    nation: 'Nation',
  };

  const selected = selectedId !== null;
  const style = searchInputStyle(focused, selected || query.length > 0);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300"
        style={style}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ color: 'rgba(139,92,246,0.5)', flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          ref={ref}
          type="text"
          value={query}
          onChange={e => handleCustom(e.target.value)}
          onFocus={() => { setFocused(true); setSelectedId(null); }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="e.g. Wiradjuri, Arrernte, Koori…"
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/22 text-lg outline-none caret-violet-400"
          autoComplete="off"
          autoCapitalize="sentences"
          spellCheck={false}
        />
        {query && (
          <button onClick={() => { setQuery(''); setSelectedId(null); onSelect('', undefined); }}
            className="text-white/20 hover:text-white/45 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Search results */}
      {focused && q.length > 0 && !selected && (
        <div className="space-y-1">
          {results.length === 0 ? (
            <div className="px-4 py-4 text-center space-y-1">
              <p className="text-sm" style={{ color: 'rgba(139,92,246,0.4)' }}>
                No match — your mob will be saved as typed.
              </p>
            </div>
          ) : (
            results.map(g => (
              <button key={g.id} onMouseDown={() => handlePick(g)}
                className="group w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 focus:outline-none"
                style={{ borderColor: 'rgba(88,28,135,0.2)', background: 'rgba(88,28,135,0.04)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.04)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(88,28,135,0.2)';
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-white/88 font-medium">{g.name}</span>
                    {g.description && (
                      <span className="block text-xs mt-0.5 truncate" style={{ color: 'rgba(139,92,246,0.5)' }}>
                        {g.description}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-xs" style={{ color: 'rgba(212,164,84,0.5)' }}>
                      {TYPE_LABEL[g.type]}
                    </span>
                    <span className="block text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                      {g.stateTerritory}
                    </span>
                  </div>
                </div>
                {g.skinNames && g.skinNames.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {g.skinNames.slice(0, 4).map(sn => (
                      <span key={sn} className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(88,28,135,0.2)', color: 'rgba(212,164,84,0.6)' }}>
                        {sn}
                      </span>
                    ))}
                    {g.skinNames.length > 4 && (
                      <span className="text-xs" style={{ color: 'rgba(139,92,246,0.35)' }}>
                        +{g.skinNames.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Confirmed selection */}
      {selected && (
        <div className="px-4 py-3 rounded-xl border"
          style={{ borderColor: 'rgba(139,92,246,0.25)', background: 'rgba(88,28,135,0.06)' }}>
          <p className="text-xs" style={{ color: 'rgba(139,92,246,0.55)' }}>
            {mobGroups.find(g => g.id === selectedId)?.description ?? 'Saved as custom mob.'}
          </p>
        </div>
      )}

      <p className="text-xs px-1 leading-relaxed" style={{ color: 'rgba(139,92,246,0.35)' }}>
        Can&apos;t find yours? Type it in — any name you use is valid.
      </p>
    </div>
  );
}

// ─── moiety picker ────────────────────────────────────────────────────────────

function MoietyPicker({
  region, value, onChange,
}: {
  region: Region | null;
  value: string;
  onChange: (v: string) => void;
}) {
  if (!region) return null;

  const template = kinshipTemplates[region.kinshipTemplateType];
  const names    = template.moietyNames ?? [];

  if (names.length === 0) return (
    <p className="text-sm text-center" style={{ color: 'rgba(139,92,246,0.4)' }}>
      No moiety system recorded for this Country yet.
    </p>
  );

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {names.map(name => {
          const active = value === name;
          return (
            <button key={name} onClick={() => onChange(active ? '' : name)}
              className="px-4 py-3 rounded-xl border text-sm font-light transition-all duration-200 text-left"
              style={{
                borderColor: active ? 'rgba(212,164,84,0.55)' : 'rgba(88,28,135,0.3)',
                background:  active ? 'rgba(88,28,135,0.25)' : 'rgba(88,28,135,0.05)',
                color:       active ? '#D4A454' : 'rgba(255,255,255,0.55)',
                boxShadow:   active ? '0 0 20px rgba(212,164,84,0.12), 0 0 0 1px rgba(212,164,84,0.2)' : 'none',
              }}>
              {name}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onChange('not_sure')}
        className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200"
        style={{
          borderColor: value === 'not_sure' ? 'rgba(139,92,246,0.4)' : 'rgba(88,28,135,0.2)',
          background:  value === 'not_sure' ? 'rgba(88,28,135,0.12)' : 'transparent',
          color:       'rgba(255,255,255,0.30)',
        }}>
        I&apos;m not sure
      </button>
      <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(139,92,246,0.35)' }}>
        {template.description}
      </p>
    </div>
  );
}

// ─── skin name picker ─────────────────────────────────────────────────────────

function SkinNamePicker({
  region, selectedMob, value, onChange,
}: {
  region: Region | null;
  selectedMob?: MobGroup;
  value: string;
  onChange: (v: string) => void;
}) {
  if (!region) return null;

  // Prefer skin names from the selected mob group, fall back to kinship template sections
  const template = kinshipTemplates[region.kinshipTemplateType];
  const names = selectedMob?.skinNames ?? template.sectionNames ?? [];

  if (names.length === 0) return (
    <div className="text-center space-y-3">
      <p className="text-sm" style={{ color: 'rgba(139,92,246,0.4)' }}>
        No skin name system recorded for this Country.
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(139,92,246,0.28)' }}>
        Skin name systems belong to specific language groups. Your Country may use a different
        naming tradition or this information hasn&apos;t been recorded yet.
      </p>
    </div>
  );

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {names.map(name => {
          const active = value === name;
          return (
            <button key={name} onClick={() => onChange(active ? '' : name)}
              className="px-4 py-3 rounded-xl border text-sm font-light transition-all duration-200 text-left"
              style={{
                borderColor: active ? 'rgba(212,164,84,0.55)' : 'rgba(88,28,135,0.3)',
                background:  active ? 'rgba(88,28,135,0.25)' : 'rgba(88,28,135,0.05)',
                color:       active ? '#D4A454' : 'rgba(255,255,255,0.55)',
                boxShadow:   active ? '0 0 20px rgba(212,164,84,0.12), 0 0 0 1px rgba(212,164,84,0.2)' : 'none',
              }}>
              {name}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onChange('not_sure')}
        className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200"
        style={{
          borderColor: value === 'not_sure' ? 'rgba(139,92,246,0.4)' : 'rgba(88,28,135,0.2)',
          background:  value === 'not_sure' ? 'rgba(88,28,135,0.12)' : 'transparent',
          color:       'rgba(255,255,255,0.30)',
        }}>
        I&apos;m not sure
      </button>
      <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(139,92,246,0.35)' }}>
        {template.description}
      </p>
    </div>
  );
}

// ─── main profile creation component ─────────────────────────────────────────

export function RegionSelector() {
  const { setRegion, dispatch } = useApp();
  const router = useRouter();

  const [step,        setStep]        = useState<number>(0);
  const [name,        setName]        = useState('');
  const [country,     setCountry]     = useState<Region | null>(null);
  const [mob,         setMob]         = useState('');
  const [selectedMob, setSelectedMob] = useState<MobGroup | undefined>(undefined);
  const [moiety,      setMoiety]      = useState('');
  const [skinName,    setSkinName]    = useState('');
  const [dir,         setDir]         = useState<1 | -1>(1);
  const [animating,   setAnimating]   = useState(false);

  const goTo = useCallback((next: number) => {
    setDir(next > step ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 220);
  }, [step]);

  const canContinue = [
    name.trim().length > 0,  // step 0: name required
    country !== null,         // step 1: country required
    true,                     // step 2: mob optional
    true,                     // step 3: moiety optional
    true,                     // step 4: skin name optional
  ][step];

  function handleFinish() {
    const existingSelfId = localStorage.getItem('kinstellation_self_id');

    if (country) setRegion(country.id);

    const cleanSkinName = skinName && skinName !== 'not_sure' ? skinName : null;
    const cleanMoiety   = moiety && moiety !== 'not_sure' ? moiety : null;
    localStorage.setItem('kinstellation_profile', JSON.stringify({
      name: name.trim(),
      mob: mob.trim() || null,
      skinName: cleanSkinName,
      moiety: cleanMoiety,
    }));

    if (!existingSelfId) {
      const selfId = crypto.randomUUID();
      const selfPerson: Person = {
        id: selfId,
        displayName: name.trim(),
        skinName: cleanSkinName ?? undefined,
        moiety: cleanMoiety ?? undefined,
        countryLanguageGroup: mob.trim() || undefined,
        regionSelectorValue: country?.id ?? '',
        isDeceased: false,
        stories: [],
        visibility: 'public',
        lastUpdated: new Date().toISOString(),
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      };
      dispatch({ type: 'ADD_PERSON', payload: selfPerson });
      localStorage.setItem('kinstellation_self_id', selfId);
    }

    router.push('/canvas');
  }

  const STEP_CONTENT: Record<number, { heading: string; sub: string; skip?: boolean }> = {
    0: { heading: 'What\'s your name?',              sub: 'This is how you\'ll appear in your constellation.' },
    1: { heading: 'Which is your Country?',          sub: 'Search your language group, nation, or Country name.' },
    2: { heading: 'What\'s your mob?',               sub: 'Your community, clan, or language group — however you describe it.', skip: true },
    3: { heading: 'Which moiety do you belong to?',  sub: 'Moiety is your inherited half of creation. Skip if you\'re unsure.', skip: true },
    4: { heading: 'What\'s your skin name?',         sub: 'Skin names place you within the kinship system. Skip if you\'re unsure.', skip: true },
  };

  const info = STEP_CONTENT[step];

  return (
    <div className="relative max-w-lg w-full">

      {/* Card */}
      <div
        className="relative rounded-3xl px-8 py-10"
        style={{
          background: 'rgba(8,4,22,0.92)',
          border: '1px solid rgba(88,28,135,0.4)',
          boxShadow: '0 0 80px rgba(88,28,135,0.18), 0 0 40px rgba(88,28,135,0.08), 0 30px 60px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Inner top purple glow */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(212,164,84,0.2), rgba(139,92,246,0.4), transparent)' }} />

        {/* Progressive constellation */}
        <ConstellationProgress step={step} />

        {/* Step dots */}
        <StepDots current={step} />

        {/* Animated content */}
        <div
          style={{
            opacity:    animating ? 0 : 1,
            transform:  animating ? `translateX(${dir * 24}px)` : 'translateX(0)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light tracking-tight mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {info.heading}
            </h1>
            <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'rgba(139,92,246,0.6)' }}>
              {info.sub}
            </p>
          </div>

          {/* Input for this step */}
          <div className="mb-8">
            {step === 0 && (
              <TextField
                value={name}
                onChange={setName}
                placeholder="Your name"
                autoFocus
              />
            )}
            {step === 1 && (
              <CountrySearch selected={country} onSelect={setCountry} />
            )}
            {step === 2 && (
              <MobSearch
                value={mob}
                onSelect={(name, group) => { setMob(name); setSelectedMob(group); }}
              />
            )}
            {step === 3 && (
              <MoietyPicker region={country} value={moiety} onChange={setMoiety} />
            )}
            {step === 4 && (
              <SkinNamePicker
                region={country}
                selectedMob={selectedMob}
                value={skinName}
                onChange={setSkinName}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Continue / Finish */}
            <button
              onClick={step < STEPS.length - 1 ? () => goTo(step + 1) : handleFinish}
              disabled={!canContinue}
              className="w-full py-4 rounded-2xl font-light tracking-wide text-base transition-all duration-300"
              style={{
                background: canContinue ? 'rgba(88,28,135,0.55)' : 'rgba(88,28,135,0.12)',
                border:     `1px solid ${canContinue ? 'rgba(212,164,84,0.5)' : 'rgba(88,28,135,0.25)'}`,
                color:      canContinue ? '#D4A454' : 'rgba(139,92,246,0.3)',
                boxShadow:  canContinue ? '0 0 30px rgba(88,28,135,0.3), 0 0 60px rgba(212,164,84,0.08)' : 'none',
                cursor:     canContinue ? 'pointer' : 'not-allowed',
              }}
            >
              {step < STEPS.length - 1 ? 'Continue' : 'Enter the sky →'}
            </button>

            {/* Back / Skip row */}
            <div className="flex justify-between items-center">
              {step > 0 ? (
                <button onClick={() => goTo(step - 1)}
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(139,92,246,0.4)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(139,92,246,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,92,246,0.4)')}>
                  ← Back
                </button>
              ) : <span />}
              {info.skip && (
                <button onClick={step < STEPS.length - 1 ? () => goTo(step + 1) : handleFinish}
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(139,92,246,0.35)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(139,92,246,0.6)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,92,246,0.35)')}>
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <p className="text-center text-xs mt-6 leading-relaxed px-4" style={{ color: 'rgba(88,28,135,0.5)' }}>
        Language groups sourced from the AIATSIS Map of Indigenous Australia.
        Skin name systems belong to their communities — this platform holds no ownership of that knowledge.
      </p>
    </div>
  );
}
