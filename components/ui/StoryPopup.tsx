'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { SeasonPicker } from '@/components/ui/SeasonPicker';
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

function ImpactBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs tracking-wider" style={{ color: 'rgba(212,164,84,0.55)', textTransform: 'uppercase' }}>
        Cultural weight
      </span>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                i < score
                  ? `rgba(212,175,100,${0.3 + (i / 10) * 0.7})`
                  : 'rgba(88,28,135,0.3)',
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: 'rgba(212,164,84,0.45)' }}>{score}/10</span>
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
  const { dispatch } = useApp();
  const [isEditing, setIsEditing] = useState(true);

  // Edit fields
  const [editTitle, setEditTitle] = useState(story.title);
  const [editContent, setEditContent] = useState(story.content);
  const [editSeasonalContext, setEditSeasonalContext] = useState(story.seasonalContext ?? '');
  const [editSeasonTag, setEditSeasonTag] = useState(story.seasonTag);
  const [editVisibility, setEditVisibility] = useState<Visibility>(story.visibility);

  const isPhoto = story.type === 'photo';

  function handleSave() {
    const updated: Story = {
      ...story,
      title: editTitle.trim() || story.title,
      content: editContent,
      seasonTag: editSeasonTag,
      seasonalContext: editSeasonalContext.trim() || undefined,
      visibility: editVisibility,
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
    setIsEditing(false);
  }

  const INPUT = {
    background: 'rgba(88,28,135,0.14)',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'rgba(255,255,255,0.82)',
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
                <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(212,164,84,0.55)' }}>
                  {story.type}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span className="text-xs" style={{ color: 'rgba(212,164,84,0.45)' }}>{personName}</span>
              </div>
              {isEditing ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ ...INPUT, fontSize: 18, fontWeight: 500, background: 'rgba(88,28,135,0.18)', border: '1px solid rgba(212,164,84,0.35)' }}
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-medium" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  {story.title}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Edit toggle */}
              <button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{
                  background: isEditing ? 'rgba(88,28,135,0.5)' : 'rgba(88,28,135,0.25)',
                  border: `1px solid ${isEditing ? 'rgba(212,164,84,0.4)' : 'rgba(139,92,246,0.3)'}`,
                }}
                aria-label={isEditing ? 'Cancel edit' : 'Edit story'}
                title={isEditing ? 'Cancel' : 'Edit story'}
              >
                {isEditing ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="rgba(212,164,84,0.8)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 2l2 2-6 6H2V8L8 2z" stroke="rgba(139,92,246,0.8)" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
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

          {/* Impact score */}
          {impactScore !== undefined && (
            <div className="mb-5">
              <ImpactBar score={impactScore} />
            </div>
          )}

          {/* Season tag / picker */}
          <div className="mb-5">
            {isEditing ? (
              <SeasonPicker value={editSeasonTag} onChange={setEditSeasonTag} />
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
            {isEditing && !isPhoto ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                rows={7}
                style={{ ...INPUT, resize: 'none', lineHeight: 1.65 }}
              />
            ) : isPhoto ? (
              story.content.startsWith('data:') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={story.content} alt={story.title} className="w-full rounded-xl object-cover max-h-72" />
              ) : (
                <p className="text-base italic" style={{ color: 'rgba(255,255,255,0.25)' }}>Photo not available</p>
              )
            ) : (
              <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.78)' }}>
                {story.content}
              </p>
            )}
          </div>

          {/* Seasonal context */}
          {isEditing ? (
            <div className="mb-5">
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.55)' }}>
                What was happening on Country? (optional)
              </label>
              <input
                value={editSeasonalContext}
                onChange={(e) => setEditSeasonalContext(e.target.value)}
                placeholder="e.g. the wattle was flowering..."
                style={{ ...INPUT }}
              />
            </div>
          ) : story.seasonalContext ? (
            <blockquote className="mb-5 pl-4 text-sm italic leading-relaxed" style={{ borderLeft: '2px solid rgba(212,164,84,0.25)', color: 'rgba(255,255,255,0.48)' }}>
              {story.seasonalContext}
            </blockquote>
          ) : null}

          {/* Visibility (edit mode) */}
          {isEditing && (
            <div className="mb-5">
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(212,164,84,0.55)' }}>Who can see this?</label>
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
