'use client';

import type { RelationshipType } from '@/lib/types';

interface LineStyle {
  stroke: string;
  glowStroke: string;
  strokeDasharray?: string;
  strokeWidth: number;
}

function getLineStyle(type: RelationshipType, isAvoidance: boolean): LineStyle {
  if (isAvoidance) {
    return {
      stroke: 'rgba(248,113,113,0.55)',
      glowStroke: 'rgba(248,113,113,0.18)',
      strokeDasharray: '3 6',
      strokeWidth: 1.2,
    };
  }
  switch (type) {
    case 'mother':
    case 'father':
    case 'child':
    case 'spouse':
    case 'sibling':
      return {
        stroke: 'rgba(212,164,84,0.6)',
        glowStroke: 'rgba(212,164,84,0.14)',
        strokeDasharray: undefined,
        strokeWidth: 1.5,
      };
    case 'classificatory_mother':
    case 'classificatory_father':
    case 'classificatory_sibling':
      return {
        stroke: 'rgba(139,92,246,0.45)',
        glowStroke: 'rgba(139,92,246,0.12)',
        strokeDasharray: '5 5',
        strokeWidth: 1.2,
      };
    case 'totemic':
    case 'country_connection':
      return {
        stroke: 'rgba(139,92,246,0.3)',
        glowStroke: 'rgba(139,92,246,0.08)',
        strokeDasharray: '2 7',
        strokeWidth: 1,
      };
    case 'kupai_omasker':
      return {
        stroke: 'rgba(212,164,84,0.4)',
        glowStroke: 'rgba(212,164,84,0.1)',
        strokeDasharray: '7 4',
        strokeWidth: 1.2,
      };
    default:
      return {
        stroke: 'rgba(139,92,246,0.3)',
        glowStroke: 'rgba(139,92,246,0.08)',
        strokeDasharray: undefined,
        strokeWidth: 1,
      };
  }
}

interface ConstellationLineProps {
  x1: number; y1: number; x2: number; y2: number;
  relationshipType: RelationshipType;
  isAvoidance: boolean;
  lineState?: 'bright' | 'dim' | 'normal';
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function ConstellationLine({
  x1, y1, x2, y2,
  relationshipType, isAvoidance,
  lineState = 'normal',
  onMouseEnter,
  onMouseLeave,
}: ConstellationLineProps) {
  const base = getLineStyle(relationshipType, isAvoidance);

  const opacity    = lineState === 'dim' ? 0.07 : 1;
  const widthScale = lineState === 'bright' ? 2.2 : 1;
  const stroke     = lineState === 'bright'
    ? isAvoidance ? 'rgba(255,140,140,0.95)' : 'rgba(255,220,130,0.95)'
    : base.stroke;
  const glowStroke = lineState === 'bright'
    ? isAvoidance ? 'rgba(255,100,100,0.30)' : 'rgba(212,164,84,0.30)'
    : base.glowStroke;

  return (
    <g
      style={{ transition: 'opacity 0.25s ease' }}
      opacity={opacity}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Wide invisible hit area for easier hover */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="transparent" strokeWidth={16} strokeLinecap="round" />
      {/* Soft glow halo */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={glowStroke}
        strokeWidth={base.strokeWidth * (lineState === 'bright' ? 10 : 5)}
        strokeLinecap="round"
        strokeDasharray={base.strokeDasharray}
      />
      {/* Main line */}
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={stroke}
        strokeWidth={base.strokeWidth * widthScale}
        strokeDasharray={base.strokeDasharray}
        strokeLinecap="round"
      />
    </g>
  );
}
