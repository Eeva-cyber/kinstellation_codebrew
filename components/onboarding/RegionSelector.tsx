'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/AppContext';
import { regions } from '@/lib/data/regions';
import { kinshipTemplates } from '@/lib/data/kinship-templates';
import type { Region, Person } from '@/lib/types';

// ─── step definitions ─────────────────────────────────────────────────────────

const STEPS = ['name', 'country', 'mob', 'skinname'] as const;
type Step = typeof STEPS[number];

// ─── dot decoration ───────────────────────────────────────────────────────────

function AmbientDots() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {[
        { cx: '8%',  cy: '18%', r: 2,   op: 0.18 },
        { cx: '92%', cy: '12%', r: 1.5, op: 0.14 },
        { cx: '5%',  cy: '75%', r: 1.5, op: 0.12 },
        { cx: '95%', cy: '68%', r: 2,   op: 0.16 },
        { cx: '50%', cy: '4%',  r: 1.5, op: 0.10 },
        { cx: '50%', cy: '96%', r: 1.5, op: 0.10 },
        { cx: '18%', cy: '45%', r: 1,   op: 0.08 },
        { cx: '82%', cy: '55%', r: 1,   op: 0.08 },
      ].map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#D4A454" opacity={d.op} />
      ))}
    </svg>
  );
}

// ─── step indicator ───────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-3 justify-center mb-10">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="rounded-full transition-all duration-500"
            style={{
              width:   i === current ? 28 : 8,
              height:  8,
              background: i <= current ? '#D4A454' : 'rgba(255,255,255,0.12)',
              boxShadow: i === current ? '0 0 12px rgba(212,164,84,0.6)' : 'none',
            }}
          />
          {i < STEPS.length - 1 && (
            <div
              className="h-px transition-all duration-500"
              style={{
                width: 20,
                background: i < current ? 'rgba(212,164,84,0.4)' : 'rgba(255,255,255,0.08)',
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
          borderColor:     focused ? 'rgba(212,164,84,0.45)' : 'rgba(255,255,255,0.08)',
          background:      focused ? 'rgba(212,164,84,0.04)' : 'rgba(255,255,255,0.02)',
          boxShadow:       focused ? '0 0 0 3px rgba(212,164,84,0.08), 0 0 30px rgba(212,164,84,0.06)' : 'none',
        }}
      >
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/20 text-lg outline-none caret-amber-400"
          autoComplete="off"
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
      {hint && <p className="mt-2.5 text-xs text-white/25 leading-relaxed">{hint}</p>}
    </div>
  );
}

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

  return (
    <div className="w-full space-y-2">
      {/* Input */}
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300"
        style={{
          borderColor: focused ? 'rgba(212,164,84,0.45)' : selected ? 'rgba(212,164,84,0.25)' : 'rgba(255,255,255,0.08)',
          background:  focused ? 'rgba(212,164,84,0.04)' : selected ? 'rgba(212,164,84,0.03)' : 'rgba(255,255,255,0.02)',
          boxShadow:   focused ? '0 0 0 3px rgba(212,164,84,0.08)' : 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'rgba(212,164,84,0.5)', flexShrink: 0 }}>
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
          className="flex-1 bg-transparent text-white/90 placeholder:text-white/22 text-lg outline-none caret-amber-400"
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

      {/* Results dropdown */}
      {q.length > 0 && !selected && (
        <div className="space-y-1">
          {results.length === 0 ? (
            <p className="text-center text-white/25 text-sm py-5">No Country found for &ldquo;{query}&rdquo;</p>
          ) : results.map(r => (
            <button key={r.id} onMouseDown={() => handlePick(r)}
              className="group w-full text-left px-4 py-3.5 rounded-xl border border-white/[0.05]
                bg-white/[0.02] hover:bg-amber-400/[0.06] hover:border-amber-400/20
                transition-all duration-200 focus:outline-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="block text-white/85 group-hover:text-white/95 font-medium">{r.displayName}</span>
                  <span className="block text-white/30 text-xs mt-0.5 group-hover:text-white/45">{r.countryDescription}</span>
                </div>
                <span className="shrink-0 text-white/20 text-xs mt-0.5">{r.stateTerritory}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected confirmation */}
      {selected && (
        <div className="px-4 py-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04]">
          <p className="text-white/50 text-xs">{selected.countryDescription}</p>
        </div>
      )}

      {/* Not listed */}
      <button onMouseDown={() => handlePick(notListed)}
        className="group w-full text-left px-4 py-3 rounded-xl border border-white/[0.04]
          bg-transparent hover:bg-white/[0.03] hover:border-white/[0.08]
          transition-all duration-200 mt-1">
        <span className="text-white/35 group-hover:text-white/55 text-sm">My Country isn&apos;t listed</span>
      </button>
    </div>
  );
}

// ─── skin name picker ─────────────────────────────────────────────────────────

function SkinNamePicker({
  region, value, onChange,
}: {
  region: Region | null;
  value: string;
  onChange: (v: string) => void;
}) {
  if (!region) return null;

  const template = kinshipTemplates[region.kinshipTemplateType];
  const names    = template.sectionNames ?? template.moietyNames ?? [];

  if (names.length === 0) return (
    <p className="text-white/30 text-sm text-center">No skin name system recorded for this Country yet.</p>
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
                borderColor: active ? 'rgba(212,164,84,0.55)' : 'rgba(255,255,255,0.07)',
                background:  active ? 'rgba(212,164,84,0.10)' : 'rgba(255,255,255,0.02)',
                color:       active ? '#D4A454' : 'rgba(255,255,255,0.55)',
                boxShadow:   active ? '0 0 18px rgba(212,164,84,0.12)' : 'none',
              }}>
              {name}
            </button>
          );
        })}
      </div>
      {/* I'm not sure */}
      <button
        onClick={() => onChange('not_sure')}
        className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200"
        style={{
          borderColor: value === 'not_sure' ? 'rgba(212,164,84,0.3)' : 'rgba(255,255,255,0.05)',
          background:  value === 'not_sure' ? 'rgba(212,164,84,0.06)' : 'transparent',
          color:       'rgba(255,255,255,0.30)',
        }}>
        I&apos;m not sure
      </button>
      <p className="text-xs text-white/18 leading-relaxed text-center">
        {template.description}
      </p>
    </div>
  );
}

