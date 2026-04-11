'use client';

import { getStarOpacity, hasStoriesInSeason } from '@/lib/utils/season';
import { getSeasonById } from '@/lib/utils/season';
import type { Person, SeasonalCalendar, Story, MediaEntry } from '@/lib/types';
import type { AttributeClickInfo } from './PlanetInfoPopup';

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
  boosted?: boolean;
  activeSeasonIds?: string[];
  linked?: boolean;
  /** Tutorial step 1: shine/pulse the main sun circle */
  tutorialSpotlit?: boolean;
  /** Tutorial step 3: glow the inner-orbit attribute planets */
  tutorialHighlightPlanets?: boolean;
  /** Tutorial step 0: gentle pulse ring on all stars */
  tutorialAllPulse?: boolean;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onSunClick: () => void;
  onStoryClick: (story: Story) => void;
  onPlanetClick: (action: 'identity' | 'stories' | 'media') => void;
  onAttributeClick?: (info: AttributeClickInfo) => void;
  onMediaEntryClick: (entry: MediaEntry) => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

function getMediaEntryColor(entry: MediaEntry, sc: SeasonalCalendar | null): { color: string; hasRing: boolean } {
  if (entry.type === 'article') return { color: '#8898C8', hasRing: true };
  if (entry.type === 'video')   return { color: '#C89848', hasRing: true };
  const tag = (entry as { seasonTag: string }).seasonTag;
  if (tag && tag !== 'unsure' && sc) {
    const season = getSeasonById(sc, tag);
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

// Wider spacing between rings to prevent overlap
const ORBITS = {
  inner:  { radius: 40,  planetRadius: 4.5 },
  middle: { radius: 62,  planetRadius: 5   },
  outer:  { radius: 84,  planetRadius: 5.5 },
  far:    { radius: 108, planetRadius: 6   },
} as const;

// Label sits this many px past the planet edge, along the radial direction
const LABEL_OFFSET = 13;

function planetPos(cx: number, cy: number, r: number, angle: number) {
  return { px: cx + r * Math.cos(angle), py: cy + r * Math.sin(angle) };
}

// Place label radially outward from the star so it never points inward or collides with siblings.
// Returns position + the correct SVG text-anchor for that direction.
function radialLabel(
  cx: number, cy: number,
  px: number, py: number,
  extraDist: number,
): { lx: number; ly: number; anchor: 'start' | 'middle' | 'end' } {
  const dx = px - cx, dy = py - cy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const lx = px + (dx / len) * extraDist;
  const ly = py + (dy / len) * extraDist;
  const anchor: 'start' | 'middle' | 'end' =
    dx > 8 ? 'start' : dx < -8 ? 'end' : 'middle';
  return { lx, ly, anchor };
}

function OrbitRing({ cx, cy, r, active, color = 'rgba(160,210,255,1)' }: {
  cx: number; cy: number; r: number; active: boolean; color?: string;
}) {
  const base = active ? 0.28 : 0.09;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}  opacity={base * 0.25} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={0.8}
        strokeDasharray={active ? 'none' : '4 8'} opacity={base} />
    </g>
  );
}

function MediaPlanet({ px, py, r, color, hasRing, spinDur = '12s' }: {
  px: number; py: number; r: number; color: string; hasRing: boolean; spinDur?: string;
}) {
  return (
    <g>
      <circle cx={px} cy={py} r={r + 4} fill={color} opacity={0.10} />
      <circle cx={px} cy={py} r={r + 2} fill={color} opacity={0.18} />
      <circle cx={px} cy={py} r={r}     fill={color} opacity={0.90} />
      <g>
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur={spinDur} repeatCount="indefinite" />
        <circle cx={px - r * 0.28} cy={py - r * 0.28} r={r * 0.32} fill="white" opacity={0.50} />
      </g>
      {hasRing && (
        <>
          <ellipse cx={px} cy={py} rx={r * 1.9}  ry={r * 0.42} fill="none" stroke={color} strokeWidth={1.0} opacity={0.45} />
          <ellipse cx={px} cy={py} rx={r * 1.55} ry={r * 0.33} fill="none" stroke={color} strokeWidth={0.7} opacity={0.30} />
        </>
      )}
    </g>
  );
}

