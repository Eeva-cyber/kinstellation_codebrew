'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Person, Story, StoryType, Visibility } from '@/lib/types';

interface StoryPanelProps {
  person: Person;
  onClose: () => void;
}

// Minimal Web Speech API types (not in standard TS lib)
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResult[];
}
interface ISpeechRecognitionCtor {
  new(): ISpeechRecognition;
}

function getSpeechRecognition(): ISpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

const LANG_OPTIONS = [
  { code: 'en-AU', label: 'EN·AU' },
  { code: 'en-US', label: 'EN·US' },
  { code: 'en-GB', label: 'EN·GB' },
];

function MicButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState('en-AU');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  if (!getSpeechRecognition()) return null;

  function toggle() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SR = getSpeechRecognition(); if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = lang;
    rec.onresult = (e: ISpeechRecognitionEvent) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final) onTranscript(final);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start(); recognitionRef.current = rec; setListening(true);
  }

  return (
    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
      {/* Language selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLangPicker(v => !v)}
          className="text-[9px] px-1.5 py-0.5 rounded-md leading-tight"
          style={{
            background: 'rgba(88,28,135,0.2)',
            border: '1px solid rgba(139,92,246,0.2)',
            color: 'rgba(139,92,246,0.6)',
          }}
        >
          {LANG_OPTIONS.find(l => l.code === lang)?.label ?? lang}
        </button>
        {showLangPicker && (
          <div
            className="absolute bottom-full right-0 mb-1 rounded-lg overflow-hidden z-20"
            style={{ background: 'rgba(8,4,22,0.98)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}
          >
            {LANG_OPTIONS.map(opt => (
              <button
                key={opt.code}
                type="button"
                onClick={() => { setLang(opt.code); setShowLangPicker(false); }}
                className="w-full px-3 py-1.5 text-[10px] text-left whitespace-nowrap"
                style={{
                  color: opt.code === lang ? 'rgba(212,164,84,0.9)' : 'rgba(255,255,255,0.55)',
                  background: opt.code === lang ? 'rgba(88,28,135,0.4)' : 'transparent',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Mic button */}
      <button
        type="button"
        onClick={toggle}
        title={listening ? 'Stop recording' : 'Speak your story'}
        className="p-1.5 rounded-lg transition-all"
        style={{
          background: listening ? 'rgba(248,113,113,0.2)' : 'rgba(88,28,135,0.25)',
          border: `1px solid ${listening ? 'rgba(248,113,113,0.5)' : 'rgba(139,92,246,0.3)'}`,
          color: listening ? 'rgba(248,113,113,0.9)' : 'rgba(139,92,246,0.7)',
          position: 'relative',
        }}
      >
        {listening ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="4.5" y="1" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 7a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
        {listening && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-star-pulse"
            style={{ background: 'rgba(248,113,113,0.9)' }}
          />
        )}
      </button>
    </div>
  );
}

// Generation/era options — mirrors TimelinePanel ERA_GROUPS
const ERA_OPTIONS = [
  { id: '',            label: 'Not sure',        year: undefined   },
  { id: 'immemorial',  label: "Country's making", year: 1850        },
  { id: 'elders',      label: "Elders' time",     year: 1925        },
  { id: 'parents',     label: "Parents' time",    year: 1965        },
  { id: 'living',      label: 'Our time',         year: 1995        },
  { id: 'unknown',     label: 'Time unknown',     year: undefined   },
];

