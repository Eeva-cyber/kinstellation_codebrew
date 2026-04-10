'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Person } from '@/lib/types';

interface QuickAddModalProps {
  onClose: () => void;
}

export function QuickAddModal({ onClose }: QuickAddModalProps) {
  const { state, dispatch } = useApp();
  const [displayName, setDisplayName] = useState('');
  const moietyNames = state.kinshipTemplate?.moietyNames;
  const [moiety, setMoiety] = useState('');

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
      id: crypto.randomUUID(),
      displayName: displayName.trim(),
      moiety: moiety || undefined,
      regionSelectorValue: state.selectedRegion ?? '',
      isDeceased: false,
      stories: [],
      visibility: 'family',
      lastUpdated: new Date().toISOString(),
      position: { x, y },
    };

    dispatch({ type: 'ADD_PERSON', payload: newPerson });
    onClose();
  }

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-[#0d0d18]/95 border border-white/[0.08] rounded-2xl p-6 w-72 shadow-2xl animate-fade-in">
        <h2 className="text-sm font-medium text-white/60 tracking-wide mb-5">
          Add a new star
        </h2>

        {/* Name field */}
        <div className="mb-4">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5
              text-sm text-white/80 placeholder:text-white/20
              focus:outline-none focus:border-white/[0.2] transition-colors"
          />
        </div>

        {/* Moiety toggle */}
        {moietyNames && (
          <div className="mb-5">
            <label className="block text-xs text-white/25 mb-1.5">Moiety</label>
            <div className="flex gap-2">
              {moietyNames.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMoiety(moiety === m ? '' : m)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-xs transition-all ${
                    moiety === m
                      ? 'border-white/20 bg-white/[0.08] text-white/80'
                      : 'border-white/[0.04] bg-white/[0.02] text-white/35 hover:bg-white/[0.04]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/[0.06] text-white/30 text-sm
              hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!displayName.trim()}
            className="flex-1 py-2 rounded-lg bg-white/[0.1] border border-white/[0.12]
              text-white/70 text-sm hover:bg-white/[0.15] transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add to sky
          </button>
        </div>
      </div>
    </div>
  );
}