// ─── main profile creation component ─────────────────────────────────────────

export function RegionSelector() {
  const { setRegion, dispatch } = useApp();
  const router = useRouter();

  const [step,     setStep]     = useState<number>(0);
  const [name,     setName]     = useState('');
  const [country,  setCountry]  = useState<Region | null>(null);
  const [mob,      setMob]      = useState('');
  const [skinName, setSkinName] = useState('');
  const [dir,      setDir]      = useState<1 | -1>(1); // slide direction

  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((next: number) => {
    setDir(next > step ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 220);
  }, [step]);

  const canContinue = [
    name.trim().length > 0,           // step 0: name required
    country !== null,                  // step 1: country required
    true,                              // step 2: mob optional
    true,                              // step 3: skin name optional
  ][step];

  function handleFinish() {
    const existingSelfId = localStorage.getItem('kinstellation_self_id');

    if (country) setRegion(country.id);

    const cleanSkinName = skinName && skinName !== 'not_sure' ? skinName : null;
    localStorage.setItem('kinstellation_profile', JSON.stringify({
      name: name.trim(),
      mob: mob.trim() || null,
      skinName: cleanSkinName,
    }));

    if (!existingSelfId) {
      const selfId = crypto.randomUUID();
      const selfPerson: Person = {
        id: selfId,
        displayName: name.trim(),
        skinName: cleanSkinName ?? undefined,
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

  const STEP_CONTENT: Record<number, {
    heading: string; sub: string; skip?: boolean;
  }> = {
    0: { heading: 'What\'s your name?',       sub: 'This is how you\'ll appear in your constellation.' },
    1: { heading: 'Which is your Country?',   sub: 'Search your language group, nation, or Country name.' },
    2: { heading: 'What\'s your mob?',        sub: 'Your community, clan, or language group — however you describe it.', skip: true },
    3: { heading: 'What\'s your skin name?',  sub: 'Skin names carry your kinship law. Skip if you\'re unsure.', skip: true },
  };

  const info = STEP_CONTENT[step];

  return (
    <div className="relative max-w-lg w-full">
      <AmbientDots />

      {/* Radial glow behind card */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(212,164,84,0.05) 0%, transparent 70%)',
      }} />

      {/* Card */}
      <div
        className="relative rounded-3xl border border-white/[0.06] px-8 py-10"
        style={{ background: 'rgba(4,3,10,0.72)', backdropFilter: 'blur(20px)' }}
      >
        {/* Star pulse icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full border border-amber-400/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 24px rgba(212,164,84,0.18)' }}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400/80 animate-star-pulse" />
            </div>
            {/* Small orbit dots */}
            {[0, 90, 180, 270].map(deg => (
              <div key={deg} className="absolute w-1 h-1 rounded-full bg-amber-400/40"
                style={{
                  top:  `calc(50% + ${Math.sin(deg * Math.PI / 180) * 22}px - 2px)`,
                  left: `calc(50% + ${Math.cos(deg * Math.PI / 180) * 22}px - 2px)`,
                }} />
            ))}
          </div>
        </div>

        {/* Step dots */}
        <StepDots current={step} />

        {/* Animated content */}
        <div
          style={{
            opacity:   animating ? 0 : 1,
            transform: animating ? `translateX(${dir * 24}px)` : 'translateX(0)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light tracking-tight text-white/92 mb-2">
              {info.heading}
            </h1>
            <p className="text-white/35 text-sm leading-relaxed max-w-sm mx-auto">
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
              <TextField
                value={mob}
                onChange={setMob}
                placeholder="e.g. Wiradjuri, Arrernte, Torres Strait…"
                autoFocus
                hint="Mob, community, or however you identify your group."
              />
            )}
            {step === 3 && (
              <SkinNamePicker region={country} value={skinName} onChange={setSkinName} />
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
                background:   canContinue ? 'rgba(212,164,84,0.15)' : 'rgba(255,255,255,0.04)',
                border:       `1px solid ${canContinue ? 'rgba(212,164,84,0.45)' : 'rgba(255,255,255,0.07)'}`,
                color:        canContinue ? '#D4A454' : 'rgba(255,255,255,0.22)',
                boxShadow:    canContinue ? '0 0 30px rgba(212,164,84,0.12)' : 'none',
                cursor:       canContinue ? 'pointer' : 'not-allowed',
              }}
            >
              {step < STEPS.length - 1 ? 'Continue' : 'Enter the sky →'}
            </button>

            {/* Back / Skip row */}
            <div className="flex justify-between items-center">
              {step > 0 ? (
                <button onClick={() => goTo(step - 1)}
                  className="text-sm text-white/25 hover:text-white/50 transition-colors">
                  ← Back
                </button>
              ) : <span />}
              {info.skip && (
                <button onClick={step < STEPS.length - 1 ? () => goTo(step + 1) : handleFinish}
                  className="text-sm text-white/22 hover:text-white/42 transition-colors">
                  Skip
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <p className="text-center text-white/12 text-xs mt-6 leading-relaxed px-4">
        Language groups sourced from the AIATSIS Map of Indigenous Australia.
        Skin name systems belong to their communities — this platform holds no ownership of that knowledge.
      </p>
    </div>
  );
}
