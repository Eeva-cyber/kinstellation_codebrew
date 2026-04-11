'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store/AppContext';
import type {
  Person, Visibility, Story, StoryType,
  MediaEntry, PhotoEntry, ArticleEntry, VideoEntry,
} from '@/lib/types';
import { SeasonPicker } from '@/components/ui/SeasonPicker';
import { WordTooltip } from '@/components/ui/WordTooltip';
import { regions } from '@/lib/data/regions';

interface PersonPanelProps {
  person: Person;
  isSelf?: boolean;
  focusSection?: 'identity' | 'stories' | 'connections';
  onClose: () => void;
  onAddStory: (personId: string) => void;
  onAddConnection: (personId: string) => void;
  onMediaEntryClick?: (entry: MediaEntry) => void;
}

type Tab = 'profile' | 'connections' | 'media';
type MediaSection = 'photos' | 'articles' | 'videos';

// ── localStorage size warning ────────────────────────────────────────────────
const PHOTO_WARN_BYTES = 3 * 1024 * 1024; // 3 MB

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
                color: active ? 'rgba(212,164,84,0.9)' : 'rgba(255,255,255,0.3)',
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
}: PersonPanelProps) {
  const { state, dispatch } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>(
    focusSection === 'connections' ? 'connections' : 'profile',
  );

  // ── Profile state ──────────────────────────────────────────────────────────
  const [displayName, setDisplayName]       = useState(person.displayName);
  const [indigenousName, setIndigenousName] = useState(person.indigenousName ?? '');
  const [skinName, setSkinName]             = useState(person.skinName ?? '');
  const [moiety, setMoiety]                 = useState(person.moiety ?? '');
  const [mob, setMob]                       = useState(person.mob ?? '');
  const [countryLanguageGroup, setCountryLanguageGroup] = useState(person.countryLanguageGroup ?? '');
  const [isDeceased, setIsDeceased]         = useState(person.isDeceased);
  const [visibility, setVisibility]         = useState<Visibility>(person.visibility);
  const [confirmDelete, setConfirmDelete]   = useState(false);

  // Quick story
  const [showQuickStory, setShowQuickStory]     = useState(false);
  const [quickStoryTitle, setQuickStoryTitle]   = useState('');
  const [quickStoryContent, setQuickStoryContent] = useState('');
  const [quickStoryType]                        = useState<StoryType>('text');
  const [quickStorySeason, setQuickStorySeason] = useState('unsure');

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
        mob: mob.trim() || undefined,
        countryLanguageGroup: countryLanguageGroup.trim() || undefined,
        isDeceased, visibility,
        lastUpdated: new Date().toISOString(),
      },
    });
  }

  function handleQuickStorySave() {
    if (!quickStoryTitle.trim() || !quickStoryContent.trim()) return;
    const story: Story = {
      id: crypto.randomUUID(),
      title: quickStoryTitle.trim(),
      type: quickStoryType,
      content: quickStoryContent,
      recordedBy: '',
      recordedDate: new Date().toISOString(),
      seasonTag: quickStorySeason,
      visibility: 'family',
      linkedPersonIds: [person.id],
    };
    dispatch({ type: 'ADD_STORY', payload: { personId: person.id, story } });
    setQuickStoryTitle(''); setQuickStoryContent(''); setQuickStorySeason('unsure');
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
    <div className="absolute top-0 right-0 h-full z-30 animate-slide-right select-auto" style={{ width: '28rem' }}>
      <div ref={scrollRef} className="h-full flex flex-col backdrop-blur-xl panel-scroll"
        style={{ background: 'rgba(8,4,22,0.97)', borderLeft: '1px solid rgba(88,28,135,0.4)' }}>

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
              style={{ color: 'rgba(255,255,255,0.3)' }} aria-label="Close">
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
            {(['profile', 'connections', 'media'] as Tab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  background: activeTab === tab ? 'rgba(88,28,135,0.5)' : 'transparent',
                  color: activeTab === tab ? 'rgba(212,164,84,0.95)' : 'rgba(255,255,255,0.35)',
                  border: activeTab === tab ? '1px solid rgba(212,164,84,0.25)' : '1px solid transparent',
                }}>
                {tab}
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
                      <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                      <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                  <LanguageGroupCombobox value={mob} onChange={setMob} />
                  <Field label="Country / Language group" value={countryLanguageGroup}
                    onChange={setCountryLanguageGroup} placeholder="e.g. Noongar Country, Arnhem Land" />
                  <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <input type="checkbox" checked={isDeceased} onChange={(e) => setIsDeceased(e.target.checked)}
                      className="rounded border-white/10" />
                    This person is deceased
                  </label>
                  <button onClick={handleSave} disabled={!displayName.trim()}
                    className="w-full py-2 rounded-lg text-sm transition-all disabled:opacity-30"
                    style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(212,164,84,0.35)', color: 'rgba(212,164,84,0.9)' }}>
                    Save
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
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{rel.relationshipType.replace(/_/g, ' ')}</span>
                  </div>
                ))
              )}
              <button onClick={() => onAddConnection(person.id)}
                className="text-xs transition-colors py-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                + Add connection
              </button>
            </div>
          )}

          {/* Invite link (self-star only) */}
          {isSelf && (
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              {inviteLink ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-white/40">Share this link to connect:</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/70 truncate"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        setInviteCopied(true);
                        setTimeout(() => setInviteCopied(false), 2000);
                      }}
                      className="text-xs text-amber-400/60 hover:text-amber-400/80 transition-colors shrink-0"
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
                  className="w-full text-xs text-amber-400/60 hover:text-amber-400/80 transition-colors py-2 border border-amber-400/15 rounded-lg hover:bg-amber-400/5 disabled:opacity-40"
                >
                  {inviteLoading ? 'Creating link…' : 'Invite someone to your constellation'}
                </button>
              )}
            </div>
          )}

          {/* Delete */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400/60">Remove {person.displayName}?</span>
                <button
                  onClick={() => {
                    dispatch({ type: 'DELETE_PERSON', payload: person.id });
                    onClose();
                  }}
                  className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded border border-red-400/20"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-400/40 hover:text-red-400/70 transition-colors"
              >
                Remove from sky
              </button>
            )}
          </div>

          {/* ════ MEDIA TAB ════ */}
          {activeTab === 'media' && (
            <div className="space-y-1">
              {photoStorageWarning && (
                <div className="mb-3 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'rgba(251,191,36,0.8)' }}>
                  Storage getting full. Consider removing old photos before adding more.
                </div>
              )}

              {/* ── Stories ── */}
              <div className="pt-4 mt-2" style={{ borderBottom: '1px solid rgba(88,28,135,0.18)', paddingBottom: '12px' }}>
                <p className="text-xs uppercase tracking-wider mb-3 font-medium" style={{ color: 'rgba(212,164,84,0.5)' }}>
                  Stories <span style={{ color: 'rgba(139,92,246,0.5)' }}>({person.stories.length})</span>
                </p>
                <div className="space-y-2">
                  {person.stories.length === 0 && !showQuickStory && (
                    <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      No stories yet. This star is waiting to be illuminated.
                    </p>
                  )}
                  {person.stories.map((story) => (
                    <div key={story.id} className="px-3 py-2.5 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{story.title}</span>
                      <span className="text-xs ml-2 capitalize" style={{ color: 'rgba(255,255,255,0.25)' }}>{story.type}</span>
                    </div>
                  ))}
                  {showQuickStory ? (
                    <div className="mt-2 p-4 rounded-lg space-y-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(88,28,135,0.25)' }}>
                      <Field label="Title" value={quickStoryTitle} onChange={setQuickStoryTitle} placeholder="Story title" />
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Story</label>
                        <textarea value={quickStoryContent} onChange={(e) => setQuickStoryContent(e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          placeholder="Tell the story..." rows={4}
                          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }} />
                      </div>
                      <SeasonPicker value={quickStorySeason} onChange={setQuickStorySeason} />
                      <div className="flex gap-2">
                        <BtnSecondary onClick={() => setShowQuickStory(false)}>Cancel</BtnSecondary>
                        <BtnPrimary onClick={handleQuickStorySave} disabled={!quickStoryTitle.trim() || !quickStoryContent.trim()}>Save</BtnPrimary>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setShowQuickStory(true)} className="flex-1 text-sm py-2 rounded-lg transition-all"
                        style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        + Quick story
                      </button>
                      <button onClick={() => onAddStory(person.id)} className="flex-1 text-sm py-2 rounded-lg transition-all"
                        style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        + Full story
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                        <span className="text-xs block" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
                        <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Your note (optional)</label>
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
                        <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Your note (optional)</label>
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
          style={{ color: 'rgba(212,164,84,0.5)' }}>{title}</p>
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
      <label className="block text-xs text-white/35 mb-1.5">{label}</label>
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

// ── Language / Country group combobox ────────────────────────────────────────
const LANGUAGE_OPTIONS: { label: string; state: string; alternates: string[] }[] = regions
  .filter((r) => r.id !== 'not_listed')
  .map((r) => ({ label: r.displayName, state: r.stateTerritory, alternates: r.alternateNames ?? [] }));

function LanguageGroupCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search.trim()
    ? LANGUAGE_OPTIONS.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        o.alternates.some((a) => a.toLowerCase().includes(search.toLowerCase())))
    : LANGUAGE_OPTIONS;

  const hasExactMatch = LANGUAGE_OPTIONS.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());

  function select(label: string) { onChange(label); setSearch(label); setOpen(false); }

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, o) => {
    const key = o.state || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Mob / Language group</label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            const v = e.target.value;
            const cap = v.length > 0 ? v[0].toUpperCase() + v.slice(1) : v;
            setSearch(cap); onChange(cap); setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type your own…"
          autoCapitalize="sentences"
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 pr-8 text-sm text-white/75 placeholder:text-white/20 focus:outline-none focus:border-white/[0.18]"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
          tabIndex={-1}
          aria-label="Toggle list"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M2 3.5l3 3 3-3" stroke="rgba(139,92,246,0.9)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-[70]"
          style={{ background: 'rgba(8,4,22,0.98)', border: '1px solid rgba(88,28,135,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', maxHeight: 220, overflowY: 'auto' }}>
          {search.trim() && !hasExactMatch && (
            <button type="button" onClick={() => select(search.trim())}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] border-b"
              style={{ color: 'rgba(212,164,84,0.85)', borderColor: 'rgba(88,28,135,0.25)' }}>
              <span style={{ color: 'rgba(212,164,84,0.45)' }}>+</span>
              Use &quot;{search.trim()}&quot;
            </button>
          )}
          {Object.entries(grouped).map(([state, opts]) => (
            <div key={state}>
              <div className="px-3 py-1 sticky top-0"
                style={{ background: 'rgba(8,4,22,0.95)', color: 'rgba(139,92,246,0.5)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {state}
              </div>
              {opts.map((o) => (
                <button key={o.label} type="button" onClick={() => select(o.label)}
                  className="w-full text-left px-3 py-2 text-[12px] transition-all"
                  style={{ color: value === o.label ? 'rgba(212,164,84,0.95)' : 'rgba(255,255,255,0.65)', background: value === o.label ? 'rgba(88,28,135,0.4)' : 'transparent' }}>
                  {o.label}
                  {o.alternates.length > 0 && (
                    <span className="ml-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                      ({o.alternates.slice(0, 2).join(', ')}{o.alternates.length > 2 ? '…' : ''})
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
