'use client';

import { useApp } from '@/lib/store/AppContext';

interface SeasonWheelProps {
  activeSeasonFilter: string | null;
  onSeasonClick: (seasonId: string | null) => void;
}

export function SeasonWheel({ activeSeasonFilter, onSeasonClick }: SeasonWheelProps) {
  const { state } = useApp();
  const seasons = state.seasonalCalendar?.seasons ?? [];
  const currentSeasonId = state.currentSeasonId;

  if (seasons.length === 0) return null;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 62;
  const arcCount = seasons.length;

  function describeArc(index: number): string {
    const startAngle = (2 * Math.PI * index) / arcCount - Math.PI / 2;
    const endAngle = (2 * Math.PI * (index + 1)) / arcCount - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        {seasons.map((season, i) => {
          const isActive = activeSeasonFilter === season.id;
          const isCurrent = currentSeasonId === season.id;
          return (
            <g key={season.id}>
              <path
                d={describeArc(i)}
                fill={season.colorPalette.accentColor}
                opacity={isActive ? 0.9 : activeSeasonFilter ? 0.15 : isCurrent ? 0.7 : 0.4}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={0.8}
                className={`cursor-pointer transition-opacity duration-200 ${isCurrent && !activeSeasonFilter ? 'animate-star-pulse' : ''}`}
                onClick={() => onSeasonClick(isActive ? null : season.id)}
              />
              {/* Season name label */}
              {(() => {
                const midAngle = (2 * Math.PI * (i + 0.5)) / arcCount - Math.PI / 2;
                const labelR = radius * 0.58;
                const lx = cx + labelR * Math.cos(midAngle);
                const ly = cy + labelR * Math.sin(midAngle);
                return (
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)'}
                    fontSize={11}
                    fontWeight={isActive ? 600 : 500}
                    className="pointer-events-none select-none"
                  >
                    {season.name.length > 7 ? season.name.slice(0, 6) + '.' : season.name}
                  </text>
                );
              })()}
            </g>
          );
        })}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} fill="rgba(255,255,255,0.2)" />
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
      </svg>
    </div>
  );
}
