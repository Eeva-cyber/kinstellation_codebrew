'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Person, Visibility } from '@/lib/types';

interface PersonPanelProps {
  person: Person | null; // null = add new
  onClose: () => void;
  onAddStory: (personId: string) => void;
  onAddConnection: (personId: string) => void;
}

export function PersonPanel({ person, onClose, onAddStory, onAddConnection }: PersonPanelProps) {
  const { state, dispatch } = useApp();
  const isNew = !person;

  const [displayName, setDisplayName] = useState(person?.displayName ?? '');
  const [indigenousName, setIndigenousName] = useState(person?.indigenousName ?? '');
  const [skinName, setSkinName] = useState(person?.skinName ?? '');
  const [moiety, setMoiety] = useState(person?.moiety ?? '');
  const [countryLanguageGroup, setCountryLanguageGroup] = useState(
    person?.countryLanguageGroup ?? '',
  );
  const [isDeceased, setIsDeceased] = useState(person?.isDeceased ?? false);
  const [visibility, setVisibility] = useState<Visibility>(person?.visibility ?? 'family');

  const moietyNames = state.kinshipTemplate?.moietyNames;
  const sectionNames = state.kinshipTemplate?.sectionNames;

  const personRelationships = person
    ? state.relationships.filter(
        (r) => r.fromPersonId === person.id || r.toPersonId === person.id,
      )
    : [];

  function handleSave() {
    if (!displayName.trim()) return;

    const now = new Date().toISOString();
    const dimensions = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (isNew) {
      // Position: center of the appropriate moiety half, with some randomness
      let x = dimensions.width / 2 + (Math.random() - 0.5) * 150;
      if (moiety && moietyNames) {
        if (moiety === moietyNames[0]) x = dimensions.width * 0.3 + (Math.random() - 0.5) * 100;
        if (moiety === moietyNames[1]) x = dimensions.width * 0.7 + (Math.random() - 0.5) * 100;
      }
      const y = dimensions.height / 2 + (Math.random() - 0.5) * 150;

      const newPerson: Person = {
        id: crypto.randomUUID(),
        displayName: displayName.trim(),
        indigenousName: indigenousName.trim() || undefined,
        skinName: skinName.trim() || undefined,
        moiety: moiety || undefined,
        countryLanguageGroup: countryLanguageGroup.trim() || undefined,
        regionSelectorValue: state.selectedRegion ?? '',
        isDeceased,
        stories: [],
        visibility,
        lastUpdated: now,
        position: { x, y },
      };
      dispatch({ type: 'ADD_PERSON', payload: newPerson });
      onClose();
    } else {
      dispatch({
        type: 'UPDATE_PERSON',
        payload: {
          ...person,
          displayName: displayName.trim(),
          indigenousName: indigenousName.trim() || undefined,
          skinName: skinName.trim() || undefined,
          moiety: moiety || undefined,
          countryLanguageGroup: countryLanguageGroup.trim() || undefined,
          isDeceased,
          visibility,
          lastUpdated: now,
        },
      });
    }
  }

  function getRelatedPersonName(rel: typeof personRelationships[0]) {
    const otherId = rel.fromPersonId === person?.id ? rel.toPersonId : rel.fromPersonId;
    return state.persons.find((p) => p.id === otherId)?.displayName ?? 'Unknown';
  }

  return (
    <div className="absolute top-0 right-0 h-full w-80 z-30 animate-slide-right">
      <div className="h-full bg-[var(--panel-bg)] border-l border-[var(--panel-border)] backdrop-blur-xl overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-white/70 tracking-wide">
              {isNew ? 'Add Person' : person.displayName}
            </h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Deceased warning */}
          {isDeceased && !isNew && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40">
              Aboriginal and Torres Strait Islander peoples are advised that
              this profile may contain the name and image of a deceased person.
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            <Field label="Name" value={displayName} onChange={setDisplayName} placeholder="Display name" />
            <Field
              label="Indigenous name (optional)"
              value={indigenousName}
              onChange={setIndigenousName}
              placeholder="Name in language"
            />

            {/* Skin name */}
            {sectionNames ? (
              <div>
                <label className="block text-xs text-white/30 mb-1">Skin name</label>
                <select
                  value={skinName}
                  onChange={(e) => setSkinName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-white/[0.15]"
                >
                  <option value="">Select...</option>
                  {sectionNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Field
                label="Skin name (optional)"
                value={skinName}
                onChange={setSkinName}
                placeholder="Skin name"
              />
            )}

            {/* Moiety */}
            {moietyNames && (
              <div>
                <label className="block text-xs text-white/30 mb-1">Moiety</label>
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

            <Field
              label="Country / Language group (optional)"
              value={countryLanguageGroup}
              onChange={setCountryLanguageGroup}
              placeholder="e.g. Warlpiri, Noongar"
            />

            {/* Deceased toggle */}
            <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
              <input
                type="checkbox"
                checked={isDeceased}
                onChange={(e) => setIsDeceased(e.target.checked)}
                className="rounded border-white/10"
              />
              This person is deceased
            </label>

            {/* Visibility */}
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

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!displayName.trim()}
              className="w-full py-2.5 rounded-lg bg-white/[0.08] border border-white/[0.1]
                text-white/70 text-sm hover:bg-white/[0.12] transition-all
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isNew ? 'Add to sky' : 'Save'}
            </button>
          </div>

          {/* Existing person: stories + connections */}
          {!isNew && (
            <>
              {/* Stories */}
              <div className="mt-8 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs text-white/40 uppercase tracking-wider">
                    Stories ({person.stories.length})
                  </h3>
                  <button
                    onClick={() => onAddStory(person.id)}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    + Add story
                  </button>
                </div>
                {person.stories.length === 0 ? (
                  <p className="text-xs text-white/20 italic">
                    No stories yet. This star is waiting to be illuminated.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {person.stories.map((story) => (
                      <div
                        key={story.id}
                        className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs"
                      >
                        <span className="text-white/60">{story.title}</span>
                        <span className="text-white/20 ml-2">{story.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connections */}
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs text-white/40 uppercase tracking-wider">
                    Connections ({personRelationships.length})
                  </h3>
                  <button
                    onClick={() => onAddConnection(person.id)}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    + Add connection
                  </button>
                </div>
                {personRelationships.length === 0 ? (
                  <p className="text-xs text-white/20 italic">
                    No connections yet. Empty space in the sky — knowledge waiting to be discovered.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {personRelationships.map((rel) => (
                      <div
                        key={rel.id}
                        className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs flex items-center justify-between"
                      >
                        <span className="text-white/50">
                          {getRelatedPersonName(rel)}
                        </span>
                        <span className="text-white/25">
                          {rel.relationshipType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    if (confirm(`Remove ${person.displayName} from the sky?`)) {
                      dispatch({ type: 'DELETE_PERSON', payload: person.id });
                      onClose();
                    }
                  }}
                  className="text-xs text-red-400/40 hover:text-red-400/70 transition-colors"
                >
                  Remove from sky
                </button>
              </div>
            </>
          )}
        </div>
      </div>
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
      <label className="block text-xs text-white/30 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/15 focus:outline-none focus:border-white/[0.15]"
      />
    </div>
  );
}
