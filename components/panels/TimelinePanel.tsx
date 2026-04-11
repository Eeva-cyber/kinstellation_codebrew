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

// ─── Multi-select dropdown with search ────────────────────────────────────────
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
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLabels = selected
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter(Boolean);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all"
        style={{
          background: 'rgba(88,28,135,0.2)',
          border: `1px solid ${open ? 'rgba(212,164,84,0.4)' : 'rgba(139,92,246,0.25)'}`,
          minHeight: 36,
        }}
      >
        <span className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
          {selected.length === 0 ? (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {label}
            </span>
          ) : (
            selectedLabels.map((lbl, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(88,28,135,0.5)', color: 'rgba(212,164,84,0.9)', border: '1px solid rgba(212,164,84,0.2)' }}
              >
                {lbl}
              </span>
            ))
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              className="text-[10px] px-1 rounded cursor-pointer hover:text-white/70 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
            >
              ×
            </span>
          )}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'rgba(139,92,246,0.6)' }}
          >
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-[60]"
          style={{
            background: 'rgba(8,4,22,0.98)',
            border: '1px solid rgba(88,28,135,0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(88,28,135,0.2)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Search */}
          <div className="p-2 border-b" style={{ borderColor: 'rgba(88,28,135,0.25)' }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-2.5 py-1.5 rounded-lg text-[11px] focus:outline-none"
              style={{
                background: 'rgba(88,28,135,0.2)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: 'rgba(255,255,255,0.8)',
              }}
            />
          </div>

          {/* Options */}
          <div className="max-h-44 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No results</p>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onToggle(opt.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                    style={{
                      background: isSelected ? 'rgba(88,28,135,0.4)' : 'transparent',
                      color: isSelected ? 'rgba(212,164,84,0.95)' : 'rgba(255,255,255,0.6)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(88,28,135,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Checkbox */}
                    <span
                      className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                      style={{
                        border: `1px solid ${isSelected ? 'rgba(212,164,84,0.6)' : 'rgba(139,92,246,0.35)'}`,
                        background: isSelected ? 'rgba(88,28,135,0.7)' : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l2 2 3-3" stroke="rgba(212,164,84,0.9)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {opt.color && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                    )}
                    <span className="text-[11px] truncate">{opt.label}</span>
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

// ─── Main TimelinePanel ────────────────────────────────────────────────────────
export function TimelinePanel({ onClose, onStoryClick }: TimelinePanelProps) {
  const { state } = useApp();
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<string[]>([]);

  const calendar = state.seasonalCalendar;
  const seasons = calendar?.seasons ?? [];

  const allStories: TimelineStory[] = useMemo(
    () =>
      state.persons.flatMap((p) =>
        p.stories.map((s) => ({
          ...s,
          personName: p.displayName,
          personId: p.id,
        })),
      ),
    [state.persons],
  );

  // Apply both filters (AND logic)
  const displayedStories = useMemo(() => {
    return allStories.filter((s) => {
      const personMatch = selectedPersonIds.length === 0 || selectedPersonIds.includes(s.personId);
      const seasonMatch = selectedSeasonIds.length === 0 || selectedSeasonIds.includes(s.seasonTag);
      return personMatch && seasonMatch;
    });
  }, [allStories, selectedPersonIds, selectedSeasonIds]);

  // Dropdown options
  const personOptions: DropdownOption[] = state.persons.map((p) => ({
    id: p.id,
    label: p.displayName,
  }));

  const seasonOptions: DropdownOption[] = [
    ...seasons.map((s) => ({ id: s.id, label: s.name, color: s.colorPalette.accentColor })),
    { id: 'unsure', label: 'Unknown season', color: 'rgba(255,255,255,0.25)' },
  ];

  function togglePerson(id: string) {
    setSelectedPersonIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleSeason(id: string) {
    setSelectedSeasonIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  // Group displayed stories by season column
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

  function getSeasonName(tag: string): string {
    if (!calendar || tag === 'unsure') return 'Unknown';
    return getSeasonById(calendar, tag)?.name ?? tag;
  }

  const activeFilters = selectedPersonIds.length + selectedSeasonIds.length;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-bottom select-auto">
      <div
        className="flex flex-col"
        style={{
          height: '50vh',
          minHeight: 300,
          background: 'rgba(8,4,22,0.97)',
          borderTop: '1px solid rgba(88,28,135,0.45)',
          boxShadow: '0 -8px 40px rgba(88,28,135,0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(88,28,135,0.25)' }}
        >
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div>
              <h2 className="text-sm font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.9)' }}>
                Story Timeline
              </h2>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(139,92,246,0.55)' }}>
                {displayedStories.length} {displayedStories.length === 1 ? 'story' : 'stories'}
                {activeFilters > 0 && <span style={{ color: 'rgba(212,164,84,0.45)' }}> · {activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>}
              </p>
            </div>

            {/* Dropdown filters */}
            <div className="flex gap-2 flex-1 max-w-md">
              <MultiSelectDropdown
                label="Filter by person…"
                options={personOptions}
                selected={selectedPersonIds}
                onToggle={togglePerson}
                onClear={() => setSelectedPersonIds([])}
              />
              <MultiSelectDropdown
                label="Filter by season…"
                options={seasonOptions}
                selected={selectedSeasonIds}
                onToggle={toggleSeason}
                onClear={() => setSelectedSeasonIds([])}
              />
            </div>

            {/* Clear all */}
            {activeFilters > 0 && (
              <button
                onClick={() => { setSelectedPersonIds([]); setSelectedSeasonIds([]); }}
                className="text-[10px] px-2.5 py-1 rounded-lg transition-all shrink-0"
                style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                Clear all
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all ml-4 shrink-0 text-lg leading-none"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Timeline content */}
        <div className="flex-1 overflow-hidden">
          {allStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(139,92,246,0.4)' }} />
              <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No stories yet. Add stories to see them across the seasonal cycle.
              </p>
            </div>
          ) : displayedStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No stories match the selected filters.
              </p>
              <button
                onClick={() => { setSelectedPersonIds([]); setSelectedSeasonIds([]); }}
                className="text-[11px] px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'rgba(212,164,84,0.7)', border: '1px solid rgba(212,164,84,0.2)' }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* Season columns horizontal layout */
            <div className="flex h-full panel-scroll-x">
              {seasonColumns.map((col) => (
                <div
                  key={col.id}
                  className="flex-none h-full flex flex-col"
                  style={{
                    minWidth: col.stories.length === 0 ? 80 : 172,
                    borderRight: '1px solid rgba(88,28,135,0.15)',
                  }}
                >
                  {/* Column header */}
                  <div
                    className="px-4 py-2.5 shrink-0"
                    style={{
                      background: `${col.color}0f`,
                      borderBottom: `1px solid ${col.color}22`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color, boxShadow: `0 0 5px ${col.color}80` }} />
                      <span className="text-[11px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{col.name}</span>
                      <span
                        className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: col.stories.length > 0 ? 'rgba(88,28,135,0.4)' : 'rgba(255,255,255,0.04)',
                          color: col.stories.length > 0 ? 'rgba(212,164,84,0.7)' : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {col.stories.length}
                      </span>
                    </div>
                  </div>

                  {/* Story cards */}
                  <div
                    className="flex-1 overflow-y-auto px-3 py-3"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {col.stories.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 opacity-20">
                        <div className="w-px h-10" style={{ background: col.color }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-[5px] top-1 bottom-1 w-px" style={{ background: `${col.color}28` }} />
                        <div className="pl-5 space-y-2">
                          {col.stories.map((story) => (
                            <button
                              key={story.id}
                              onClick={() => onStoryClick(story.personId)}
                              className="w-full text-left group/story relative"
                            >
                              <div
                                className="absolute -left-5 top-[7px] w-2 h-2 rounded-full transition-transform group-hover/story:scale-125"
                                style={{ backgroundColor: col.color }}
                              />
                              <div
                                className="px-3 py-2 rounded-xl transition-all"
                                style={{
                                  background: 'rgba(88,28,135,0.08)',
                                  border: '1px solid rgba(139,92,246,0.12)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(88,28,135,0.25)';
                                  e.currentTarget.style.borderColor = 'rgba(212,164,84,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(88,28,135,0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)';
                                }}
                              >
                                <span
                                  className="block text-[11px] truncate leading-snug mb-0.5"
                                  style={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                  {story.title}
                                </span>
                                <span
                                  className="block text-[10px] truncate leading-snug"
                                  style={{ color: 'rgba(139,92,246,0.6)' }}
                                >
                                  {story.personName}
                                </span>
                                {story.type !== 'text' && (
                                  <span
                                    className="mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded-md capitalize"
                                    style={{ background: 'rgba(88,28,135,0.3)', color: 'rgba(212,164,84,0.6)' }}
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