function Planet({ px, py, r, color, glow = true, spinDur = '9s' }: {
  px: number; py: number; r: number; color: string; glow?: boolean; spinDur?: string;
}) {
  return (
    <g>
      {glow && <circle cx={px} cy={py} r={r + 4} fill={color} opacity={0.12} />}
      {glow && <circle cx={px} cy={py} r={r + 2} fill={color} opacity={0.20} />}
      <circle cx={px} cy={py} r={r} fill={color} opacity={0.92} />
      <g>
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur={spinDur} repeatCount="indefinite" />
        <circle cx={px - r * 0.28} cy={py - r * 0.28} r={r * 0.32} fill="white" opacity={0.55} />
      </g>
    </g>
  );
}

export function SolarSystemNode({
  person, x, y, isSelf, isGuest, currentSeasonId, moietyNames,
  seasonalCalendar, connectionCount, zoom, dimmed = false, boosted = false,
  activeSeasonIds, linked = false,
  tutorialSpotlit = false, tutorialHighlightPlanets = false, tutorialAllPulse = false,
  onHoverIn, onHoverOut,
  onSunClick, onStoryClick, onPlanetClick, onAttributeClick, onMediaEntryClick, onDragStart,
}: SolarSystemNodeProps) {
  const storyCount  = person.stories.length;
  const baseRadius  = isSelf
    ? Math.max(14 + storyCount * 1.2 + connectionCount * 1.5, 18)
    : Math.min(9  + storyCount * 1.2 + connectionCount * 1.5, 20);

  const opacity            = getStarOpacity(storyCount, person.lastUpdated);
  const isSeasonRelevant   = hasStoriesInSeason(person.stories, currentSeasonId);
  void isSeasonRelevant;
  const starColor          = getMoietyColor(person.moiety, moietyNames);
  const connectionBright   = Math.min(1, 0.7 + connectionCount * 0.08);
  const guestDim           = isGuest ? 0.55 : 1;
  const baseOpacity        = Math.min(opacity * connectionBright * guestDim, 1);
  const finalOpacity       = dimmed ? 0.08 : boosted ? Math.min(baseOpacity * 1.6 + 0.2, 1) : baseOpacity;

  const hasSkinName = !!person.skinName;
  const hasMedia    = person.stories.some((s) => s.type === 'photo' || s.type === 'audio' || s.type === 'video');

  const identityAttrs = [
    person.nation               ? { label: person.nation,               color: '#D4A454', type: 'nation'    as const } : null,
    person.countryLanguageGroup ? { label: person.countryLanguageGroup, color: '#7ECFA4', type: 'language'  as const } : null,
    person.community            ? { label: person.community,            color: '#7AB8D0', type: 'community' as const } : null,
  ].filter((a): a is { label: string; color: string; type: 'nation' | 'language' | 'community' } => a !== null);

  const showLabels  = zoom >= 1.2;
  const sunColor    = isSelf ? '#D4A454' : starColor;
  const innerColor  = hasSkinName ? '#E8C060' : 'rgba(255,255,255,0.15)';
  const middleColor = 'rgba(140,210,255,0.5)';

  function getStoryColor(tag: string) {
    if (!seasonalCalendar) return '#AADDFF';
    return getSeasonById(seasonalCalendar, tag)?.colorPalette.accentColor ?? '#AADDFF';
  }

  const storyAngles = Array.from(
    { length: storyCount },
    (_, i) => -Math.PI / 2 + (2 * Math.PI * i) / storyCount,
  );

  const isSeasonFiltered  = !!(activeSeasonIds && activeSeasonIds.length > 0);
  const hasMatchingSeason = isSeasonFiltered && person.stories.some((s) => activeSeasonIds!.includes(s.seasonTag));
  const bodyOpacity       = isSeasonFiltered
    ? finalOpacity * (hasMatchingSeason ? 0.10 : 0.05)
    : finalOpacity;

  // Name label sits just below the outermost orbit ring
  const nameLabelY = y + ORBITS.far.radius + 20;

  return (
    <>
    {/* ── Tutorial step 0: gentle pulse ring on all stars ── */}
    {tutorialAllPulse && (
      <circle cx={x} cy={y} r={baseRadius + 10} fill="none" stroke={sunColor} strokeWidth={1.5} opacity={0}>
        <animate attributeName="opacity" values="0;0.38;0" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values={`${baseRadius+10};${baseRadius+22};${baseRadius+10}`} dur="2s" repeatCount="indefinite" />
      </circle>
    )}

    {/* ── Tutorial step 1: spotlight Aunty June — shine, enlarge, revert ── */}
    {tutorialSpotlit && (
      <>
        {/* Outer expanding halo */}
        <circle cx={x} cy={y} r={baseRadius + 40} fill={sunColor} opacity={0}>
          <animate attributeName="opacity" values="0;0.22;0" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="r" values={`${baseRadius+40};${baseRadius+62};${baseRadius+40}`} dur="1.5s" repeatCount="indefinite" />
        </circle>
        {/* Inner glow ring */}
        <circle cx={x} cy={y} r={baseRadius + 18} fill="none" stroke={sunColor} strokeWidth={3} opacity={0}>
          <animate attributeName="opacity" values="0;0.85;0" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="r" values={`${baseRadius+18};${baseRadius+32};${baseRadius+18}`} dur="1.5s" repeatCount="indefinite" />
        </circle>
        {/* Core brightness pulse */}
        <circle cx={x} cy={y} r={baseRadius} fill={sunColor} opacity={0}>
          <animate attributeName="opacity" values="0;0.4;0" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="r" values={`${baseRadius};${baseRadius*1.45};${baseRadius}`} dur="1.5s" repeatCount="indefinite" />
        </circle>
      </>
    )}

    {/* ── Tutorial step 3: highlight inner-orbit attribute planets ── */}
    {tutorialHighlightPlanets && identityAttrs.map((attr, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / identityAttrs.length;
      const { px, py } = planetPos(x, y, ORBITS.inner.radius, angle);
      return (
        <g key={`thl-${i}`}>
          <circle cx={px} cy={py} r={ORBITS.inner.planetRadius + 9} fill={attr.color} opacity={0}>
            <animate attributeName="opacity" values="0;0.4;0" dur="1.4s" repeatCount="indefinite" begin={`${i * 0.18}s`} />
          </circle>
          <circle cx={px} cy={py} r={ORBITS.inner.planetRadius + 5} fill={attr.color} opacity={0}>
            <animate attributeName="opacity" values="0;0.6;0" dur="1.4s" repeatCount="indefinite" begin={`${i * 0.18}s`} />
          </circle>
        </g>
      );
    })}

    <g opacity={bodyOpacity} className="transition-opacity duration-500">

      {/* Nebula atmosphere */}
      <circle cx={x} cy={y} r={ORBITS.far.radius + 45} fill={isSelf ? 'rgba(212,164,84,0.025)' : 'rgba(120,180,255,0.018)'} />
      <circle cx={x} cy={y} r={ORBITS.far.radius + 28} fill={isSelf ? 'rgba(212,164,84,0.04)'  : 'rgba(120,180,255,0.03)'} />

      {/* Moiety boost */}
      {boosted && (
        <>
          <circle cx={x} cy={y} r={ORBITS.far.radius + 60} fill={starColor} opacity={0.06} />
          <circle cx={x} cy={y} r={ORBITS.far.radius + 38} fill={starColor} opacity={0.10} />
          <circle cx={x} cy={y} r={baseRadius + 28} fill="none" stroke={starColor}
            strokeWidth={1.5} opacity={0.35} className="animate-star-pulse" />
        </>
      )}

      {/* Linked highlight */}
      {linked && !boosted && (
        <circle cx={x} cy={y} r={baseRadius + 20} fill="none" stroke={starColor}
          strokeWidth={1} opacity={0.45} style={{ transition: 'opacity 0.2s ease' }} />
      )}

      {/* Self corona */}
      {isSelf && (
        <>
          <circle cx={x} cy={y} r={baseRadius + 36} fill="none" stroke="rgba(212,164,84,0.08)" strokeWidth={6} />
          <circle cx={x} cy={y} r={baseRadius + 22} fill="none" stroke="rgba(212,164,84,0.18)" strokeWidth={3} className="animate-star-pulse" />
          <circle cx={x} cy={y} r={baseRadius + 12} fill="none" stroke="rgba(212,164,84,0.45)" strokeWidth={1.5} className="animate-star-pulse" />
        </>
      )}

      {/* Orbit rings */}
      <OrbitRing cx={x} cy={y} r={ORBITS.inner.radius}  active={hasSkinName}    color={isSelf ? 'rgba(212,164,84,0.9)' : 'rgba(220,180,100,0.9)'} />
      <OrbitRing cx={x} cy={y} r={ORBITS.middle.radius} active={false}          color="rgba(140,210,255,0.9)" />
      <OrbitRing cx={x} cy={y} r={ORBITS.outer.radius}  active={storyCount > 0} color="rgba(160,220,255,0.9)" />
      <OrbitRing cx={x} cy={y} r={ORBITS.far.radius}    active={hasMedia}       color="rgba(180,140,255,0.9)" />

      {/* ── Inner orbit: identity attribute planets ── */}
      {identityAttrs.length > 0 ? (
        identityAttrs.map((attr, i) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / identityAttrs.length;
          const { px, py } = planetPos(x, y, ORBITS.inner.radius, angle);
          const { lx, ly, anchor } = radialLabel(x, y, px, py, ORBITS.inner.planetRadius + LABEL_OFFSET);
          return (
            <g key={i} className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onAttributeClick) {
                  onAttributeClick({ type: attr.type, value: attr.label, personName: person.displayName, personId: person.id, color: attr.color });
                } else {
                  onPlanetClick('identity');
                }
              }}>
              <circle cx={px} cy={py} r={16} fill="transparent" />
              <Planet px={px} py={py} r={ORBITS.inner.planetRadius} color={attr.color} glow spinDur="9s" />
              {showLabels && (
                <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
                  fill="rgba(255,255,255,0.90)" fontSize={9} fontWeight={500}>
                  {attr.label.length > 12 ? attr.label.slice(0, 11) + '…' : attr.label}
                </text>
              )}
            </g>
          );
        })
      ) : (
        <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onPlanetClick('identity'); }}>
          {(() => {
            const { px, py } = planetPos(x, y, ORBITS.inner.radius, -Math.PI / 5);
            return (
              <>
                <circle cx={px} cy={py} r={16} fill="transparent" />
                <Planet px={px} py={py} r={ORBITS.inner.planetRadius} color={innerColor} glow={hasSkinName} spinDur="10s" />
              </>
            );
          })()}
        </g>
      )}

      {/* ── Middle planet ── */}
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
          const col   = getStoryColor(story.seasonTag);
          const { lx, ly, anchor } = radialLabel(x, y, px, py, ORBITS.outer.planetRadius + LABEL_OFFSET);
          // Skip label if it would fall into the name-label zone below the star
          const labelClear = ly < nameLabelY - 6;
          return (
            <g key={story.id} className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onStoryClick(story); }}>
              <line x1={x} y1={y} x2={px} y2={py}
                stroke={col} strokeWidth={0.8} strokeDasharray="3 5" opacity={0.30} />
              <circle cx={px} cy={py} r={16} fill="transparent" />
              <Planet px={px} py={py} r={ORBITS.outer.planetRadius} color={col} />
              {showLabels && labelClear && (
                <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
                  fill="rgba(255,255,255,0.85)" fontSize={9} fontWeight={500}>
                  {story.title.length > 12 ? story.title.slice(0, 11) + '…' : story.title}
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

      {/* ── Far orbit: media planets ── */}
      {hasMedia ? (() => {
        const entries = person.mediaEntries ?? [];
        return entries.map((entry, i) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / entries.length;
          const { px, py } = planetPos(x, y, ORBITS.far.radius, angle);
          const { color, hasRing } = getMediaEntryColor(entry, seasonalCalendar);
          const { lx, ly, anchor } = radialLabel(x, y, px, py, ORBITS.far.planetRadius + LABEL_OFFSET);
          const labelClear = ly < nameLabelY - 6;
          const caption =
            entry.type === 'photo'
              ? (entry.caption?.length > 10 ? entry.caption.slice(0, 9) + '…' : entry.caption || 'photo')
              : (entry.title.length > 10 ? entry.title.slice(0, 9) + '…' : entry.title);
          return (
            <g key={entry.id} className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onMediaEntryClick(entry); }}>
              <circle cx={px} cy={py} r={18} fill="transparent" />
              <MediaPlanet px={px} py={py} r={ORBITS.far.planetRadius} color={color} hasRing={hasRing} />
              {showLabels && labelClear && (
                <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
                  fill="rgba(255,255,255,0.82)" fontSize={9} fontWeight={400}>
                  {caption}
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

      {/* ── Central sun ── */}
      <g className="cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onSunClick(); }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
        role="button" tabIndex={0}
        aria-label={person.displayName}
        onKeyDown={(e) => e.key === 'Enter' && onSunClick()}
      >
        <circle cx={x} cy={y} r={baseRadius + 18} fill={sunColor} opacity={0.04} />
        <circle cx={x} cy={y} r={baseRadius + 10} fill={sunColor} opacity={0.10} />
        <circle cx={x} cy={y} r={baseRadius + 5}  fill={sunColor} opacity={0.22} filter="url(#starGlow)" />
        <circle cx={x} cy={y} r={baseRadius}       fill={sunColor} opacity={0.95} />
        <circle cx={x} cy={y} r={baseRadius * 0.45} fill="white"  opacity={0.92} />
        <circle cx={x - baseRadius * 0.2} cy={y - baseRadius * 0.2} r={baseRadius * 0.18} fill="white" opacity={0.6} />
        {person.isDeceased && (
          <circle cx={x} cy={y} r={baseRadius + 8}
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} />
        )}
      </g>

      {/* ── Name label (always below far orbit, always upright) ── */}
      {isSelf ? (
        <>
          <text x={x} y={nameLabelY}
            textAnchor="middle" fill="rgba(212,164,84,0.97)"
            fontSize={14} fontWeight={600} letterSpacing="0.05em">
            {person.displayName}
          </text>
          <text x={x} y={nameLabelY + 14}
            textAnchor="middle" fill="rgba(212,164,84,0.60)"
            fontSize={9} fontWeight={400} letterSpacing="0.2em">
            YOUR STAR
          </text>
        </>
      ) : (
        <text x={x} y={nameLabelY}
          textAnchor="middle" fill="rgba(255,255,255,0.92)"
          fontSize={13} fontWeight={500}>
          {person.displayName}
        </text>
      )}

      {/* ── Connection count ── */}
      {showLabels && connectionCount > 0 && (
        <text x={x} y={nameLabelY + (isSelf ? 28 : 15)}
          textAnchor="middle" fill="rgba(255,255,255,0.52)"
          fontSize={9} fontWeight={400}>
          {connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}
        </text>
      )}
    </g>

    {/* ── Season highlight layer ── */}
    {isSeasonFiltered && storyAngles.map((angle, i) => {
      const story = person.stories[i];
      if (!activeSeasonIds!.includes(story.seasonTag)) return null;
      const { px, py } = planetPos(x, y, ORBITS.outer.radius, angle);
      const col = getStoryColor(story.seasonTag);
      const { lx, ly, anchor } = radialLabel(x, y, px, py, ORBITS.outer.planetRadius + LABEL_OFFSET);
      const labelClear = ly < nameLabelY - 6;
      return (
        <g key={`sh-${story.id}`} opacity={finalOpacity} className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onStoryClick(story); }}>
          <line x1={x} y1={y} x2={px} y2={py} stroke={col} strokeWidth={6}   strokeDasharray="3 5" opacity={0.16} />
          <line x1={x} y1={y} x2={px} y2={py} stroke={col} strokeWidth={1.4} strokeDasharray="3 5" opacity={0.82} />
          <circle cx={px} cy={py} r={ORBITS.outer.planetRadius + 7} fill={col} opacity={0.14} />
          <circle cx={px} cy={py} r={ORBITS.outer.planetRadius + 4} fill={col} opacity={0.28} />
          <Planet px={px} py={py} r={ORBITS.outer.planetRadius} color={col} />
          {showLabels && labelClear && (
            <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
              fill="rgba(255,255,255,0.92)" fontSize={9} fontWeight={600}>
              {story.title.length > 12 ? story.title.slice(0, 11) + '…' : story.title}
            </text>
          )}
        </g>
      );
    })}
    </>
  );
}
