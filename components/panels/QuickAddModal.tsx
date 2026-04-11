'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { mobGroups, type MobGroup } from '@/lib/data/mob-groups';
import { regions } from '@/lib/data/regions';
import type { Person, Region } from '@/lib/types';

interface QuickAddModalProps {
  onClose: () => void;
  onPersonAdded?: (personId: string) => void;
  tutorialHighlight?: boolean;
}

// ── Searchable dropdown matching onboarding style ─────────────────────────────
function SearchInput({
  value, onChange, placeholder, suggestions, onSelect, focused, onFocus, onBlur,
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; suggestions: MobGroup[];
  onSelect: (g: MobGroup) => void;
  focused: boolean; onFocus: () => void; onBlur: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const q = value.trim().toLowerCase();

  const filtered = q.length > 0
    ? suggestions.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.alternateNames?.some(n => n.toLowerCase().includes(q))
      ).slice(0, 8)
    : suggestions.slice(0, 6);

  const showList = focused && !dismissed && filtered.length > 0;

  const inputStyle: React.CSSProperties = {
    background:   focused ? 'rgba(88,28,135,0.2)' : value ? 'rgba(88,28,135,0.12)' : 'rgba(88,28,135,0.07)',
    border:       `1px solid ${focused ? 'rgba(212,164,84,0.55)' : value ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.25)'}`,
    borderRadius: 10,
    padding:      '10px 14px',
    color:        'rgba(255,255,255,0.9)',
    fontSize:     14,
    outline:      'none',
    width:        '100%',
    boxShadow:    focused ? '0 0 0 3px rgba(88,28,135,0.18)' : 'none',
    transition:   'all 0.2s ease',
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setDismissed(false); }}
        placeholder={placeholder}
        autoCapitalize="words"
        onFocus={onFocus}
        onBlur={() => { setTimeout(() => { onBlur(); }, 150); }}
        style={inputStyle}
      />
      {showList && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-10"
          style={{
            background: 'rgba(8,4,22,0.98)',
            border: '1px solid rgba(139,92,246,0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {filtered.map(g => (
            <button
              key={g.id}
              type="button"
              onMouseDown={() => { onChange(g.name); onSelect(g); setDismissed(true); }}
              className="w-full text-left px-3 py-2.5 text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.75)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ color: 'rgba(212,164,84,0.9)' }}>{g.name}</span>
              {g.description && (
                <span className="block text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {g.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Simple styled text input ──────────────────────────────────────────────────
function StyledInput({
  value, onChange, placeholder, autoFocus, onKeyDown,
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text"
      value={value}
      onChange={e => {
        const v = e.target.value;
        onChange(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v);
      }}
      placeholder={placeholder}
      autoFocus={autoFocus}
      autoCapitalize="sentences"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={onKeyDown}
      style={{
        background:   focused ? 'rgba(88,28,135,0.2)' : value ? 'rgba(88,28,135,0.12)' : 'rgba(88,28,135,0.07)',
        border:       `1px solid ${focused ? 'rgba(212,164,84,0.55)' : value ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.25)'}`,
        borderRadius: 10,
        padding:      '10px 14px',
        color:        'rgba(255,255,255,0.9)',
        fontSize:     14,
        outline:      'none',
        width:        '100%',
        boxShadow:    focused ? '0 0 0 3px rgba(88,28,135,0.18)' : 'none',
        transition:   'all 0.2s ease',
      }}
    />
  );
}

// ── Nation searchable dropdown (uses regions data) ────────────────────────────
function NationSearchInput({
  value, onChange, focused, onFocus, onBlur,
}: {
  value: string; onChange: (v: string) => void;
  focused: boolean; onFocus: () => void; onBlur: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const q = value.trim().toLowerCase();

  const filtered = q.length > 0
    ? regions.filter(r =>
        r.displayName.toLowerCase().includes(q) ||
        r.alternateNames?.some(n => n.toLowerCase().includes(q))
      ).slice(0, 8)
    : regions.slice(0, 6);

  const showList = focused && !dismissed && filtered.length > 0;

  const inputStyle: React.CSSProperties = {
    background:   focused ? 'rgba(88,28,135,0.2)' : value ? 'rgba(88,28,135,0.12)' : 'rgba(88,28,135,0.07)',
    border:       `1px solid ${focused ? 'rgba(212,164,84,0.55)' : value ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.25)'}`,
    borderRadius: 10,
    padding:      '10px 14px',
    color:        'rgba(255,255,255,0.9)',
    fontSize:     14,
    outline:      'none',
    width:        '100%',
    boxShadow:    focused ? '0 0 0 3px rgba(88,28,135,0.18)' : 'none',
    transition:   'all 0.2s ease',
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setDismissed(false); }}
        placeholder="e.g. Wurundjeri, Gunditjmara"
        autoCapitalize="words"
        onFocus={onFocus}
        onBlur={() => { setTimeout(() => { onBlur(); }, 150); }}
        style={inputStyle}
      />
      {showList && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-10"
          style={{
            background: 'rgba(8,4,22,0.98)',
            border: '1px solid rgba(139,92,246,0.4)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {filtered.map((r: Region) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={() => { onChange(r.displayName); setDismissed(true); }}
              className="w-full text-left px-3 py-2.5 text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.75)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ color: 'rgba(212,164,84,0.9)' }}>{r.displayName}</span>
              {r.countryDescription && (
                <span className="block text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {r.countryDescription}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuickAddModal({ onClose, onPersonAdded, tutorialHighlight }: QuickAddModalProps) {
  const { state, dispatch } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [nation,      setNation]      = useState('');
  const [language,    setLanguage]    = useState('');
  const [community,   setCommunity]   = useState('');
  const [moiety,      setMoiety]      = useState('');

  // Focus states for searchable fields
  const [nationFocused,    setNationFocused]    = useState(false);
  const [communityFocused, setCommunityFocused] = useState(false);
  const [langFocused,      setLangFocused]      = useState(false);

  const moietyNames    = state.kinshipTemplate?.moietyNames;
  const currentRegion  = state.selectedRegion ? regions.find(r => r.id === state.selectedRegion) : null;


  const commSuggestions = currentRegion
    ? [...mobGroups.filter(g => g.type === 'community' && g.nationId === currentRegion.id), ...mobGroups.filter(g => g.type === 'community' && !g.nationId)]
    : mobGroups.filter(g => g.type === 'community');

  const langSuggestions = mobGroups.filter(g => g.type === 'language_group');

  // ESC key closes the modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleAdd() {
    if (!displayName.trim()) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    let x = w / 2 + (Math.random() - 0.5) * 150;
    if (moiety && moietyNames) {
      if (moiety === moietyNames[0]) x = w * 0.3 + (Math.random() - 0.5) * 100;
      if (moiety === moietyNames[1]) x = w * 0.7 + (Math.random() - 0.5) * 100;
    }
    const y = h / 2 + (Math.random() - 0.5) * 150;

    const newPerson: Person = {
      id:                   crypto.randomUUID(),
      displayName:          displayName.trim(),
      nation:               nation.trim()    || undefined,
      community:            community.trim() || undefined,
      countryLanguageGroup: language.trim()  || undefined,
      moiety:               moiety           || undefined,
      regionSelectorValue:  state.selectedRegion ?? '',
      isDeceased:           false,
      stories:              [],
      visibility:           'family',
      lastUpdated:          new Date().toISOString(),
      position:             { x, y },
    };

    dispatch({ type: 'ADD_PERSON', payload: newPerson });
    onClose();
    onPersonAdded?.(newPerson.id);
  }

  const LABEL: React.CSSProperties = { color: 'rgba(212,164,84,0.7)', fontSize: 11, marginBottom: 6, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' };
  const OPT: React.CSSProperties   = { color: 'rgba(255,255,255,0.25)', fontWeight: 400 };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative rounded-2xl p-7 w-96 shadow-2xl animate-fade-in"
        style={{
          background:    'rgba(8,4,22,0.98)',
          border:        tutorialHighlight ? '1px solid rgba(212,164,84,0.45)' : '1px solid rgba(139,92,246,0.4)',
          boxShadow:     '0 0 60px rgba(88,28,135,0.3), 0 25px 50px rgba(0,0,0,0.75)',
          maxHeight:     '90vh',
          overflowY:     'auto',
          ...(tutorialHighlight && { filter: 'brightness(1.22)' }),
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(212,164,84,0.2), rgba(139,92,246,0.5), transparent)' }} />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.95)' }}>
              Add a new star
            </h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(139,92,246,0.55)' }}>
              Their star will appear in the sky.
            </p>
          </div>
          {/* × close button */}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-base leading-none transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div className="">
            <label style={LABEL}>Name</label>
            <StyledInput
              value={displayName}
              onChange={setDisplayName}
              placeholder="Their name"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>

          {/* Nation */}
          <div className="">
            <label style={LABEL}>Nation <span style={OPT}>(optional)</span></label>
            <NationSearchInput
              value={nation}
              onChange={setNation}
              focused={nationFocused}
              onFocus={() => setNationFocused(true)}
              onBlur={() => setNationFocused(false)}
            />
          </div>

          {/* Language group */}
          <div className="">
            <label style={LABEL}>Language group <span style={OPT}>(optional)</span></label>
            <SearchInput
              value={language}
              onChange={setLanguage}
              placeholder="e.g. Woi wurrung, Dja Dja wurrung"
              suggestions={langSuggestions}
              onSelect={g => setLanguage(g.name)}
              focused={langFocused}
              onFocus={() => setLangFocused(true)}
              onBlur={() => setLangFocused(false)}
            />
          </div>

          {/* Community */}
          <div>
            <label style={LABEL}>Community <span style={OPT}>(optional)</span></label>
            <SearchInput
              value={community}
              onChange={setCommunity}
              placeholder="Search or type community…"
              suggestions={commSuggestions}
              onSelect={g => setCommunity(g.name)}
              focused={communityFocused}
              onFocus={() => setCommunityFocused(true)}
              onBlur={() => setCommunityFocused(false)}
            />
          </div>

          {/* Moiety toggle */}
          {moietyNames && (
            <div className="">
              <label style={LABEL}>Moiety <span style={OPT}>(optional)</span></label>
              <div className="flex gap-2">
                {moietyNames.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMoiety(moiety === m ? '' : m)}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={moiety === m ? {
                      background: 'rgba(88,28,135,0.5)',
                      border: '1px solid rgba(212,164,84,0.45)',
                      color: 'rgba(212,164,84,0.95)',
                    } : {
                      background: 'rgba(88,28,135,0.07)',
                      border: '1px solid rgba(139,92,246,0.25)',
                      color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(139,92,246,0.22)',
              color: 'rgba(255,255,255,0.35)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.22)')}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!displayName.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(88,28,135,0.65)',
              border: '1px solid rgba(212,164,84,0.4)',
              color: 'rgba(212,164,84,0.95)',
              boxShadow: displayName.trim() ? '0 0 20px rgba(88,28,135,0.25)' : 'none',
            }}
          >
            Add to sky
          </button>
        </div>
      </div>
    </div>
  );
}
