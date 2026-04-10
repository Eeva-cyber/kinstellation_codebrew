'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { getSeasonById } from '@/lib/utils/season';
import type { Story } from '@/lib/types';

interface TimelinePanelProps {
  onClose: () => void;
  onStoryClick: (personId: string) => void;
}

interface TimelineStory extends Story {
  personName: string;
  personId: string;
  personMoiety?: string;
}

function getMoietyDotColor(moiety: string | undefined, moietyNames?: [string, string]): string {
  if (!moiety || !moietyNames) return 'rgba(255, 248, 230, 0.8)';
  if (moiety === moietyNames[0]) return 'rgba(212, 175, 100, 0.9)';
  if (moiety === moietyNames[1]) return 'rgba(130, 160, 210, 0.9)';
  return 'rgba(255, 248, 230, 0.8)';
}

export function TimelinePanel({ onClose, onStoryClick }: TimelinePanelProps) {
  const { state } = useApp();
  const calendar = state.seasonalCalendar;
  const seasons = calendar?.seasons ?? [];
  const moietyNames = state.kinshipTemplate?.moietyNames;

  // Collect all stories with person info
  const allStories: TimelineStory[] = useMemo(
    () =>
      state.persons.flatMap((p) =>
        p.stories.map((s) => ({
          ...s,
          personName: p.displayName,
          personId: p.id,
          personMoiety: p.moiety,
        })),
      ),
    [state.persons],
  );

  // Group stories by season
  const storiesBySeason = useMemo(() => {
    const map: Record<string, TimelineStory[]> = {};
    for (const season of seasons) {
      map[season.id] = [];
    }
    map['unsure'] = [];
    for (const story of allStories) {
      const bucket = map[story.seasonTag] ?? map['unsure'];
      bucket.push(story);
    }
    return map;
  }, [allStories, seasons]);

  const hasStories = allStories.length > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-bottom">
      <div
        className="bg-[var(--panel-bg)] border-t border-[var(--panel-border)] backdrop-blur-xl"
        style={{ height: '45vh', minHeight: 240 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-white/60 tracking-wide">
            Story Timeline
          </h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Timeline content */}
        <div className="h-[calc(100%-48px)] overflow-x-auto overflow-y-auto">
          {!hasStories ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-white/20 italic">
                No stories yet. Add stories to see them across the seasonal cycle.
              </p>
            </div>
          ) : (
            <div className="flex h-full min-w-max">
              {/* Season columns */}
              {seasons.map((season) => {
                const stories = storiesBySeason[season.id] ?? [];
                return (
                  <div
                    key={season.id}
                    className="flex-1 min-w-[140px] border-r border-white/[0.04] last:border-r-0"
                  >
                    {/* Season header */}
                    <div
                      className="px-3 py-2 border-b border-white/[0.06] sticky top-0"
                      style={{ backgroundColor: `${season.colorPalette.accentColor}10` }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: season.colorPalette.accentColor }}
                        />
                        <div>
                          <span className="text-xs text-white/60 font-medium block leading-tight">
                            {season.name}
                          </span>
                          <span className="text-[10px] text-white/25 block leading-tight">
                            {season.nameEnglish}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Story dots in this season */}
                    <div className="p-2 space-y-1.5">
                      {stories.length === 0 ? (
                        <div className="text-center py-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/[0.06] mx-auto" />
                        </div>
                      ) : (
                        stories.map((story) => (
                          <button
                            key={story.id}
                            onClick={() => onStoryClick(story.personId)}
                            className="w-full text-left px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]
                              hover:bg-white/[0.05] transition-all group"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className="w-2 h-2 rounded-full mt-0.5 shrink-0"
                                style={{ backgroundColor: getMoietyDotColor(story.personMoiety, moietyNames) }}
                              />
                              <div className="min-w-0">
                                <span className="text-[11px] text-white/50 group-hover:text-white/70 block truncate transition-colors">
                                  {story.title}
                                </span>
                                <span className="text-[10px] text-white/25 block truncate">
                                  {story.personName}
                                  {story.type !== 'text' && ` · ${story.type}`}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Unsure column */}
              {storiesBySeason['unsure']?.length > 0 && (
                <div className="flex-1 min-w-[140px] border-l border-white/[0.06]">
                  <div className="px-3 py-2 border-b border-white/[0.06] sticky top-0 bg-white/[0.02]">
                    <span className="text-xs text-white/30 italic">Unsure</span>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {storiesBySeason['unsure'].map((story) => (
                      <button
                        key={story.id}
                        onClick={() => onStoryClick(story.personId)}
                        className="w-full text-left px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]
                          hover:bg-white/[0.05] transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className="w-2 h-2 rounded-full mt-0.5 shrink-0"
                            style={{ backgroundColor: getMoietyDotColor(story.personMoiety, moietyNames) }}
                          />
                          <div className="min-w-0">
                            <span className="text-[11px] text-white/50 group-hover:text-white/70 block truncate transition-colors">
                              {story.title}
                            </span>
                            <span className="text-[10px] text-white/25 block truncate">
                              {story.personName}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
