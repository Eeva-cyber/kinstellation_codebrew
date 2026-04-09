'use client';

interface MoietyRegionsProps {
  width: number;
  height: number;
  moietyNames?: [string, string];
}

export function MoietyRegions({ width, height, moietyNames }: MoietyRegionsProps) {
  if (width === 0 || !moietyNames) return null;

  return (
    <g className="pointer-events-none">
      {/* Warm moiety region (left half) */}
      <rect
        x={0}
        y={0}
        width={width / 2}
        height={height}
        fill="url(#moietyWarm)"
        opacity={1}
      />
      {/* Cool moiety region (right half) */}
      <rect
        x={width / 2}
        y={0}
        width={width / 2}
        height={height}
        fill="url(#moietyCool)"
        opacity={1}
      />
      {/* Blend seam down the middle */}
      <rect
        x={width / 2 - 60}
        y={0}
        width={120}
        height={height}
        fill="url(#moietyBlend)"
        opacity={1}
      />
      {/* Moiety labels */}
      <text
        x={width * 0.25}
        y={32}
        textAnchor="middle"
        fill="rgba(212, 160, 87, 0.2)"
        fontSize={11}
        fontWeight={300}
        letterSpacing="0.15em"
      >
        {moietyNames[0].toUpperCase()}
      </text>
      <text
        x={width * 0.75}
        y={32}
        textAnchor="middle"
        fill="rgba(107, 127, 184, 0.2)"
        fontSize={11}
        fontWeight={300}
        letterSpacing="0.15em"
      >
        {moietyNames[1].toUpperCase()}
      </text>
      <defs>
        <radialGradient id="moietyWarm" cx="30%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#d4a057" stopOpacity={0.06} />
          <stop offset="100%" stopColor="#d4a057" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="moietyCool" cx="70%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#6b7fb8" stopOpacity={0.06} />
          <stop offset="100%" stopColor="#6b7fb8" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="moietyBlend" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#080b14" stopOpacity={0} />
          <stop offset="50%" stopColor="#080b14" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#080b14" stopOpacity={0} />
        </linearGradient>
      </defs>
    </g>
  );
}
