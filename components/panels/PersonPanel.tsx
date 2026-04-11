'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type {
  Person, Visibility, Story, StoryType,
  MediaEntry, PhotoEntry, ArticleEntry, VideoEntry,
} from '@/lib/types';
import { SeasonPicker } from '@/components/ui/SeasonPicker';
import { WordTooltip } from '@/components/ui/WordTooltip';
import { AudioRecorderModal } from '@/components/ui/AudioRecorderModal';

// ── Web Speech API types ─────────────────────────────────────────────────────
interface ISpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void;
}
interface ISpeechRecognitionResult { isFinal: boolean; [index: number]: { transcript: string }; }
interface ISpeechRecognitionEvent extends Event { resultIndex: number; results: ISpeechRecognitionResult[]; }
interface ISpeechRecognitionCtor { new(): ISpeechRecognition; }

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

interface PersonPanelProps {
  person: Person;
  isSelf?: boolean;
  focusSection?: 'identity' | 'stories' | 'connections';
  onClose: () => void;
  onAddStory: (personId: string) => void;
  onAddConnection: (personId: string) => void;
  onMediaEntryClick?: (entry: MediaEntry) => void;
  /** Tutorial step 2: glow all four tab buttons to guide the user */
  tutorialHighlightTabs?: boolean;
}

type Tab = 'profile' | 'stories' | 'connections' | 'media';
type MediaSection = 'photos' | 'articles' | 'videos';

// ── localStorage size warning ────────────────────────────────────────────────
const PHOTO_WARN_BYTES = 3 * 1024 * 1024; // 3 MB

// Generation/era options — mirrors TimelinePanel ERA_GROUPS
const ERA_OPTIONS = [
  { id: '',           label: 'Not sure',         year: undefined },
  { id: 'immemorial', label: "Country's making",  year: 1850      },
  { id: 'elders',     label: "Elders' time",      year: 1925      },
  { id: 'parents',    label: "Parents' time",     year: 1965      },
  { id: 'living',     label: 'Our time',          year: 1995      },
  { id: 'unknown',    label: 'Time unknown',      year: undefined },
];

function getPhotoStorageUsed(person: Person): number {
  return (person.mediaEntries ?? [])
    .filter((e): e is PhotoEntry => e.type === 'photo')
    .reduce((sum, e) => sum + (e.imageData?.length ?? 0), 0);
}

