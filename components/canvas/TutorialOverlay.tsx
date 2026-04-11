'use client';

import { useState } from 'react';

interface TutorialOverlayProps {
  onOpenPersonById?: (id: string) => void;
  onOpenTimeline?: () => void;
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

// All cards use z-[60] to sit above SeasonWheel (z-[50]) and all other canvas UI.
// Positioned upper-right to avoid: SeasonWheel (bottom-left), toolbar (bottom-right),
// moiety buttons (top-center), and timeline panel (bottom, full-width).
const CARD_POSITION = 'fixed top-20 left-6 z-[60] w-72';

const cardStyle: React.CSSProperties = {
  background:     'rgba(8,4,22,0.97)',
  border:         '1px solid rgba(88,28,135,0.5)',
  boxShadow:      '0 8px 48px rgba(0,0,0,0.7), 0 0 60px rgba(88,28,135,0.18)',
  backdropFilter: 'blur(20px)',
};

function SkipBtn({ onComplete }: { onComplete: () => void }) {
  return (
    <button
      onClick={onComplete}
      className="w-full text-center text-xs mt-2 py-1 transition-colors"
      style={{ color: 'rgba(139,92,246,0.35)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.65)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.35)'; }}
    >
      Skip tutorial
    </button>
  );
}

function GoldBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2 rounded-lg text-xs font-medium tracking-wide transition-all mb-2"
      style={{ background: 'rgba(212,164,84,0.18)', border: '1px solid rgba(212,164,84,0.3)', color: 'rgba(212,164,84,0.9)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.3)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.18)'; }}
    >
      {label}
    </button>
  );
}

function PurpleBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all"
      style={{ background: 'rgba(88,28,135,0.5)', border: '1px solid rgba(212,164,84,0.35)', color: '#FFE599' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.65)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.5)'; }}
    >
      {label}
    </button>
  );
}

