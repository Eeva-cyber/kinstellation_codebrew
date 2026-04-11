'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Person, RelationshipType, Relationship } from '@/lib/types';
import { WordTooltip } from '@/components/ui/WordTooltip';

interface AddConnectionPanelProps {
  fromPerson: Person;
  onClose: () => void;
}

const RELATIONSHIP_GROUPS: { label: string; types: { value: RelationshipType; label: string }[] }[] = [
  {
    label: 'Direct Family',
    types: [
      { value: 'mother',  label: 'Mother'  },
      { value: 'father',  label: 'Father'  },
      { value: 'child',   label: 'Child'   },
      { value: 'sibling', label: 'Sibling' },
      { value: 'spouse',  label: 'Spouse'  },
    ],
  },
  {
    label: 'Classificatory',
    types: [
      { value: 'classificatory_mother',  label: 'Classificatory mother'  },
      { value: 'classificatory_father',  label: 'Classificatory father'  },
      { value: 'classificatory_sibling', label: 'Classificatory sibling' },
    ],
  },
  {
    label: 'Other',
    types: [
      { value: 'avoidance',        label: 'Avoidance'        },
      { value: 'totemic',          label: 'Totemic'          },
      { value: 'country_connection', label: 'Country connection' },
      { value: 'kupai_omasker',    label: 'Kupai Omasker'    },
    ],
  },
];

// Line preview colours matching ConstellationLine
const LINE_PREVIEW: Record<RelationshipType, { stroke: string; dash?: string }> = {
  mother:                   { stroke: 'rgba(212,164,84,0.7)'  },
  father:                   { stroke: 'rgba(212,164,84,0.7)'  },
  child:                    { stroke: 'rgba(212,164,84,0.7)'  },
  sibling:                  { stroke: 'rgba(212,164,84,0.7)'  },
  spouse:                   { stroke: 'rgba(212,164,84,0.7)'  },
  classificatory_mother:    { stroke: 'rgba(139,92,246,0.55)', dash: '4 3' },
  classificatory_father:    { stroke: 'rgba(139,92,246,0.55)', dash: '4 3' },
  classificatory_sibling:   { stroke: 'rgba(139,92,246,0.55)', dash: '4 3' },
  avoidance:                { stroke: 'rgba(248,113,113,0.6)', dash: '2 4' },
  totemic:                  { stroke: 'rgba(139,92,246,0.38)', dash: '1 5' },
  country_connection:       { stroke: 'rgba(139,92,246,0.38)', dash: '1 5' },
  kupai_omasker:            { stroke: 'rgba(212,164,84,0.5)',  dash: '6 3' },
};

