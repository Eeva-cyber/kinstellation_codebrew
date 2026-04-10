'use client';

import { getStarOpacity, hasStoriesInSeason } from '@/lib/utils/season';
import { getSeasonById } from '@/lib/utils/season';
import type { Person, SeasonalCalendar } from '@/lib/types';

interface SolarSystemNodeProps {
  person: Person;
  x: number;
  y: number;
  currentSeasonId: string | null;
  moietyNames?: [string, string];
  seasonalCalendar: SeasonalCalendar | null;
  connectionCount: number;
  zoom: number;
  dimmed?: boolean;
  onSunClick: () => void;
  onPlanetClick: (action: 'identity' | 'stories' | 'media') => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

function getMoietyColor(moiety: string | undefined, moietyNames?: [string, string]): string {
  if (!moiety || !moietyNames) return 'rgba(255, 248, 230, 0.95)';
  if (moiety === moietyNames[0]) return 'rgba(220, 180, 100, 1)';
  if (moiety === moietyNames[1]) return 'rgba(140, 170, 220, 1)';
  return 'rgba(255, 248, 230, 0.95)';
}

// Orbit configuration — larger overall
const ORBITS = {
  skinName: { radius: 35, planetRadius: 5, defaultColor: 'rgba(220, 180, 100, 0.85)', dimColor: 'rgba(255,255,255,0.18)' },
  dob: { radius: 55, planetRadius: 5, defaultColor: 'rgba(100, 210, 210, 0.85)', dimColor: 'rgba(255,255,255,0.18)' },
  stories: { radius: 75, planetRadius: 6, defaultColor: 'rgba(255,255,255,0.6)' },
  media: { radius: 95, planetRadius: 7, defaultColor: 'rgba(190, 140, 230, 0.85)', dimColor: 'rgba(255,255,255,0.18)' },
} as const;

function planetPosition(cx: number, cy: number, orbitRadius: number, angle: number) {
  return {
    px: cx + orbitRadius * Math.cos(angle),
    py: cy + orbitRadius * Math.sin(angle),
  };
}

export function SolarSystemNode({
  person,
  x,
  y,
  currentSeasonId,
  moietyNames,
  seasonalCalendar,
  connectionCount,
  zoom,
  dimmed = false,
  onSunClick,
  onPlanetClick,
  onDragStart,
}: SolarSystemNodeProps) {
  const storyCount = person.stories.length;

  // Sun radius: bigger base, grows with stories AND connections
  const baseRadius = Math.min(8 + storyCount * 1.5 + connectionCount * 2, 22);

  const opacity = getStarOpacity(storyCount, person.lastUpdated);
  const isSeasonRelevant = hasStoriesInSeason(person.stories, currentSeasonId);
  const starColor = getMoietyColor(person.moiety, moietyNames);

  // Brighter with more connections
  const connectionBrightness = Math.min(1, 0.7 + connectionCount * 0.08);
  const finalOpacity = dimmed ? 0.15 : Math.min(
    (isSeasonRelevant ? opacity * 1.4 : opacity) * connectionBrightness,
    1,
  );

  const hasSkinName = !!person.skinName;
  const hasMedia = person.stories.some((s) => s.type === 'photo' || s.type === 'audio' || s.type === 'video');
  const mediaCount = person.stories.filter((s) => s.type === 'photo' || s.type === 'audio' || s.type === 'video').length;

  // Show detailed labels when zoomed in enough
  const showLabels = zoom >= 1.3;

  function getStoryColor(seasonTag: string): string {
    if (!seasonalCalendar) return ORBITS.stories.defaultColor;
    const season = getSeasonById(seasonalCalendar, seasonTag);
    return season?.colorPalette.accentColor ?? ORBITS.stories.defaultColor;
  }

  function storyPlanetAngles(count: number): number[] {
    if (count === 0) return [];
    const offset = -Math.PI / 2;
    return Array.from({ length: count }, (_, i) => offset + (2 * Math.PI * i) / count);
  }

  const storyAngles = storyPlanetAngles(storyCount);

  return (
    <g
      opacity={finalOpacity}
      className="transition-opacity duration-300"
    >
      {/* Orbit rings */}
      <OrbitRing cx={x} cy={y} r={ORBITS.skinName.radius} active={hasSkinName} />
      <OrbitRing cx={x} cy={y} r={ORBITS.dob.radius} active={false} />
      <OrbitRing cx={x} cy={y} r={ORBITS.stories.radius} active={storyCount > 0} />
      {(hasMedia || storyCount === 0) && (
        <OrbitRing cx={x} cy={y} r={ORBITS.media.radius} active={hasMedia} />
      )}

      {/* Skin name planet — inner orbit */}
      <g
        className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onPlanetClick('identity'); }}
      >
        {(() => {
          const { px, py } = planetPosition(x, y, ORBITS.skinName.radius, -Math.PI / 4);
          return (
            <>
              <circle
                cx={px} cy={py}
                r={ORBITS.skinName.planetRadius}
                fill={hasSkinName ? ORBITS.skinName.defaultColor : ORBITS.skinName.dimColor}
              />
              {hasSkinName && showLabels && (
                <text
                  x={px} y={py - 9}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.75)"
                  fontSize={9}
                  fontWeight={400}
                >
                  {person.skinName}
                </text>
              )}
              {!hasSkinName && showLabels && (
                <text
                  x={px} y={py - 9}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize={8}
                  fontWeight={300}
                >
                  skin
                </text>
              )}
            </>
          );
        })()}
      </g>

      {/* DOB planet — second orbit */}
      <g
        className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onPlanetClick('identity'); }}
      >
        {(() => {
          const { px, py } = planetPosition(x, y, ORBITS.dob.radius, Math.PI / 3);
          return (
            <>
              <circle
                cx={px} cy={py}
                r={ORBITS.dob.planetRadius}
                fill={ORBITS.dob.dimColor}
              />
              {showLabels && (
                <text
                  x={px} y={py - 9}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize={8}
                  fontWeight={300}
                >
                  birth
                </text>
              )}
            </>
          );
        })()}
      </g>

      {/* Story planets — third orbit */}
      {storyCount > 0 ? (
        storyAngles.map((angle, i) => {
          const { px, py } = planetPosition(x, y, ORBITS.stories.radius, angle);
          const story = person.stories[i];
          return (
            <g
              key={story.id}
              className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onPlanetClick('stories'); }}
            >
              <circle
                cx={px} cy={py}
                r={ORBITS.stories.planetRadius}
                fill={getStoryColor(story.seasonTag)}
                opacity={0.9}
              />
              {/* Glow */}
              <circle
                cx={px} cy={py}
                r={ORBITS.stories.planetRadius + 3}
                fill={getStoryColor(story.seasonTag)}
                opacity={0.15}
              />
              {showLabels && (
                <text
                  x={px} y={py - 10}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.65)"
                  fontSize={8}
                  fontWeight={400}
                >
                  {story.title.length > 12 ? story.title.slice(0, 11) + '...' : story.title}
                </text>
              )}
            </g>
          );
        })
      ) : (
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onPlanetClick('stories'); }}
        >
          {(() => {
            const { px, py } = planetPosition(x, y, ORBITS.stories.radius, -Math.PI / 2);
            return (
              <>
                <circle
                  cx={px} cy={py}
                  r={ORBITS.stories.planetRadius}
                  fill="rgba(255,255,255,0.1)"
                  strokeDasharray="2 3"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={0.8}
                />
                {showLabels && (
                  <text
                    x={px} y={py - 10}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.25)"
                    fontSize={8}
                    fontWeight={300}
                  >
                    stories
                  </text>
                )}
              </>
            );
          })()}
        </g>
      )}

      {/* Media planet — outermost orbit */}
      {(hasMedia || storyCount === 0) && (
        <g
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onPlanetClick('media'); }}
        >
          {(() => {
            const { px, py } = planetPosition(x, y, ORBITS.media.radius, Math.PI / 6);
            return (
              <>
                <circle
                  cx={px} cy={py}
                  r={ORBITS.media.planetRadius}
                  fill={hasMedia ? ORBITS.media.defaultColor : ORBITS.media.dimColor}
                />
                {hasMedia && mediaCount > 1 && (
                  <text
                    x={px} y={py + 3}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.8)"
                    fontSize={8}
                    fontWeight={600}
                  >
                    {mediaCount}
                  </text>
                )}
                {showLabels && (
                  <text
                    x={px} y={py - 11}
                    textAnchor="middle"
                    fill={hasMedia ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)'}
                    fontSize={8}
                    fontWeight={300}
                  >
                    media
                  </text>
                )}
              </>
            );
          })()}
        </g>
      )}

      {/* Sun — central star (draggable, main click target) */}
      <g
        className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onSunClick(); }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        role="button"
        tabIndex={0}
        aria-label={`${person.displayName} — ${storyCount} ${storyCount === 1 ? 'story' : 'stories'}, ${connectionCount} ${connectionCount === 1 ? 'connection' : 'connections'}`}
        onKeyDown={(e) => e.key === 'Enter' && onSunClick()}
      >
        {/* Sun glow halo */}
        <circle
          cx={x} cy={y}
          r={baseRadius + 5}
          fill={starColor}
          opacity={0.2}
          filter="url(#starGlow)"
        />
        {/* Main sun */}
        <circle
          cx={x} cy={y}
          r={baseRadius}
          fill={starColor}
        />
        {/* Inner bright core */}
        <circle
          cx={x} cy={y}
          r={baseRadius * 0.4}
          fill="white"
          opacity={0.85}
        />
        {/* Deceased indicator ring */}
        {person.isDeceased && (
          <circle
            cx={x} cy={y}
            r={baseRadius + 7}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.8}
          />
        )}
      </g>

      {/* Season relevance pulse on sun */}
      {isSeasonRelevant && !dimmed && (
        <circle
          cx={x} cy={y}
          r={baseRadius + 8}
          fill="none"
          stroke={starColor}
          strokeWidth={0.8}
          opacity={0.4}
          className="animate-star-pulse"
        />
      )}

      {/* Name label — always visible, brighter */}
      <text
        x={x}
        y={y + ORBITS.media.radius + 18}
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.85)"
        fontSize={12}
        fontWeight={400}
      >
        {person.displayName}
      </text>

      {/* Connection count badge (when zoomed in and has connections) */}
      {showLabels && connectionCount > 0 && (
        <text
          x={x}
          y={y + ORBITS.media.radius + 32}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.4)"
          fontSize={9}
          fontWeight={300}
        >
          {connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}
        </text>
      )}
    </g>
  );
}

function OrbitRing({ cx, cy, r, active }: { cx: number; cy: number; r: number; active: boolean }) {
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill="none"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth={0.6}
      strokeDasharray={active ? 'none' : '3 6'}
      opacity={active ? 0.25 : 0.08}
    />
  );
}
