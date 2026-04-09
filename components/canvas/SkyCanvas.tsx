'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3';
import { useApp } from '@/lib/store/AppContext';
import { StarFieldBg } from './StarFieldBg';
import { MilkyWay } from './MilkyWay';
import { MoietyRegions } from './MoietyRegions';
import { SeasonalAmbient } from './SeasonalAmbient';
import { ConstellationLine } from './ConstellationLine';
import { StarNode } from './StarNode';
import { SeasonIndicator } from './SeasonIndicator';
import { PersonPanel } from '@/components/panels/PersonPanel';
import { StoryPanel } from '@/components/panels/StoryPanel';
import { AddConnectionPanel } from '@/components/panels/AddConnectionPanel';
import { StoriesRiverPanel } from '@/components/panels/StoriesRiverPanel';
import type { Person, Relationship } from '@/lib/types';

type PanelType = 'person' | 'addPerson' | 'story' | 'connection' | 'river' | null;

interface NodeDatum extends SimulationNodeDatum {
  id: string;
  moiety?: string;
}

interface LinkDatum extends SimulationLinkDatum<NodeDatum> {
  id: string;
}

export function SkyCanvas() {
  const { state, dispatch } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const simulationRef = useRef<ReturnType<typeof forceSimulation<NodeDatum>> | null>(null);

  const moietyNames = state.kinshipTemplate?.moietyNames;

  // Measure container
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // D3 force simulation
  useEffect(() => {
    if (dimensions.width === 0 || state.persons.length === 0) return;

    const { width, height } = dimensions;

    const nodes: NodeDatum[] = state.persons.map((p) => {
      const existing = nodePositions[p.id];
      return {
        id: p.id,
        moiety: p.moiety,
        x: existing?.x ?? width / 2 + (Math.random() - 0.5) * 200,
        y: existing?.y ?? height / 2 + (Math.random() - 0.5) * 200,
      };
    });

    const links: LinkDatum[] = state.relationships
      .filter(
        (r) =>
          nodes.some((n) => n.id === r.fromPersonId) &&
          nodes.some((n) => n.id === r.toPersonId),
      )
      .map((r) => ({
        id: r.id,
        source: r.fromPersonId,
        target: r.toPersonId,
      }));

    const sim = forceSimulation<NodeDatum>(nodes)
      .force(
        'link',
        forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance(100),
      )
      .force('charge', forceManyBody().strength(-200))
      .force('collide', forceCollide(30))
      // Moiety regions: push nodes toward their moiety's half
      .force(
        'moietyX',
        forceX<NodeDatum>((d) => {
          if (!d.moiety || !moietyNames) return width / 2;
          if (d.moiety === moietyNames[0]) return width * 0.3;
          if (d.moiety === moietyNames[1]) return width * 0.7;
          return width / 2;
        }).strength(0.05),
      )
      .force('centerY', forceY(height / 2).strength(0.03))
      .alpha(0.3)
      .alphaDecay(0.02);

    sim.on('tick', () => {
      const pos: Record<string, { x: number; y: number }> = {};
      for (const node of nodes) {
        // Clamp to canvas bounds
        const r = 20;
        node.x = Math.max(r, Math.min(width - r, node.x ?? width / 2));
        node.y = Math.max(r + 40, Math.min(height - r - 20, node.y ?? height / 2));
        pos[node.id] = { x: node.x, y: node.y };
      }
      setNodePositions({ ...pos });
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions, state.persons.length, state.relationships.length, moietyNames]);

  // Drag handlers
  const handleDragStart = useCallback(
    (personId: string) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setDragging(personId);
      const pos = nodePositions[personId];
      if (!pos) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
    },
    [nodePositions],
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!dragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const newX = clientX - dragOffset.current.x;
      const newY = clientY - dragOffset.current.y;

      setNodePositions((prev) => ({
        ...prev,
        [dragging]: { x: newX, y: newY },
      }));

      // Update simulation node position
      if (simulationRef.current) {
        const node = simulationRef.current.nodes().find((n) => n.id === dragging);
        if (node) {
          node.fx = newX;
          node.fy = newY;
          simulationRef.current.alpha(0.1).restart();
        }
      }
    },
    [dragging],
  );

  const handleDragEnd = useCallback(() => {
    if (!dragging) return;
    // Release fixed position
    if (simulationRef.current) {
      const node = simulationRef.current.nodes().find((n) => n.id === dragging);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
    setDragging(null);
  }, [dragging]);

  const handleStarClick = useCallback((personId: string) => {
    setActivePersonId(personId);
    setActivePanel('person');
  }, []);

  const handleAddPerson = useCallback(() => {
    setActivePersonId(null);
    setActivePanel('addPerson');
  }, []);

  const handleOpenStoryPanel = useCallback((personId: string) => {
    setActivePersonId(personId);
    setActivePanel('story');
  }, []);

  const handleOpenConnectionPanel = useCallback((personId: string) => {
    setActivePersonId(personId);
    setActivePanel('connection');
  }, []);

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
    setActivePersonId(null);
  }, []);

  const activePerson = activePersonId
    ? state.persons.find((p) => p.id === activePersonId) ?? null
    : null;

  // Get all stories for the river panel
  const allStories = state.persons.flatMap((p) =>
    p.stories.map((s) => ({ ...s, personName: p.displayName, personId: p.id })),
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {/* Layer 1: Seasonal ambient background */}
      <SeasonalAmbient />

      {/* Layer 2: Decorative static star field */}
      <StarFieldBg />

      {/* Layer 3: Interactive SVG layer */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }}>
        <defs>
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Moiety sky regions */}
        <MoietyRegions
          width={dimensions.width}
          height={dimensions.height}
          moietyNames={moietyNames}
        />

        {/* Milky Way band */}
        <MilkyWay
          width={dimensions.width}
          height={dimensions.height}
          onClick={() => setActivePanel('river')}
        />

        {/* Constellation lines */}
        {state.relationships.map((rel) => {
          const fromPos = nodePositions[rel.fromPersonId];
          const toPos = nodePositions[rel.toPersonId];
          if (!fromPos || !toPos) return null;
          return (
            <ConstellationLine
              key={rel.id}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              relationshipType={rel.relationshipType}
              isAvoidance={rel.isAvoidance}
            />
          );
        })}

        {/* Star nodes */}
        {state.persons.map((person) => {
          const pos = nodePositions[person.id];
          if (!pos) return null;
          return (
            <StarNode
              key={person.id}
              person={person}
              x={pos.x}
              y={pos.y}
              currentSeasonId={state.currentSeasonId}
              moietyNames={moietyNames}
              onClick={() => handleStarClick(person.id)}
              onDragStart={handleDragStart(person.id)}
            />
          );
        })}
      </svg>

      {/* Season indicator */}
      <SeasonIndicator />

      {/* Add person FAB */}
      <button
        onClick={handleAddPerson}
        className="absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full
          bg-white/[0.08] border border-white/[0.1] backdrop-blur-sm
          hover:bg-white/[0.14] transition-all duration-200
          flex items-center justify-center group"
        aria-label="Add person"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-white/60 group-hover:text-white/90 transition-colors"
        >
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Settings / change region */}
      <button
        onClick={() => {
          if (confirm('Change your region? This will update your seasonal calendar and kinship template.')) {
            window.location.href = '/onboarding';
          }
        }}
        className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg
          bg-white/[0.04] border border-white/[0.06] text-white/30 text-xs
          hover:text-white/50 hover:bg-white/[0.06] transition-all"
      >
        {state.seasonalCalendar?.languageGroup ?? 'Settings'}
      </button>

      {/* Empty state */}
      {state.persons.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center animate-fade-in">
            <div className="w-3 h-3 rounded-full bg-white/20 mx-auto mb-4 animate-star-pulse" />
            <p className="text-white/25 text-sm">
              The sky is waiting for your family&apos;s stars.
            </p>
            <p className="text-white/15 text-xs mt-1">
              Tap + to add the first person.
            </p>
          </div>
        </div>
      )}

      {/* Panels */}
      {(activePanel === 'person' || activePanel === 'addPerson') && (
        <PersonPanel
          person={activePerson}
          onClose={handleClosePanel}
          onAddStory={(personId) => handleOpenStoryPanel(personId)}
          onAddConnection={(personId) => handleOpenConnectionPanel(personId)}
        />
      )}
      {activePanel === 'story' && activePerson && (
        <StoryPanel
          person={activePerson}
          onClose={() => {
            setActivePanel('person');
          }}
        />
      )}
      {activePanel === 'connection' && activePerson && (
        <AddConnectionPanel
          fromPerson={activePerson}
          onClose={() => {
            setActivePanel('person');
          }}
        />
      )}
      {activePanel === 'river' && (
        <StoriesRiverPanel
          stories={allStories}
          onClose={handleClosePanel}
          onPersonClick={(personId) => handleStarClick(personId)}
        />
      )}
    </div>
  );
}