export function AddConnectionPanel({ fromPerson, onClose }: AddConnectionPanelProps) {
  const { state, dispatch } = useApp();
  const [toPersonId,       setToPersonId]       = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('sibling');
  const [notes,            setNotes]            = useState('');

  const otherPersons = state.persons.filter((p) => p.id !== fromPerson.id);
  const toPerson     = otherPersons.find(p => p.id === toPersonId);

  function handleSave() {
    if (!toPersonId || !relationshipType) return;
    const relationship: Relationship = {
      id: crypto.randomUUID(),
      fromPersonId: fromPerson.id,
      toPersonId,
      relationshipType,
      proximity: relationshipType.startsWith('classificatory') ? 'classificatory' : 'close',
      isAvoidance: relationshipType === 'avoidance',
      notes: notes.trim() || undefined,
    };
    dispatch({ type: 'ADD_RELATIONSHIP', payload: relationship });
    onClose();
  }

  const preview = LINE_PREVIEW[relationshipType];

  return (
    <div className="absolute top-0 right-0 h-full w-[22rem] z-30 animate-slide-right select-auto">
      <div className="h-full panel-scroll overflow-y-auto"
        style={{ background: 'rgba(6,3,18,0.97)', borderLeft: '1px solid rgba(88,28,135,0.4)', backdropFilter: 'blur(20px)' }}>
        <div className="p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.9)' }}>
                Connect stars
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.5)' }}>
                Draw a constellation line
              </p>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="w-7 h-7 flex items-center justify-center rounded-full transition-all"
              style={{ background: 'rgba(88,28,135,0.15)', border: '1px solid rgba(88,28,135,0.3)', color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.15)'; }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Top shimmer */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.35), rgba(212,164,84,0.15), rgba(139,92,246,0.35), transparent)' }} />

          {/* From → To */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.45)' }}>
              From
            </label>
            <div className="px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'rgba(88,28,135,0.1)', border: '1px solid rgba(88,28,135,0.25)', color: 'rgba(212,164,84,0.8)' }}>
              {fromPerson.displayName}
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M4 10l4 4 4-4" stroke="rgba(139,92,246,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <label className="block text-xs uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.45)' }}>
              To
            </label>
            {otherPersons.length === 0 ? (
              <p className="text-xs italic px-3 py-2.5" style={{ color: 'rgba(139,92,246,0.35)' }}>
                Add another person to the sky first.
              </p>
            ) : (
              <div className="rounded-xl overflow-hidden panel-scroll"
                style={{ background: 'rgba(8,4,22,0.8)', border: '1px solid rgba(88,28,135,0.3)', maxHeight: 160, overflowY: 'auto' }}>
                {otherPersons.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => setToPersonId(p.id)}
                    className="w-full text-left px-3 py-2.5 text-sm transition-all"
                    style={{
                      background: toPersonId === p.id ? 'rgba(88,28,135,0.35)' : 'transparent',
                      color: toPersonId === p.id ? 'rgba(212,164,84,0.9)' : 'rgba(255,255,255,0.6)',
                      borderBottom: '1px solid rgba(88,28,135,0.12)',
                    }}
                    onMouseEnter={e => { if (toPersonId !== p.id) (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.15)'; }}
                    onMouseLeave={e => { if (toPersonId !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    {p.displayName}
                    {p.moiety && (
                      <span className="ml-2 text-xs" style={{ color: 'rgba(139,92,246,0.45)' }}>{p.moiety}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line preview */}
          {toPersonId && (
            <div className="px-3 py-2.5 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(88,28,135,0.08)', border: '1px solid rgba(88,28,135,0.2)' }}>
              <svg width="48" height="8" viewBox="0 0 48 8" fill="none" className="shrink-0">
                <line x1="2" y1="4" x2="46" y2="4"
                  stroke={preview.stroke}
                  strokeWidth="1.8"
                  strokeDasharray={preview.dash}
                  strokeLinecap="round" />
              </svg>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {fromPerson.displayName} → {toPerson?.displayName}
              </span>
            </div>
          )}

          {/* Relationship type */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.45)' }}>
              Relationship
            </label>
            {RELATIONSHIP_GROUPS.map((group) => (
              <div key={group.label}>
                <span className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(88,28,135,0.6)' }}>
                  <WordTooltip term={group.label}>{group.label}</WordTooltip>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.types.map((t) => {
                    const active = relationshipType === t.value;
                    const lp = LINE_PREVIEW[t.value];
                    return (
                      <button key={t.value} type="button"
                        onClick={() => setRelationshipType(t.value)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all"
                        style={{
                          borderColor: active ? 'rgba(212,164,84,0.45)' : 'rgba(88,28,135,0.25)',
                          background:  active ? 'rgba(88,28,135,0.3)' : 'rgba(88,28,135,0.06)',
                          color:       active ? 'rgba(212,164,84,0.9)' : 'rgba(255,255,255,0.45)',
                        }}>
                        {/* Tiny line swatch */}
                        <svg width="14" height="6" viewBox="0 0 14 6" fill="none" className="shrink-0">
                          <line x1="1" y1="3" x2="13" y2="3"
                            stroke={active ? lp.stroke : 'rgba(139,92,246,0.35)'}
                            strokeWidth="1.5"
                            strokeDasharray={lp.dash}
                            strokeLinecap="round" />
                        </svg>
                        <WordTooltip term={t.label}>{t.label}</WordTooltip>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-widest" style={{ color: 'rgba(139,92,246,0.45)' }}>
              Notes <span style={{ color: 'rgba(139,92,246,0.28)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context…"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'rgba(88,28,135,0.06)',
                border: '1px solid rgba(88,28,135,0.25)',
                color: 'rgba(255,255,255,0.7)',
              }}
              onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.5)'; }}
              onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(88,28,135,0.25)'; }}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!toPersonId}
            className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(88,28,135,0.4)',
              border: '1px solid rgba(212,164,84,0.4)',
              color: 'rgba(212,164,84,0.95)',
              boxShadow: toPersonId ? '0 0 24px rgba(88,28,135,0.25)' : 'none',
            }}
            onMouseEnter={e => { if (toPersonId) (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.6)'; }}
            onMouseLeave={e => { if (toPersonId) (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.4)'; }}>
            Connect stars
          </button>
        </div>
      </div>
    </div>
  );
}
