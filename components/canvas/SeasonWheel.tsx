'use client';

import { useApp } from '@/lib/store/AppContext';

// Season ID → weather/environment icon type
const SEASON_ICON: Record<string, string> = {
  // Noongar (SW WA)
  birak: 'sun-hot', bunuru: 'sun-intense',
  djeran: 'cooling', makuru: 'rain',
  djilba: 'flower', kambarang: 'bloom',
  // Yolngu (Arnhem Land)
  dharratharramirri: 'storm', barramirri: 'monsoon',
  mainmak: 'wind', midawarr: 'harvest',
  dharratharr: 'sun', rarranhdharr: 'cool',
  // D'harawal (Sydney)
  ngoonungi: 'cool', wiritjiribin: 'cold',
  tumburung: 'sprout', marrai_gang: 'rain',
  gadalung_marool: 'sun-hot', burran: 'harvest',
  // Torres Strait
  kuki: 'storm', sager: 'wind', naigai: 'flower',
  // Generic 6-season
  fire_season: 'sun-hot', rain_season: 'monsoon',
  harvest_season: 'harvest', cold_season: 'cold',
  flower_season: 'bloom', storm_season: 'storm',
};

function SunCenter({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const coreR = 6.5;
  const innerRay = coreR + 2.5;
  const outerRay = coreR + 6;

  return (
    <g filter="url(#centerGlow)">
      {/* Outer glow halo */}
      <circle cx={cx} cy={cy} r={coreR + 9} fill={color} opacity={0.06} />
      {/* Rays — alternating long/short */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => {
        const rad = (deg * Math.PI) / 180;
        const rOuter = idx % 2 === 0 ? outerRay : outerRay - 2.5;
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * innerRay}
            y1={cy + Math.sin(rad) * innerRay}
            x2={cx + Math.cos(rad) * rOuter}
            y2={cy + Math.sin(rad) * rOuter}
            stroke={color}
            strokeWidth={idx % 2 === 0 ? 1.1 : 0.7}
            strokeLinecap="round"
            opacity={0.75}
          />
        );
      })}
      {/* Core circles */}
      <circle cx={cx} cy={cy} r={coreR} fill={color} opacity={0.22} />
      <circle cx={cx} cy={cy} r={coreR * 0.65} fill={color} opacity={0.55} />
      <circle cx={cx} cy={cy} r={coreR * 0.3} fill="white" opacity={0.7} />
    </g>
  );
}

