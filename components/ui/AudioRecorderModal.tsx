'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Story, Visibility } from '@/lib/types';

interface AudioRecorderModalProps {
  personId: string;
  personName: string;
  onClose: () => void;
}

type RecorderPhase = 'idle' | 'recording' | 'stopped';

const ERA_OPTIONS = [
  { id: '',           label: 'Not sure',         year: undefined  },
  { id: 'immemorial', label: "Country's making",  year: 1850       },
  { id: 'elders',     label: "Elders' time",      year: 1925       },
  { id: 'parents',    label: "Parents' time",     year: 1965       },
  { id: 'living',     label: 'Our time',          year: 1995       },
  { id: 'unknown',    label: 'Time unknown',      year: undefined  },
];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function AudioRecorderModal({ personId, personName, onClose }: AudioRecorderModalProps) {
  const { state, dispatch } = useApp();

  const [phase, setPhase]               = useState<RecorderPhase>('idle');
  const [audioUrl, setAudioUrl]         = useState<string | null>(null);
  const [elapsedSecs, setElapsedSecs]   = useState(0);
  const [title, setTitle]               = useState('');
  const [seasonTag, setSeasonTag]       = useState('unsure');
  const [eraId, setEraId]               = useState('');
  const [visibility, setVisibility]     = useState<Visibility>('family');
  const [saving, setSaving]             = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef          = useRef<Blob | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setPermissionError(null);
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionError('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick the most compact supported codec
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm')             ? 'audio/webm' :
        '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const usedMime = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: usedMime });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setPhase('stopped');
      };

      mr.start(500);
      setPhase('recording');
      setElapsedSecs(0);
      timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    } catch (err: unknown) {
      const isDenied = err instanceof DOMException && err.name === 'NotAllowedError';
      setPermissionError(
        isDenied
          ? 'Microphone access was denied. Please allow microphone permission and try again.'
          : 'Could not start recording. Please check your microphone.'
      );
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  function handleReRecord() {
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    blobRef.current = null;
    setElapsedSecs(0);
    setPhase('idle');
    setPermissionError(null);
  }

  function handleSave() {
    const blob = blobRef.current;
    if (!blob) return;
    setSaving(true);

    // Cancel any ongoing speech synthesis to avoid audio overlap
    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      const story: Story = {
        id: crypto.randomUUID(),
        title: title.trim() || `Voice recording — ${new Date().toLocaleDateString('en-AU')}`,
        type: 'audio',
        content: b64,
        recordedBy: personName,
        recordedDate: new Date().toISOString(),
        seasonTag,
        year: ERA_OPTIONS.find(e => e.id === eraId)?.year,
        visibility,
        linkedPersonIds: [personId],
      };
      dispatch({ type: 'ADD_STORY', payload: { personId, story } });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setSaving(false);
      onClose();
    };
    reader.onerror = () => {
      setSaving(false);
      setPermissionError('Failed to process recording. Please try again.');
    };
    reader.readAsDataURL(blob);
  }

  const isOverFiveMin = elapsedSecs >= 300;

  const INPUT: React.CSSProperties = {
    background: 'rgba(88,28,135,0.14)',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'rgba(255,255,255,0.90)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl animate-fade-in"
        style={{
          background: 'rgba(8,4,22,0.98)',
          border: '1px solid rgba(88,28,135,0.45)',
          boxShadow: '0 0 40px rgba(88,28,135,0.25), 0 25px 50px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-medium" style={{ color: 'rgba(212,164,84,0.92)' }}>
              Record a yarn
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xl leading-none transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* ── IDLE PHASE ───────────────────────────────────────────────── */}
          {phase === 'idle' && (
            <div className="flex flex-col items-center gap-5 py-4">
              {/* Mic icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(88,28,135,0.22)', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="9" y="2" width="10" height="14" rx="5" stroke="rgba(212,164,84,0.85)" strokeWidth="1.8" />
                  <path d="M4 14a10 10 0 0 0 20 0" stroke="rgba(212,164,84,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="14" y1="24" x2="14" y2="27" stroke="rgba(212,164,84,0.85)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Tap to start recording your yarn for <span style={{ color: 'rgba(212,164,84,0.8)' }}>{personName}</span>
              </p>
              {permissionError && (
                <p className="text-xs text-center px-2" style={{ color: 'rgba(248,113,113,0.9)' }}>
                  {permissionError}
                </p>
              )}
              <button
                onClick={startRecording}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'rgba(212,164,84,0.12)',
                  border: '1px solid rgba(212,164,84,0.35)',
                  color: 'rgba(212,164,84,0.9)',
                }}
              >
                Start recording
              </button>
            </div>
          )}

          {/* ── RECORDING PHASE ──────────────────────────────────────────── */}
          {phase === 'recording' && (
            <div className="flex flex-col items-center gap-4 py-4">
              {/* Pulsing red circle */}
              <div className="relative flex items-center justify-center w-16 h-16">
                <span
                  className="absolute w-16 h-16 rounded-full animate-star-pulse"
                  style={{ background: 'rgba(248,113,113,0.18)' }}
                />
                <span
                  className="w-10 h-10 rounded-full"
                  style={{ background: 'rgba(248,113,113,0.85)' }}
                />
              </div>
              {/* Timer */}
              <p className="text-3xl font-mono font-semibold tracking-widest" style={{ color: 'rgba(212,164,84,0.95)' }}>
                {fmtTime(elapsedSecs)}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Recording…</p>
              {/* 5-min warning */}
              {isOverFiveMin && (
                <div
                  className="w-full rounded-xl px-4 py-2.5 text-xs text-center"
                  style={{ background: 'rgba(212,164,84,0.10)', border: '1px solid rgba(212,164,84,0.25)', color: 'rgba(212,164,84,0.8)' }}
                >
                  Over 5 minutes — recordings use significant storage. Finish up when you&apos;re ready.
                </div>
              )}
              <button
                onClick={stopRecording}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'rgba(248,113,113,0.12)',
                  border: '1px solid rgba(248,113,113,0.4)',
                  color: 'rgba(248,113,113,0.9)',
                }}
              >
                Stop recording
              </button>
            </div>
          )}

          {/* ── STOPPED PHASE ────────────────────────────────────────────── */}
          {phase === 'stopped' && (
            <div className="flex flex-col gap-4">
              {/* Duration + audio player */}
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(88,28,135,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                <p className="text-[10px] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Recording · {fmtTime(elapsedSecs)}
                </p>
                {audioUrl && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio
                    controls
                    src={audioUrl}
                    className="w-full"
                    style={{ accentColor: '#D4A454' }}
                  />
                )}
              </div>

              {/* Optional title */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Name this recording <span style={{ color: 'rgba(255,255,255,0.20)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Voice recording — ${new Date().toLocaleDateString('en-AU')}`}
                  style={INPUT}
                  autoCapitalize="sentences"
                />
              </div>

              {/* Season pills */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.82)' }}>
                  Which season does this belong to?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSeasonTag('unsure')}
                    className="px-2.5 py-1 rounded-lg text-[11px] transition-all"
                    style={seasonTag === 'unsure' ? {
                      background: 'rgba(88,28,135,0.5)',
                      border: '1px solid rgba(212,164,84,0.35)',
                      color: 'rgba(212,164,84,0.9)',
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    I&apos;m not sure yet
                  </button>
                  {(state.seasonalCalendar?.seasons ?? []).map((season) => (
                    <button
                      key={season.id}
                      type="button"
                      onClick={() => setSeasonTag(season.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all"
                      style={seasonTag === season.id ? {
                        background: 'rgba(88,28,135,0.5)',
                        border: '1px solid rgba(212,164,84,0.35)',
                        color: 'rgba(212,164,84,0.9)',
                      } : {
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.35)',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: season.colorPalette.accentColor }} />
                      {season.nameEnglish}
                    </button>
                  ))}
                </div>
              </div>

              {/* When did this happen */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  When did this happen? <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
                </label>
                <select
                  value={eraId}
                  onChange={(e) => setEraId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                >
                  {ERA_OPTIONS.map((era) => (
                    <option key={era.id} value={era.id}>{era.label}</option>
                  ))}
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  Who can hear this?
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                >
                  <option value="family">Family only</option>
                  <option value="public">Public</option>
                  <option value="restricted">Restricted</option>
                  <option value="gendered">Gendered business</option>
                </select>
              </div>

              {permissionError && (
                <p className="text-xs" style={{ color: 'rgba(248,113,113,0.9)' }}>{permissionError}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleReRecord}
                  className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Re-record
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: saving ? 'rgba(88,28,135,0.2)' : 'rgba(88,28,135,0.45)',
                    border: '1px solid rgba(212,164,84,0.35)',
                    color: saving ? 'rgba(212,164,84,0.45)' : 'rgba(212,164,84,0.9)',
                  }}
                >
                  {saving ? 'Saving…' : 'Save yarn'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
