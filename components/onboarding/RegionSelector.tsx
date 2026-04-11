'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { regions } from '@/lib/data/regions';
import { kinshipTemplates } from '@/lib/data/kinship-templates';
import { mobGroups, type MobGroup } from '@/lib/data/mob-groups';
import { supabase } from '@/lib/supabase';
import type { Region, Person } from '@/lib/types';

// ─── step definitions ─────────────────────────────────────────────────────────

const STEPS = ['name', 'nation', 'language', 'community', 'moiety'] as const;
type Step = typeof STEPS[number];

// ─── progressive constellation (5 stars, pentagonal) ─────────────────────────

const STARS = [
  { cx: 46, cy:  6 }, // 0 — name      (top)
  { cx: 78, cy: 30 }, // 1 — nation    (upper right)
  { cx: 66, cy: 68 }, // 2 — language  (lower right)
  { cx: 26, cy: 68 }, // 3 — community (lower left)
  { cx: 14, cy: 30 }, // 4 — moiety    (upper left)
] as const;

const LINES: [number, number, number][] = [
  [0, 1, 1], // name → nation
  [1, 2, 2], // nation → language
  [2, 3, 3], // language → community
  [3, 4, 4], // community → moiety
  [4, 0, 4], // moiety → name (closes pentagon)
];

