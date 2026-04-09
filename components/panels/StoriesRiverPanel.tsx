'use client';

import { useApp } from '@/lib/store/AppContext';
import { getSeasonById } from '@/lib/utils/season';

interface RiverStory {
  id: string;
  title: string;
  type: string;
  content: string;
  seasonTag: string;
  seasonalContext?: string;
  recordedDate: string;
  personName: string;
  personId: string;
}

interface StoriesRiverPanelProps {
  stories: RiverStory[];
  onClose: () => void;
  onPersonClick: (personId: string) => void;
}

export function StoriesRiverPanel({ stories, onClose, onPersonClick }: StoriesRiverPanelProps) {
  const { state } = useApp();

  const sortedStories = [...stories].sort(
    (a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime(),
  );

  function getSeasonName(tag: string) {
    if (!state.seasonalCalendar || tag === 'unsure') return tag === 'unsure' ? 'Season unknown' : tag;
    const season = getSeasonById(state.seasonalCalendar, tag);
    return season ? `${season.name} — ${season.nameEnglish}` : tag;
  }

  function getSeasonColor(tag: string) {
    if (!state.seasonalCalendar || tag === 'unsure') return 'rgba(255,255,255,0.2)';
    const season = getSeasonById(state.seasonalCalendar, tag);
    return season?.colorPalette.accentColor ?? 'rgba(255,255,255,0.2)';
  }

  return (
    <div className="absolute top-0 right-0 h-full w-80 z-30 animate-slide-right">
      <div className="h-full bg-[var(--panel-bg)] border-l border-[var(--panel-border)] backdrop-blur-xl overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-white/70 tracking-wide">
              River of Stories
            </h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <p className="text-xs text-white/25 mb-4 leading-relaxed">
            The Milky Way carries the stories of your family. These are all the
            stories flowing through your kinship constellation.
          </p>

          {sortedStories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-white/20 italic">
                No stories yet. The river is waiting to flow.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => onPersonClick(story.personId)}
                  className="w-full text-left px-3 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: getSeasonColor(story.seasonTag) }}
                    />
                    <div className="min-w-0">
                      <span className="block text-xs text-white/60 truncate">
                        {story.title}
                      </span>
                      <span className="block text-[10px] text-white/25 mt-0.5">
                        {story.personName} &middot; {getSeasonName(story.seasonTag)}
                      </span>
                      {story.seasonalContext && (
                        <span className="block text-[10px] text-white/15 italic mt-0.5">
                          &ldquo;{story.seasonalContext}&rdquo;
                        </span>
                      )}
                      {story.type === 'text' && (
                        <p className="text-[10px] text-white/20 mt-1 line-clamp-2">
                          {story.content.slice(0, 120)}
                          {story.content.length > 120 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
