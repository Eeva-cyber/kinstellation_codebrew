'use client';

import type { RelationshipType } from '@/lib/types';

interface ConstellationLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  relationshipType: RelationshipType;
  isAvoidance: boolean;
  /**
   * 'bright' — both endpoints in active moiety → shine
   * 'dim'    — at least one endpoint outside active moiety → fade
   * 'normal' — no filter active
   */
  lineState?: 'bright' | 'dim' | 'normal';
}

interface LineStyle {
  stroke: string;
  strokeDasharray?: string;
  strokeWidth: number;
}

function getLineStyle(type: RelationshipType, isAvoidance: boolean): LineStyle {
  if (isAvoidance) {
    return { stroke: 'rgba(180,60,60,0.3)', strokeDasharray: '3 6', strokeWidth: 1 };
  }
  switch (type) {
    case 'mother':
    case 'father':
    case 'child':
    case 'spouse':
    case 'sibling':
      return { stroke: 'rgba(255,255,255,0.25)', strokeDasharray: undefined, strokeWidth: 1.5 };
    case 'classificatory_mother':
    case 'classificatory_father':
    case 'classificatory_sibling':
      return { stroke: 'rgba(255,255,255,0.12)', strokeDasharray: '4 4', strokeWidth: 1 };
    case 'totemic':
    case 'country_connection':
      return { stroke: 'rgba(100,140,200,0.15)', strokeDasharray: '2 6', strokeWidth: 1 };
    case 'kupai_omasker':
      return { stroke: 'rgba(180,140,200,0.2)', strokeDasharray: '6 3', strokeWidth: 1 };
    default:
      return { stroke: 'rgba(255,255,255,0.1)', strokeDasharray: undefined, strokeWidth: 1 };
  }
}

export function ConstellationLine({
  x1, y1, x2, y2,
  relationshipType, isAvoidance,
  lineState = 'normal',
}: ConstellationLineProps) {
  const base = getLineStyle(relationshipType, isAvoidance);

  const opacity     = lineState === 'bright' ? 1   : lineState === 'dim' ? 0.05 : 1;
  const widthScale  = lineState === 'bright' ? 2.2 : lineState === 'dim' ? 0.5  : 1;
  // Bright lines get a luminous white/gold tint on top of the base colour
  const stroke      = lineState === 'bright'
    ? isAvoidance ? 'rgba(255,120,120,0.85)' : 'rgba(255,255,255,0.85)'
    : base.stroke;

  return (
    <g className="transition-all duration-500">
      {/* Glow layer — only rendered when bright */}
      {lineState === 'bright' && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={base.strokeWidth * 6}
          strokeLinecap="round"
          filter="url(#starGlow)"
        />
      )}
      {/* Main line */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={stroke}
        strokeWidth={base.strokeWidth * widthScale}
        strokeDasharray={base.strokeDasharray}
        strokeLinecap="round"
        opacity={opacity}
      />
    </g>
  );
}
