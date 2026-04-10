'use client';

import { useState } from 'react';
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
  onAddStoryForPerson: (personId: string) => void;
}

export function StoriesRiverPanel({ stories, onClose, onPersonClick, onAddStoryForPerson }: StoriesRiverPanelProps) {
  const { state } = useApp();
  const [showPersonPicker, setShowPersonPicker] = useState(false);

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

  function handleAddStory(personId: string) {
    setShowPersonPicker(false);
    onAddStoryForPerson(personId);
  }

  return (
    <div className="absolute top-0 right-0 h-full w-[22rem] z-30 animate-slide-right select-auto">
      <div className="h-full bg-[var(--panel-bg)] border-l border-[var(--panel-border)] backdrop-blur-xl panel-scroll">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-white/75 tracking-wide">
              River of Stories
            </h2>
            <div className="flex items-center gap-2">
              {/* Add story button */}
              <button
                onClick={() => setShowPersonPicker((s) => !s)}
                className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center
                  ${showPersonPicker
                    ? 'bg-white/[0.12] border-white/[0.18] text-white/80'
                    : 'bg-white/[0.05] border-white/[0.08] text-white/40 hover:bg-white/[0.09] hover:text-white/70'}`}
                aria-label="Add story"
                title="Add a new story"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Person picker for adding a story */}
          {showPersonPicker && (
            <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-white/30 px-3 pt-2.5 pb-1.5 tracking-wide uppercase">
                Add story for
              </p>
              {state.persons.length === 0 ? (
                <p className="text-[11px] text-white/20 italic px-3 pb-3">
                  No people in your constellation yet.
                </p>
              ) : (
                <div>
                  {state.persons.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleAddStory(person.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/[0.05]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/25 shrink-0" />
                      <span className="text-sm text-white/60">{person.displayName}</span>
                      {person.indigenousName && (
                        <span className="text-[10px] text-white/25 ml-auto">{person.indigenousName}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
                      <span className="block text-sm text-white/65 truncate">
                        {story.title}
                      </span>
                      <span className="block text-xs text-white/30 mt-0.5">
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
