'use client';

import { getStarRadius, getStarOpacity, hasStoriesInSeason } from '@/lib/utils/season';
import type { Person } from '@/lib/types';

interface StarNodeProps {
  person: Person;
  x: number;
  y: number;
  isSelf?: boolean;
  currentSeasonId: string | null;
  moietyNames?: [string, string];
  onClick: () => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

function getMoietyColor(moiety: string | undefined, moietyNames?: [string, string]): string {
  if (!moiety || !moietyNames) return 'rgba(255, 248, 230, 0.9)';
  if (moiety === moietyNames[0]) return 'rgba(212, 175, 100, 0.95)';
  if (moiety === moietyNames[1]) return 'rgba(130, 160, 210, 0.95)';
  return 'rgba(255, 248, 230, 0.9)';
}

export function StarNode({
  person,
  x,
  y,
  isSelf,
  currentSeasonId,
  moietyNames,
  onClick,
  onDragStart,
}: StarNodeProps) {
  const storyCount = person.stories.length;
  const radius = getStarRadius(storyCount);
  const opacity = getStarOpacity(storyCount, person.lastUpdated);
  const isSeasonRelevant = hasStoriesInSeason(person.stories, currentSeasonId);
  const starColor = getMoietyColor(person.moiety, moietyNames);
  const hasNoConnections = storyCount === 0; // will be refined at parent level
  const glowRadius = radius + (isSeasonRelevant ? 8 : 4);
  const finalOpacity = isSeasonRelevant ? Math.min(opacity * 1.4, 1) : opacity;

  return (
    <g
      className="cursor-pointer"
      onClick={onClick}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      role="button"
      tabIndex={0}
      aria-label={`${person.displayName} — ${storyCount} ${storyCount === 1 ? 'story' : 'stories'}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Self indicator — pulsing amber ring */}
      {isSelf && (
        <circle
          cx={x}
          cy={y}
          r={glowRadius + 6}
          fill="none"
          stroke="rgba(212,164,84,0.45)"
          strokeWidth={1}
          className="animate-star-pulse"
        />
      )}
      {/* Outer glow */}
      <circle
        cx={x}
        cy={y}
        r={glowRadius}
        fill="none"
        stroke={starColor}
        strokeWidth={0.5}
        opacity={finalOpacity * 0.3}
        className={isSeasonRelevant ? 'animate-star-pulse' : ''}
      />
      {/* Star glow halo */}
      <circle
        cx={x}
        cy={y}
        r={radius + 2}
        fill={starColor}
        opacity={finalOpacity * 0.15}
        filter="url(#starGlow)"
      />
      {/* Main star */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={starColor}
        opacity={finalOpacity}
      />
      {/* Inner bright core */}
      <circle
        cx={x}
        cy={y}
        r={radius * 0.4}
        fill="white"
        opacity={finalOpacity * 0.8}
      />
      {/* Dashed outline for isolated stars (no stories, waiting to be illuminated) */}
      {hasNoConnections && (
        <circle
          cx={x}
          cy={y}
          r={radius + 5}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={0.5}
          strokeDasharray="2 4"
        />
      )}
      {/* Deceased indicator */}
      {person.isDeceased && (
        <circle
          cx={x}
          cy={y}
          r={radius + 3}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      )}
      {/* Name label */}
      <text
        x={x}
        y={y + radius + 14}
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.5)"
        fontSize={10}
        fontWeight={300}
      >
        {person.displayName}
      </text>
    </g>
  );
}