// ── Date / season helpers ────────────────────────────────────────────────────
function DateSeasonInput({
  date, setDate, seasonTag, setSeasonTag,
  useIndigenous, setUseIndigenous,
}: {
  date: string; setDate: (v: string) => void;
  seasonTag: string; setSeasonTag: (v: string) => void;
  useIndigenous: boolean; setUseIndigenous: (v: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Toggle */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['indigenous', 'western'] as const).map((mode) => {
          const active = mode === 'indigenous' ? useIndigenous : !useIndigenous;
          return (
            <button key={mode} type="button"
              onClick={() => setUseIndigenous(mode === 'indigenous')}
              className="px-3 py-1 rounded text-xs transition-all"
              style={{
                background: active ? 'rgba(212,164,84,0.2)' : 'transparent',
                color: active ? 'rgba(212,164,84,0.9)' : 'rgba(255,255,255,0.52)',
                border: active ? '1px solid rgba(212,164,84,0.3)' : '1px solid transparent',
              }}>
              {mode === 'indigenous' ? 'Seasonal' : 'Western'}
            </button>
          );
        })}
      </div>

      {useIndigenous ? (
        <SeasonPicker value={seasonTag} onChange={setSeasonTag} />
      ) : (
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)',
              colorScheme: 'dark',
            }} />
        </div>
      )}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export function PersonPanel({
  person, isSelf, focusSection, onClose,
  onAddStory, onAddConnection, onMediaEntryClick,
  tutorialHighlightTabs = false,
}: PersonPanelProps) {
  const { state, dispatch } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>(
    tutorialHighlightTabs ? 'stories'
    : focusSection === 'connections' ? 'connections'
    : focusSection === 'stories' ? 'stories'
    : 'profile',
  );

  // Switch to stories tab when tutorial dashboard step activates
  useEffect(() => {
    if (tutorialHighlightTabs) setActiveTab('stories');
  }, [tutorialHighlightTabs]);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [displayName, setDisplayName]       = useState(person.displayName);
  const [indigenousName, setIndigenousName] = useState(person.indigenousName ?? '');
  const [skinName, setSkinName]             = useState(person.skinName ?? '');
  const [moiety, setMoiety]                 = useState(person.moiety ?? '');
  const [clan, setClan]                     = useState(person.clan ?? '');
  const [community, setCommunity]           = useState(person.community ?? '');
  const [countryLanguageGroup, setCountryLanguageGroup] = useState(person.countryLanguageGroup ?? '');
  const [isDeceased, setIsDeceased]         = useState(person.isDeceased);
  const [visibility, setVisibility]         = useState<Visibility>(person.visibility);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [savedProfile, setSavedProfile]     = useState(false);

  // AI summariser
  const [summarizing, setSummarizing]               = useState(false);
  const [storySummary, setStorySummary]             = useState<string | null>(null);

  // Quick story
  const [showQuickStory, setShowQuickStory]         = useState(false);
  const [showAudioRecorder, setShowAudioRecorder]   = useState(false);
  const [quickStoryTitle, setQuickStoryTitle]       = useState('');
  const [quickStoryContent, setQuickStoryContent]   = useState('');
  const [quickStoryType]                            = useState<StoryType>('text');
  const [quickStorySeason, setQuickStorySeason]     = useState('unsure');
  const [quickStoryEraId, setQuickStoryEraId]       = useState('');

  // ── Media state ────────────────────────────────────────────────────────────
  const [openMediaSections, setOpenMediaSections] = useState<Set<MediaSection>>(new Set(['photos']));

  // Photo form
  const [showPhotoForm, setShowPhotoForm]       = useState(false);
  const [pCaption, setPCaption]                 = useState('');
  const [pImageData, setPImageData]             = useState('');
  const [pDate, setPDate]                       = useState('');
  const [pSeason, setPSeason]                   = useState('unsure');
  const [pUseIndigenous, setPUseIndigenous]     = useState(true);
  const fileInputRef                            = useRef<HTMLInputElement>(null);

  // Article form
  const [showArticleForm, setShowArticleForm]   = useState(false);
  const [aTitle, setATitle]                     = useState('');
  const [aUrl, setAUrl]                         = useState('');
  const [aNote, setANote]                       = useState('');

  // Video form
  const [showVideoForm, setShowVideoForm]       = useState(false);
  const [vTitle, setVTitle]                     = useState('');
  const [vUrl, setVUrl]                         = useState('');
  const [vNote, setVNote]                       = useState('');

  // Invite link
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const moietyNames = state.kinshipTemplate?.moietyNames;
  const sectionNames = state.kinshipTemplate?.sectionNames;
  const personRelationships = state.relationships.filter(
    (r) => r.fromPersonId === person.id || r.toPersonId === person.id,
  );
  const mediaEntries = person.mediaEntries ?? [];
  const photos    = mediaEntries.filter((e): e is PhotoEntry    => e.type === 'photo');
  const articles  = mediaEntries.filter((e): e is ArticleEntry  => e.type === 'article');
  const videos    = mediaEntries.filter((e): e is VideoEntry    => e.type === 'video');

  const photoStorageUsed = getPhotoStorageUsed(person);
  const photoStorageWarning = photoStorageUsed > PHOTO_WARN_BYTES;

  useEffect(() => {
    if (focusSection && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-section="${focusSection}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusSection]);

  function toggleMediaSection(s: MediaSection) {
    setOpenMediaSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSave() {
    if (!displayName.trim()) return;
    dispatch({
      type: 'UPDATE_PERSON',
      payload: {
        ...person,
        displayName: displayName.trim(),
        indigenousName: indigenousName.trim() || undefined,
        skinName: skinName.trim() || undefined,
        moiety: moiety || undefined,
        clan: clan.trim() || undefined,
        community: community.trim() || undefined,
        countryLanguageGroup: countryLanguageGroup.trim() || undefined,
        isDeceased, visibility,
        lastUpdated: new Date().toISOString(),
      },
    });
    // Update localStorage profile for self-person
    if (isSelf) {
      try {
        const existing = JSON.parse(localStorage.getItem('kinstellation_profile') ?? '{}');
        localStorage.setItem('kinstellation_profile', JSON.stringify({
          ...existing,
          name: displayName.trim(),
          clan: clan.trim() || null,
          community: community.trim() || null,
          moiety: (moiety && moiety !== 'not_sure') ? moiety : null,
          language: countryLanguageGroup.trim() || null,
        }));
      } catch { /* ignore */ }
    }
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  }

  function handleQuickStorySave() {
    if (!quickStoryTitle.trim() || !quickStoryContent.trim()) return;
    const eraYear = ERA_OPTIONS.find((e) => e.id === quickStoryEraId)?.year;
    const story: Story = {
      id: crypto.randomUUID(),
      title: quickStoryTitle.trim(),
      type: quickStoryType,
      content: quickStoryContent,
      recordedBy: '',
      recordedDate: new Date().toISOString(),
      seasonTag: quickStorySeason,
      year: eraYear,
      visibility: 'family',
      linkedPersonIds: [person.id],
    };
    dispatch({ type: 'ADD_STORY', payload: { personId: person.id, story } });
    setQuickStoryTitle(''); setQuickStoryContent(''); setQuickStorySeason('unsure'); setQuickStoryEraId('');
    setShowQuickStory(false);
  }

  const handlePhotoFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPImageData(e.target?.result as string ?? '');
    reader.readAsDataURL(file);
  }, []);

  function handleAddPhoto() {
    if (!pImageData) return;
    const entry: PhotoEntry = {
      id: crypto.randomUUID(),
      type: 'photo',
      caption: pCaption.trim(),
      imageData: pImageData,
      date: pUseIndigenous ? '' : pDate,
      seasonTag: pUseIndigenous ? pSeason : 'unsure',
      useIndigenousCalendar: pUseIndigenous,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MEDIA_ENTRY', payload: { personId: person.id, entry } });
    setPCaption(''); setPImageData(''); setPDate(''); setPSeason('unsure');
    setShowPhotoForm(false);
  }

  function handleAddArticle() {
    if (!aTitle.trim() || !aUrl.trim()) return;
    const entry: ArticleEntry = {
      id: crypto.randomUUID(),
      type: 'article',
      title: aTitle.trim(),
      url: aUrl.trim(),
      note: aNote.trim(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MEDIA_ENTRY', payload: { personId: person.id, entry } });
    setATitle(''); setAUrl(''); setANote('');
    setShowArticleForm(false);
  }

  function handleAddVideo() {
    if (!vTitle.trim() || !vUrl.trim()) return;
    const entry: VideoEntry = {
      id: crypto.randomUUID(),
      type: 'video',
      title: vTitle.trim(),
      url: vUrl.trim(),
      note: vNote.trim(),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MEDIA_ENTRY', payload: { personId: person.id, entry } });
    setVTitle(''); setVUrl(''); setVNote('');
    setShowVideoForm(false);
  }

  function getRelatedPersonName(rel: typeof personRelationships[0]) {
    const otherId = rel.fromPersonId === person.id ? rel.toPersonId : rel.fromPersonId;
    return state.persons.find((p) => p.id === otherId)?.displayName ?? 'Unknown';
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="absolute top-0 right-0 h-full z-30 animate-slide-right select-auto" style={{ width: '28rem' }} onMouseDown={(e) => e.stopPropagation()}>
      <div ref={scrollRef} className="h-full flex flex-col backdrop-blur-xl panel-scroll"
        style={{
          background: 'rgba(8,4,22,0.97)',
          borderLeft: '1px solid rgba(88,28,135,0.4)',
          ...(tutorialHighlightTabs && { filter: 'brightness(1.22)', borderLeft: '1px solid rgba(212,164,84,0.35)' }),
        }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.9)' }}>
                {person.displayName}
              </h2>
              {person.indigenousName && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.6)' }}>{person.indigenousName}</p>
              )}
            </div>
            <button onClick={onClose} className="text-lg leading-none transition-colors"
              style={{ color: 'rgba(139,92,246,0.5)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(212,164,84,0.75)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.5)'; }}
              aria-label="Close">
              &times;
            </button>
          </div>

          {isDeceased && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-xs leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              Aboriginal and Torres Strait Islander peoples are advised that this profile may contain
              the name and image of a deceased person.
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-0"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(88,28,135,0.25)' }}>
            {(['profile', 'stories', 'connections', 'media'] as Tab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize${tutorialHighlightTabs ? ' animate-tutorial-box-glow' : ''}`}
                style={{
                  background: activeTab === tab ? 'rgba(88,28,135,0.5)' : 'transparent',
                  color: activeTab === tab ? 'rgba(212,164,84,0.95)' : 'rgba(139,92,246,0.65)',
                  border: activeTab === tab ? '1px solid rgba(212,164,84,0.25)' : '1px solid transparent',
                }}>
                {tab === 'stories' ? `stories${person.stories.length > 0 ? ` (${person.stories.length})` : ''}` : tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">

          {/* ════ PROFILE TAB ════ */}
          {activeTab === 'profile' && (
            <div className="space-y-0">
              {/* Identity */}
              <MediaSubSection title="Identity" open count={null}>
                <div className="space-y-3">
                  <Field label="Name" value={displayName} onChange={setDisplayName} placeholder="Display name" />
                  <Field label="Indigenous name" value={indigenousName} onChange={setIndigenousName} placeholder="Name in language" />
                  {sectionNames ? (
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                        <WordTooltip term="Skin name">Skin name</WordTooltip>
                      </label>
                      <select value={skinName} onChange={(e) => setSkinName(e.target.value)}
                        className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
                        <option value="">Select...</option>
                        {sectionNames.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ) : (
                    <Field label="Skin name" value={skinName} onChange={setSkinName} placeholder="Skin name" />
                  )}
                  {moietyNames && (
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                        <WordTooltip term="Moiety">Moiety</WordTooltip>
                      </label>
                      <div className="flex gap-2">
                        {moietyNames.map((m) => (
                          <button key={m} type="button"
                            onClick={() => setMoiety(moiety === m ? '' : m)}
                            className="flex-1 px-3 py-2 rounded-lg border text-xs transition-all"
                            style={{
                              background: moiety === m ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                              border: moiety === m ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                              color: moiety === m ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                            }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Field label="Clan" value={clan} onChange={(v) => setClan(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v)}
                    placeholder="e.g. Brataualung, Yalukit-willam" />
                  <Field label="Community" value={community} onChange={(v) => setCommunity(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v)}
                    placeholder="e.g. Koorie, Framlingham" />
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <input type="checkbox" checked={isDeceased} onChange={(e) => setIsDeceased(e.target.checked)}
                      className="rounded border-white/10" />
                    This person is deceased
                  </label>
                  <button onClick={handleSave} disabled={!displayName.trim()}
                    className="w-full py-2 rounded-lg text-sm transition-all disabled:opacity-30"
                    style={{
                      background: savedProfile ? 'rgba(34,197,94,0.2)' : 'rgba(88,28,135,0.6)',
                      border: `1px solid ${savedProfile ? 'rgba(34,197,94,0.5)' : 'rgba(212,164,84,0.35)'}`,
                      color: savedProfile ? 'rgba(134,239,172,0.9)' : 'rgba(212,164,84,0.9)',
                    }}>
                    {savedProfile ? 'Saved ✓' : 'Save'}
                  </button>
                </div>
              </MediaSubSection>

              {/* Delete */}
              <div className="pt-5 mt-5" style={{ borderTop: '1px solid rgba(88,28,135,0.2)' }}>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'rgba(248,113,113,0.6)' }}>Remove {person.displayName}?</span>
                    <button onClick={() => { dispatch({ type: 'DELETE_PERSON', payload: person.id }); onClose(); }}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ color: 'rgba(248,113,113,0.7)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      Remove
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs transition-colors"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="text-xs transition-colors"
                    style={{ color: 'rgba(248,113,113,0.4)' }}>
                    Remove from sky
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ════ STORIES TAB ════ */}
          {activeTab === 'stories' && (
            <div className="space-y-4" data-section="stories">
              {person.stories.length === 0 && !showQuickStory && (
                <p className="text-xs italic pt-2" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  No stories yet. This star is waiting to be illuminated.
                </p>
              )}

              {/* Story list */}
              {person.stories.map((story) => (
                <div key={story.id} className="px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(88,28,135,0.08)', border: '1px solid rgba(88,28,135,0.25)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>{story.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded capitalize shrink-0 mt-0.5"
                      style={{ background: 'rgba(139,92,246,0.15)', color: 'rgba(139,92,246,0.7)' }}>
                      {story.type}
                    </span>
                  </div>
                  {story.content && story.type === 'text' && (
                    <p className="text-xs mt-1.5 leading-relaxed line-clamp-3"
                      style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {story.content}
                    </p>
                  )}
                  {story.seasonTag && story.seasonTag !== 'unsure' && (
                    <p className="text-[10px] mt-1.5" style={{ color: 'rgba(212,164,84,0.75)' }}>
                      {state.seasonalCalendar
                        ? (state.seasonalCalendar.seasons.find(s => s.id === story.seasonTag)?.name ?? story.seasonTag)
                        : story.seasonTag}
                    </p>
                  )}
                </div>
              ))}

              {/* AI story summary */}
              {person.stories.length > 0 && (
                <div>
                  {storySummary ? (
                    <div className="px-4 py-3 rounded-xl relative"
                      style={{ background: 'rgba(212,164,84,0.06)', border: '1px solid rgba(212,164,84,0.25)' }}>
                      <button
                        onClick={() => setStorySummary(null)}
                        className="absolute top-2.5 right-2.5 text-[11px] leading-none px-1.5 py-0.5 rounded"
                        style={{ color: 'rgba(212,164,84,0.55)', background: 'rgba(212,164,84,0.08)' }}
                        title="Dismiss"
                      >×</button>
                      <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'rgba(212,164,84,0.55)' }}>
                        ✦ Story summary
                      </p>
                      <p className="text-xs leading-relaxed pr-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {storySummary}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        setSummarizing(true);
                        try {
                          const resp = await fetch('/api/summarize-stories', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({
                              personName: person.displayName,
                              stories: person.stories.map((s) => ({
                                title: s.title,
                                content: s.content,
                                type: s.type,
                              })),
                            }),
                          });
                          const data = await resp.json();
                          setStorySummary(data.summary ?? null);
                        } catch {
                          setStorySummary('Unable to summarise stories at this time.');
                        } finally {
                          setSummarizing(false);
                        }
                      }}
                      disabled={summarizing}
                      className="w-full px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: 'rgba(212,164,84,0.06)',
                        border: '1px solid rgba(212,164,84,0.20)',
                        color: summarizing ? 'rgba(212,164,84,0.40)' : 'rgba(212,164,84,0.70)',
                        cursor: summarizing ? 'default' : 'pointer',
                      }}
                    >
                      {summarizing ? '✦ Summarising…' : '✦ Summarise stories'}
                    </button>
                  )}
                </div>
              )}

              {/* Quick story inline form */}
              {showQuickStory ? (
                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(88,28,135,0.25)' }}>
                  <Field label="Title" value={quickStoryTitle} onChange={setQuickStoryTitle} placeholder="Story title" />
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>Story</label>
                    <div className="relative">
                      <textarea value={quickStoryContent} onChange={(e) => setQuickStoryContent(e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder="Tell the story..." rows={5}
                        className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', paddingBottom: '2.5rem' }} />
                      <MicButton onTranscript={(t) => setQuickStoryContent(prev => prev ? prev + ' ' + t : t)} />
                    </div>
                  </div>
                  {/* Season — pill buttons */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                      Which season does this belong to?
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickStorySeason('unsure')}
                        className="px-2.5 py-1 rounded-lg text-[11px] transition-all"
                        style={quickStorySeason === 'unsure' ? {
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
                          onClick={() => setQuickStorySeason(season.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all"
                          style={quickStorySeason === season.id ? {
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
                  {/* When did this happen — dropdown */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
                      When did this happen? <span style={{ color: 'rgba(255,255,255,0.15)' }}>(optional)</span>
                    </label>
                    <select
                      value={quickStoryEraId}
                      onChange={(e) => setQuickStoryEraId(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      {ERA_OPTIONS.map((era) => (
                        <option key={era.id} value={era.id}>{era.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <BtnSecondary onClick={() => setShowQuickStory(false)}>Cancel</BtnSecondary>
                    <BtnPrimary onClick={handleQuickStorySave} disabled={!quickStoryTitle.trim() || !quickStoryContent.trim()}>Save</BtnPrimary>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  {/* Record a yarn — captures actual audio, distinct from speech-to-text */}
                  <button
                    onClick={() => setShowAudioRecorder(true)}
                    className="w-full text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    style={{ color: 'rgba(212,164,84,0.85)', border: '1px solid rgba(212,164,84,0.3)', background: 'rgba(212,164,84,0.08)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.14)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.08)'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="4.5" y="1" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M2 7a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Record a yarn
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => setShowQuickStory(true)}
                      className={`flex-1 text-sm py-2.5 rounded-xl transition-all${tutorialHighlightTabs ? ' animate-tutorial-box-glow' : ''}`}
                      style={{ color: 'rgba(212,164,84,0.7)', border: '1px solid rgba(212,164,84,0.2)', background: 'rgba(212,164,84,0.05)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.05)'; }}>
                      + Quick story
                    </button>
                    <button onClick={() => onAddStory(person.id)}
                      className={`flex-1 text-sm py-2.5 rounded-xl transition-all${tutorialHighlightTabs ? ' animate-tutorial-box-glow' : ''}`}
                      style={{ color: 'rgba(139,92,246,0.7)', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.05)'; }}>
                      + Full story
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ CONNECTIONS TAB ════ */}
          {activeTab === 'connections' && (
            <div className="space-y-2" data-section="connections">
              {personRelationships.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  No connections yet. Empty space in the sky — knowledge waiting to be discovered.
                </p>
              ) : (
                personRelationships.map((rel) => (
                  <div key={rel.id} className="px-3 py-2 rounded-lg flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{getRelatedPersonName(rel)}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>{rel.relationshipType.replace(/_/g, ' ')}</span>
                  </div>
                ))
              )}
              <button onClick={() => onAddConnection(person.id)}
                className={`text-xs transition-colors py-1${tutorialHighlightTabs ? ' animate-tutorial-box-glow rounded-lg px-2' : ''}`}
                style={{ color: 'rgba(139,92,246,0.55)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(212,164,84,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(139,92,246,0.55)'; }}>
                + Add connection
              </button>

              {/* Invite to collaborate — self-star only */}
              {isSelf && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(88,28,135,0.2)' }}>
                  {inviteLink ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.60)' }}>Share this link to collaborate:</p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={inviteLink}
                          className="flex-1 rounded px-2 py-1.5 text-xs truncate focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}
                          onFocus={(e) => e.target.select()}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inviteLink);
                            setInviteCopied(true);
                            setTimeout(() => setInviteCopied(false), 2000);
                          }}
                          className="text-xs shrink-0 transition-colors"
                          style={{ color: inviteCopied ? 'rgba(134,239,172,0.8)' : 'rgba(212,164,84,0.6)' }}
                        >
                          {inviteCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={inviteLoading}
                      onClick={async () => {
                        setInviteLoading(true);
                        try {
                          const res = await fetch('/api/invite/create', { method: 'POST' });
                          const data = await res.json();
                          if (data.token) setInviteLink(`${window.location.origin}/invite/${data.token}`);
                        } catch { /* ignore */ }
                        setInviteLoading(false);
                      }}
                      className="w-full text-xs py-2.5 rounded-xl transition-all disabled:opacity-40"
                      style={{
                        color: 'rgba(212,164,84,0.65)',
                        border: '1px solid rgba(212,164,84,0.2)',
                        background: 'rgba(212,164,84,0.04)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,164,84,0.04)'; }}
                    >
                      {inviteLoading ? 'Creating link…' : 'Invite someone to collaborate'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════ MEDIA TAB ════ */}
          {activeTab === 'media' && (
            <div className="space-y-1">
              {photoStorageWarning && (
                <div className="mb-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'rgba(251,191,36,0.8)' }}>
                  Storage getting full. Consider removing old photos before adding more.
                </div>
              )}

              {/* ── Photos ── */}
              <MediaSubSection title="Photos" count={photos.length}
                open={openMediaSections.has('photos')}
                onToggle={() => toggleMediaSection('photos')}>
                <div className="space-y-2">
                  {photos.length === 0 && !showPhotoForm && (
                    <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>No photos yet.</p>
                  )}
                  {photos.map((e) => (
                    <button key={e.id} onClick={() => onMediaEntryClick?.(e)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.imageData} alt={e.caption}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                        style={{ border: '1px solid rgba(212,164,84,0.3)' }} />
                      <div className="min-w-0">
                        <span className="text-sm block truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          {e.caption || 'Untitled photo'}
                        </span>
                        <span className="text-xs block" style={{ color: 'rgba(255,255,255,0.50)' }}>
                          {e.useIndigenousCalendar && e.seasonTag !== 'unsure'
                            ? state.seasonalCalendar?.seasons.find((s) => s.id === e.seasonTag)?.name ?? e.seasonTag
                            : e.date || 'No date'}
                        </span>
                      </div>
                    </button>
                  ))}
                  {showPhotoForm ? (
                    <div className="p-4 rounded-lg space-y-3"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(88,28,135,0.3)' }}>
                      {/* Drop zone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) handlePhotoFile(file);
                        }}
                        className="w-full rounded-xl flex flex-col items-center justify-center py-6 cursor-pointer transition-all"
                        style={{
                          border: '2px dashed rgba(212,164,84,0.25)',
                          background: pImageData ? 'transparent' : 'rgba(255,255,255,0.02)',
                        }}>
                        {pImageData ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pImageData} alt="preview"
                            className="max-h-40 rounded-lg object-contain"
                            style={{ border: '2px solid rgba(212,164,84,0.4)' }} />
                        ) : (
                          <>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-2" style={{ color: 'rgba(212,164,84,0.4)' }}>
                              <path d="M4 16l4-4 4 4 4-6 4 6M2 20h20V4H2v16z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click or drag to upload</span>
                          </>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoFile(f); }} />
                      </div>
                      <Field label="Caption" value={pCaption} onChange={setPCaption} placeholder="Describe this photo…" />
                      <DateSeasonInput date={pDate} setDate={setPDate}
                        seasonTag={pSeason} setSeasonTag={setPSeason}
                        useIndigenous={pUseIndigenous} setUseIndigenous={setPUseIndigenous} />
                      <div className="flex gap-2">
                        <BtnSecondary onClick={() => { setShowPhotoForm(false); setPImageData(''); }}>Cancel</BtnSecondary>
                        <BtnPrimary onClick={handleAddPhoto} disabled={!pImageData}>Save</BtnPrimary>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowPhotoForm(true)}
                      className="w-full text-sm py-2 rounded-lg transition-all"
                      style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      + Add photo
                    </button>
                  )}
                </div>
              </MediaSubSection>

              {/* ── Articles ── */}
              <MediaSubSection title="Articles" count={articles.length}
                open={openMediaSections.has('articles')}
                onToggle={() => toggleMediaSection('articles')}>
                <div className="space-y-2">
                  {articles.length === 0 && !showArticleForm && (
                    <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>No articles linked yet.</p>
                  )}
                  {articles.map((e) => (
                    <button key={e.id} onClick={() => onMediaEntryClick?.(e)}
                      className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-sm block" style={{ color: 'rgba(255,255,255,0.7)' }}>{e.title}</span>
                      <span className="text-xs truncate block" style={{ color: 'rgba(255,255,255,0.2)' }}>{e.url}</span>
                    </button>
                  ))}
                  {showArticleForm ? (
                    <div className="p-4 rounded-lg space-y-3"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(88,28,135,0.3)' }}>
                      <Field label="Title" value={aTitle} onChange={setATitle} placeholder="Article name" />
                      <Field label="URL" value={aUrl} onChange={setAUrl} placeholder="https://…" />
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>Your note (optional)</label>
                        <textarea value={aNote} onChange={(e) => setANote(e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          placeholder="Why does this article matter to you?" rows={3}
                          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }} />
                      </div>
                      <div className="flex gap-2">
                        <BtnSecondary onClick={() => setShowArticleForm(false)}>Cancel</BtnSecondary>
                        <BtnPrimary onClick={handleAddArticle} disabled={!aTitle.trim() || !aUrl.trim()}>Save</BtnPrimary>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowArticleForm(true)}
                      className="w-full text-sm py-2 rounded-lg transition-all"
                      style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      + Link article
                    </button>
                  )}
                </div>
              </MediaSubSection>

              {/* ── Videos ── */}
              <MediaSubSection title="Videos" count={videos.length}
                open={openMediaSections.has('videos')}
                onToggle={() => toggleMediaSection('videos')}>
                <div className="space-y-2">
                  {videos.length === 0 && !showVideoForm && (
                    <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>No videos linked yet.</p>
                  )}
                  {videos.map((e) => (
                    <button key={e.id} onClick={() => onMediaEntryClick?.(e)}
                      className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-sm block" style={{ color: 'rgba(255,255,255,0.7)' }}>{e.title}</span>
                      <span className="text-xs truncate block" style={{ color: 'rgba(255,255,255,0.2)' }}>{e.url}</span>
                    </button>
                  ))}
                  {showVideoForm ? (
                    <div className="p-4 rounded-lg space-y-3"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(88,28,135,0.3)' }}>
                      <Field label="Title" value={vTitle} onChange={setVTitle} placeholder="Video name" />
                      <Field label="URL" value={vUrl} onChange={setVUrl} placeholder="https://…" />
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.60)' }}>Your note (optional)</label>
                        <textarea value={vNote} onChange={(e) => setVNote(e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          placeholder="What's this video about?" rows={3}
                          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }} />
                      </div>
                      <div className="flex gap-2">
                        <BtnSecondary onClick={() => setShowVideoForm(false)}>Cancel</BtnSecondary>
                        <BtnPrimary onClick={handleAddVideo} disabled={!vTitle.trim() || !vUrl.trim()}>Save</BtnPrimary>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowVideoForm(true)}
                      className="w-full text-sm py-2 rounded-lg transition-all"
                      style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      + Link video
                    </button>
                  )}
                </div>
              </MediaSubSection>
            </div>
          )}
        </div>
      </div>
    </div>

    {showAudioRecorder && (
      <AudioRecorderModal
        personId={person.id}
        personName={person.displayName}
        onClose={() => setShowAudioRecorder(false)}
      />
    )}
    </>
  );
}

// ── Shared UI atoms ──────────────────────────────────────────────────────────

function BtnPrimary({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex-1 py-2 rounded-lg text-sm transition-all disabled:opacity-30"
      style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(212,164,84,0.35)', color: 'rgba(212,164,84,0.9)' }}>
      {children}
    </button>
  );
}

function BtnSecondary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="flex-1 py-2 rounded-lg text-sm transition-all"
      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.32)' }}>
      {children}
    </button>
  );
}

function MediaSubSection({ title, count, open, onToggle, children }: {
  title: string; count?: number | null;
  open?: boolean; onToggle?: () => void;
  children: React.ReactNode;
}) {
  const isCollapsible = !!onToggle;
  const isOpen = open ?? true;
  return (
    <div className="pt-3 pb-1" style={{ borderTop: '1px solid rgba(88,28,135,0.18)' }}>
      {isCollapsible ? (
        <button onClick={onToggle} className="w-full flex items-center justify-between mb-2 group">
          <span className="text-xs uppercase tracking-wider font-medium transition-colors"
            style={{ color: isOpen ? 'rgba(212,164,84,0.75)' : 'rgba(212,164,84,0.4)' }}>
            {title} {count !== null && count !== undefined && <span style={{ color: 'rgba(139,92,246,0.5)' }}>({count})</span>}
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12"
            className={`transition-all ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'rgba(139,92,246,0.4)' }}>
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <p className="text-xs uppercase tracking-wider font-medium mb-2"
          style={{ color: 'rgba(212,164,84,0.75)' }}>{title}</p>
      )}
      {isOpen && children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/60 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v);
        }}
        placeholder={placeholder}
        autoCapitalize="sentences"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white/75 placeholder:text-white/20 focus:outline-none focus:border-white/[0.18]"
      />
    </div>
  );
}