function WeatherIcon({
  type, x, y, color, opacity,
}: {
  type: string; x: number; y: number; color: string; opacity: number;
}) {
  switch (type) {
    case 'sun-hot':
    case 'sun-intense':
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity} fill="none">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => {
            const rad = (deg * Math.PI) / 180;
            const len = idx % 3 === 0 ? 4.5 : idx % 3 === 1 ? 3.5 : 2.5;
            return (
              <line
                key={deg}
                x1={Math.cos(rad) * 3.8}
                y1={Math.sin(rad) * 3.8}
                x2={Math.cos(rad) * (3.8 + len)}
                y2={Math.sin(rad) * (3.8 + len)}
                stroke={color}
                strokeWidth={idx % 3 === 0 ? 1.1 : 0.7}
                strokeLinecap="round"
              />
            );
          })}
          <circle r={3.5} fill={color} opacity={0.95} />
        </g>
      );

    case 'sun':
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity} fill="none">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={Math.cos(rad) * 3.8} y1={Math.sin(rad) * 3.8}
                x2={Math.cos(rad) * 6.5} y2={Math.sin(rad) * 6.5}
                stroke={color} strokeWidth={1} strokeLinecap="round"
              />
            );
          })}
          <circle r={3.2} fill={color} opacity={0.9} />
        </g>
      );

    case 'rain':
    case 'monsoon':
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
          {/* Cloud */}
          <path
            d="M -5 0 Q -5 -5.5 -1.5 -5.5 Q -1 -8 2.5 -7.5 Q 6 -7 5.5 -3.5 Q 7.5 -3.5 7.5 -1 Q 7.5 2 5 2 L -5 2 Q -7 2 -7 -0.5 Q -7 -2 -5 -2 Z"
            fill={color}
            fillOpacity={0.55}
          />
          {/* Rain drops */}
          {[-3.5, 0, 3.5].map((ox) => (
            <line
              key={ox}
              x1={ox} y1={4}
              x2={ox - 1.5} y2={9}
              stroke={color}
              strokeWidth={1.3}
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
        </g>
      );

    case 'storm':
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
          {/* Cloud */}
          <path
            d="M -5 -1 Q -5 -6 -1 -6 Q -0.5 -9 3 -8.5 Q 6.5 -8 6 -4.5 Q 8 -4.5 8 -2 Q 8 0 5.5 0 L -5 0 Q -7 0 -7 -2 Q -7 -3.5 -5 -3.5 Z"
            fill={color}
            fillOpacity={0.5}
          />
          {/* Lightning bolt */}
          <path
            d="M 1.5 0 L -2 5.5 L 0.5 5.5 L -2 11 L 5 3.5 L 2 3.5 Z"
            fill={color}
            fillOpacity={0.95}
          />
        </g>
      );

    case 'wind':
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity} fill="none" stroke={color} strokeLinecap="round">
          <path d="M -7 -3.5 Q -1 -7 4 -3.5 Q 7.5 -0.5 5.5 2" strokeWidth={1.4} />
          <path d="M -7 0.5 Q -1 -3 4 0.5" strokeWidth={1.1} />
          <path d="M -6 4.5 Q 0 1.5 4 4.5" strokeWidth={0.9} />
        </g>
      );

    case 'flower':
    case 'bloom':
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity}>
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const px = Math.cos(rad) * 4.5;
            const py = Math.sin(rad) * 4.5;
            return (
              <ellipse
                key={deg}
                cx={px} cy={py}
                rx={2.2} ry={3.5}
                fill={color}
                fillOpacity={0.72}
                transform={`rotate(${deg}, ${px}, ${py})`}
              />
            );
          })}
          <circle r={2.2} fill={color} opacity={0.95} />
        </g>
      );

    case 'harvest':
    case 'sprout':
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity} fill="none">
          {/* Grain/leaf shape */}
          <path d="M 0 8 Q -6.5 1 0 -8 Q 6.5 1 0 8 Z" fill={color} fillOpacity={0.8} />
          {/* Vein */}
          <path d="M 0 8 L 0 -8" stroke="rgba(0,0,0,0.25)" strokeWidth={0.8} />
          {/* Side sprigs */}
          <path d="M 0 -1 Q -5.5 -5 -3 -8" stroke={color} strokeWidth={1.1} strokeLinecap="round" />
          <path d="M 0 -1 Q 5.5 -5 3 -8" stroke={color} strokeWidth={1.1} strokeLinecap="round" />
        </g>
      );

    case 'cool':
    case 'cooling':
    case 'cold':
    default:
      // Snowflake
      return (
        <g transform={`translate(${x},${y})`} opacity={opacity} fill="none" stroke={color} strokeLinecap="round">
          {[0, 60, 120].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={-Math.cos(rad) * 7.5} y1={-Math.sin(rad) * 7.5}
                x2={Math.cos(rad) * 7.5} y2={Math.sin(rad) * 7.5}
                strokeWidth={1.3}
              />
            );
          })}
          {/* Side branches on each arm */}
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const mx = Math.cos(rad) * 4;
            const my = Math.sin(rad) * 4;
            const bRad1 = ((deg + 60) * Math.PI) / 180;
            const bRad2 = ((deg - 60) * Math.PI) / 180;
            return (
              <g key={deg}>
                <line x1={mx} y1={my} x2={mx + Math.cos(bRad1) * 2.2} y2={my + Math.sin(bRad1) * 2.2} strokeWidth={0.8} />
                <line x1={mx} y1={my} x2={mx + Math.cos(bRad2) * 2.2} y2={my + Math.sin(bRad2) * 2.2} strokeWidth={0.8} />
              </g>
            );
          })}
        </g>
      );
  }
}

