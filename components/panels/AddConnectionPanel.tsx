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
      { value: 'mother', label: 'Mother' },
      { value: 'father', label: 'Father' },
      { value: 'child', label: 'Child' },
      { value: 'sibling', label: 'Sibling' },
      { value: 'spouse', label: 'Spouse' },
    ],
  },
  {
    label: 'Classificatory',
    types: [
      { value: 'classificatory_mother', label: 'Classificatory mother' },
      { value: 'classificatory_father', label: 'Classificatory father' },
      { value: 'classificatory_sibling', label: 'Classificatory sibling' },
    ],
  },
  {
    label: 'Other',
    types: [
      { value: 'avoidance', label: 'Avoidance' },
      { value: 'totemic', label: 'Totemic' },
      { value: 'country_connection', label: 'Country connection' },
      { value: 'kupai_omasker', label: 'Kupai Omasker' },
    ],
  },
];

export function AddConnectionPanel({ fromPerson, onClose }: AddConnectionPanelProps) {
  const { state, dispatch } = useApp();
  const [toPersonId, setToPersonId] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('sibling');
  const [notes, setNotes] = useState('');

  const otherPersons = state.persons.filter((p) => p.id !== fromPerson.id);

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

  return (
    <div className="absolute top-0 right-0 h-full w-[22rem] z-30 animate-slide-right select-auto">
      <div className="h-full bg-[var(--panel-bg)] border-l border-[var(--panel-border)] backdrop-blur-xl panel-scroll">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-white/75 tracking-wide">
              Add connection
            </h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            {/* From */}
            <div>
              <label className="block text-xs text-white/30 mb-1">From</label>
              <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-sm text-white/50">
                {fromPerson.displayName}
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-xs text-white/30 mb-1">To</label>
              {otherPersons.length === 0 ? (
                <p className="text-xs text-white/20 italic">
                  Add another person to the sky first.
                </p>
              ) : (
                <select
                  value={toPersonId}
                  onChange={(e) => setToPersonId(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-white/[0.15]"
                >
                  <option value="">Select a person...</option>
                  {otherPersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Relationship type */}
            <div>
              <label className="block text-xs text-white/30 mb-1">Relationship</label>
              <div className="space-y-3">
                {RELATIONSHIP_GROUPS.map((group) => (
                  <div key={group.label}>
                    <span className="block text-[10px] text-white/20 uppercase tracking-wider mb-1">
                      <WordTooltip term={group.label}>{group.label}</WordTooltip>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {group.types.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setRelationshipType(t.value)}
                          className={`px-2.5 py-1 rounded-md border text-[11px] transition-all ${
                            relationshipType === t.value
                              ? 'border-white/20 bg-white/[0.08] text-white/80'
                              : 'border-white/[0.04] bg-white/[0.02] text-white/35 hover:bg-white/[0.04]'
                          }`}
                        >
                          <WordTooltip term={t.label}>{t.label}</WordTooltip>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-white/30 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/15 focus:outline-none focus:border-white/[0.15]"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!toPersonId}
              className="w-full py-2.5 rounded-lg bg-white/[0.08] border border-white/[0.1]
                text-white/70 text-sm hover:bg-white/[0.12] transition-all
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Connect stars
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
