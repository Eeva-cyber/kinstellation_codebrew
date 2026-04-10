'use client';

import type { Story } from '@/lib/types';

interface StoryPopupProps {
  story: Story;
  personName: string;
  seasonName?: string;
  impactScore?: number;
  onClose: () => void;
}

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Public',
  family: 'Family only',
  restricted: 'Restricted',
  gendered: "Gendered business",
};

const TYPE_LABELS: Record<string, string> = {
  text: 'Written',
  photo: 'Photo',
  audio: 'Audio',
  video: 'Video',
};

function ImpactBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/30 uppercase tracking-wider">Cultural weight</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor:
                i < score
                  ? `rgba(212,175,100,${0.3 + (i / 10) * 0.7})`
                  : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-white/25">{score}/10</span>
    </div>
  );
}

export function StoryPopup({
  story,
  personName,
  seasonName,
  impactScore,
  onClose,
}: StoryPopupProps) {
  const isPhoto = story.type === 'photo';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md max-h-[80vh] overflow-y-auto
          bg-[#0a0d1a]/95 border border-white/[0.1] rounded-2xl shadow-2xl
          animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">
                  {TYPE_LABELS[story.type] ?? story.type}
                </span>
                <span className="text-white/15">·</span>
                <span className="text-[10px] text-white/30">
                  {personName}
                </span>
              </div>
              <h2 className="text-base font-medium text-white/90 leading-snug">
                {story.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 text-white/25 hover:text-white/60 transition-colors text-xl leading-none mt-0.5"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Impact score */}
          {impactScore !== undefined && (
            <div className="mb-4">
              <ImpactBar score={impactScore} />
            </div>
          )}

          {/* Season tag */}
          {seasonName && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/45">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                {seasonName}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="mb-4">
            {isPhoto ? (
              story.content.startsWith('data:') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={story.content}
                  alt={story.title}
                  className="w-full rounded-lg object-cover max-h-64"
                />
              ) : (
                <p className="text-sm text-white/30 italic">Photo not available</p>
              )
            ) : (
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                {story.content}
              </p>
            )}
          </div>

          {/* Seasonal context */}
          {story.seasonalContext && (
            <blockquote className="mb-4 pl-3 border-l border-white/[0.08] text-xs text-white/40 italic leading-relaxed">
              {story.seasonalContext}
            </blockquote>
          )}

          {/* Place connection */}
          {story.placeConnection && (
            <div className="mb-4 flex items-start gap-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-white/25">
                <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 1v1M6 9v1M1 5h1M10 5h1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-white/40">{story.placeConnection}</span>
            </div>
          )}

          {/* Footer meta */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <div className="text-[10px] text-white/25">
              {story.recordedBy && <span>{story.recordedBy}</span>}
              {story.recordedBy && story.recordedDate && <span className="mx-1.5">·</span>}
              {story.recordedDate && <span>{story.recordedDate}</span>}
            </div>
            <span className="text-[10px] text-white/20">
              {VISIBILITY_LABELS[story.visibility] ?? story.visibility}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
