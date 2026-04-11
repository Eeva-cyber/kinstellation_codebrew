'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Person, Visibility, Story, StoryType } from '@/lib/types';
import { SeasonPicker } from '@/components/ui/SeasonPicker';
import { WordTooltip } from '@/components/ui/WordTooltip';
import { regions } from '@/lib/data/regions';

interface PersonPanelProps {
  person: Person;
  isSelf?: boolean;
  focusSection?: 'identity' | 'stories' | 'connections';
  onClose: () => void;
  onAddStory: (personId: string) => void;
  onAddConnection: (personId: string) => void;
}

type Section = 'identity' | 'stories' | 'connections';

export function PersonPanel({ person, isSelf, focusSection, onClose, onAddStory, onAddConnection }: PersonPanelProps) {
  const { state, dispatch } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [displayName, setDisplayName] = useState(person.displayName);
  const [indigenousName, setIndigenousName] = useState(person.indigenousName ?? '');
  const [skinName, setSkinName] = useState(person.skinName ?? '');
  const [moiety, setMoiety] = useState(person.moiety ?? '');
  const [mob, setMob] = useState(person.mob ?? '');
  const [countryLanguageGroup, setCountryLanguageGroup] = useState(person.countryLanguageGroup ?? '');
  const [isDeceased, setIsDeceased] = useState(person.isDeceased);
  const [visibility, setVisibility] = useState<Visibility>(person.visibility);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Set<Section>>(
    new Set(focusSection ? [focusSection] : ['identity']),
  );

  // Inline quick story form
  const [showQuickStory, setShowQuickStory] = useState(false);
  const [quickStoryTitle, setQuickStoryTitle] = useState('');
  const [quickStoryContent, setQuickStoryContent] = useState('');
  const [quickStoryType, setQuickStoryType] = useState<StoryType>('text');
  const [quickStorySeason, setQuickStorySeason] = useState('unsure');

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Invite link
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const moietyNames = state.kinshipTemplate?.moietyNames;
  const sectionNames = state.kinshipTemplate?.sectionNames;

  const personRelationships = state.relationships.filter(
    (r) => r.fromPersonId === person.id || r.toPersonId === person.id,
  );

  // Scroll to focused section on mount
  useEffect(() => {
    if (focusSection && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-section="${focusSection}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusSection]);

  function toggleSection(section: Section) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function handleSave() {
    if (!displayName.trim()) return;
    dispatch({
      type: 'UPDATE_PERSON',
      payload: {
        ...person,
        displayName: displayName.trim(),
        indigenousName: indigenousName.trim() || undefined,
        skinName: skinName.trim() || undefined,
        moiety: moiety || undefined,
        mob: mob.trim() || undefined,
        countryLanguageGroup: countryLanguageGroup.trim() || undefined,
        isDeceased,
        visibility,
        lastUpdated: new Date().toISOString(),
      },
    });
  }

  function handleQuickStorySave() {
    if (!quickStoryTitle.trim()) return;
    if (quickStoryType === 'text' && !quickStoryContent.trim()) return;

    const story: Story = {
      id: crypto.randomUUID(),
      title: quickStoryTitle.trim(),
      type: quickStoryType,
      content: quickStoryContent,
      recordedBy: '',
      recordedDate: new Date().toISOString(),
      seasonTag: quickStorySeason,
      visibility: 'family',
      linkedPersonIds: [person.id],
    };

    dispatch({ type: 'ADD_STORY', payload: { personId: person.id, story } });
    setQuickStoryTitle('');
    setQuickStoryContent('');
    setQuickStorySeason('unsure');
    setShowQuickStory(false);
  }

  function getRelatedPersonName(rel: typeof personRelationships[0]) {
    const otherId = rel.fromPersonId === person.id ? rel.toPersonId : rel.fromPersonId;
    return state.persons.find((p) => p.id === otherId)?.displayName ?? 'Unknown';
  }

  return (
    <div className="absolute top-0 right-0 h-full w-[22rem] z-30 animate-slide-right select-auto">
      <div
        ref={scrollRef}
        className="h-full backdrop-blur-xl panel-scroll"
        style={{ background: 'rgba(8,4,22,0.97)', borderLeft: '1px solid rgba(88,28,135,0.4)' }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.9)' }}>
                {person.displayName}
              </h2>
              {person.indigenousName && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.6)' }}>{person.indigenousName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-lg leading-none transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Deceased warning */}
          {isDeceased && (
            <div className="mb-5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/45 leading-relaxed">
              Aboriginal and Torres Strait Islander peoples are advised that
              this profile may contain the name and image of a deceased person.
            </div>
          )}

          {/* === Identity section === */}
          <CollapsibleSection
            title="Identity"
            section="identity"
            count={null}
            open={openSections.has('identity')}
            onToggle={() => toggleSection('identity')}
          >
            <div className="space-y-3">
              <Field label="Name" value={displayName} onChange={setDisplayName} placeholder="Display name" />
              <Field label="Indigenous name" value={indigenousName} onChange={setIndigenousName} placeholder="Name in language" />

              {sectionNames ? (
                <div>
                  <label className="block text-xs text-white/30 mb-1">
                    <WordTooltip term="Skin name">Skin name</WordTooltip>
                  </label>
                  <select
                    value={skinName}
                    onChange={(e) => setSkinName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-white/[0.15]"
                  >
                    <option value="">Select...</option>
                    {sectionNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <Field label="Skin name" value={skinName} onChange={setSkinName} placeholder="Skin name" />
              )}

              {moietyNames && (
                <div>
                  <label className="block text-xs text-white/30 mb-1">
                    <WordTooltip term="Moiety">Moiety</WordTooltip>
                  </label>
                  <div className="flex gap-2">
                    {moietyNames.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMoiety(moiety === m ? '' : m)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-xs transition-all ${
                          moiety === m
                            ? 'border-white/20 bg-white/[0.08] text-white/80'
                            : 'border-white/[0.04] bg-white/[0.02] text-white/40 hover:bg-white/[0.04]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <LanguageGroupCombobox value={mob} onChange={setMob} />
              <Field label="Country / Language group" value={countryLanguageGroup} onChange={setCountryLanguageGroup} placeholder="e.g. Noongar Country, Arnhem Land" />

              <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeceased}
                  onChange={(e) => setIsDeceased(e.target.checked)}
                  className="rounded border-white/10"
                />
                This person is deceased
              </label>

              <div>
                <label className="block text-xs text-white/30 mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-white/[0.15]"
                >
                  <option value="public">Public</option>
                  <option value="family">Family only</option>
                  <option value="restricted">Restricted</option>
                  <option value="gendered">Gendered (men&apos;s/women&apos;s business)</option>
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={!displayName.trim()}
                className="w-full py-2 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(212,164,84,0.35)', color: 'rgba(212,164,84,0.9)' }}
              >
                Save
              </button>
            </div>
          </CollapsibleSection>

          {/* === Stories section === */}
          <CollapsibleSection
            title="Stories"
            section="stories"
            count={person.stories.length}
            open={openSections.has('stories')}
            onToggle={() => toggleSection('stories')}
          >
            <div className="space-y-2">
              {person.stories.length === 0 && !showQuickStory && (
                <p className="text-xs text-white/20 italic">
                  No stories yet. This star is waiting to be illuminated.
                </p>
              )}

              {person.stories.map((story) => (
                <div
                  key={story.id}
                  className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-sm text-white/65">{story.title}</span>
                  <span className="text-xs text-white/25 ml-2 capitalize">{story.type}</span>
                </div>
              ))}

              {/* Quick story inline form */}
              {showQuickStory ? (
                <div className="mt-2 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <input
                    type="text"
                    value={quickStoryTitle}
                    onChange={(e) => setQuickStoryTitle(e.target.value)}
                    placeholder="Story title"
                    autoFocus
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/[0.15]"
                  />
                  <textarea
                    value={quickStoryContent}
                    onChange={(e) => setQuickStoryContent(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Tell the story..."
                    rows={4}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/[0.15] resize-none"
                  />
                  <SeasonPicker value={quickStorySeason} onChange={setQuickStorySeason} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowQuickStory(false)}
                      className="flex-1 py-2 rounded-lg text-sm transition-all"
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.32)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleQuickStorySave}
                      disabled={!quickStoryTitle.trim() || !quickStoryContent.trim()}
                      className="flex-1 py-2 rounded-lg text-sm transition-all disabled:opacity-30"
                      style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(212,164,84,0.35)', color: 'rgba(212,164,84,0.9)' }}
                    >
                      Save story
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowQuickStory(true)}
                    className="flex-1 text-sm text-white/35 hover:text-white/55 transition-colors py-2 rounded-lg border border-white/[0.04] hover:bg-white/[0.03]"
                  >
                    + Quick story
                  </button>
                  <button
                    onClick={() => onAddStory(person.id)}
                    className="flex-1 text-sm text-white/35 hover:text-white/55 transition-colors py-2 rounded-lg border border-white/[0.04] hover:bg-white/[0.03]"
                  >
                    + Full story
                  </button>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* === Connections section === */}
          <CollapsibleSection
            title="Connections"
            section="connections"
            count={personRelationships.length}
            open={openSections.has('connections')}
            onToggle={() => toggleSection('connections')}
          >
            <div className="space-y-2">
              {personRelationships.length === 0 ? (
                <p className="text-xs text-white/20 italic">
                  No connections yet. Empty space in the sky — knowledge waiting to be discovered.
                </p>
              ) : (
                personRelationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs flex items-center justify-between"
                  >
                    <span className="text-white/50">{getRelatedPersonName(rel)}</span>
                    <span className="text-white/25">{rel.relationshipType.replace(/_/g, ' ')}</span>
                  </div>
                ))
              )}
              <button
                onClick={() => onAddConnection(person.id)}
                className="text-xs text-white/30 hover:text-white/50 transition-colors py-1"
              >
                + Add connection
              </button>
            </div>
          </CollapsibleSection>

          {/* Invite link (self-star only) */}
          {isSelf && (
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              {inviteLink ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-white/40">Share this link to connect:</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/70 truncate"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        setInviteCopied(true);
                        setTimeout(() => setInviteCopied(false), 2000);
                      }}
                      className="text-xs text-amber-400/60 hover:text-amber-400/80 transition-colors shrink-0"
                    >
                      {inviteCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  disabled={inviteLoading}
                  onClick={async () => {
                    setInviteLoading(true);
                    try {
                      const res = await fetch('/api/invite/create', { method: 'POST' });
                      const data = await res.json();
                      if (data.token) setInviteLink(`${window.location.origin}/invite/${data.token}`);
                    } catch { /* ignore */ }
                    setInviteLoading(false);
                  }}
                  className="w-full text-xs text-amber-400/60 hover:text-amber-400/80 transition-colors py-2 border border-amber-400/15 rounded-lg hover:bg-amber-400/5 disabled:opacity-40"
                >
                  {inviteLoading ? 'Creating link…' : 'Invite someone to your constellation'}
                </button>
              )}
            </div>
          )}

          {/* Delete */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400/60">Remove {person.displayName}?</span>
                <button
                  onClick={() => {
                    dispatch({ type: 'DELETE_PERSON', payload: person.id });
                    onClose();
                  }}
                  className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded border border-red-400/20"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-400/40 hover:text-red-400/70 transition-colors"
              >
                Remove from sky
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  section,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  section: Section;
  count: number | null;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(88,28,135,0.25)' }} data-section={section}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <h3 className="text-xs uppercase tracking-wider font-medium transition-colors"
          style={{ color: open ? 'rgba(212,164,84,0.8)' : 'rgba(212,164,84,0.45)' }}>
          {title} {count !== null && <span style={{ color: 'rgba(139,92,246,0.5)' }}>({count})</span>}
        </h3>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`transition-all ${open ? 'rotate-180' : ''}`}
          style={{ color: 'rgba(139,92,246,0.4)' }}
        >
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/35 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white/75 placeholder:text-white/20 focus:outline-none focus:border-white/[0.18]"
      />
    </div>
  );
}

// ─── Language / Country group combobox ───────────────────────────────────────
// Builds a flat list from the regions data: displayName + alternateNames, grouped by state.
const LANGUAGE_OPTIONS: { label: string; state: string; alternates: string[] }[] = regions
  .filter((r) => r.id !== 'not_listed')
  .map((r) => ({ label: r.displayName, state: r.stateTerritory, alternates: r.alternateNames ?? [] }));

function LanguageGroupCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Keep search input in sync when parent value changes externally
  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search.trim()
    ? LANGUAGE_OPTIONS.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.alternates.some((a) => a.toLowerCase().includes(search.toLowerCase())),
      )
    : LANGUAGE_OPTIONS;

  const hasExactMatch = LANGUAGE_OPTIONS.some(
    (o) => o.label.toLowerCase() === search.trim().toLowerCase(),
  );

  function select(label: string) {
    onChange(label);
    setSearch(label);
    setOpen(false);
  }

  // Group filtered results by state
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, o) => {
    const key = o.state || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-white/35 mb-1.5">Mob / Language group</label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type your own…"
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 pr-8 text-sm text-white/75 placeholder:text-white/20 focus:outline-none focus:border-white/[0.18]"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
          tabIndex={-1}
          aria-label="Toggle list"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M2 3.5l3 3 3-3" stroke="rgba(139,92,246,0.9)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-[70]"
          style={{
            background: 'rgba(8,4,22,0.98)',
            border: '1px solid rgba(88,28,135,0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            maxHeight: 220,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139,92,246,0.3) transparent',
          }}
        >
          {/* Custom entry option if no exact match */}
          {search.trim() && !hasExactMatch && (
            <button
              type="button"
              onClick={() => select(search.trim())}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] border-b"
              style={{ color: 'rgba(212,164,84,0.85)', borderColor: 'rgba(88,28,135,0.25)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(88,28,135,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ color: 'rgba(212,164,84,0.45)' }}>+</span>
              Use &quot;{search.trim()}&quot;
            </button>
          )}

          {filtered.length === 0 && !search.trim() && (
            <p className="px-3 py-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Start typing to search…</p>
          )}

          {Object.entries(grouped).map(([state, opts]) => (
            <div key={state}>
              <div className="px-3 py-1 sticky top-0" style={{ background: 'rgba(8,4,22,0.95)', color: 'rgba(139,92,246,0.5)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {state}
              </div>
              {opts.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => select(o.label)}
                  className="w-full text-left px-3 py-2 text-[12px] transition-all"
                  style={{
                    color: value === o.label ? 'rgba(212,164,84,0.95)' : 'rgba(255,255,255,0.65)',
                    background: value === o.label ? 'rgba(88,28,135,0.4)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (value !== o.label) e.currentTarget.style.background = 'rgba(88,28,135,0.2)'; }}
                  onMouseLeave={(e) => { if (value !== o.label) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{o.label}</span>
                  {o.alternates.length > 0 && (
                    <span className="ml-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                      ({o.alternates.slice(0, 2).join(', ')}{o.alternates.length > 2 ? '…' : ''})
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
