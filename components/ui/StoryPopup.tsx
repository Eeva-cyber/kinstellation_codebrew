'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type { Story, Visibility } from '@/lib/types';

interface StoryPopupProps {
  story: Story;
  personId: string;
  personName: string;
  seasonName?: string;
  impactScore?: number;
  onClose: () => void;
  onStoryUpdated?: (updated: Story) => void;
}

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Public',
  family: 'Family only',
  restricted: 'Restricted',
  gendered: 'Gendered business',
};

// Minimal Web Speech API types
interface ISpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null; onend: (() => void) | null;
  start(): void; stop(): void;
}
interface ISpeechRecognitionResult { isFinal: boolean; [index: number]: { transcript: string }; }
interface ISpeechRecognitionEvent extends Event { resultIndex: number; results: ISpeechRecognitionResult[]; }
interface ISpeechRecognitionCtor { new(): ISpeechRecognition; }
function getSR(): ISpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

const LANG_OPTIONS = [
  { code: 'en-AU', label: 'EN·AU' },
  { code: 'en-US', label: 'EN·US' },
  { code: 'en-GB', label: 'EN·GB' },
];

const ERA_OPTIONS = [
  { id: '',            label: 'Not sure',         year: undefined },
  { id: 'immemorial',  label: "Country's making",  year: 1850      },
  { id: 'elders',      label: "Elders' time",      year: 1925      },
  { id: 'parents',     label: "Parents' time",     year: 1965      },
  { id: 'living',      label: 'Our time',          year: 1995      },
  { id: 'unknown',     label: 'Time unknown',      year: undefined },
];

