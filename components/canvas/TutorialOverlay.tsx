'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store/AppContext';

interface TutorialOverlayProps {
  selfPersonName: string;
  onOpenAddPerson: () => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

export function TutorialOverlay({ selfPersonName, onOpenAddPerson, onComplete }: TutorialOverlayProps) {
  const { state } = useApp();
  const [step, setStep] = useState(0);
  const [personCountAtStart] = useState(state.persons.length);

  // Step 1 → step 2: auto-advance when a new person has been added
  useEffect(() => {
    if (step === 1 && state.persons.length > personCountAtStart) {
      setTimeout(() => setStep(2), 600);
    }
  }, [state.persons.length, step, personCountAtStart]);

  const cardStyle: React.CSSProperties = {
    background:    'rgba(8,4,22,0.95)',
    border:        '1px solid rgba(88,28,135,0.4)',
    boxShadow:     '0 8px 48px rgba(0,0,0,0.5), 0 0 60px rgba(88,28,135,0.1)',
    backdropFilter:'blur(20px)',
  };

  // Step dots
  function Dots() {
    return (
      <div className="flex items-center gap-1.5 mb-4">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className="rounded-full transition-all duration-500" style={{
            width:      i === step ? 22 : 7,
            height:     7,
            background: i === step ? '#D4A454' : i < step ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.09)',
            boxShadow:  i === step ? '0 0 10px rgba(212,164,84,0.5)' : 'none',
          }} />
        ))}
      </div>
    );
  }

  // ── Step 0: Welcome ─────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="fixed bottom-32 left-6 z-40 w-72 rounded-2xl p-6 animate-fade-in" style={cardStyle}>
        <Dots />
        <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
          Welcome{selfPersonName ? `, ${selfPersonName}` : ''}!
        </h3>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Your star is shining in the sky. This is your constellation — drag to explore, scroll to zoom in and see more detail.
        </p>
        <button
          onClick={() => setStep(1)}
          className="w-full py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all"
          style={{
            background: 'rgba(88,28,135,0.5)',
            border: '1px solid rgba(212,164,84,0.35)',
            color: '#FFE599',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.65)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.5)'; }}
        >
          Show me around →
        </button>
      </div>
    );
  }

  // ── Step 1: Add a family member (interactive — highlights + button) ─────────
  if (step === 1) {
    return (
      <>
        {/* Pulsing highlight ring around the + button area (bottom-right toolbar) */}
        <div
          className="fixed z-40 pointer-events-none"
          style={{ bottom: 22, right: 22 }}
        >
          <div
            className="animate-star-pulse rounded-full"
            style={{
              width:  64,
              height: 64,
              background:  'rgba(212,164,84,0.12)',
              border:      '2px solid rgba(212,164,84,0.5)',
              boxShadow:   '0 0 24px rgba(212,164,84,0.4), 0 0 48px rgba(212,164,84,0.15)',
              marginBottom: -8,
              marginRight:  -8,
            }}
          />
        </div>

        {/* Tooltip card near the + button */}
        <div
          className="fixed z-40 w-64 rounded-2xl p-5 animate-fade-in"
          style={{ ...cardStyle, bottom: 100, right: 24, border: '1px solid rgba(212,164,84,0.3)' }}
        >
          <Dots />
          <h3 className="text-sm font-light tracking-wide mb-1.5" style={{ color: '#FFE599' }}>
            Add a family member
          </h3>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Press the <span style={{ color: 'rgba(212,164,84,0.8)' }}>+ button</span> below to add someone to your constellation.
          </p>
          <button
            onClick={() => { onOpenAddPerson(); }}
            className="w-full py-2 rounded-lg text-xs font-medium tracking-wide transition-all"
            style={{
              background: 'rgba(212,164,84,0.18)',
              border: '1px solid rgba(212,164,84,0.3)',
              color: 'rgba(212,164,84,0.9)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.28)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.18)'; }}
          >
            Open the + button for me
          </button>
          <button
            onClick={onComplete}
            className="w-full text-center text-xs mt-2 transition-colors"
            style={{ color: 'rgba(139,92,246,0.35)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.6)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.35)'; }}
          >
            Skip tutorial
          </button>
        </div>
      </>
    );
  }

  // ── Step 2: Person added ────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="fixed bottom-32 left-6 z-40 w-72 rounded-2xl p-6 animate-fade-in" style={cardStyle}>
        <Dots />
        <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
          They&apos;re in your sky now!
        </h3>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Click any star to open their profile — add stories, connect them to others, and grow your constellation over time.
        </p>
        <button
          onClick={() => setStep(3)}
          className="w-full py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all"
          style={{
            background: 'rgba(88,28,135,0.5)',
            border: '1px solid rgba(212,164,84,0.35)',
            color: '#FFE599',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.65)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.5)'; }}
        >
          Got it →
        </button>
      </div>
    );
  }

  // ── Step 3: Completion ──────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-32 left-6 z-40 w-72 rounded-2xl p-6 animate-fade-in" style={cardStyle}>
      <Dots />
      {/* Tiny constellation icon */}
      <div className="mb-4">
        <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
          <circle cx="8"  cy="16" r="3.5" fill="rgba(212,164,84,0.9)" />
          <circle cx="24" cy="6"  r="2.8" fill="rgba(212,164,84,0.75)" />
          <circle cx="40" cy="16" r="3.2" fill="rgba(212,164,84,0.85)" />
          <circle cx="24" cy="26" r="2.5" fill="rgba(212,164,84,0.65)" />
          <line x1="8" y1="16" x2="24" y2="6"  stroke="rgba(212,164,84,0.35)" strokeWidth="1" />
          <line x1="24" y1="6"  x2="40" y2="16" stroke="rgba(212,164,84,0.35)" strokeWidth="1" />
          <line x1="40" y1="16" x2="24" y2="26" stroke="rgba(212,164,84,0.35)" strokeWidth="1" />
          <line x1="24" y1="26" x2="8"  y2="16" stroke="rgba(212,164,84,0.35)" strokeWidth="1" />
        </svg>
      </div>
      <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
        Your constellation is growing
      </h3>
      <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Every star you add, every story you record, every connection you make — your family&apos;s sky grows brighter.
      </p>
      <button
        onClick={onComplete}
        className="w-full py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all"
        style={{
          background: 'rgba(88,28,135,0.5)',
          border: '1px solid rgba(212,164,84,0.35)',
          color: '#FFE599',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.65)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.5)'; }}
      >
        Enter the sky
      </button>
    </div>
  );
}
