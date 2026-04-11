'use client';

import { useState, useEffect, useCallback } from 'react';

interface TutorialOverlayProps {
  onOpenPersonById?: (id: string) => void;
  onOpenTimeline?: () => void;
  onOpenAddStar?: () => void;
  onClosePanel?: () => void;
  onComplete: () => void;
  /** Called every time the effective tutorial step changes (−1 = audio prompt) */
  onStepChange?: (step: number) => void;
  /** Ref that SkyCanvas fills — calling it advances the tutorial one step */
  advanceRef?: React.MutableRefObject<(() => void) | null>;
  /** Which panel is currently open — used to reposition the card so it doesn't overlap */
  activePanel?: string | null;
}

// Steps: 0=mouse, 1=welcome, 2=click star, 3=dashboard, 4=moiety, 5=planets, 6=season wheel, 7=timeline, 8=inside timeline, 9=add star, 10=save
const TOTAL_STEPS = 11;

const cardStyle: React.CSSProperties = {
  background:     'rgba(12,6,30,0.99)',
  border:         '1px solid rgba(212,164,84,0.55)',
  boxShadow:      '0 8px 64px rgba(0,0,0,0.9), 0 0 80px rgba(88,28,135,0.25), 0 0 40px rgba(212,164,84,0.12)',
  backdropFilter: 'blur(28px)',
};

// ── Audio scripts — clean spoken English, one per step ──────────────────────
const AUDIO_SCRIPTS: string[] = [
  // 0: Mouse controls
  `Before we explore, here is how to move around. Drag anywhere on the dark sky with your mouse or finger to pan and look around. Use the scroll wheel on a mouse, or pinch with two fingers on a screen, to zoom in and out. And click or tap any glowing star to open it. Try it now — then tap Let us begin when you are ready!`,

  // 1: Welcome
  `Welcome to Kinstellation! This is a constellation — a living map where people are stars and families are connected like the night sky. Right now, three Wurundjeri Woi Wurrung community members are here: Elder Thomas, Aunty June, and Young Sarah. The Wurundjeri Woi Wurrung are the traditional custodians of Melbourne and the Yarra River valley in Victoria, Australia. Try dragging the sky to look around!`,

  // 2: Click Aunty June's star
  `Every star is a person. Watch Aunty June's star — it is glowing and pulsing to show you where to tap. Click her star to open her page, where you can read her stories and see her family connections. When you are ready, tap the button below and we will open it together.`,

  // 3: Star dashboard
  `Welcome to the star dashboard. You are looking at Aunty June's home page. At the top you can see four glowing tabs — Stories, Profile, Connections, and Media. In the Stories tab there are two glowing buttons. The gold Quick Story button lets you jot down a short story right away. The purple Full Story button opens a bigger editor with seasons, eras, and a microphone so you can record by speaking. The Profile tab shows her name, Nation, language group, and moiety. The Connections tab shows family links and lets you invite real family to join. The Media tab holds photos, videos, and journal entries.`,

  // 4: Bunjil and Waa
  `Bunjil and Waa. Wurundjeri Country has two sides, like two big families that belong together. One side belongs to the Eagle spirit, Bunjil. The other belongs to the Crow spirit, Waa. Elder Thomas and Young Sarah are Bunjil. Aunty June is Waa. The two glowing labels at the very top of the screen are the moiety names. Tap one to light up only that side of the sky. Lines between stars show how people are family. Gold lines show close family. Purple lines show extended family.`,

  // 5: Attribute planets
  `Planets. Each person has small coloured planets orbiting their star. Gold shows their Nation — the Country they belong to. Green shows their language group. Teal shows their community. All the planets are glowing right now so you can spot them. Tap any planet to read cultural information about that place, specific to Victorian Koorie Country.`,

  // 6: Season Wheel
  `The Season Wheel. In the bottom left corner you can see a glowing circular wheel. Each segment is a season used by this community — not calendar months. Tap any segment to filter the whole sky by that season. When a filter is active, matching story planets glow bright and everything else dims. The season shown in the centre is the current season. Have a tap and explore!`,

  // 7: Timeline intro
  `The Story Timeline. Every story ever added lives in the Story Timeline — it is like a giant family scrapbook sorted by season. The timeline button in the bottom right corner is glowing right now so you know where to find it. Click it any time to open the timeline. Let us take a look now!`,

  // 8: Inside the timeline
  `Inside the Timeline. Stories are sorted into columns by season — like Cold Season or Fire Season — instead of months of the year. The filter buttons at the top are glowing — use them to narrow down stories by person, season, generation like Elder's time or Our time, or story type. Hit the Summarise button in the header to get a paragraph that sums up everything you can see — great for school projects or sharing with family.`,

  // 9: Add a star
  `Adding your own star. The glowing plus button in the bottom right corner opens a form to add a family member or community person to the sky. Fill in their name. Then choose their Nation, their language group, and their moiety — either Bunjil or Waa — if you know it. All the form fields are glowing so you can see what to fill in. Nothing is locked in — you can always add more details later.`,

  // 10: Save button (final)
  `Almost done! To keep your constellation safe forever, use the glowing Save button at the bottom of the toolbar on the right. It creates an account so all your people and stories are remembered next time you come back. That is everything! You are ready to explore Kinstellation. Tap Enter the sky to begin.`,
];

