'use client';

import { getStarOpacity, hasStoriesInSeason } from '@/lib/utils/season';
import { getSeasonById } from '@/lib/utils/season';
import type { Person, SeasonalCalendar, Story, MediaEntry } from '@/lib/types';

interface SolarSystemNodeProps {
  person: Person;
  x: number;
  y: number;
  isSelf?: boolean;
  isGuest?: boolean;
  currentSeasonId: string | null;
  moietyNames?: [string, string];
  seasonalCalendar: SeasonalCalendar | null;
  connectionCount: number;
  zoom: number;
  dimmed?: boolean;
  /** Active moiety selected and this person belongs to it — shine brighter than normal */
  boosted?: boolean;
  onSunClick: () => void;
  onStoryClick: (story: Story) => void;
  onPlanetClick: (action: 'identity' | 'stories' | 'media') => void;
  onMediaEntryClick: (entry: MediaEntry) => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

function getMediaEntryColor(entry: MediaEntry, seasonalCalendar: SeasonalCalendar | null): { color: string; hasRing: boolean } {
  if (entry.type === 'article') return { color: '#8898C8', hasRing: true };
  if (entry.type === 'video')   return { color: '#C89848', hasRing: true };
  // journal / photo — try season color
  const tag = (entry as { seasonTag: string }).seasonTag;
  if (tag && tag !== 'unsure' && seasonalCalendar) {
    const season = getSeasonById(seasonalCalendar, tag);
    if (season) return { color: season.colorPalette.accentColor, hasRing: false };
  }
  return { color: entry.type === 'photo' ? '#D4A454' : '#9890B8', hasRing: false };
}

function getMoietyColor(moiety: string | undefined, moietyNames?: [string, string]): string {
  if (!moiety || !moietyNames) return '#FFE8A0';
  if (moiety === moietyNames[0]) return '#DCA855';
  if (moiety === moietyNames[1]) return '#7AB0E0';
  return '#FFE8A0';
}

const ORBITS = {
  inner:  { radius: 32, planetRadius: 4  },
  middle: { radius: 52, planetRadius: 5  },
  outer:  { radius: 72, planetRadius: 5.5 },
  far:    { radius: 92, planetRadius: 6  },
} as const;

function planetPos(cx: number, cy: number, r: number, angle: number) {
  return { px: cx + r * Math.cos(angle), py: cy + r * Math.sin(angle) };
}

// Luminous orbit ring — inspired by nicegrpahic.jpg
function OrbitRing({ cx, cy, r, active, color = 'rgba(160,210,255,1)' }: {
  cx: number; cy: number; r: number; active: boolean; color?: string;
}) {
  const baseOpacity = active ? 0.28 : 0.09;
  return (
    <g>
      {/* Soft glow behind the ring */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={4} opacity={baseOpacity * 0.25} />
      {/* Crisp ring line */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={0.8}
        strokeDasharray={active ? 'none' : '4 8'}
        opacity={baseOpacity} />
    </g>
  );
}

// Media entry planet — optional thin ring for articles/videos
function MediaPlanet({ px, py, r, color, hasRing }: {
  px: number; py: number; r: number; color: string; hasRing: boolean;
}) {
  return (
    <g>
      <circle cx={px} cy={py} r={r + 4} fill={color} opacity={0.10} />
      <circle cx={px} cy={py} r={r + 2} fill={color} opacity={0.18} />
      <circle cx={px} cy={py} r={r} fill={color} opacity={0.90} />
      <circle cx={px - r * 0.28} cy={py - r * 0.28} r={r * 0.32} fill="white" opacity={0.50} />
      {hasRing && (
        <>
          <ellipse cx={px} cy={py} rx={r * 1.9} ry={r * 0.42}
            fill="none" stroke={color} strokeWidth={1.0} opacity={0.45} />
          <ellipse cx={px} cy={py} rx={r * 1.55} ry={r * 0.33}
            fill="none" stroke={color} strokeWidth={0.7} opacity={0.30} />
        </>
      )}
    </g>
  );
}

// Glowing planet dot
function Planet({ px, py, r, color, glow = true }: {
  px: number; py: number; r: number; color: string; glow?: boolean;
}) {
  return (
    <g>
      {glow && <circle cx={px} cy={py} r={r + 4} fill={color} opacity={0.12} />}
      {glow && <circle cx={px} cy={py} r={r + 2} fill={color} opacity={0.20} />}
      <circle cx={px} cy={py} r={r} fill={color} opacity={0.92} />
      {/* Bright specular highlight */}
      <circle cx={px - r * 0.28} cy={py - r * 0.28} r={r * 0.32} fill="white" opacity={0.55} />
    </g>
  );
}

export function SolarSystemNode({
  person,
  x,
  y,
  isSelf,
  isGuest,
  currentSeasonId,
  moietyNames,
  seasonalCalendar,
  connectionCount,
  zoom,
  dimmed = false,
  boosted = false,
  onSunClick,
  onStoryClick,
  onPlanetClick,
  onMediaEntryClick,
  onDragStart,
}: SolarSystemNodeProps) {
  const storyCount = person.stories.length;
  const baseRadius = isSelf
    ? Math.max(14 + storyCount * 1.2 + connectionCount * 1.5, 18)
    : Math.min(9 + storyCount * 1.2 + connectionCount * 1.5, 20);

  const opacity = getStarOpacity(storyCount, person.lastUpdated);
  const isSeasonRelevant = hasStoriesInSeason(person.stories, currentSeasonId);
  const starColor = getMoietyColor(person.moiety, moietyNames);
  const connectionBrightness = Math.min(1, 0.7 + connectionCount * 0.08);
  const guestDim = isGuest ? 0.55 : 1;
  const baseOpacity = Math.min((isSeasonRelevant ? opacity * 1.4 : opacity) * connectionBrightness * guestDim, 1);
  const finalOpacity = dimmed ? 0.08 : boosted ? Math.min(baseOpacity * 1.6 + 0.2, 1) : baseOpacity;

  const hasSkinName  = !!person.skinName;
  const hasMedia     = person.stories.some((s) => s.type === 'photo' || s.type === 'audio' || s.type === 'video');
  const showLabels   = zoom >= 1.2;

  const selfColor  = '#D4A454';
  const sunColor   = isSelf ? selfColor : starColor;

  function getStoryColor(tag: string) {
    if (!seasonalCalendar) return '#AADDFF';
    const s = getSeasonById(seasonalCalendar, tag);
    return s?.colorPalette.accentColor ?? '#AADDFF';
  }

  const storyAngles = Array.from(
    { length: storyCount },
    (_, i) => -Math.PI / 2 + (2 * Math.PI * i) / storyCount,
  );

  // Planet colors — warm solar system palette
  const innerColor  = hasSkinName ? '#E8C060' : 'rgba(255,255,255,0.15)';
  const middleColor = 'rgba(140,210,255,0.5)';
  const outerColor  = storyCount > 0 ? '#AADDFF' : 'rgba(255,255,255,0.1)';
  const farColor    = hasMedia     ? '#C8A0F0' : 'rgba(255,255,255,0.08)';

  return (
    <g opacity={finalOpacity} className="transition-opacity duration-500">

      {/* ── Nebula atmosphere — soft glow cloud around whole system ── */}
      <circle cx={x} cy={y} r={ORBITS.far.radius + 45}
        fill={isSelf ? 'rgba(212,164,84,0.025)' : 'rgba(120,180,255,0.018)'} />
      <circle cx={x} cy={y} r={ORBITS.far.radius + 28}
        fill={isSelf ? 'rgba(212,164,84,0.04)' : 'rgba(120,180,255,0.03)'} />

      {/* ── Moiety boost glow — extra halos when this moiety is selected ── */}
      {boosted && (
        <>
          <circle cx={x} cy={y} r={ORBITS.far.radius + 60}
            fill={starColor} opacity={0.06} />
          <circle cx={x} cy={y} r={ORBITS.far.radius + 38}
            fill={starColor} opacity={0.10} />
          <circle cx={x} cy={y} r={baseRadius + 28} fill="none"
            stroke={starColor} strokeWidth={1.5} opacity={0.35}
            className="animate-star-pulse" />
        </>
      )}

      {/* ── Self extra corona ── */}
      {isSelf && (
        <>
          <circle cx={x} cy={y} r={baseRadius + 36} fill="none"
            stroke="rgba(212,164,84,0.08)" strokeWidth={6} />
          <circle cx={x} cy={y} r={baseRadius + 22} fill="none"
            stroke="rgba(212,164,84,0.18)" strokeWidth={3} className="animate-star-pulse" />
          <circle cx={x} cy={y} r={baseRadius + 12} fill="none"
            stroke="rgba(212,164,84,0.45)" strokeWidth={1.5} className="animate-star-pulse" />
        </>
      )}

      {/* ── Orbit rings (bird's-eye, luminous) ── */}
      <OrbitRing cx={x} cy={y} r={ORBITS.inner.radius}  active={hasSkinName}    color={isSelf ? 'rgba(212,164,84,0.9)' : 'rgba(220,180,100,0.9)'} />
      <OrbitRing cx={x} cy={y} r={ORBITS.middle.radius} active={false}          color="rgba(140,210,255,0.9)" />
      <OrbitRing cx={x} cy={y} r={ORBITS.outer.radius}  active={storyCount > 0} color="rgba(160,220,255,0.9)" />
      <OrbitRing cx={x} cy={y} r={ORBITS.far.radius}    active={hasMedia}       color="rgba(180,140,255,0.9)" />

      {/* ── Inner planet (skin name / identity) ── */}
      <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPlanetClick('identity'); }}>
        {(() => {
          const { px, py } = planetPos(x, y, ORBITS.inner.radius, -Math.PI / 5);
          return (
            <>
              <circle cx={px} cy={py} r={18} fill="transparent" />
              <Planet px={px} py={py} r={ORBITS.inner.planetRadius} color={innerColor} glow={hasSkinName} />
              {hasSkinName && showLabels && (
                <text x={px} y={py - 10} textAnchor="middle"
                  fill="rgba(255,220,120,0.8)" fontSize={8} fontWeight={400}>
                  {person.skinName}
                </text>
              )}
            </>
          );
        })()}
      </g>

      {/* ── Middle planet (identity details) ── */}
      <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPlanetClick('identity'); }}>
        {(() => {
          const { px, py } = planetPos(x, y, ORBITS.middle.radius, Math.PI / 3);
          return (
            <>
              <circle cx={px} cy={py} r={18} fill="transparent" />
              <Planet px={px} py={py} r={ORBITS.middle.planetRadius} color={middleColor} glow={false} />
            </>
          );
        })()}
      </g>