function MicButton({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState('en-AU');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const recRef = useRef<ISpeechRecognition | null>(null);
  if (!getSR()) return null;
  function toggle() {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const SR = getSR(); if (!SR) return;
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
    rec.start(); recRef.current = rec; setListening(true);
  }
  return (
    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
      {/* Language selector */}
      <div className="relative">
        <button type="button" onClick={() => setShowLangPicker(v => !v)}
          className="text-[9px] px-1.5 py-0.5 rounded-md leading-tight"
          style={{ background: 'rgba(88,28,135,0.2)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(139,92,246,0.6)' }}>
          {LANG_OPTIONS.find(l => l.code === lang)?.label ?? lang}
        </button>
        {showLangPicker && (
          <div className="absolute bottom-full right-0 mb-1 rounded-lg overflow-hidden z-20"
            style={{ background: 'rgba(8,4,22,0.98)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
            {LANG_OPTIONS.map(opt => (
              <button key={opt.code} type="button" onClick={() => { setLang(opt.code); setShowLangPicker(false); }}
                className="w-full px-3 py-1.5 text-[10px] text-left whitespace-nowrap"
                style={{ color: opt.code === lang ? 'rgba(212,164,84,0.9)' : 'rgba(255,255,255,0.55)', background: opt.code === lang ? 'rgba(88,28,135,0.4)' : 'transparent' }}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Mic button */}
      <button type="button" onClick={toggle} title={listening ? 'Stop recording' : 'Speak your story'}
        className="p-1.5 rounded-lg transition-all"
        style={{
          background: listening ? 'rgba(248,113,113,0.2)' : 'rgba(88,28,135,0.25)',
          border: `1px solid ${listening ? 'rgba(248,113,113,0.5)' : 'rgba(139,92,246,0.3)'}`,
          color: listening ? 'rgba(248,113,113,0.9)' : 'rgba(139,92,246,0.7)',
          position: 'relative',
        }}>
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
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-star-pulse"
            style={{ background: 'rgba(248,113,113,0.9)' }} />
        )}
      </button>
    </div>
  );
}

export function StoryPopup({
  story,
  personId,
  personName,
  seasonName,
  impactScore,
  onClose,
  onStoryUpdated,
}: StoryPopupProps) {
  const { state, dispatch } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState(story.title);
  const [editContent, setEditContent] = useState(story.content);
  const [editSeasonalContext, setEditSeasonalContext] = useState(story.seasonalContext ?? '');
  const [editSeasonTag, setEditSeasonTag] = useState(story.seasonTag);
  const [editVisibility, setEditVisibility] = useState<Visibility>(story.visibility);
  const [editEraId, setEditEraId] = useState(() => ERA_OPTIONS.find(e => e.year === story.year)?.id ?? '');

  const isPhoto = story.type === 'photo';
  const isAudio = story.type === 'audio';

  function handleSave() {
    const updated: Story = {
      ...story,
      title: editTitle.trim() || story.title,
      content: editContent,
      seasonTag: editSeasonTag,
      seasonalContext: editSeasonalContext.trim() || undefined,
      visibility: editVisibility,
      year: ERA_OPTIONS.find(e => e.id === editEraId)?.year,
    };
    dispatch({ type: 'UPDATE_STORY', payload: { personId, story: updated } });
    onStoryUpdated?.(updated);
    setIsEditing(false);
  }

  function handleCancel() {
    setEditTitle(story.title);
    setEditContent(story.content);
    setEditSeasonalContext(story.seasonalContext ?? '');
    setEditSeasonTag(story.seasonTag);
    setEditVisibility(story.visibility);
    setEditEraId(ERA_OPTIONS.find(e => e.year === story.year)?.id ?? '');
    setIsEditing(false);
  }

  const INPUT = {
    background: 'rgba(88,28,135,0.14)',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'rgba(255,255,255,0.90)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl shadow-2xl animate-fade-in panel-scroll"
        style={{
          background: 'rgba(8,4,22,0.98)',
          border: '1px solid rgba(88,28,135,0.45)',
          boxShadow: '0 0 40px rgba(88,28,135,0.25), 0 25px 50px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(212,164,84,0.82)' }}>
                  {story.type}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span className="text-xs" style={{ color: 'rgba(212,164,84,0.70)' }}>{personName}</span>
              </div>
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={(e) => { const v = e.target.value; setEditTitle(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v); }}
                  style={{ ...INPUT, fontSize: 18, fontWeight: 500, background: 'rgba(88,28,135,0.18)', border: '1px solid rgba(212,164,84,0.35)' }}
                  autoFocus
                  autoCapitalize="sentences"
                />
              ) : (
                <h2 className="text-xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  {story.title}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Edit toggle — hidden for audio stories (view-only playback) */}
              {!isAudio && <button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{
                  background: isEditing ? 'rgba(88,28,135,0.5)' : 'rgba(88,28,135,0.25)',
                  border: `1px solid ${isEditing ? 'rgba(212,164,84,0.4)' : 'rgba(139,92,246,0.3)'}`,
                }}
                aria-label={isEditing ? 'Back to view' : 'Edit story'}
                title={isEditing ? 'Back to view' : 'Edit story'}
              >
                {isEditing ? (
                  // Back arrow
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7 2L3 6l4 4" stroke="rgba(212,164,84,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  // Pen icon
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 2l2 2-6 6H2V8L8 2z" stroke="rgba(139,92,246,0.8)" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                )}
              </button>}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-xl leading-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Season tag / picker */}
          <div className="mb-5">
            {isEditing ? (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.82)' }}>
                  Which season does this belong to?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditSeasonTag('unsure')}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={editSeasonTag === 'unsure' ? {
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
                      onClick={() => setEditSeasonTag(season.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={editSeasonTag === season.id ? {
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
            ) : (
              seasonName && (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ background: 'rgba(88,28,135,0.2)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(212,164,84,0.75)' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(212,164,84,0.6)' }} />
                  {seasonName}
                </span>
              )
            )}
          </div>

          {/* Content */}
          <div className="mb-5">
            {isEditing && !isPhoto && !isAudio ? (
              <div className="relative">
                <textarea
                  value={editContent}
                  onChange={(e) => { const v = e.target.value; setEditContent(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  rows={7}
                  autoCapitalize="sentences"
                  style={{ ...INPUT, resize: 'none', lineHeight: 1.65, paddingBottom: 36 }}
                />
                <MicButton onTranscript={(t) => setEditContent(prev => prev ? prev + ' ' + t : t)} />
              </div>
            ) : isPhoto ? (
              story.content.startsWith('data:') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={story.content} alt={story.title} className="w-full rounded-xl object-cover max-h-72" />
              ) : (
                <p className="text-base italic" style={{ color: 'rgba(255,255,255,0.25)' }}>Photo not available</p>
              )
            ) : isAudio ? (
              story.content.startsWith('data:') ? (
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(88,28,135,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}
                >
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio
                    controls
                    src={story.content}
                    className="w-full"
                    style={{ accentColor: '#D4A454' }}
                  />
                </div>
              ) : (
                <p className="text-base italic" style={{ color: 'rgba(255,255,255,0.25)' }}>Audio not available</p>
              )
            ) : (
              <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.90)' }}>
                {story.content}
              </p>
            )}
          </div>

          {/* Seasonal context */}
          {isEditing ? (
            <div className="mb-5">
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.82)' }}>
                What was happening on Country? (optional)
              </label>
              <input
                value={editSeasonalContext}
                onChange={(e) => { const v = e.target.value; setEditSeasonalContext(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v); }}
                placeholder="e.g. the wattle was flowering..."
                autoCapitalize="sentences"
                style={{ ...INPUT }}
              />
            </div>
          ) : story.seasonalContext ? (
            <blockquote className="mb-5 pl-4 text-sm italic leading-relaxed" style={{ borderLeft: '2px solid rgba(212,164,84,0.25)', color: 'rgba(255,255,255,0.48)' }}>
              {story.seasonalContext}
            </blockquote>
          ) : null}

          {/* When did this happen (edit mode) */}
          {isEditing && (
            <div className="mb-5">
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.82)' }}>
                When did this happen? <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span>
              </label>
              <select
                value={editEraId}
                onChange={(e) => setEditEraId(e.target.value)}
                style={{ ...INPUT }}
              >
                {ERA_OPTIONS.map((era) => (
                  <option key={era.id} value={era.id}>{era.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility (edit mode) */}
          {isEditing && (
            <div className="mb-5">
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.82)' }}>Who can see this?</label>
              <select
                value={editVisibility}
                onChange={(e) => setEditVisibility(e.target.value as Visibility)}
                style={{ ...INPUT }}
              >
                <option value="public">Public</option>
                <option value="family">Family only</option>
                <option value="restricted">Restricted</option>
                <option value="gendered">Gendered (men&apos;s/women&apos;s business)</option>
              </select>
            </div>
          )}

          {/* Save / Footer */}
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={!editTitle.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{ background: 'rgba(88,28,135,0.65)', border: '1px solid rgba(212,164,84,0.35)', color: 'rgba(212,164,84,0.95)' }}
            >
              Save changes
            </button>
          ) : (
            <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(88,28,135,0.2)' }}>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {story.recordedDate && (
                  <span>{new Date(story.recordedDate).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                )}
              </div>
              <span className="text-xs" style={{ color: 'rgba(139,92,246,0.5)' }}>
                {VISIBILITY_LABELS[story.visibility] ?? story.visibility}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
