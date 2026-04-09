'use client';

import type { RelationshipType } from '@/lib/types';

interface ConstellationLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  relationshipType: RelationshipType;
  isAvoidance: boolean;
}

function getLineStyle(type: RelationshipType, isAvoidance: boolean) {
  if (isAvoidance) {
    return { stroke: 'rgba(180, 60, 60, 0.3)', strokeDasharray: '3 6', strokeWidth: 1 };
  }
  switch (type) {
    case 'mother':
    case 'father':
    case 'child':
    case 'spouse':
    case 'sibling':
      return { stroke: 'rgba(255, 255, 255, 0.25)', strokeDasharray: undefined, strokeWidth: 1.5 };
    case 'classificatory_mother':
    case 'classificatory_father':
    case 'classificatory_sibling':
      return { stroke: 'rgba(255, 255, 255, 0.12)', strokeDasharray: '4 4', strokeWidth: 1 };
    case 'totemic':
    case 'country_connection':
      return { stroke: 'rgba(100, 140, 200, 0.15)', strokeDasharray: '2 6', strokeWidth: 1 };
    case 'kupai_omasker':
      return { stroke: 'rgba(180, 140, 200, 0.2)', strokeDasharray: '6 3', strokeWidth: 1 };
    default:
      return { stroke: 'rgba(255, 255, 255, 0.1)', strokeDasharray: undefined, strokeWidth: 1 };
  }
}

export function ConstellationLine({
  x1,
  y1,
  x2,
  y2,
  relationshipType,
  isAvoidance,
}: ConstellationLineProps) {
  const style = getLineStyle(relationshipType, isAvoidance);

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
      strokeDasharray={style.strokeDasharray}
      strokeLinecap="round"
    />
  );
}