      {/* ── Outer orbit: story planets ── */}
      {storyCount > 0 ? (
        storyAngles.map((angle, i) => {
          const { px, py } = planetPos(x, y, ORBITS.outer.radius, angle);
          const story = person.stories[i];
          const col = getStoryColor(story.seasonTag);
          return (
            <g key={story.id} className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onStoryClick(story); }}>
              <circle cx={px} cy={py} r={16} fill="transparent" />
              <Planet px={px} py={py} r={ORBITS.outer.planetRadius} color={col} />
              {showLabels && (
                <text x={px} y={py - 11} textAnchor="middle"
                  fill="rgba(255,255,255,0.6)" fontSize={7.5} fontWeight={400}>
                  {story.title.length > 10 ? story.title.slice(0, 9) + '…' : story.title}
                </text>
              )}
            </g>
          );
        })
      ) : (
        <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPlanetClick('stories'); }}>
          {(() => {
            const { px, py } = planetPos(x, y, ORBITS.outer.radius, -Math.PI / 2);
            return (
              <>
                <circle cx={px} cy={py} r={16} fill="transparent" />
                <circle cx={px} cy={py} r={ORBITS.outer.planetRadius}
                  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} strokeDasharray="2 4" />
              </>
            );
          })()}
        </g>
      )}

      {/* ── Far orbit: individual media entry planets ── */}
      {hasMedia ? (() => {
        const entries = person.mediaEntries ?? [];
        const count = entries.length;
        return entries.map((entry, i) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
          const { px, py } = planetPos(x, y, ORBITS.far.radius, angle);
          const { color, hasRing } = getMediaEntryColor(entry, seasonalCalendar);
          return (
            <g key={entry.id} className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onMediaEntryClick(entry); }}>
              <circle cx={px} cy={py} r={18} fill="transparent" />
              <MediaPlanet px={px} py={py} r={ORBITS.far.planetRadius} color={color} hasRing={hasRing} />
              {showLabels && (
                <text x={px} y={py - 12} textAnchor="middle"
                  fill="rgba(255,255,255,0.55)" fontSize={7} fontWeight={400}>
                  {entry.type === 'photo'
                    ? (entry.caption?.length > 8 ? entry.caption.slice(0, 7) + '…' : entry.caption || 'photo')
                    : (entry.title.length > 8 ? entry.title.slice(0, 7) + '…' : entry.title)}
                </text>
              )}
            </g>
          );
        });
      })() : (
        <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPlanetClick('media'); }}>
          {(() => {
            const { px, py } = planetPos(x, y, ORBITS.far.radius, Math.PI / 5);
            return (
              <>
                <circle cx={px} cy={py} r={18} fill="transparent" />
                <circle cx={px} cy={py} r={ORBITS.far.planetRadius}
                  fill="none" stroke="rgba(180,140,255,0.20)" strokeWidth={0.8} strokeDasharray="2 4" />
              </>
            );
          })()}
        </g>
      )}

      {/* ── Central sun — layered glow like goodgraphic.jpg ── */}
      <g
        className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onSunClick(); }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        role="button"
        tabIndex={0}
        aria-label={`${person.displayName}`}
        onKeyDown={(e) => e.key === 'Enter' && onSunClick()}
      >
        {/* Corona layers */}
        <circle cx={x} cy={y} r={baseRadius + 18} fill={sunColor} opacity={0.04} />
        <circle cx={x} cy={y} r={baseRadius + 10} fill={sunColor} opacity={0.10} />
        <circle cx={x} cy={y} r={baseRadius + 5}  fill={sunColor} opacity={0.22} filter="url(#starGlow)" />
        {/* Main body */}
        <circle cx={x} cy={y} r={baseRadius} fill={sunColor} opacity={0.95} />
        {/* Bright white core */}
        <circle cx={x} cy={y} r={baseRadius * 0.45} fill="white" opacity={0.92} />
        {/* Tiny specular peak */}
        <circle cx={x - baseRadius * 0.2} cy={y - baseRadius * 0.2}
          r={baseRadius * 0.18} fill="white" opacity={0.6} />
        {/* Deceased ring */}
        {person.isDeceased && (
          <circle cx={x} cy={y} r={baseRadius + 8}
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
        )}
      </g>

      {/* ── Season pulse ── */}
      {isSeasonRelevant && !dimmed && (
        <circle cx={x} cy={y} r={baseRadius + 9}
          fill="none" stroke={sunColor} strokeWidth={1}
          opacity={0.5} className="animate-star-pulse" />
      )}

      {/* ── Name labels ── */}
      {isSelf ? (
        <>
          <text x={x} y={y + ORBITS.far.radius + 16}
            textAnchor="middle" fill="rgba(212,164,84,0.95)"
            fontSize={13} fontWeight={500} letterSpacing="0.06em">
            {person.displayName}
          </text>
          <text x={x} y={y + ORBITS.far.radius + 29}
            textAnchor="middle" fill="rgba(212,164,84,0.35)"
            fontSize={8.5} fontWeight={300} letterSpacing="0.2em">
            YOUR STAR
          </text>
        </>
      ) : (
        <text x={x} y={y + ORBITS.far.radius + 18}
          textAnchor="middle" fill="rgba(255,255,255,0.75)"
          fontSize={11} fontWeight={300}>
          {person.displayName}
        </text>
      )}

      {/* ── Connection count ── */}
      {showLabels && connectionCount > 0 && (
        <text x={x} y={y + ORBITS.far.radius + (isSelf ? 44 : 32)}
          textAnchor="middle" fill="rgba(255,255,255,0.3)"
          fontSize={8} fontWeight={300}>
          {connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}
        </text>
      )}
    </g>
  );
}