export function TutorialOverlay({ onOpenPersonById, onOpenTimeline, onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

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

  // ── Step 0: What you're looking at ─────────────────────────────────────────
  if (step === 0) {
    return (
      <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={(e) => e.stopPropagation()}>
        <Dots />
        <div className="mb-3">
          <svg width="52" height="34" viewBox="0 0 52 34" fill="none">
            <circle cx="8"  cy="17" r="4"   fill="rgba(212,164,84,0.95)" />
            <circle cx="26" cy="6"  r="3"   fill="rgba(212,164,84,0.75)" />
            <circle cx="44" cy="17" r="3.5" fill="rgba(212,164,84,0.85)" />
            <circle cx="30" cy="28" r="2.5" fill="rgba(212,164,84,0.60)" />
            <circle cx="14" cy="26" r="2"   fill="rgba(212,164,84,0.50)" />
            <line x1="8"  y1="17" x2="26" y2="6"  stroke="rgba(212,164,84,0.3)" strokeWidth="1" />
            <line x1="26" y1="6"  x2="44" y2="17" stroke="rgba(212,164,84,0.3)" strokeWidth="1" />
            <line x1="8"  y1="17" x2="14" y2="26" stroke="rgba(212,164,84,0.3)" strokeWidth="1" />
            <line x1="14" y1="26" x2="30" y2="28" stroke="rgba(212,164,84,0.3)" strokeWidth="1" />
            <line x1="44" y1="17" x2="30" y2="28" stroke="rgba(212,164,84,0.3)" strokeWidth="1" />
          </svg>
        </div>
        <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
          You&apos;re looking at a living constellation
        </h3>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Five Warlpiri community members are already here —
          <span style={{ color: 'rgba(212,164,84,0.85)' }}> Aunty June, Uncle Ray, Cousin Mia, Elder Thomas,</span> and
          <span style={{ color: 'rgba(212,164,84,0.85)' }}> Young Sarah</span>.
        </p>
        <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Each star is a person. Brighter stars have more stories. Drag to explore, scroll to zoom.
        </p>
        <PurpleBtn label="Show me around →" onClick={() => setStep(1)} />
        <SkipBtn onComplete={onComplete} />
      </div>
    );
  }

  // ── Step 1: Click a star ────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <>
        {/* Pulsing ring around the + button (bottom-right toolbar) */}
        <div className="fixed z-[60] pointer-events-none" style={{ bottom: 22, right: 22 }}>
          <div
            className="animate-star-pulse rounded-full"
            style={{
              width: 64, height: 64,
              background: 'rgba(212,164,84,0.12)',
              border: '2px solid rgba(212,164,84,0.5)',
              boxShadow: '0 0 24px rgba(212,164,84,0.4), 0 0 48px rgba(212,164,84,0.15)',
              marginBottom: -8, marginRight: -8,
            }}
          />
        </div>

        {/* Tooltip card — upper-right, clear of toolbar */}
        <div className={`${CARD_POSITION} rounded-2xl p-5 animate-fade-in`}
          style={{ ...cardStyle, border: '1px solid rgba(212,164,84,0.3)' }}
          onMouseDown={(e) => e.stopPropagation()}>
          <Dots />
          <h3 className="text-sm font-light tracking-wide mb-1.5" style={{ color: '#FFE599' }}>
            Tap a star to hear their story
          </h3>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Click any star on the canvas — try{' '}
            <span style={{ color: 'rgba(212,164,84,0.85)' }}>Aunty June</span>. Her profile opens with three stories: the Seven Sisters Dreaming, walking Country with her grandmother, and her Saturday language circle.
          </p>
          {onOpenPersonById && (
            <GoldBtn
              label="Open Aunty June for me"
              onClick={() => { onOpenPersonById('demo-1'); setStep(2); }}
            />
          )}
          <PurpleBtn label="Got it →" onClick={() => setStep(2)} />
          <SkipBtn onComplete={onComplete} />
        </div>
      </>
    );
  }

  // ── Step 2: Moiety + connections ────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={(e) => e.stopPropagation()}>
        <Dots />
        <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
          Two sides of Country
        </h3>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          The <span style={{ color: 'rgba(212,164,84,0.85)' }}>Sun side</span> and{' '}
          <span style={{ color: 'rgba(139,92,246,0.85)' }}>Shade side</span> buttons at the top of the screen split the constellation by moiety — the two complementary halves of Warlpiri Country.
        </p>
        <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Relationship lines connect family — gold for direct kin, purple for classificatory. Click any line to see the connection type.
        </p>
        <PurpleBtn label="Got it →" onClick={() => setStep(3)} />
        <SkipBtn onComplete={onComplete} />
      </div>
    );
  }

  // ── Step 3: Timeline + summarise ────────────────────────────────────────────
  return (
    <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={(e) => e.stopPropagation()}>
      <Dots />
      <div className="mb-3">
        <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
          <line x1="4" y1="14" x2="36" y2="14" stroke="rgba(88,28,135,0.5)" strokeWidth="1.5" />
          <circle cx="10" cy="14" r="3"   fill="rgba(212,164,84,0.85)" />
          <circle cx="20" cy="8"  r="2.5" fill="rgba(139,92,246,0.7)" />
          <circle cx="30" cy="14" r="3"   fill="rgba(212,164,84,0.65)" />
          <circle cx="22" cy="20" r="2"   fill="rgba(139,92,246,0.5)" />
        </svg>
      </div>
      <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
        The Story Timeline holds everything
      </h3>
      <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
        Press the <span style={{ color: 'rgba(212,164,84,0.85)' }}>timeline button</span> (bottom-right) to filter stories by season, generation, or voice type.
      </p>
      <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Then hit <span style={{ color: 'rgba(212,164,84,0.7)' }}>✦ Summarise</span> to get an AI paragraph across all the stories you&apos;ve selected — one click, no extra steps.
      </p>
      {onOpenTimeline && (
        <GoldBtn
          label="Open the Timeline for me"
          onClick={() => { onOpenTimeline(); onComplete(); }}
        />
      )}
      <button
        onClick={onComplete}
        className="w-full py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all"
        style={{ background: 'rgba(88,28,135,0.5)', border: '1px solid rgba(212,164,84,0.35)', color: '#FFE599' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.65)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.5)'; }}
      >
        Enter the sky
      </button>
    </div>
  );
}