export function StoryPanel({ person, onClose }: StoryPanelProps) {
  const { state, dispatch } = useApp();

  const [title, setTitle] = useState('');
  const [storyType, setStoryType] = useState<StoryType>('text');
  const [content, setContent] = useState('');
  const [seasonTag, setSeasonTag] = useState('unsure');
  const [seasonalContext, setSeasonalContext] = useState('');
  const [eraId, setEraId] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('family');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setContent(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!title.trim()) return;
    if (storyType === 'text' && !content.trim()) return;
    if ((storyType === 'photo' || storyType === 'audio') && !content) return;

    const eraYear = ERA_OPTIONS.find((e) => e.id === eraId)?.year;
    const story: Story = {
      id: crypto.randomUUID(),
      title: title.trim(),
      type: storyType,
      content,
      recordedBy: '',
      recordedDate: new Date().toISOString(),
      seasonTag,
      year: eraYear,
      seasonalContext: seasonalContext.trim() || undefined,
      visibility,
      linkedPersonIds: [person.id],
    };

    dispatch({ type: 'ADD_STORY', payload: { personId: person.id, story } });
    onClose();
  }

  const INPUT_CLS = "w-full rounded-lg px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none transition-colors";
  const INPUT_STYLE = { background: 'rgba(88,28,135,0.14)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(255,255,255,0.90)' };
  const LABEL_STYLE = { color: 'rgba(212,164,84,0.85)' };

  return (
    <div
      className="absolute top-0 right-0 h-full w-[22rem] z-30 animate-slide-right select-auto"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="h-full backdrop-blur-xl panel-scroll"
        style={{ background: 'rgba(8,4,22,0.97)', borderLeft: '1px solid rgba(88,28,135,0.4)' }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.9)' }}>
                New story
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.6)' }}>for {person.displayName}</p>
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

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Story title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this story a name"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,164,84,0.45)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
              />
            </div>

            {/* Type selector */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Type</label>
              <div className="flex gap-2">
                {(['text', 'photo', 'audio'] as StoryType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setStoryType(t); setContent(''); setPhotoPreview(null); }}
                    className="flex-1 px-3 py-2 rounded-lg text-xs capitalize transition-all"
                    style={storyType === t ? {
                      background: 'rgba(88,28,135,0.55)',
                      border: '1px solid rgba(212,164,84,0.35)',
                      color: 'rgba(212,164,84,0.9)',
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      color: 'rgba(255,255,255,0.38)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {storyType === 'text' ? (
              <div>
                <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Story</label>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Tell the story… or use the mic to speak it"
                    rows={6}
                    className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm placeholder:text-white/20 focus:outline-none resize-none"
                    style={INPUT_STYLE}
                  />
                  <MicButton
                    onTranscript={(text) => setContent((prev) => prev ? prev + ' ' + text : text)}
                  />
                </div>
              </div>
            ) : storyType === 'photo' ? (
              <div>
                <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-white/40 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:cursor-pointer"
                  style={{ '--file-bg': 'rgba(88,28,135,0.3)' } as React.CSSProperties}
                />
                {photoPreview && (
                  <img src={photoPreview} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover w-full" />
                )}
              </div>
            ) : storyType === 'audio' ? (
              <InlineAudioRecorder onRecordingComplete={setContent} currentContent={content} />
            ) : null}

            {/* Season — pill buttons */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Which season does this belong to?</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSeasonTag('unsure')}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={seasonTag === 'unsure' ? {
                    background: 'rgba(88,28,135,0.55)',
                    border: '1px solid rgba(212,164,84,0.35)',
                    color: 'rgba(212,164,84,0.9)',
                  } : {
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    color: 'rgba(255,255,255,0.38)',
                  }}
                >
                  I&apos;m not sure yet
                </button>
                {(state.seasonalCalendar?.seasons ?? []).map((season) => (
                  <button
                    key={season.id}
                    type="button"
                    onClick={() => setSeasonTag(season.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={seasonTag === season.id ? {
                      background: 'rgba(88,28,135,0.55)',
                      border: '1px solid rgba(212,164,84,0.35)',
                      color: 'rgba(212,164,84,0.9)',
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      color: 'rgba(255,255,255,0.38)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: season.colorPalette.accentColor }} />
                    {season.nameEnglish}
                  </button>
                ))}
              </div>
            </div>

            {/* When did this happen — dropdown */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>
                When did this happen? <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(optional)</span>
              </label>
              <select
                value={eraId}
                onChange={(e) => setEraId(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={INPUT_STYLE}
              >
                {ERA_OPTIONS.map((era) => (
                  <option key={era.id} value={era.id}>{era.label}</option>
                ))}
              </select>
            </div>

            {/* Seasonal context */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>
                What was happening on Country? (optional)
              </label>
              <input
                type="text"
                value={seasonalContext}
                onChange={(e) => setSeasonalContext(e.target.value)}
                placeholder="e.g. the wattle was flowering, emus were sitting on eggs"
                className={INPUT_CLS}
                style={INPUT_STYLE}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,164,84,0.45)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Who can see this?</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={INPUT_STYLE}
              >
                <option value="public">Public</option>
                <option value="family">Family only</option>
                <option value="restricted">Restricted</option>
                <option value="gendered">Gendered (men&apos;s/women&apos;s business)</option>
              </select>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!title.trim() || (storyType === 'text' && !content.trim()) || ((storyType === 'photo' || storyType === 'audio') && !content)}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(88,28,135,0.65)',
                border: '1px solid rgba(212,164,84,0.35)',
                color: 'rgba(212,164,84,0.95)',
              }}
            >
              Save story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline audio recorder (used inside StoryPanel when type === 'audio') ───────

type InlinePhase = 'idle' | 'recording' | 'stopped';

function fmtSecs(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function InlineAudioRecorder({
  onRecordingComplete,
  currentContent,
}: {
  onRecordingComplete: (base64: string) => void;
  currentContent: string;
}) {
  const [phase, setPhase]       = useState<InlinePhase>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed]   = useState(0);
  const [error, setError]       = useState<string | null>(null);

  const mrRef     = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm')             ? 'audio/webm' : '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const usedMime = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: usedMime });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setPhase('stopped');
        const reader = new FileReader();
        reader.onload = () => { onRecordingComplete(reader.result as string); };
        reader.readAsDataURL(blob);
      };
      mr.start(500);
      setPhase('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } catch (err: unknown) {
      const isDenied = err instanceof DOMException && err.name === 'NotAllowedError';
      setError(isDenied ? 'Microphone access denied.' : 'Could not start recording.');
    }
  }, [onRecordingComplete]);

  function stop() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mrRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  function reRecord() {
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    onRecordingComplete('');
    setElapsed(0);
    setPhase('idle');
    setError(null);
  }

  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.82)' }}>Audio recording</label>
      <div
        className="rounded-xl p-4 flex flex-col items-center gap-3"
        style={{ background: 'rgba(88,28,135,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
      >
        {phase === 'idle' && (
          <>
            {currentContent && (
              <p className="text-[10px] self-start" style={{ color: 'rgba(212,164,84,0.6)' }}>
                Recording saved — click Re-record to replace it.
              </p>
            )}
            <button
              type="button"
              onClick={start}
              className="w-full py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              style={{ background: 'rgba(212,164,84,0.1)', border: '1px solid rgba(212,164,84,0.3)', color: 'rgba(212,164,84,0.85)' }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="4.5" y="1" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 7a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {currentContent ? 'Re-record' : 'Start recording'}
            </button>
            {error && <p className="text-xs" style={{ color: 'rgba(248,113,113,0.9)' }}>{error}</p>}
          </>
        )}
        {phase === 'recording' && (
          <>
            <div className="relative flex items-center justify-center w-12 h-12">
              <span className="absolute w-12 h-12 rounded-full animate-star-pulse" style={{ background: 'rgba(248,113,113,0.18)' }} />
              <span className="w-7 h-7 rounded-full" style={{ background: 'rgba(248,113,113,0.85)' }} />
            </div>
            <p className="text-xl font-mono font-semibold tracking-widest" style={{ color: 'rgba(212,164,84,0.95)' }}>
              {fmtSecs(elapsed)}
            </p>
            <button
              type="button"
              onClick={stop}
              className="w-full py-2.5 rounded-xl text-sm transition-all"
              style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)', color: 'rgba(248,113,113,0.9)' }}
            >
              Stop recording
            </button>
          </>
        )}
        {phase === 'stopped' && audioUrl && (
          <>
            <p className="text-[10px] self-start" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Recording · {fmtSecs(elapsed)}
            </p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={audioUrl} className="w-full" style={{ accentColor: '#D4A454' }} />
            <button
              type="button"
              onClick={reRecord}
              className="w-full py-2 rounded-xl text-xs transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              Re-record
            </button>
          </>
        )}
      </div>
    </div>
  );
}