function ConstellationProgress({ step }: { step: number }) {
  return (
    <div className="flex justify-center mb-7" aria-hidden="true">
      <svg width="92" height="80" viewBox="0 0 92 80">
        {/* Ambient glow */}
        <ellipse cx="46" cy="40" rx="42" ry="36" fill="rgba(88,28,135,0.07)" />

        {/* Lines */}
        {LINES.map(([a, b, threshold], i) => {
          if (step < threshold) return null;
          const sa = STARS[a], sb = STARS[b];
          return (
            <g key={i}>
              <line x1={sa.cx} y1={sa.cy} x2={sb.cx} y2={sb.cy}
                stroke="rgba(139,92,246,0.22)" strokeWidth={3} strokeLinecap="round" />
              <line x1={sa.cx} y1={sa.cy} x2={sb.cx} y2={sb.cy}
                stroke="rgba(139,92,246,0.6)" strokeWidth={0.85} strokeLinecap="round" />
            </g>
          );
        })}

        {/* Stars */}
        {STARS.map((s, i) => {
          if (i > step) return null;
          const isCurrent  = i === step;
          const isComplete = i < step;
          return (
            <g key={i}>
              {/* Outer corona */}
              <circle cx={s.cx} cy={s.cy} r={isCurrent ? 11 : 7}
                fill={isCurrent ? 'rgba(212,164,84,0.16)' : 'rgba(212,164,84,0.09)'}
                className={isCurrent ? 'animate-star-pulse' : ''} />
              {/* Mid glow */}
              <circle cx={s.cx} cy={s.cy} r={isCurrent ? 6.5 : 4.5}
                fill={isCurrent ? 'rgba(212,164,84,0.30)' : 'rgba(212,164,84,0.20)'} />
              {/* Body */}
              <circle cx={s.cx} cy={s.cy}
                r={isCurrent ? 3.8 : isComplete ? 3.2 : 2.8}
                fill={isComplete ? 'rgba(212,164,84,0.95)' : isCurrent ? 'rgba(255,220,130,0.92)' : 'rgba(212,164,84,0.5)'} />
              {/* White core for completed stars */}
              {isComplete && <circle cx={s.cx} cy={s.cy} r={1.4} fill="white" opacity={0.85} />}
              {/* Specular for current star */}
              {isCurrent && <circle cx={s.cx - 1.2} cy={s.cy - 1.2} r={1.1} fill="white" opacity={0.7} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── step dots ────────────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-7">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="rounded-full transition-all duration-500" style={{
            width:      i === current ? 24 : 7,
            height:     7,
            background: i === current ? '#D4A454' : i < current ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.09)',
            boxShadow:  i === current ? '0 0 10px rgba(212,164,84,0.5)' : 'none',
          }} />
          {i < STEPS.length - 1 && (
            <div className="h-px transition-all duration-500" style={{
              width: 14,
              background: i < current ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── shared input style helper ────────────────────────────────────────────────

function inputStyle(focused: boolean, hasValue: boolean): React.CSSProperties {
  return {
    borderColor: focused ? 'rgba(212,164,84,0.6)' : hasValue ? 'rgba(139,92,246,0.55)' : 'rgba(139,92,246,0.3)',
    background:  focused ? 'rgba(88,28,135,0.2)' : hasValue ? 'rgba(88,28,135,0.14)' : 'rgba(88,28,135,0.08)',
    boxShadow:   focused ? '0 0 0 3px rgba(88,28,135,0.22), 0 0 20px rgba(212,164,84,0.08)' : 'none',
  };
}

const dropdownContainerStyle: React.CSSProperties = {
  border: '1px solid rgba(139,92,246,0.45)',
  background: 'rgba(8,4,22,0.98)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.75), 0 0 0 1px rgba(88,28,135,0.2)',
};

// ─── shared search input wrapper ──────────────────────────────────────────────

function SearchBox({
  value, onChange, onFocus, onBlur, placeholder, focused, hasValue, icon,
}: {
  value: string; onChange: (v: string) => void;
  onFocus: () => void; onBlur: () => void;
  placeholder: string; focused: boolean; hasValue: boolean;
  icon?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300"
      style={inputStyle(focused, hasValue)}>
      {icon ?? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
          style={{ color: 'rgba(139,92,246,0.5)', flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => {
          const v = e.target.value;
          onChange(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white/95 placeholder:text-white/30 text-lg outline-none caret-amber-400"
        autoComplete="off"
        autoCapitalize="sentences"
        spellCheck={false}
      />
      {value && (
        <button onClick={() => onChange('')} className="text-white/20 hover:text-white/45 transition-colors">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── shared result button ─────────────────────────────────────────────────────

function ResultRow({
  title, sub, badge, badge2, onPick,
}: {
  title: string; sub?: string; badge?: string; badge2?: string; onPick: () => void;
}) {
  return (
    <button
      onMouseDown={onPick}
      className="w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 focus:outline-none"
      style={{ borderColor: 'transparent', background: 'transparent' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.18)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.22)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-white/88 font-medium">{title}</span>
          {sub && <span className="block text-xs mt-0.5 truncate" style={{ color: 'rgba(139,92,246,0.52)' }}>{sub}</span>}
        </div>
        {(badge || badge2) && (
          <div className="shrink-0 text-right">
            {badge  && <span className="block text-xs" style={{ color: 'rgba(212,164,84,0.55)' }}>{badge}</span>}
            {badge2 && <span className="block text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.42)' }}>{badge2}</span>}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── name field ───────────────────────────────────────────────────────────────

function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex items-center px-5 py-4 rounded-2xl border transition-all duration-300"
      style={inputStyle(focused, value.length > 0)}>
      <input
        type="text"
        value={value}
        onChange={e => { const v = e.target.value; onChange(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Your name"
        autoFocus
        className="flex-1 bg-transparent text-white/90 placeholder:text-white/20 text-lg outline-none caret-amber-400"
        autoComplete="off"
        autoCapitalize="sentences"
        spellCheck={false}
      />
      {value && (
        <button onClick={() => onChange('')} className="text-white/20 hover:text-white/45 transition-colors ml-3">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── nation search ────────────────────────────────────────────────────────────

function NationSearch({ selected, onSelect }: { selected: Region | null; onSelect: (r: Region) => void }) {
  const [query, setQuery]     = useState(selected?.displayName ?? '');
  const [focused, setFocused] = useState(false);

  const q           = query.trim().toLowerCase();
  const notListed   = regions.find(r => r.id === 'not_listed')!;
  const searchable  = regions.filter(r => r.id !== 'not_listed');
  const results     = q.length < 1 ? [] : searchable.filter(r =>
    r.displayName.toLowerCase().includes(q) ||
    r.alternateNames?.some(n => n.toLowerCase().includes(q)) ||
    r.countryDescription.toLowerCase().includes(q)
  ).slice(0, 20);

  const pick = (r: Region) => { setQuery(r.displayName); onSelect(r); };

  return (
    <div className="w-full space-y-2">
      <SearchBox
        value={query}
        onChange={v => { setQuery(v); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="e.g. Wurundjeri, Gunditjmara, Yorta Yorta…"
        focused={focused}
        hasValue={!!selected}
      />

      {q.length > 0 && !selected && (
        <div className="rounded-xl overflow-hidden" style={dropdownContainerStyle}>
          <div className="panel-scroll p-1.5" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <p className="text-center text-sm py-5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                No Nation found for &ldquo;{query}&rdquo;
              </p>
            ) : results.map(r => (
              <ResultRow key={r.id}
                title={r.displayName}
                sub={r.countryDescription}
                badge2={r.stateTerritory}
                onPick={() => pick(r)}
              />
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="px-4 py-3 rounded-xl border"
          style={{ borderColor: 'rgba(139,92,246,0.22)', background: 'rgba(88,28,135,0.06)' }}>
          <p className="text-xs" style={{ color: 'rgba(139,92,246,0.55)' }}>{selected.countryDescription}</p>
        </div>
      )}

      <button
        onMouseDown={() => pick(notListed)}
        className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200"
        style={{ borderColor: 'rgba(88,28,135,0.15)', background: 'transparent' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span className="text-sm" style={{ color: 'rgba(139,92,246,0.4)' }}>My Nation isn&apos;t listed</span>
      </button>
    </div>
  );
}

// ─── clan search ──────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  language_group: 'Language group',
  clan: 'Clan',
  community: 'Community',
  nation: 'Nation',
};

function ClanSearch({
  value, nationId, onSelect,
}: {
  value: string;
  nationId?: string;
  onSelect: (name: string, group?: MobGroup) => void;
}) {
  const [query,      setQuery]      = useState(value);
  const [focused,    setFocused]    = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  // Clans for the selected nation come first; then all others
  const nationClans  = nationId ? mobGroups.filter(g => g.nationId === nationId) : [];
  const otherGroups  = mobGroups.filter(g => !g.nationId || g.nationId !== nationId);
  const pool         = [...nationClans, ...otherGroups];

  const results = q.length < 1
    ? nationClans.slice(0, 10)
    : pool.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.alternateNames?.some(n => n.toLowerCase().includes(q)) ||
        g.description?.toLowerCase().includes(q)
      ).slice(0, 20);

  const pick = (g: MobGroup) => { setQuery(g.name); setSelectedId(g.id); onSelect(g.name, g); };
  const custom = (v: string) => { setQuery(v); setSelectedId(null); onSelect(v, undefined); };

  const isSelected = selectedId !== null;

  // Show dropdown when focused and either query or nation clans exist
  const showDropdown = focused && !isSelected && (q.length > 0 || nationClans.length > 0);

  return (
    <div className="w-full space-y-2">
      <SearchBox
        value={query}
        onChange={custom}
        onFocus={() => { setFocused(true); setSelectedId(null); }}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search or type your clan…"
        focused={focused}
        hasValue={isSelected || query.length > 0}
      />

      {showDropdown && (
        <div className="rounded-xl overflow-hidden" style={dropdownContainerStyle}>
          {nationClans.length > 0 && q.length === 0 && (
            <p className="px-4 pt-3 pb-1 text-xs" style={{ color: 'rgba(139,92,246,0.45)' }}>
              Known clans for your Nation
            </p>
          )}
          <div className="panel-scroll p-1.5" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <p className="text-center text-sm py-5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                No match — your clan will be saved as typed.
              </p>
            ) : results.map(g => (
              <ResultRow key={g.id}
                title={g.name}
                sub={g.description}
                badge={TYPE_LABEL[g.type]}
                onPick={() => pick(g)}
              />
            ))}
          </div>
        </div>
      )}

      {isSelected && (
        <div className="px-4 py-3 rounded-xl border"
          style={{ borderColor: 'rgba(139,92,246,0.22)', background: 'rgba(88,28,135,0.06)' }}>
          <p className="text-xs" style={{ color: 'rgba(139,92,246,0.55)' }}>
            {mobGroups.find(g => g.id === selectedId)?.description ?? ''}
          </p>
        </div>
      )}

      <p className="text-xs px-1 leading-relaxed" style={{ color: 'rgba(139,92,246,0.35)' }}>
        Can&apos;t find yours? Type it in — any name you use is right.
      </p>
    </div>
  );
}

// ─── community search ─────────────────────────────────────────────────────────

function CommunitySearch({
  value, nationId, onSelect,
}: {
  value: string;
  nationId?: string;
  onSelect: (name: string, group?: MobGroup) => void;
}) {
  const [query,      setQuery]      = useState(value);
  const [focused,    setFocused]    = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  const communities     = mobGroups.filter(g => g.type === 'community');
  const nationComms     = nationId ? communities.filter(g => g.nationId === nationId) : [];
  const generalComms    = communities.filter(g => !g.nationId);
  // Pool: nation-specific first, then general (Koorie, Urban Koorie)
  const pool            = [...nationComms, ...generalComms];

  const results = q.length < 1
    ? pool.slice(0, 10)
    : communities.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.alternateNames?.some(n => n.toLowerCase().includes(q)) ||
        g.description?.toLowerCase().includes(q)
      ).slice(0, 20);

  const pick   = (g: MobGroup) => { setQuery(g.name); setSelectedId(g.id); onSelect(g.name, g); };
  const custom = (v: string)   => { setQuery(v); setSelectedId(null); onSelect(v, undefined); };

  const isSelected  = selectedId !== null;
  const showDropdown = focused && !isSelected && (q.length > 0 || pool.length > 0);

  return (
    <div className="w-full space-y-2">
      <SearchBox
        value={query}
        onChange={custom}
        onFocus={() => { setFocused(true); setSelectedId(null); }}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search or type your community…"
        focused={focused}
        hasValue={isSelected || query.length > 0}
      />

      {showDropdown && (
        <div className="rounded-xl overflow-hidden" style={dropdownContainerStyle}>
          {pool.length > 0 && q.length === 0 && (
            <p className="px-4 pt-3 pb-1 text-xs" style={{ color: 'rgba(139,92,246,0.45)' }}>
              {nationComms.length > 0 ? 'Known communities for your Nation' : 'Victorian Aboriginal communities'}
            </p>
          )}
          <div className="panel-scroll p-1.5" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <p className="text-center text-sm py-5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                No match — your community will be saved as typed.
              </p>
            ) : results.map(g => (
              <ResultRow key={g.id}
                title={g.name}
                sub={g.description}
                onPick={() => pick(g)}
              />
            ))}
          </div>
        </div>
      )}

      {isSelected && (
        <div className="px-4 py-3 rounded-xl border"
          style={{ borderColor: 'rgba(139,92,246,0.22)', background: 'rgba(88,28,135,0.06)' }}>
          <p className="text-xs" style={{ color: 'rgba(139,92,246,0.55)' }}>
            {mobGroups.find(g => g.id === selectedId)?.description ?? ''}
          </p>
        </div>
      )}

      <p className="text-xs px-1 leading-relaxed" style={{ color: 'rgba(139,92,246,0.35)' }}>
        Can&apos;t find yours? Type it in — any community name you use is right.
      </p>
    </div>
  );
}

// ─── moiety picker ────────────────────────────────────────────────────────────
// Resolves effective region from: selected nation → clan's nation → community's nation.
// Shows moiety buttons when names are documented; free-text input otherwise.

function MoietyPicker({ region, community, value, onChange }: {
  region: Region | null;
  community?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [textFocused, setTextFocused] = useState(false);

  // 'not_listed' is a sentinel — treat as no nation for moiety resolution
  let effectiveRegion: Region | null = (region && region.id !== 'not_listed') ? region : null;
  let inferredFrom: string | null = null;

  if (!effectiveRegion && community) {
    const commGroup = mobGroups.find(g =>
      g.name.toLowerCase() === community.toLowerCase() ||
      g.alternateNames?.some(n => n.toLowerCase() === community.toLowerCase())
    );
    if (commGroup?.nationId) {
      const r = regions.find(r => r.id === commGroup.nationId) ?? null;
      if (r) { effectiveRegion = r; inferredFrom = `your Community (${community})`; }
    }
  }

  const template    = effectiveRegion ? kinshipTemplates[effectiveRegion.kinshipTemplateType] : null;
  const names       = template?.moietyNames ?? [];
  const notSureActive = value === 'not_sure';

  // ── Case 1: known moiety names ─────────────────────────────────────────────
  if (names.length > 0) {
    return (
      <div className="w-full space-y-3">
        {inferredFrom && (
          <p className="text-xs text-center pb-1" style={{ color: 'rgba(212,164,84,0.45)' }}>
            Based on {inferredFrom} — {effectiveRegion!.displayName}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {names.map(name => {
            const active = value === name;
            return (
              <button key={name} onClick={() => onChange(active ? '' : name)}
                className="px-4 py-3.5 rounded-xl border text-sm font-light transition-all duration-200 text-left"
                style={{
                  borderColor: active ? 'rgba(212,164,84,0.55)' : 'rgba(88,28,135,0.3)',
                  background:  active ? 'rgba(88,28,135,0.28)' : 'rgba(88,28,135,0.05)',
                  color:       active ? '#D4A454' : 'rgba(255,255,255,0.55)',
                  boxShadow:   active ? '0 0 20px rgba(212,164,84,0.10), 0 0 0 1px rgba(212,164,84,0.18)' : 'none',
                }}>
                {name}
              </button>
            );
          })}
        </div>
        <button onClick={() => onChange(notSureActive ? '' : 'not_sure')}
          className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200"
          style={{
            borderColor: notSureActive ? 'rgba(139,92,246,0.4)' : 'rgba(88,28,135,0.2)',
            background:  notSureActive ? 'rgba(88,28,135,0.12)' : 'transparent',
            color: 'rgba(255,255,255,0.30)',
          }}>
          I&apos;m not sure
        </button>
        <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(139,92,246,0.32)' }}>
          {template!.description}
        </p>
      </div>
    );
  }

  // ── Case 2: no documented moiety names — free text + "I'm not sure" ────────
  return (
    <div className="w-full space-y-3">
      {effectiveRegion ? (
        <p className="text-sm text-center" style={{ color: 'rgba(139,92,246,0.45)' }}>
          Moiety names for {effectiveRegion.displayName} are not yet recorded here.
        </p>
      ) : (
        <p className="text-sm text-center" style={{ color: 'rgba(139,92,246,0.45)' }}>
          Many Victorian nations have a moiety system — two complementary halves of Country.
        </p>
      )}

      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300"
        style={inputStyle(textFocused, !notSureActive && value.length > 0)}>
        <input
          type="text"
          value={notSureActive ? '' : value}
          onChange={e => {
            const v = e.target.value;
            onChange(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v);
          }}
          onFocus={() => setTextFocused(true)}
          onBlur={() => setTextFocused(false)}
          placeholder="Enter your moiety name…"
          autoFocus
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/22 text-base outline-none caret-violet-400"
          autoComplete="off"
          autoCapitalize="sentences"
          spellCheck={false}
        />
        {value && !notSureActive && (
          <button onClick={() => onChange('')} className="text-white/20 hover:text-white/45 transition-colors">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <button onClick={() => onChange(notSureActive ? '' : 'not_sure')}
        className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200"
        style={{
          borderColor: notSureActive ? 'rgba(139,92,246,0.4)' : 'rgba(88,28,135,0.2)',
          background:  notSureActive ? 'rgba(88,28,135,0.12)' : 'transparent',
          color: 'rgba(255,255,255,0.30)',
        }}>
        I&apos;m not sure
      </button>

      <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(139,92,246,0.28)' }}>
        Moiety law belongs to communities. Type yours if you know it, or skip for now.
      </p>
    </div>
  );
}

// ─── language search ──────────────────────────────────────────────────────────
// Shows Victorian Aboriginal language groups keyed to the selected nation.
// Language group ≠ Nation name — a Nation may speak one or more languages,
// and a language group may span multiple clans/Nations.

function LanguageSearch({
  value, nationId, onSelect,
}: {
  value: string;
  nationId?: string;
  onSelect: (name: string) => void;
}) {
  const [query,      setQuery]      = useState(value);
  const [focused,    setFocused]    = useState(false);
  const [confirmed,  setConfirmed]  = useState(value.length > 0);

  const q = query.trim().toLowerCase();

  const langGroups   = mobGroups.filter(g => g.type === 'language_group');
  const nationLangs  = nationId ? langGroups.filter(g => g.nationId === nationId) : [];
  const otherLangs   = langGroups.filter(g => !g.nationId || g.nationId !== nationId);
  const pool         = [...nationLangs, ...otherLangs];

  const results = q.length < 1
    ? nationLangs.slice(0, 10)
    : pool.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.alternateNames?.some(n => n.toLowerCase().includes(q)) ||
        g.description?.toLowerCase().includes(q)
      ).slice(0, 20);

  const pick   = (g: { name: string }) => { setQuery(g.name); setConfirmed(true); onSelect(g.name); };
  const custom = (v: string)           => { setQuery(v); setConfirmed(false); onSelect(v); };

  const showDropdown = focused && !confirmed && (q.length > 0 || nationLangs.length > 0);

  return (
    <div className="w-full space-y-2">
      <SearchBox
        value={query}
        onChange={custom}
        onFocus={() => { setFocused(true); setConfirmed(false); }}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="e.g. Woi wurrung, Dja Dja wurrung…"
        focused={focused}
        hasValue={confirmed || query.length > 0}
      />

      {showDropdown && (
        <div className="rounded-xl overflow-hidden" style={dropdownContainerStyle}>
          {nationLangs.length > 0 && q.length === 0 && (
            <p className="px-4 pt-3 pb-1 text-xs" style={{ color: 'rgba(139,92,246,0.45)' }}>
              Known languages for your Nation
            </p>
          )}
          <div className="panel-scroll p-1.5" style={{ maxHeight: 280, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <p className="text-center text-sm py-5" style={{ color: 'rgba(139,92,246,0.4)' }}>
                No match — your language group will be saved as typed.
              </p>
            ) : results.map((g, i) => (
              <ResultRow key={i}
                title={g.name}
                sub={g.description}
                onPick={() => pick(g)}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs px-1 leading-relaxed" style={{ color: 'rgba(139,92,246,0.35)' }}>
        Can&apos;t find yours? Type it in — or skip if you&apos;re not sure.
      </p>
    </div>
  );
}

// ─── skin name picker ─────────────────────────────────────────────────────────

function SkinNamePicker({ region, value, onChange }: {
  region: Region | null; value: string; onChange: (v: string) => void;
}) {
  if (!region) return null;

  const template = kinshipTemplates[region.kinshipTemplateType];
  const names    = template.sectionNames ?? [];

  if (names.length === 0) return (
    <div className="text-center space-y-3">
      <p className="text-sm" style={{ color: 'rgba(139,92,246,0.45)' }}>
        Skin name systems are not a Victorian tradition.
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(139,92,246,0.28)' }}>
        Section names like Japanangka or Japangardi come from Central and Western Desert peoples.
        Victorian kinship is organised through moiety (Bunjil/Waa for Kulin peoples) and clan.
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
              className="px-4 py-3.5 rounded-xl border text-sm font-light transition-all duration-200 text-left"
              style={{
                borderColor: active ? 'rgba(212,164,84,0.55)' : 'rgba(88,28,135,0.3)',
                background:  active ? 'rgba(88,28,135,0.28)' : 'rgba(88,28,135,0.05)',
                color:       active ? '#D4A454' : 'rgba(255,255,255,0.55)',
                boxShadow:   active ? '0 0 20px rgba(212,164,84,0.10)' : 'none',
              }}>
              {name}
            </button>
          );
        })}
      </div>
      <button onClick={() => onChange('not_sure')}
        className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200"
        style={{
          borderColor: value === 'not_sure' ? 'rgba(139,92,246,0.4)' : 'rgba(88,28,135,0.2)',
          background:  value === 'not_sure' ? 'rgba(88,28,135,0.12)' : 'transparent',
          color: 'rgba(255,255,255,0.30)',
        }}>
        I&apos;m not sure
      </button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function RegionSelector() {
  const { setRegion, dispatch } = useApp();
  const router = useRouter();

  const [step,         setStep]         = useState<number>(0);
  const [name,         setName]         = useState('');
  const [country,      setCountry]      = useState<Region | null>(null);
  const [community,    setCommunity]    = useState('');
  const [moiety,       setMoiety]       = useState('');
  const [language,     setLanguage]     = useState('');
  const [dir,                  setDir]                  = useState<1 | -1>(1);
  const [animating,            setAnimating]            = useState(false);
  const [showAccountCreation,  setShowAccountCreation]  = useState(false);

  const goTo = useCallback((next: number) => {
    setDir(next > step ? 1 : -1);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  }, [step]);

  const canContinue = [
    name.trim().length > 0, // 0 name
    country !== null,        // 1 nation
    true,                    // 2 language
    true,                    // 3 community
    true,                    // 4 moiety
  ][step];

  function saveProfileAndPerson() {
    const existingSelfId = localStorage.getItem('kinstellation_self_id');
    if (country) setRegion(country.id);

    const cleanMoiety   = moiety   && moiety   !== 'not_sure' ? moiety   : null;
    const nationName    = country?.displayName ?? null;

    localStorage.setItem('kinstellation_profile', JSON.stringify({
      name:      name.trim(),
      nation:    nationName,
      community: community.trim() || null,
      moiety:    cleanMoiety,
      language:  language.trim()  || null,
    }));

    if (!existingSelfId) {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;

      const selfId = crypto.randomUUID();
      const selfPerson: Person = {
        id:                   selfId,
        displayName:          name.trim(),
        nation:               nationName ?? undefined,
        moiety:               cleanMoiety ?? undefined,
        community:            community.trim() || undefined,
        countryLanguageGroup: language.trim() || undefined,
        regionSelectorValue:  country?.id ?? '',
        isDeceased:           false,
        stories:              [],
        visibility:           'public',
        lastUpdated:          new Date().toISOString(),
        position:             { x: cx, y: cy },
      };
      dispatch({ type: 'ADD_PERSON', payload: selfPerson });
      localStorage.setItem('kinstellation_self_id', selfId);

      // Create anchor stars for nation and community
      const offset = (angle: number, dist: number) => ({
        x: cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
      });

      if (nationName) {
        const nationPerson: Person = {
          id:                  crypto.randomUUID(),
          displayName:         nationName,
          moiety:              cleanMoiety ?? undefined,
          countryLanguageGroup: language.trim() || undefined,
          regionSelectorValue: country?.id ?? '',
          isDeceased:          false,
          stories:             [],
          visibility:          'public',
          lastUpdated:         new Date().toISOString(),
          position:            offset(-Math.PI / 4, 240),
        };
        dispatch({ type: 'ADD_PERSON', payload: nationPerson });
      }

      if (community.trim()) {
        const communityPerson: Person = {
          id:                  crypto.randomUUID(),
          displayName:         community.trim(),
          community:           community.trim(),
          moiety:              cleanMoiety ?? undefined,
          regionSelectorValue: country?.id ?? '',
          isDeceased:          false,
          stories:             [],
          visibility:          'public',
          lastUpdated:         new Date().toISOString(),
          position:            offset(Math.PI / 4, 220),
        };
        dispatch({ type: 'ADD_PERSON', payload: communityPerson });
      }
    }
  }

  function handleFinish() {
    saveProfileAndPerson();
    setShowAccountCreation(true);
  }

  const STEP_CONTENT: Record<number, { heading: string; sub: string; skip?: boolean }> = {
    0: {
      heading: 'What\'s your name?',
      sub:     'This is how you\'ll appear in your constellation.',
    },
    1: {
      heading: 'Which is your Nation?',
      sub:     'Your Nation is the foundation of your kinship and Country — the people and place you belong to.',
    },
    2: {
      heading: 'What is your language group?',
      sub:     'The language of your Country. This may differ from your Nation name — one Nation can hold several languages. Skip if you\'re not sure.',
      skip:    true,
    },
    3: {
      heading: 'Which Community are you from?',
      sub:     'The community, town, or mob your family identifies with.',
      skip:    true,
    },
    4: {
      heading: 'Which moiety do you belong to?',
      sub:     'Your moiety is inferred from your Nation or Community where known.',
      skip:    true,
    },
  };

  const info = STEP_CONTENT[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="relative max-w-lg w-full">

      {/* Card */}
      <div
        className="relative rounded-3xl px-8 py-9"
        style={{
          background:    'rgba(8,4,22,0.96)',
          border:        '1px solid rgba(139,92,246,0.35)',
          boxShadow:     '0 0 80px rgba(88,28,135,0.28), 0 0 40px rgba(88,28,135,0.12), 0 30px 60px rgba(0,0,0,0.7)',
          backdropFilter:'blur(24px)',
        }}
      >
        {/* Top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.45), rgba(212,164,84,0.18), rgba(139,92,246,0.45), transparent)' }} />

        {/* Progressive constellation */}
        <ConstellationProgress step={step} />

        {/* Step dots */}
        <StepDots current={step} />

        {/* Animated content */}
        <div style={{
          opacity:    animating ? 0 : 1,
          transform:  animating ? `translateX(${dir * 22}px)` : 'translateX(0)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}>
          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="text-2xl font-light tracking-tight mb-2" style={{ color: 'rgba(255,255,255,0.96)' }}>
              {info.heading}
            </h1>
            <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'rgba(180,150,255,0.72)' }}>
              {info.sub}
            </p>
          </div>

          {/* Step input */}
          <div className="mb-7">
            {step === 0 && <NameField value={name} onChange={setName} />}
            {step === 1 && <NationSearch selected={country} onSelect={setCountry} />}
            {step === 2 && (
              <LanguageSearch
                value={language}
                nationId={country?.id}
                onSelect={setLanguage}
              />
            )}
            {step === 3 && (
              <CommunitySearch
                value={community}
                nationId={country?.id}
                onSelect={(n) => setCommunity(n)}
              />
            )}
            {step === 4 && (
              <MoietyPicker
                region={country}
                community={community}
                value={moiety}
                onChange={setMoiety}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={isLast ? handleFinish : () => goTo(step + 1)}
              disabled={!canContinue}
              className="w-full py-4 rounded-2xl font-light tracking-wide text-base transition-all duration-300"
              style={{
                background: canContinue ? 'rgba(88,28,135,0.58)' : 'rgba(88,28,135,0.12)',
                border:     `1px solid ${canContinue ? 'rgba(212,164,84,0.52)' : 'rgba(88,28,135,0.25)'}`,
                color:      canContinue ? '#D4A454' : 'rgba(139,92,246,0.3)',
                boxShadow:  canContinue ? '0 0 30px rgba(88,28,135,0.28), 0 0 60px rgba(212,164,84,0.06)' : 'none',
                cursor:     canContinue ? 'pointer' : 'not-allowed',
              }}
            >
              {isLast ? 'Enter the sky →' : 'Continue'}
            </button>

            <div className="flex justify-between items-center">
              {step > 0 ? (
                <button onClick={() => goTo(step - 1)}
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(139,92,246,0.42)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(139,92,246,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,92,246,0.42)')}>
                  ← Back
                </button>
              ) : <span />}
              {info.skip && (
                <button onClick={isLast ? handleFinish : () => goTo(step + 1)}
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
      <p className="text-center text-xs mt-6 leading-relaxed px-4" style={{ color: 'rgba(88,28,135,0.48)' }}>
        Nation and clan information sourced from AIATSIS and community language authorities.
        This knowledge belongs to communities — this platform holds no ownership of it.
      </p>

      {/* Account creation overlay — appears after the 6-step profile is complete */}
      {showAccountCreation && (
        <AccountCreationOverlay
          displayName={name.trim()}
          onSkip={() => router.push('/canvas')}
          onSuccess={() => {
            localStorage.setItem('kinstellation_tutorial_pending', 'true');
            router.push('/canvas');
          }}
        />
      )}
    </div>
  );
}

// ─── account creation overlay ─────────────────────────────────────────────────
// Appears as a full-screen overlay after the 6-step constellation form completes.
// Creates a Supabase account using a synthetic email (username@kinstellation.app).
// On success: sets tutorial flag and navigates to canvas.
// On skip: goes to canvas without an account (data is saved to localStorage only).

function AccountCreationOverlay({
  displayName,
  onSkip,
  onSuccess,
}: {
  displayName: string;
  onSkip: () => void;
  onSuccess: () => void;
}) {
  const [username,        setUsername]        = useState(displayName.toLowerCase().replace(/\s+/g, '_'));
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [userFocused,     setUserFocused]     = useState(false);
  const [passFocused,     setPassFocused]     = useState(false);
  const [confirmFocused,  setConfirmFocused]  = useState(false);

  const syntheticEmail = (u: string) => `${u.toLowerCase().trim()}@kinstellation.app`;

  async function handleCreate() {
    if (!username.trim()) { setError('Please choose a username.'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!password) { setError('Please set a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords don\'t match.'); return; }

    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: syntheticEmail(username),
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError('That username is taken. Try another.');
      } else {
        setError(error.message);
      }
    } else {
      onSuccess();
    }
  }

  const fieldStyle = (focused: boolean): React.CSSProperties => ({
    background: focused ? 'rgba(88,28,135,0.1)' : 'rgba(88,28,135,0.04)',
    border: `1px solid ${focused ? 'rgba(139,92,246,0.55)' : 'rgba(88,28,135,0.28)'}`,
    boxShadow: focused ? '0 0 0 3px rgba(88,28,135,0.12)' : 'none',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl px-8 py-9 animate-fade-in"
        style={{
          background:    'rgba(8,4,22,0.97)',
          border:        '1px solid rgba(88,28,135,0.42)',
          boxShadow:     '0 0 80px rgba(88,28,135,0.2), 0 30px 60px rgba(0,0,0,0.7)',
          backdropFilter:'blur(20px)',
        }}
      >
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.45), rgba(212,164,84,0.18), rgba(139,92,246,0.45), transparent)' }} />

        {/* Star icon */}
        <div className="flex justify-center mb-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full animate-star-pulse"
              style={{ background: 'rgba(212,164,84,0.12)', boxShadow: '0 0 24px rgba(212,164,84,0.25)' }} />
            <div className="absolute inset-2 rounded-full"
              style={{ background: 'rgba(212,164,84,0.22)', boxShadow: '0 0 12px rgba(212,164,84,0.3)' }} />
            <div className="absolute inset-3.5 rounded-full"
              style={{ background: 'rgba(212,164,84,0.85)', boxShadow: '0 0 8px rgba(212,164,84,0.5)' }} />
          </div>
        </div>

        <div className="text-center mb-7">
          <h2 className="text-xl font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
            Save your sky
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(139,92,246,0.55)' }}>
            Create an account so your constellation is always safe.
            Sign in from any device.
          </p>
        </div>

        <div className="space-y-3">
          {/* Username */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'rgba(139,92,246,0.45)' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              onFocus={() => setUserFocused(true)}
              onBlur={() => setUserFocused(false)}
              placeholder="choose_a_username"
              autoComplete="off"
              className="w-full rounded-xl px-4 py-3 text-sm text-white/85 placeholder-white/20 outline-none transition-all"
              style={fieldStyle(userFocused)}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'rgba(139,92,246,0.45)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="w-full rounded-xl px-4 py-3 text-sm text-white/85 placeholder-white/20 outline-none transition-all"
              style={fieldStyle(passFocused)}
            />
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'rgba(139,92,246,0.45)' }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              placeholder="Type it again"
              autoComplete="new-password"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              className="w-full rounded-xl px-4 py-3 text-sm text-white/85 placeholder-white/20 outline-none transition-all"
              style={fieldStyle(confirmFocused)}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'rgba(248,113,113,0.8)' }}>{error}</p>
          )}

          {/* Create */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-medium tracking-wide transition-all disabled:opacity-40"
            style={{
              background: 'rgba(88,28,135,0.55)',
              border: '1px solid rgba(212,164,84,0.45)',
              color: '#FFE599',
              boxShadow: '0 0 30px rgba(88,28,135,0.25)',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.65)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.55)'; }}
          >
            {loading ? 'Creating account…' : 'Create account & enter the sky →'}
          </button>

          {/* Skip */}
          <button
            onClick={onSkip}
            className="w-full text-center text-sm transition-colors py-1"
            style={{ color: 'rgba(139,92,246,0.38)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.65)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.38)'; }}
          >
            Skip for now — I&apos;ll save later
          </button>
        </div>
      </div>
    </div>
  );
}