// ── TTS helpers ──────────────────────────────────────────────────────────────

// Known male voice name substrings — checked in order of preference
const MALE_VOICE_NAMES = ['Daniel', 'Alex', 'David', 'Mark', 'Fred', 'Google UK English Male', 'Google US English', 'Thomas', 'Luca'];

function getBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  // Prefer a known male voice name
  for (const name of MALE_VOICE_NAMES) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  // Fallback: en-AU → en-GB → any English
  return (
    voices.find(v => v.lang === 'en-AU') ??
    voices.find(v => v.lang === 'en-GB') ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  );
}

function speakText(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate   = 0.82;  // slow and deliberate
  u.pitch  = 0.75;  // lower pitch → male-sounding
  u.volume = 1.0;
  const voice = getBestVoice();
  if (voice) u.voice = voice;
  else u.lang = 'en-AU';
  window.speechSynthesis.speak(u);
}

function stopSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

// ── Shared visual components ─────────────────────────────────────────────────

function DarkBackdrop() {
  return (
    <div
      className="fixed inset-0 z-[59] pointer-events-none animate-fade-in"
      style={{ background: 'rgba(2,1,8,0.68)' }}
    />
  );
}

function SoftBackdrop() {
  return (
    <div
      className="fixed inset-0 z-[59] pointer-events-none animate-fade-in"
      style={{ background: 'rgba(2,1,8,0.38)' }}
    />
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full mt-[3px]"
      style={{ width: 7, height: 7, background: color, boxShadow: `0 0 4px ${color}` }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TutorialOverlay({
  onOpenPersonById,
  onOpenTimeline,
  onOpenAddStar,
  onClosePanel,
  onComplete,
  onStepChange,
  advanceRef,
  activePanel,
}: TutorialOverlayProps) {
  const [step,            setStep]            = useState(0);
  const [audioEnabled,    setAudioEnabled]    = useState(false);
  // showAudioPrompt: true = show the audio choice screen before step 0
  const [showAudioPrompt, setShowAudioPrompt] = useState(true);

  // Expose advance function to SkyCanvas via ref (for manual-click advance)
  useEffect(() => {
    if (!advanceRef) return;
    advanceRef.current = showAudioPrompt ? null : () => {
      setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
    };
    return () => { if (advanceRef) advanceRef.current = null; };
  }, [advanceRef, showAudioPrompt]);

  // Notify parent of effective step (−1 while audio prompt is showing)
  useEffect(() => {
    onStepChange?.(showAudioPrompt ? -1 : step);
  }, [step, showAudioPrompt, onStepChange]);

  // Auto-play audio when step changes (if audio guide is on)
  useEffect(() => {
    if (!audioEnabled || showAudioPrompt) return;
    const script = AUDIO_SCRIPTS[step];
    if (script) speakText(script);
    return () => { stopSpeech(); };
  }, [step, audioEnabled, showAudioPrompt]);

  // Cancel speech when tutorial is closed / unmounted
  useEffect(() => {
    return () => { stopSpeech(); };
  }, []);

  const enableAudio = useCallback(() => {
    setAudioEnabled(true);
    setShowAudioPrompt(false);
    // Play step 0 script immediately
    const script = AUDIO_SCRIPTS[0];
    if (script) {
      // Small delay so voices finish loading on first mount
      setTimeout(() => speakText(script), 120);
    }
  }, []);

  const disableAudio = useCallback(() => {
    stopSpeech();
    setAudioEnabled(false);
    setShowAudioPrompt(false);
  }, []);

  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      stopSpeech();
      setAudioEnabled(false);
    } else {
      setAudioEnabled(true);
      const script = AUDIO_SCRIPTS[step];
      if (script) speakText(script);
    }
  }, [audioEnabled, step]);

  // ── Card position — adapts so the card doesn't overlap open panels ──────────
  // step 8: TimelinePanel is open at the bottom (58vh) — move card to very top
  // step 9: QuickAddModal is centred — flip card to right side to avoid overlap
  const CARD_POSITION =
    step === 3 ? 'fixed bottom-6 left-6 z-[60] w-72' :
    step === 8 ? 'fixed top-4 left-6 z-[60] w-72' :
    step === 9 ? 'fixed top-20 right-6 z-[60] w-72' :
    activePanel === 'timeline' ? 'fixed top-4 left-6 z-[60] w-72' :
    'fixed top-20 left-6 z-[60] w-72';

  // ── Progress dots + speaker toggle row ──────────────────────────────────────
  function DotRow() {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="rounded-full transition-all duration-500" style={{
              width:      i === step ? 22 : 7,
              height:     7,
              background: i === step ? '#D4A454' : i < step ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.09)',
              boxShadow:  i === step ? '0 0 10px rgba(212,164,84,0.5)' : 'none',
            }} />
          ))}
        </div>
        {/* Speaker toggle — always visible so user can enable/disable any time */}
        <button
          onClick={toggleAudio}
          title={audioEnabled ? 'Turn off audio guide' : 'Turn on audio guide'}
          className="flex items-center justify-center rounded-xl transition-all"
          style={{
            width: 32, height: 32,
            background: audioEnabled ? 'rgba(212,164,84,0.18)' : 'rgba(255,255,255,0.04)',
            border: audioEnabled ? '1px solid rgba(212,164,84,0.45)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: audioEnabled ? '0 0 12px rgba(212,164,84,0.25)' : 'none',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = audioEnabled ? 'rgba(212,164,84,0.28)' : 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = audioEnabled ? 'rgba(212,164,84,0.18)' : 'rgba(255,255,255,0.04)'; }}
        >
          {audioEnabled ? (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 5.5h2l3-3v10l-3-3H2v-4z" fill="rgba(212,164,84,0.9)" />
              <path d="M10 4a4 4 0 010 7M11.5 2a7 7 0 010 11" stroke="rgba(212,164,84,0.9)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 5.5h2l3-3v10l-3-3H2v-4z" fill="rgba(255,255,255,0.35)" />
              <line x1="10" y1="5" x2="14" y2="10" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="14" y1="5" x2="10" y2="10" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    );
  }


  function GoldBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className="w-full py-2 rounded-lg text-xs font-medium tracking-wide transition-all mb-2"
        style={{ background: 'rgba(212,164,84,0.15)', border: '1px solid rgba(212,164,84,0.38)', color: 'rgba(212,164,84,0.92)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.28)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.15)'; }}
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
        style={{ background: 'rgba(88,28,135,0.52)', border: '1px solid rgba(212,164,84,0.38)', color: '#FFE599' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.68)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.52)'; }}
      >
        {label}
      </button>
    );
  }

  // ── Audio prompt — shown before step 0 ──────────────────────────────────────
  if (showAudioPrompt) {
    return (
      <>
        <DarkBackdrop />
        <div
          className={`${CARD_POSITION} rounded-2xl animate-fade-in overflow-hidden`}
          style={cardStyle}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Top accent strip */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, rgba(212,164,84,0.6), rgba(139,92,246,0.6))' }} />

          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, background: 'rgba(212,164,84,0.1)', border: '1.5px solid rgba(212,164,84,0.4)', boxShadow: '0 0 28px rgba(212,164,84,0.2)' }}
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M4 11h4l6-6v20l-6-6H4V11z" fill="rgba(212,164,84,0.9)" />
                  <path d="M20 8a8 8 0 010 14" stroke="rgba(212,164,84,0.9)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M23 4a13 13 0 010 22" stroke="rgba(212,164,84,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <h3 className="text-base font-semibold text-center tracking-wide mb-1" style={{ color: '#FFE599' }}>
              Audio Guide
            </h3>
            <p className="text-xs text-center leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Would you like this tutorial read aloud to you? Each step will be spoken clearly in English.
            </p>

            {/* YES — prominent */}
            <button
              onClick={enableAudio}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all mb-3 flex items-center justify-center gap-2.5"
              style={{ background: 'rgba(212,164,84,0.2)', border: '1.5px solid rgba(212,164,84,0.55)', color: '#FFE599', boxShadow: '0 0 20px rgba(212,164,84,0.15)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.32)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.2)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 6.5h3l4-4v13l-4-4H2V6.5z" fill="#FFE599" />
                <path d="M12 5a5 5 0 010 8" stroke="#FFE599" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 2a9 9 0 010 14" stroke="rgba(255,229,153,0.5)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Yes, read it to me
            </button>

            {/* NO — subtle */}
            <button
              onClick={disableAudio}
              className="w-full py-2 rounded-xl text-xs font-medium tracking-wide transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.72)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; }}
            >
              Continue without audio
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Step 0: Mouse / touch controls ──────────────────────────────────────────
  if (step === 0) {
    return (
      <>
        <DarkBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          {/* Control diagram */}
          <div className="flex justify-center mb-4">
            <svg width="120" height="64" viewBox="0 0 120 64" fill="none">
              {/* Pan: hand drag */}
              <g transform="translate(14,32)">
                <circle cx="0" cy="0" r="12" fill="rgba(88,28,135,0.25)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
                <path d="M-4 0 L4 0 M0 -4 L0 4" stroke="rgba(212,164,84,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 6 L12 12" stroke="rgba(212,164,84,0.5)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" />
              </g>
              {/* Zoom: pinch */}
              <g transform="translate(60,32)">
                <circle cx="0" cy="0" r="12" fill="rgba(88,28,135,0.25)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
                <circle cx="0" cy="0" r="5" fill="none" stroke="rgba(212,164,84,0.6)" strokeWidth="1.2" />
                <circle cx="0" cy="0" r="8" fill="none" stroke="rgba(212,164,84,0.3)" strokeWidth="1" strokeDasharray="2 2" />
              </g>
              {/* Click: star */}
              <g transform="translate(106,32)">
                <circle cx="0" cy="0" r="12" fill="rgba(88,28,135,0.25)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
                <circle cx="0" cy="0" r="5" fill="rgba(212,164,84,0.8)" />
                <circle cx="0" cy="0" r="2" fill="white" opacity="0.9" />
              </g>
              {/* Labels */}
              <text x="14" y="54" textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="7">drag</text>
              <text x="60" y="54" textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="7">zoom</text>
              <text x="106" y="54" textAnchor="middle" fill="rgba(255,255,255,0.38)" fontSize="7">click</text>
            </svg>
          </div>
          <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
            How to move around
          </h3>
          <div className="space-y-2 mb-4">
            {[
              { icon: '✋', label: 'Drag', desc: 'click and drag anywhere on the sky to pan around' },
              { icon: '🔍', label: 'Zoom', desc: 'scroll the mouse wheel, or pinch with two fingers, to zoom in and out' },
              { icon: '✦',  label: 'Click', desc: 'tap any glowing star to open it' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className="text-base shrink-0 leading-snug">{icon}</span>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <span style={{ color: 'rgba(212,164,84,0.88)' }}>{label}</span> — {desc}
                </p>
              </div>
            ))}
          </div>
          <PurpleBtn label="Let's begin! →" onClick={() => setStep(1)} />

        </div>
      </>
    );
  }

  // ── Step 1: Welcome ──────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <>
        <DarkBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <div className="mb-3">
            <svg width="52" height="34" viewBox="0 0 52 34" fill="none">
              <circle cx="10" cy="22" r="4.5" fill="rgba(212,164,84,0.95)" />
              <circle cx="26" cy="7"  r="3.5" fill="rgba(212,164,84,0.75)" />
              <circle cx="44" cy="20" r="4"   fill="rgba(212,164,84,0.85)" />
              <line x1="10" y1="22" x2="26" y2="7"  stroke="rgba(212,164,84,0.35)" strokeWidth="1" />
              <line x1="26" y1="7"  x2="44" y2="20" stroke="rgba(212,164,84,0.35)" strokeWidth="1" />
              <line x1="10" y1="22" x2="44" y2="20" stroke="rgba(139,92,246,0.3)"  strokeWidth="1" strokeDasharray="3,3" />
            </svg>
          </div>
          <h3 className="text-base font-light tracking-wide mb-2" style={{ color: '#FFE599' }}>
            Welcome to Kinstellation!
          </h3>
          <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
            This is a <strong style={{ color: 'rgba(212,164,84,0.92)' }}>constellation</strong> — a living map where people are stars and families are connected like the night sky.
          </p>
          <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Right now, three Wurundjeri Woi Wurrung community members are here:{' '}
            <span style={{ color: 'rgba(212,164,84,0.92)' }}>Elder Thomas</span>,{' '}
            <span style={{ color: 'rgba(212,164,84,0.92)' }}>Aunty June</span>, and{' '}
            <span style={{ color: 'rgba(212,164,84,0.92)' }}>Young Sarah</span>.
          </p>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Drag the sky to look around. Scroll or pinch to zoom in and out.
          </p>
          <PurpleBtn label="Let's explore! →" onClick={() => setStep(2)} />

        </div>
      </>
    );
  }

  // ── Step 2: Click Aunty June's star (she pulses on the canvas) ──────────────
  if (step === 2) {
    return (
      <>
        <SoftBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-5 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <h3 className="text-sm font-semibold tracking-wide mb-1.5" style={{ color: '#FFE599' }}>
            ✦ Every star is a person
          </h3>
          <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Watch <span style={{ color: 'rgba(212,164,84,0.92)' }}>Aunty June's</span> star — it&apos;s glowing and pulsing on the sky. Click it to open her page where you can read her stories, see her family connections, and add new information.
          </p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.38)' }}>
            She has three stories about the Woiwurrung language, the Birrarung (Yarra River), and the eagle spirit Bunjil.
          </p>
          <PurpleBtn
            label="Open Aunty June →"
            onClick={() => { onOpenPersonById?.('demo-1'); setStep(3); }}
          />

        </div>
      </>
    );
  }

  // ── Step 3: Star dashboard (PersonPanel is open, tabs glow) ─────────────────
  if (step === 3) {
    return (
      <>
        <SoftBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-5 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <h3 className="text-sm font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
            Someone&apos;s star home 🌟
          </h3>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
            You just opened Aunty June&apos;s <strong style={{ color: 'rgba(212,164,84,0.88)' }}>star dashboard</strong>. See the four glowing tabs at the top:
          </p>
          <div className="space-y-1.5 mb-3">
            {[
              { color: 'rgba(212,164,84,0.9)',  label: 'Stories',     desc: 'all recorded stories — tap the mic to add new ones by speaking' },
              { color: 'rgba(139,92,246,0.9)',  label: 'Profile',     desc: 'name, Nation, language, and moiety' },
              { color: 'rgba(139,92,246,0.9)',  label: 'Connections', desc: 'family links — invite real family to join' },
              { color: 'rgba(139,92,246,0.9)',  label: 'Media',       desc: 'photos, videos, and journal entries' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <Dot color={color} />
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  <span style={{ color }}>{label}</span> — {desc}
                </p>
              </div>
            ))}
          </div>
          {/* Story button callout */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 px-2.5 py-2 rounded-lg text-center text-xs"
              style={{ background: 'rgba(212,164,84,0.08)', border: '1px solid rgba(212,164,84,0.25)', color: 'rgba(212,164,84,0.85)' }}>
              ✦ Quick story
            </div>
            <div className="flex-1 px-2.5 py-2 rounded-lg text-center text-xs"
              style={{ background: 'rgba(88,28,135,0.18)', border: '1px solid rgba(139,92,246,0.3)', color: 'rgba(139,92,246,0.85)' }}>
              ✦ Full story
            </div>
          </div>
          <PurpleBtn label="Got it →" onClick={() => { onClosePanel?.(); setStep(4); }} />

        </div>
      </>
    );
  }

  // ── Step 4: Bunjil and Waa ───────────────────────────────────────────────────
  if (step === 4) {
    return (
      <>
        <DarkBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <h3 className="text-base font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
            🦅 Bunjil and Waa
          </h3>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Wurundjeri Country has two sides — like two big families. One side belongs to the Eagle spirit,{' '}
            <span style={{ color: 'rgba(212,164,84,0.92)' }}>Bunjil</span>, and the other to the Crow spirit,{' '}
            <span style={{ color: 'rgba(139,92,246,0.92)' }}>Waa</span>.
          </p>
          <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Elder Thomas and Young Sarah are <span style={{ color: 'rgba(212,164,84,0.88)' }}>Bunjil</span>. Aunty June is <span style={{ color: 'rgba(139,92,246,0.88)' }}>Waa</span>.
          </p>
          <p className="text-xs leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
            The two glowing labels at the <strong>top of the screen</strong> are the moiety names — tap one to light up only that side of the sky.
          </p>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Lines between stars show how people are family —{' '}
            <span style={{ color: 'rgba(212,164,84,0.7)' }}>gold</span> for close family,{' '}
            <span style={{ color: 'rgba(139,92,246,0.7)' }}>purple</span> for extended family.
          </p>
          <PurpleBtn label="Got it →" onClick={() => setStep(5)} />

        </div>
      </>
    );
  }

  // ── Step 5: Attribute planets ────────────────────────────────────────────────
  if (step === 5) {
    return (
      <>
        <DarkBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <div className="mb-3">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="6"   fill="rgba(212,164,84,0.92)" />
              <circle cx="24" cy="24" r="2.5" fill="rgba(255,255,255,0.85)" />
              <circle cx="24" cy="7"  r="4"   fill="rgba(212,164,84,0.78)" />
              <circle cx="24" cy="7"  r="1.6" fill="rgba(255,255,255,0.8)" />
              <circle cx="41" cy="24" r="3.5" fill="rgba(72,199,142,0.78)" />
              <circle cx="41" cy="24" r="1.4" fill="rgba(255,255,255,0.8)" />
              <circle cx="7"  cy="24" r="3.5" fill="rgba(45,212,191,0.78)" />
              <circle cx="7"  cy="24" r="1.4" fill="rgba(255,255,255,0.8)" />
            </svg>
          </div>
          <h3 className="text-base font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
            The little planets tell their story
          </h3>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Each person has small planets orbiting their star. Each planet means something:
          </p>
          <div className="space-y-1.5 mb-4">
            {[
              { color: 'rgba(212,164,84,0.9)',  label: 'Gold',  desc: 'their Nation (the Country they belong to)' },
              { color: 'rgba(72,199,142,0.9)',  label: 'Green', desc: 'their language group' },
              { color: 'rgba(45,212,191,0.9)',  label: 'Teal',  desc: 'their community' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <Dot color={color} />
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  <span style={{ color }}>{ label}</span> — {desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Tap any planet to read about that place or language — specific to Victorian Koorie Country.
          </p>
          <PurpleBtn label="Got it →" onClick={() => setStep(6)} />

        </div>
      </>
    );
  }

  // ── Step 6: Season Wheel ─────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <>
        <DarkBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <div className="mb-3">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="19" stroke="rgba(212,164,84,0.45)" strokeWidth="1.2" fill="none" />
              <circle cx="22" cy="22" r="6"  fill="rgba(212,164,84,0.8)" />
              <path d="M22 3 A19 19 0 0 1 41 22" stroke="rgba(72,199,142,0.75)" strokeWidth="6" fill="none" strokeLinecap="butt" />
              <path d="M41 22 A19 19 0 0 1 22 41" stroke="rgba(212,164,84,0.75)" strokeWidth="6" fill="none" strokeLinecap="butt" />
              <path d="M22 41 A19 19 0 0 1 3 22" stroke="rgba(139,92,246,0.75)" strokeWidth="6" fill="none" strokeLinecap="butt" />
              <path d="M3 22 A19 19 0 0 1 22 3"  stroke="rgba(45,212,191,0.75)" strokeWidth="6" fill="none" strokeLinecap="butt" />
            </svg>
          </div>
          <h3 className="text-base font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
            The Season Wheel
          </h3>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
            The glowing wheel in the <strong style={{ color: 'rgba(212,164,84,0.88)' }}>bottom-left corner</strong> shows the seasons this community uses — not months of the year.
          </p>
          <div className="space-y-1.5 mb-4">
            {[
              { color: 'rgba(212,164,84,0.9)',  label: 'Tap a segment', desc: 'filter the whole sky by that season' },
              { color: 'rgba(139,92,246,0.9)',  label: 'Matching story planets', desc: 'glow bright — everything else dims' },
              { color: 'rgba(45,212,191,0.9)',  label: 'Centre of the wheel', desc: 'shows the current season' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <Dot color={color} />
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  <span style={{ color }}>{label}</span> — {desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Have a tap and explore — then continue when you&apos;re ready.
          </p>
          <PurpleBtn label="Got it →" onClick={() => setStep(7)} />

        </div>
      </>
    );
  }

  // ── Step 7: Timeline intro ───────────────────────────────────────────────────
  if (step === 7) {
    return (
      <>
        <DarkBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-6 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <div className="mb-3">
            <svg width="42" height="28" viewBox="0 0 42 28" fill="none">
              <line x1="4" y1="14" x2="38" y2="14" stroke="rgba(88,28,135,0.5)" strokeWidth="1.5" />
              <circle cx="10" cy="14" r="3"   fill="rgba(212,164,84,0.88)" />
              <circle cx="22" cy="8"  r="2.5" fill="rgba(139,92,246,0.72)" />
              <circle cx="34" cy="14" r="3"   fill="rgba(212,164,84,0.65)" />
              <circle cx="16" cy="20" r="2"   fill="rgba(139,92,246,0.5)" />
            </svg>
          </div>
          <h3 className="text-base font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
            The Story Timeline
          </h3>
          <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Every story ever added lives in the{' '}
            <strong style={{ color: 'rgba(212,164,84,0.88)' }}>Story Timeline</strong> — it&apos;s like a giant family scrapbook sorted by season!
          </p>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            The glowing timeline button in the bottom-right corner is ready to tap — let&apos;s open it now!
          </p>
          <PurpleBtn
            label="Open the Timeline →"
            onClick={() => { onOpenTimeline?.(); setStep(8); }}
          />

        </div>
      </>
    );
  }

  // ── Step 8: Inside the Timeline (Timeline is open behind soft backdrop) ──────
  if (step === 8) {
    return (
      <>
        <SoftBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-5 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <h3 className="text-sm font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
            Inside the Timeline
          </h3>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Columns', body: 'stories sorted by season — like "Cold Season" or "Fire Season" — not months of the year.' },
              { label: 'Filters',  body: 'narrow down by person, season, generation (Elder\'s time, Our time…), or story type.' },
              { label: '✦ Summarise', body: 'one tap to get an AI paragraph summing up all the stories you can see — great for sharing!' },
            ].map(({ label, body }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="shrink-0 text-[10px] mt-0.5" style={{ color: 'rgba(212,164,84,0.7)' }}>✦</span>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  <span style={{ color: 'rgba(212,164,84,0.88)' }}>{label}</span> — {body}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.32)' }}>
            The <span style={{ color: 'rgba(212,164,84,0.7)' }}>Season Wheel</span> (bottom-left) filters the whole sky by season — matching planets glow, everything else dims.
          </p>
          <PurpleBtn
            label="Got it, show me how to add a star →"
            onClick={() => { onClosePanel?.(); onOpenAddStar?.(); setStep(9); }}
          />

        </div>
      </>
    );
  }

  // ── Step 9: Adding a star (QuickAddModal is open behind soft backdrop) ───────
  if (step === 9) {
    return (
      <>
        <SoftBackdrop />
        <div className={`${CARD_POSITION} rounded-2xl p-5 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
          <DotRow />
          <h3 className="text-sm font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
            ✦ Adding your own star
          </h3>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
            The glowing <span style={{ color: 'rgba(212,164,84,0.88)' }}>+</span> button opens a form to add any family member or community person to the sky:
          </p>
          <div className="space-y-1.5 mb-4">
            {[
              { color: 'rgba(212,164,84,0.9)',  label: 'Name',           desc: 'their full name or the name they go by' },
              { color: 'rgba(212,164,84,0.9)',  label: 'Nation',         desc: 'the Country they come from' },
              { color: 'rgba(72,199,142,0.9)',  label: 'Language group', desc: 'the language spoken on their Country' },
              { color: 'rgba(139,92,246,0.9)',  label: 'Moiety',         desc: 'Bunjil or Waa — if you know it' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-2">
                <Dot color={color} />
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
                  <span style={{ color }}>{label}</span> — {desc}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.32)' }}>
            Nothing is locked in — you can always add more details later.
          </p>
          <PurpleBtn label="Got it →" onClick={() => { onClosePanel?.(); setStep(10); }} />

        </div>
      </>
    );
  }

  // ── Step 10 (final): Save button ─────────────────────────────────────────────
  return (
    <>
      <SoftBackdrop />
      <div className={`${CARD_POSITION} rounded-2xl p-5 animate-fade-in`} style={cardStyle} onMouseDown={e => e.stopPropagation()}>
        <DotRow />
        <h3 className="text-sm font-semibold tracking-wide mb-2" style={{ color: '#FFE599' }}>
          Keep your constellation safe
        </h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
          The glowing <span style={{ color: 'rgba(212,164,84,0.88)' }}>Save</span> button is in the bottom-right toolbar, just above the + button.
        </p>
        <div
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl mb-4"
          style={{ background: 'rgba(88,28,135,0.2)', border: '1px solid rgba(212,164,84,0.18)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <path d="M8 2v8M5.5 7.5L8 10l2.5-2.5" stroke="rgba(212,164,84,0.85)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 11.5v1.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-1.5" stroke="rgba(212,164,84,0.6)" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Tap it to create an account — your people, stories, and connections are remembered every time you come back.
          </p>
        </div>
        <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.32)' }}>
          That&apos;s everything! You are ready to explore Kinstellation.
        </p>
        <button
          onClick={() => { onComplete(); }}
          className="w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all"
          style={{ background: 'rgba(88,28,135,0.52)', border: '1px solid rgba(212,164,84,0.38)', color: '#FFE599' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.68)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(88,28,135,0.52)'; }}
        >
          Enter the sky ✦
        </button>
      </div>
    </>
  );
}
