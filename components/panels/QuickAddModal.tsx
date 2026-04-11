'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Person } from '@/lib/types';

interface QuickAddModalProps {
  onClose: () => void;
  onPersonAdded?: (personId: string) => void;
}

export function QuickAddModal({ onClose, onPersonAdded }: QuickAddModalProps) {
  const { state, dispatch } = useApp();
  const [displayName, setDisplayName] = useState('');
  const moietyNames = state.kinshipTemplate?.moietyNames;
  const [moiety, setMoiety] = useState('');

  // ESC key closes the modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
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
    onPersonAdded?.(newPerson.id);
  }

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative rounded-2xl p-6 w-72 shadow-2xl animate-fade-in"
        style={{
          background: 'rgba(8,4,22,0.98)',
          border: '1px solid rgba(88,28,135,0.5)',
          boxShadow: '0 0 40px rgba(88,28,135,0.3), 0 25px 50px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.9)' }}>
            Add a new star
          </h2>
          <span className="text-[10px]" style={{ color: 'rgba(139,92,246,0.45)' }}>esc to close</span>
        </div>
        <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Their star will appear and their profile will open.
        </p>

        {/* Name field */}
        <div className="mb-4">
          <input
            type="text"
            value={displayName}
            onChange={(e) => { const v = e.target.value; setDisplayName(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v); }}
            placeholder="Name"
            autoFocus
            autoCapitalize="sentences"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="w-full rounded-lg px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none transition-colors"
            style={{
              background: 'rgba(88,28,135,0.14)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: 'rgba(255,255,255,0.85)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(212,164,84,0.45)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)')}
          />
        </div>

        {/* Moiety toggle */}
        {moietyNames && (
          <div className="mb-5">
            <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.55)' }}>Moiety</label>
            <div className="flex gap-2">
              {moietyNames.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMoiety(moiety === m ? '' : m)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs transition-all"
                  style={moiety === m ? {
                    background: 'rgba(88,28,135,0.55)',
                    border: '1px solid rgba(212,164,84,0.4)',
                    color: 'rgba(212,164,84,0.95)',
                  } : {
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
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
            className="flex-1 py-2 rounded-lg text-sm transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.32)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!displayName.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(88,28,135,0.65)',
              border: '1px solid rgba(212,164,84,0.35)',
              color: 'rgba(212,164,84,0.95)',
            }}
          >
            Add to sky
          </button>
        </div>
      </div>
    </div>
  );
}