interface SeasonWheelProps {
  activeSeasonFilters: string[];
  onSeasonClick: (seasonId: string) => void;
  onClearFilters: () => void;
}

export function SeasonWheel({ activeSeasonFilters, onSeasonClick, onClearFilters }: SeasonWheelProps) {
  const { state } = useApp();
  const seasons = state.seasonalCalendar?.seasons ?? [];
  const currentSeasonId = state.currentSeasonId;

  if (seasons.length === 0) return null;

  const size = 216;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 93;
  const innerR = 30;
  const arcCount = seasons.length;
  // Small gap between arc segments for visual separation
  const gap = arcCount > 4 ? 0.022 : 0.014;

  function describeDonutArc(index: number): string {
    const startAngle = (2 * Math.PI * index) / arcCount - Math.PI / 2 + gap;
    const endAngle = (2 * Math.PI * (index + 1)) / arcCount - Math.PI / 2 - gap;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const ox1 = cx + outerR * Math.cos(startAngle);
    const oy1 = cy + outerR * Math.sin(startAngle);
    const ox2 = cx + outerR * Math.cos(endAngle);
    const oy2 = cy + outerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);

    return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
  }

  const currentSeason = seasons.find((s) => s.id === currentSeasonId);
  // For the label below: show the last selected filter, or fall back to current season
  const lastActiveId = activeSeasonFilters[activeSeasonFilters.length - 1] ?? null;
  const activeSeason = lastActiveId ? seasons.find((s) => s.id === lastActiveId) : null;
  const displaySeason = activeSeason ?? currentSeason;
  const centerColor = currentSeason?.colorPalette.accentColor ?? 'rgba(255,220,160,0.6)';

  return (
    <div className="absolute bottom-4 left-4 z-[50] select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-2xl"
      >
        <defs>
          <filter id="wheelGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="centerGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={centerColor} stopOpacity={0.06} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Subtle background glow from current season */}
        <circle cx={cx} cy={cy} r={outerR + 8} fill="url(#bgGrad)" />

        {/* Very faint outer decoration ring */}
        <circle cx={cx} cy={cy} r={outerR + 4} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={6} />

        {/* Tick marks on outer ring — one per season */}
        {seasons.map((_, i) => {
          const angle = (2 * Math.PI * i) / arcCount - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx + (outerR + 1) * Math.cos(angle)}
              y1={cy + (outerR + 1) * Math.sin(angle)}
              x2={cx + (outerR + 5) * Math.cos(angle)}
              y2={cy + (outerR + 5) * Math.sin(angle)}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={0.8}
              strokeLinecap="round"
            />
          );
        })}

        {/* Season segments */}
        {seasons.map((season, i) => {
          const isActive = activeSeasonFilters.includes(season.id);
          const isCurrent = currentSeasonId === season.id;
          const baseOpacity = isActive ? 1 : activeSeasonFilters.length > 0 ? 0.18 : isCurrent ? 0.8 : 0.42;

          const midAngle = (2 * Math.PI * (i + 0.5)) / arcCount - Math.PI / 2;

          // For many seasons: center icon in the full donut depth
          // For few seasons (3): icon closer to inner, name near outer
          const useLabelInSegment = arcCount <= 4;
          const iconR = innerR + (outerR - innerR) * (useLabelInSegment ? 0.38 : 0.5);
          const ix = cx + iconR * Math.cos(midAngle);
          const iy = cy + iconR * Math.sin(midAngle);
          const iconType = SEASON_ICON[season.id] ?? 'sun';
          const iconOpacity = Math.min(baseOpacity * 1.4, 0.98);

          // Current season marker: small glowing dot near outer rim
          const dotR = outerR - 5;
          const dx = cx + dotR * Math.cos(midAngle);
          const dy = cy + dotR * Math.sin(midAngle);

          // For 3-season calendars: show name in outer portion of arc
          const labelR = innerR + (outerR - innerR) * 0.8;
          const lx = cx + labelR * Math.cos(midAngle);
          const ly = cy + labelR * Math.sin(midAngle);

          return (
            <g
              key={season.id}
              onClick={() => onSeasonClick(season.id)}
              className="cursor-pointer"
              role="button"
              aria-label={`Filter by ${season.name} — ${season.nameEnglish}`}
            >
              <title>{season.name} · {season.nameEnglish}</title>

              {/* Glow layer for active/current */}
              {(isActive || isCurrent) && (
                <path
                  d={describeDonutArc(i)}
                  fill={season.colorPalette.accentColor}
                  opacity={0.22}
                  filter="url(#wheelGlow)"
                  className="pointer-events-none"
                />
              )}

              {/* Main arc segment */}
              <path
                d={describeDonutArc(i)}
                fill={season.colorPalette.accentColor}
                opacity={baseOpacity}
                className="transition-opacity duration-300"
              />

              {/* Weather/environment icon — centered in donut */}
              <WeatherIcon
                type={iconType}
                x={ix}
                y={iy}
                color="white"
                opacity={iconOpacity}
              />

              {/* Season name — only shown in-segment for ≤4 seasons (enough arc width) */}
              {useLabelInSegment && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={9}
                  fontWeight={isActive ? 700 : 400}
                  opacity={isActive ? 0.98 : Math.min(baseOpacity * 2, 0.9)}
                  className="pointer-events-none select-none"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {season.name.length > 7 ? season.name.slice(0, 6) + '…' : season.name}
                </text>
              )}

              {/* For 5-6 seasons: abbreviated initials near inner ring as a subtle hint */}
              {!useLabelInSegment && (
                <text
                  x={cx + (innerR + 10) * Math.cos(midAngle)}
                  y={cy + (innerR + 10) * Math.sin(midAngle)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={6}
                  fontWeight={400}
                  opacity={Math.min(baseOpacity * 1.5, 0.55)}
                  className="pointer-events-none select-none"
                  style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em' }}
                >
                  {season.name.slice(0, 3).toUpperCase()}
                </text>
              )}

              {/* Current season glowing dot */}
              {isCurrent && (
                <circle
                  cx={dx} cy={dy} r={3}
                  fill="white"
                  opacity={0.92}
                  className="pointer-events-none animate-star-pulse"
                />
              )}

              {/* Active filter indicator: bright ring around segment outer edge */}
              {isActive && (
                <path
                  d={describeDonutArc(i)}
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1.5}
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}

        {/* Outer ring border */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.6} />
        {/* Inner ring border */}
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />

        {/* Center dark background */}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="rgba(4,6,16,0.93)" />

        {/* Center sun */}
        <SunCenter cx={cx} cy={cy} color={centerColor} />
      </svg>

      {/* Season info label below wheel */}
      {displaySeason && (
        <div
          className="px-2.5 py-1.5 rounded-xl"
          style={{
            maxWidth: size,
            background: 'rgba(4,6,16,0.75)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: displaySeason.colorPalette.accentColor,
                boxShadow: `0 0 5px ${displaySeason.colorPalette.accentColor}90`,
              }}
            />
            <span className="text-[10px] font-medium text-white/60">
              {displaySeason.name}
            </span>
            <span className="text-[9px] text-white/25 truncate">
              {displaySeason.nameEnglish}
            </span>
          </div>
          <p className="text-[9px] text-white/20 mt-0.5 leading-snug line-clamp-2">
            {displaySeason.description.split('.')[0]}.
          </p>
          {activeSeasonFilters.length > 0 && (
            <button
              onClick={onClearFilters}
              className="mt-1 text-[8px] text-white/30 hover:text-white/55 transition-colors tracking-wide uppercase"
            >
              clear {activeSeasonFilters.length > 1 ? `${activeSeasonFilters.length} filters` : 'filter'} ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
