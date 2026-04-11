'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { getSeasonById } from '@/lib/utils/season';
import type { Story } from '@/lib/types';

interface TimelinePanelProps {
  onClose: () => void;
  onStoryClick: (personId: string) => void;
}

interface TimelineStory extends Story {
  personName: string;
  personId: string;
}

interface DropdownOption { id: string; label: string; color?: string }

function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: DropdownOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedLabels = selected
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter(Boolean);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
        style={{
          background: open ? 'rgba(88,28,135,0.35)' : 'rgba(88,28,135,0.18)',
          border: `1px solid ${open ? 'rgba(212,164,84,0.45)' : 'rgba(139,92,246,0.35)'}`,
          minHeight: 40,
        }}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
          {selected.length === 0 ? (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              All {label.toLowerCase()}s
            </span>
          ) : (
            selectedLabels.map((lbl, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-lg"
                style={{
                  background: 'rgba(88,28,135,0.6)',
                  color: 'rgba(212,164,84,0.95)',
                  border: '1px solid rgba(212,164,84,0.25)',
                }}
              >
                {lbl}
              </span>
            ))
          )}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected.length > 0 && (
            <span
              className="text-sm leading-none px-1 rounded cursor-pointer transition-colors"
              style={{ color: 'rgba(255,255,255,0.40)' }}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              title="Clear"
            >
              ×
            </span>
          )}
          <svg
            width="11" height="11" viewBox="0 0 10 10" fill="none"
            style={{
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
              color: open ? 'rgba(212,164,84,0.7)' : 'rgba(139,92,246,0.7)',
            }}
          >
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-[60]"
          style={{
            background: 'rgba(8,4,22,0.99)',
            border: '1px solid rgba(139,92,246,0.45)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 24px rgba(88,28,135,0.25)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="max-h-52 panel-scroll-col">
            {options.length === 0 ? (
              <p className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>No options</p>
            ) : (
              options.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onToggle(opt.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                    style={{
                      background: isSelected ? 'rgba(88,28,135,0.45)' : 'transparent',
                      color: isSelected ? 'rgba(212,164,84,0.95)' : 'rgba(255,255,255,0.72)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(88,28,135,0.22)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Checkbox */}
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{
                        border: `1.5px solid ${isSelected ? 'rgba(212,164,84,0.7)' : 'rgba(139,92,246,0.45)'}`,
                        background: isSelected ? 'rgba(88,28,135,0.8)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="rgba(212,164,84,0.95)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {opt.color && (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: opt.color, boxShadow: `0 0 5px ${opt.color}80` }} />
                    )}
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Era / generation definitions ─────────────────────────────────────────────
interface EraGroup {
  id: string;
  label: string;
  subLabel?: string;
  test: (year?: number) => boolean;
}

const ERA_GROUPS: EraGroup[] = [
  {
    id: 'immemorial',
    label: "Country's making",
    subLabel: 'Ancient / before living memory',
    test: (y) => y !== undefined && y < 1900,
  },
  {
    id: 'elders',
    label: "Elders' time",
    subLabel: "Grandparents' generation · c. 1900–1950",
    test: (y) => y !== undefined && y >= 1900 && y < 1950,
  },
  {
    id: 'parents',
    label: "Parents' time",
    subLabel: "Parents' generation · c. 1950–1980",
    test: (y) => y !== undefined && y >= 1950 && y < 1980,
  },
  {
    id: 'living',
    label: 'Our time',
    subLabel: 'Living generation · c. 1980–present',
    test: (y) => y !== undefined && y >= 1980,
  },
  {
    id: 'unknown_time',
    label: 'Time unknown',
    test: (y) => y === undefined || y === null,
  },
];

const VOICE_OPTIONS: DropdownOption[] = [
  { id: 'audio', label: 'Yarning (audio)' },
  { id: 'photo', label: 'Vision (photo)'  },
  { id: 'video', label: 'Vision (video)'  },
  { id: 'text',  label: 'Written words'   },
];

// Filter definitions — label + sub-label for filter row headers
const FILTER_DEFS = [
  { key: 'person',     label: 'Star',       icon: '✦' },
  { key: 'season',     label: 'Season',     icon: '◑' },
  { key: 'generation', label: 'Generation', icon: '◎' },
  { key: 'voice',      label: 'Voice',      icon: '◉' },
] as const;

export function TimelinePanel({ onClose, onStoryClick }: TimelinePanelProps) {
  const { state } = useApp();
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<string[]>([]);
  const [selectedEraIds,    setSelectedEraIds]    = useState<string[]>([]);
  const [selectedVoiceIds,  setSelectedVoiceIds]  = useState<string[]>([]);
  const [summarizing,       setSummarizing]        = useState(false);
  const [timelineSummary,   setTimelineSummary]    = useState<string | null>(null);

  const [profileLanguage, setProfileLanguage] = useState('');
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('kinstellation_profile') ?? '{}');
      if (p.language) setProfileLanguage(p.language);
    } catch { /* ignore */ }
  }, []);

  // Clear summary whenever filters change
  useEffect(() => { setTimelineSummary(null); }, [selectedPersonIds, selectedSeasonIds, selectedEraIds, selectedVoiceIds]);

  async function handleSummarize() {
    if (summarizing || displayedStories.length === 0) return;
    setSummarizing(true);
    try {
      const resp = await fetch('/api/summarize-stories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          personName: selectedPersonIds.length === 1
            ? (state.persons.find(p => p.id === selectedPersonIds[0])?.displayName ?? 'this community')
            : 'this community',
          stories: displayedStories.map((s) => ({
            title: s.title,
            content: s.content,
            type: s.type,
            personName: s.personName,
          })),
        }),
      });
      const data = await resp.json();
      setTimelineSummary(data.summary ?? null);
    } catch {
      setTimelineSummary('Unable to summarise at this time — please try again.');
    } finally {
      setSummarizing(false);
    }
  }

  const calendar = state.seasonalCalendar;
  const seasons  = calendar?.seasons ?? [];

  const allStories: TimelineStory[] = useMemo(
    () => state.persons.flatMap((p) =>
      p.stories.map((s) => ({ ...s, personName: p.displayName, personId: p.id })),
    ),
    [state.persons],
  );

  const displayedStories = useMemo(() => {
    return allStories.filter((s) => {
      const personMatch = selectedPersonIds.length === 0 || selectedPersonIds.includes(s.personId);
      const seasonMatch = selectedSeasonIds.length === 0 || selectedSeasonIds.includes(s.seasonTag);
      const eraMatch    = selectedEraIds.length    === 0 || selectedEraIds.some(id => {
        const era = ERA_GROUPS.find(e => e.id === id);
        return era ? era.test(s.year) : true;
      });
      const voiceMatch  = selectedVoiceIds.length  === 0 || selectedVoiceIds.includes(s.type);
      return personMatch && seasonMatch && eraMatch && voiceMatch;
    });
  }, [allStories, selectedPersonIds, selectedSeasonIds, selectedEraIds, selectedVoiceIds]);

  const personOptions: DropdownOption[] = state.persons.map((p) => ({ id: p.id, label: p.displayName }));
  const seasonOptions: DropdownOption[] = [
    ...seasons.map((s) => ({ id: s.id, label: s.name, color: s.colorPalette.accentColor })),
    { id: 'unsure', label: 'Unknown season', color: 'rgba(255,255,255,0.25)' },
  ];
  const eraOptions: DropdownOption[] = ERA_GROUPS.map(e => ({ id: e.id, label: e.label }));

  function togglePerson(id: string) { setSelectedPersonIds((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function toggleSeason(id: string) { setSelectedSeasonIds((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function toggleEra(id: string)    { setSelectedEraIds((p)    => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function toggleVoice(id: string)  { setSelectedVoiceIds((p)  => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }

  const filterRows = [
    { key: 'person',     label: 'Star',        options: personOptions, selected: selectedPersonIds, onToggle: togglePerson, onClear: () => setSelectedPersonIds([]) },
    { key: 'season',     label: 'Season',       options: seasonOptions, selected: selectedSeasonIds, onToggle: toggleSeason, onClear: () => setSelectedSeasonIds([]) },
    { key: 'generation', label: 'Generation',   options: eraOptions,    selected: selectedEraIds,    onToggle: toggleEra,    onClear: () => setSelectedEraIds([]) },
    { key: 'voice',      label: 'Voice',        options: VOICE_OPTIONS, selected: selectedVoiceIds,  onToggle: toggleVoice,  onClear: () => setSelectedVoiceIds([]) },
  ];

  const seasonColumns = useMemo(() => {
    const cols = [
      ...seasons.map((s) => ({ id: s.id, name: s.name, color: s.colorPalette.accentColor, stories: [] as TimelineStory[] })),
      { id: 'unsure', name: 'Unknown', color: 'rgba(255,255,255,0.2)', stories: [] as TimelineStory[] },
    ];
    for (const story of displayedStories) {
      const col = cols.find((c) => c.id === story.seasonTag) ?? cols[cols.length - 1];
      col.stories.push(story);
    }
    return cols.filter((c) => c.stories.length > 0 || seasons.find((s) => s.id === c.id));
  }, [displayedStories, seasons]);

  function getSeasonColor(tag: string): string {
    if (!calendar || tag === 'unsure') return 'rgba(255,255,255,0.3)';
    return getSeasonById(calendar, tag)?.colorPalette.accentColor ?? 'rgba(255,255,255,0.3)';
  }

  void getSeasonColor; // used via col.color in render

  const activeFilters = selectedPersonIds.length + selectedSeasonIds.length + selectedEraIds.length + selectedVoiceIds.length;
  void profileLanguage; // available for future use

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-bottom select-auto">
      <div
        className="flex flex-col"
        style={{
          height: '58vh',
          minHeight: 360,
          background: 'rgba(6,3,18,0.98)',
          borderTop: '2px solid rgba(88,28,135,0.55)',
          boxShadow: '0 -12px 48px rgba(88,28,135,0.28)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* ── Header bar ── */}
        <div
          className="flex items-center justify-between px-6 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid rgba(88,28,135,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold tracking-wide" style={{ color: 'rgba(212,164,84,0.95)' }}>
              Story Timeline
            </h2>
            {/* Story count pill */}
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: 'rgba(88,28,135,0.45)',
                border: '1px solid rgba(139,92,246,0.4)',
                color: 'rgba(212,164,84,0.85)',
              }}
            >
              {displayedStories.length} {displayedStories.length === 1 ? 'story' : 'stories'}
            </span>
            {activeFilters > 0 && (
              <span className="text-xs" style={{ color: 'rgba(139,92,246,0.75)' }}>
                · {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Summarise button — always visible when there are stories */}
            {displayedStories.length > 0 && (
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  color: summarizing ? 'rgba(212,164,84,0.40)' : 'rgba(212,164,84,0.80)',
                  border: '1px solid rgba(212,164,84,0.30)',
                  background: 'rgba(212,164,84,0.07)',
                  cursor: summarizing ? 'default' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!summarizing) e.currentTarget.style.background = 'rgba(212,164,84,0.14)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,164,84,0.07)'; }}
              >
                {summarizing
                  ? '✦ Summarising…'
                  : `✦ Summarise ${displayedStories.length} stor${displayedStories.length === 1 ? 'y' : 'ies'}`}
              </button>
            )}
            {activeFilters > 0 && (
              <button
                onClick={() => { setSelectedPersonIds([]); setSelectedSeasonIds([]); setSelectedEraIds([]); setSelectedVoiceIds([]); }}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  color: 'rgba(212,164,84,0.75)',
                  border: '1px solid rgba(212,164,84,0.25)',
                  background: 'rgba(88,28,135,0.2)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.2)'; }}
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all text-xl leading-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* ── AI summary banner ── */}
        {timelineSummary && (
          <div
            className="shrink-0 px-6 py-3 flex gap-3 items-start"
            style={{ background: 'rgba(212,164,84,0.05)', borderBottom: '1px solid rgba(212,164,84,0.18)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(212,164,84,0.55)' }}>
                ✦ Summary
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {timelineSummary}
              </p>
            </div>
            <button
              onClick={() => setTimelineSummary(null)}
              className="shrink-0 text-sm leading-none px-2 py-1 rounded-lg mt-0.5"
              style={{ color: 'rgba(212,164,84,0.45)', background: 'rgba(212,164,84,0.08)' }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Filter row — full width, 4 columns ── */}
        <div
          className="shrink-0 px-6 py-3 grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderBottom: '1px solid rgba(88,28,135,0.25)',
            background: 'rgba(88,28,135,0.06)',
          }}
        >
          {filterRows.map(({ key, label, options, selected, onToggle, onClear }) => {
            const def = FILTER_DEFS.find(d => d.key === key);
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: 'rgba(139,92,246,0.60)' }}>{def?.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(212,164,84,0.75)' }}>
                    {label}
                  </span>
                  {selected.length > 0 && (
                    <span
                      className="ml-auto text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                      style={{ background: 'rgba(212,164,84,0.2)', color: 'rgba(212,164,84,0.9)', border: '1px solid rgba(212,164,84,0.3)' }}
                    >
                      {selected.length}
                    </span>
                  )}
                </div>
                <MultiSelectDropdown
                  label={label}
                  options={options}
                  selected={selected}
                  onToggle={onToggle}
                  onClear={onClear}
                />
              </div>
            );
          })}
        </div>

        {/* ── Timeline content ── */}
        <div className="flex-1 overflow-hidden">
          {allStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(139,92,246,0.5)' }} />
              <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
                No stories yet. Add stories to see them across the seasonal cycle.
              </p>
            </div>
          ) : displayedStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
                No stories match the selected filters.
              </p>
              <button
                onClick={() => { setSelectedPersonIds([]); setSelectedSeasonIds([]); setSelectedEraIds([]); setSelectedVoiceIds([]); }}
                className="text-xs px-4 py-2 rounded-xl transition-all"
                style={{
                  color: 'rgba(212,164,84,0.8)',
                  border: '1px solid rgba(212,164,84,0.25)',
                  background: 'rgba(88,28,135,0.25)',
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* Season columns */
            <div className="flex h-full panel-scroll-x">
              {seasonColumns.map((col) => (
                <div
                  key={col.id}
                  className="flex-none h-full flex flex-col"
                  style={{
                    minWidth: col.stories.length === 0 ? 90 : 200,
                    borderRight: '1px solid rgba(88,28,135,0.18)',
                  }}
                >
                  {/* Column header */}
                  <div
                    className="px-4 py-3 shrink-0"
                    style={{
                      background: `${col.color}12`,
                      borderBottom: `1px solid ${col.color}30`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: col.color, boxShadow: `0 0 7px ${col.color}` }} />
                      <span className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
                        {col.name}
                      </span>
                      <span
                        className="ml-auto text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{
                          background: col.stories.length > 0 ? 'rgba(88,28,135,0.55)' : 'rgba(255,255,255,0.06)',
                          color: col.stories.length > 0 ? 'rgba(212,164,84,0.90)' : 'rgba(255,255,255,0.30)',
                          border: col.stories.length > 0 ? '1px solid rgba(212,164,84,0.25)' : '1px solid transparent',
                        }}
                      >
                        {col.stories.length}
                      </span>
                    </div>
                  </div>

                  {/* Story cards */}
                  <div className="flex-1 px-3 py-3 panel-scroll-col">
                    {col.stories.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 opacity-25">
                        <div className="w-px h-12" style={{ background: col.color }} />
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Timeline spine */}
                        <div className="absolute left-[6px] top-2 bottom-2 w-px"
                          style={{ background: `${col.color}35` }} />
                        <div className="pl-6 space-y-2.5">
                          {col.stories.map((story) => (
                            <button
                              key={story.id}
                              onClick={() => onStoryClick(story.personId)}
                              className="w-full text-left group/story relative"
                            >
                              {/* Timeline dot */}
                              <div
                                className="absolute -left-6 top-[9px] w-2.5 h-2.5 rounded-full transition-all group-hover/story:scale-125"
                                style={{
                                  backgroundColor: col.color,
                                  boxShadow: `0 0 6px ${col.color}80`,
                                }}
                              />
                              {/* Card */}
                              <div
                                className="px-3.5 py-3 rounded-xl transition-all"
                                style={{
                                  background: 'rgba(88,28,135,0.12)',
                                  border: '1px solid rgba(139,92,246,0.18)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(88,28,135,0.32)';
                                  e.currentTarget.style.borderColor = 'rgba(212,164,84,0.30)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(88,28,135,0.12)';
                                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.18)';
                                }}
                              >
                                {/* Story title */}
                                <span
                                  className="block text-sm font-medium truncate leading-snug mb-1"
                                  style={{ color: 'rgba(255,255,255,0.90)' }}
                                >
                                  {story.title}
                                </span>
                                {/* Person name */}
                                <span
                                  className="block text-xs truncate leading-snug"
                                  style={{ color: 'rgba(139,92,246,0.80)' }}
                                >
                                  {story.personName}
                                </span>
                                {/* Type badge */}
                                {story.type !== 'text' && (
                                  <span
                                    className="mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-lg capitalize font-medium"
                                    style={{
                                      background: 'rgba(88,28,135,0.45)',
                                      color: 'rgba(212,164,84,0.80)',
                                      border: '1px solid rgba(212,164,84,0.2)',
                                    }}
                                  >
                                    {story.type}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
