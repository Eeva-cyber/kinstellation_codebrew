'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { getStarRadius, getSeasonById } from '@/lib/utils/season';
import { StarFieldBg } from './StarFieldBg';
import { MilkyWay } from './MilkyWay';
import { MoietyRegions } from './MoietyRegions';
import { SeasonalAmbient } from './SeasonalAmbient';
import { ConstellationLine } from './ConstellationLine';
import { SolarSystemNode } from './SolarSystemNode';
import { SeasonIndicator } from './SeasonIndicator';
import { SeasonWheel } from './SeasonWheel';
import { PersonPanel } from '@/components/panels/PersonPanel';
import { StoryPanel } from '@/components/panels/StoryPanel';
import { AddConnectionPanel } from '@/components/panels/AddConnectionPanel';
import { StoriesRiverPanel } from '@/components/panels/StoriesRiverPanel';
import { QuickAddModal } from '@/components/panels/QuickAddModal';
import { TimelinePanel } from '@/components/panels/TimelinePanel';
import { StoryPopup } from '@/components/ui/StoryPopup';
import { WordTooltip } from '@/components/ui/WordTooltip';
import type { Person, Story } from '@/lib/types';

type PanelType = 'person' | 'addPerson' | 'story' | 'connection' | 'river' | 'timeline' | null;

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.06;

interface NodeDatum extends SimulationNodeDatum {
  id: string;
  moiety?: string;
}

interface LinkDatum extends SimulationLinkDatum<NodeDatum> {
  id: string;
}

export function SkyCanvas() {
  const { state } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [personPanelFocus, setPersonPanelFocus] = useState<'identity' | 'stories' | 'connections' | undefined>(undefined);
  const [dragging, setDragging] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<{ story: Story; personName: string } | null>(null);
  const [impactScores, setImpactScores] = useState<Record<string, number>>({});
  const scoringInFlight = useRef<Set<string>>(new Set());
  const dragOffset = useRef({ x: 0, y: 0 });
  const simulationRef = useRef<ReturnType<typeof forceSimulation<NodeDatum>> | null>(null);
  const [filterSeasonId, setFilterSeasonId] = useState<string | null>(null);

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const moietyNames = state.kinshipTemplate?.moietyNames;
  const [selfPersonId, setSelfPersonId] = useState<string | null>(null);
  useEffect(() => {
    setSelfPersonId(localStorage.getItem('kinstellation_self_id'));
  }, []);

  // Connection count per person (memoized)
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of state.persons) {
      counts[p.id] = 0;
    }
    for (const r of state.relationships) {
      if (counts[r.fromPersonId] !== undefined) counts[r.fromPersonId]++;
      if (counts[r.toPersonId] !== undefined) counts[r.toPersonId]++;
    }
    return counts;
  }, [state.persons, state.relationships]);

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

  // Wheel zoom handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((prev) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
        const rect = el!.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const scale = next / prev;
        setPan((p) => ({
          x: cx - scale * (cx - p.x),
          y: cy - scale * (cy - p.y),
        }));
        return next;
      });
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // AI impact scoring — run for any unscored story
  useEffect(() => {
    for (const person of state.persons) {
      for (const story of person.stories) {
        if (impactScores[story.id] !== undefined) continue;
        if (scoringInFlight.current.has(story.id)) continue;
        if (story.type === 'photo') {
          setImpactScores((prev) => ({ ...prev, [story.id]: 5 }));
          continue;
        }
        scoringInFlight.current.add(story.id);
        fetch('/api/analyze-story', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title: story.title, content: story.content }),
        })
          .then((r) => r.json())
          .then((data) => {
            const score = Math.max(1, Math.min(10, Number(data.impactScore) || 5));
            setImpactScores((prev) => ({ ...prev, [story.id]: score }));
          })
          .catch(() => {
            setImpactScores((prev) => ({ ...prev, [story.id]: 5 }));
          })
          .finally(() => {
            scoringInFlight.current.delete(story.id);
          });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.persons]);

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
          .distance(200),
      )
      .force('charge', forceManyBody().strength(-400))
      .force('collide', forceCollide(100))
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
        const margin = 100;
        node.x = Math.max(margin, Math.min(width - margin, node.x ?? width / 2));
        node.y = Math.max(margin, Math.min(height - margin, node.y ?? height / 2));
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

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Drag handlers (adjusted for zoom/pan)
  const handleDragStart = useCallback(
    (personId: string) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      setDragging(personId);
      const pos = nodePositions[personId];
      if (!pos) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld(clientX - rect.left, clientY - rect.top);
      dragOffset.current = { x: world.x - pos.x, y: world.y - pos.y };
    },
    [nodePositions, screenToWorld],
  );

  const handleDragMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Pan with middle mouse or when not dragging a node
      if (panning) {
        setPan({
          x: panStart.current.panX + (clientX - panStart.current.x),
          y: panStart.current.panY + (clientY - panStart.current.y),
        });
        return;
      }

      if (!dragging) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld(clientX - rect.left, clientY - rect.top);
      const newX = world.x - dragOffset.current.x;
      const newY = world.y - dragOffset.current.y;

      setNodePositions((prev) => ({
        ...prev,
        [dragging]: { x: newX, y: newY },
      }));

      if (simulationRef.current) {
        const node = simulationRef.current.nodes().find((n) => n.id === dragging);
        if (node) {
          node.fx = newX;
          node.fy = newY;
          simulationRef.current.alpha(0.1).restart();
        }
      }
    },
    [dragging, panning, screenToWorld],
  );

  const handleDragEnd = useCallback(() => {
    if (panning) {
      setPanning(false);
      return;
    }
    if (!dragging) return;
    if (simulationRef.current) {
      const node = simulationRef.current.nodes().find((n) => n.id === dragging);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
    setDragging(null);
  }, [dragging, panning]);

  // Pan on left-click drag on empty canvas (nodes call stopPropagation, so this only fires on empty space)
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Left-click (0) or middle-click (1) on empty area → pan
      if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        setPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan],
  );

  const handleSunClick = useCallback((personId: string) => {
    setActivePersonId(personId);
    setPersonPanelFocus(undefined);
    setActivePanel('person');
  }, []);

  const handlePlanetClick = useCallback((personId: string, action: 'identity' | 'stories' | 'media') => {
    setActivePersonId(personId);
    if (action === 'stories' || action === 'media') {
      setActivePanel('story');
    } else {
      setPersonPanelFocus(action);
      setActivePanel('person');
    }
  }, []);

  const handleAddPerson = useCallback(() => {
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
    setPersonPanelFocus(undefined);
  }, []);

  const activePerson = activePersonId
    ? state.persons.find((p) => p.id === activePersonId) ?? null
    : null;

  const allStories = state.persons.flatMap((p) =>
    p.stories.map((s) => ({ ...s, personName: p.displayName, personId: p.id })),
  );

  function isPersonDimmed(person: Person): boolean {
    if (!filterSeasonId) return false;
    return !person.stories.some((s) => s.seasonTag === filterSeasonId);
  }

  // Zoom controls
  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.15)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.15)), []);
  const zoomReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onMouseDown={handleCanvasMouseDown}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onContextMenu={(e) => e.preventDefault()}
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

        {/* Background layers — always fill viewport, not affected by zoom */}
        <MoietyRegions
          width={dimensions.width}
          height={dimensions.height}
          moietyNames={moietyNames}
        />
        <MilkyWay
          width={dimensions.width}
          height={dimensions.height}
          onClick={() => setActivePanel('river')}
        />

        {/* Zoom/Pan transform group — only interactive content */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Story satellite stars — each story orbits its person star as a smaller star.
              Impact score (1–10) pulls high-impact stories closer to the person. */}
          {state.persons.map((person) => {
            const pos = nodePositions[person.id];
            if (!pos || person.stories.length === 0) return null;
            const storyCount = person.stories.length;
            const personRadius = getStarRadius(storyCount);
            const chainOpacity = Math.min(0.15 + storyCount * 0.07, 0.65);

            return person.stories.map((story, i) => {
              const impact = impactScores[story.id] ?? null;
              const orbitRadius =
                impact !== null
                  ? personRadius + 8 + (10 - impact) * 2.6
                  : personRadius + 22;

              const angle = (i / storyCount) * Math.PI * 2 - Math.PI / 2;
              const sx = pos.x + Math.cos(angle) * orbitRadius;
              const sy = pos.y + Math.sin(angle) * orbitRadius;

              let storyColor = 'rgba(255,255,255,0.9)';
              if (state.seasonalCalendar && story.seasonTag !== 'unsure') {
                const season = getSeasonById(state.seasonalCalendar, story.seasonTag);
                if (season) storyColor = season.colorPalette.accentColor;
              }

              const glowR = impact !== null ? 4 + (impact / 10) * 4 : 5;
              const bodyR = impact !== null ? 2 + (impact / 10) * 1.5 : 2.5;

              return (
                <g
                  key={story.id}
                  className="cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setActiveStory({ story, personName: person.displayName }); }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Story: ${story.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveStory({ story, personName: person.displayName }); }}
                >
                  <circle cx={sx} cy={sy} r={10} fill="transparent" />
                  <line x1={pos.x} y1={pos.y} x2={sx} y2={sy} stroke="white" strokeOpacity={chainOpacity} strokeWidth={0.5} strokeDasharray="1.5 3" strokeLinecap="round" />
                  <circle cx={sx} cy={sy} r={glowR} fill={storyColor} opacity={chainOpacity * 0.18} filter="url(#starGlow)" />
                  <circle cx={sx} cy={sy} r={bodyR} fill={storyColor} opacity={Math.min(chainOpacity * 1.4, 1)} />
                  <circle cx={sx} cy={sy} r={bodyR * 0.4} fill="white" opacity={Math.min(chainOpacity * 1.6, 1)} />
                </g>
              );
            });
          })}

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

          {/* Solar system nodes */}
          {state.persons.map((person) => {
            const pos = nodePositions[person.id];
            if (!pos) return null;
            return (
              <SolarSystemNode
                key={person.id}
                person={person}
                x={pos.x}
                y={pos.y}
                isSelf={person.id === selfPersonId}
                currentSeasonId={state.currentSeasonId}
                moietyNames={moietyNames}
                seasonalCalendar={state.seasonalCalendar}
                connectionCount={connectionCounts[person.id] ?? 0}
                zoom={zoom}
                dimmed={isPersonDimmed(person)}
                onSunClick={() => handleSunClick(person.id)}
                onPlanetClick={(action) => handlePlanetClick(person.id, action)}
                onDragStart={handleDragStart(person.id)}
              />
            );
          })}
        </g>
      </svg>

      {/* Season indicator */}
      <SeasonIndicator />

      {/* Season wheel (bottom-left) */}
      <SeasonWheel
        activeSeasonFilter={filterSeasonId}
        onSeasonClick={setFilterSeasonId}
      />

      {/* Moiety name HTML overlays — positioned over the SVG moiety regions for hover tooltip support */}
      {moietyNames && dimensions.width > 0 && (
        <>
          <div
            className="absolute top-6 z-20 pointer-events-auto"
            style={{ left: `${dimensions.width * 0.25}px`, transform: 'translateX(-50%)' }}
          >
            <WordTooltip
              term={moietyNames[0]}
              definition={state.kinshipTemplate?.description}
            >
              <span
                className="text-[11px] font-light tracking-[0.15em] uppercase"
                style={{ color: 'rgba(212, 160, 87, 0.35)' }}
              >
                {moietyNames[0]}
              </span>
            </WordTooltip>
          </div>
          <div
            className="absolute top-6 z-20 pointer-events-auto"
            style={{ left: `${dimensions.width * 0.75}px`, transform: 'translateX(-50%)' }}
          >
            <WordTooltip
              term={moietyNames[1]}
              definition={state.kinshipTemplate?.description}
            >
              <span
                className="text-[11px] font-light tracking-[0.15em] uppercase"
                style={{ color: 'rgba(107, 127, 184, 0.35)' }}
              >
                {moietyNames[1]}
              </span>
            </WordTooltip>
          </div>
        </>
      )}

      {/* Zoom controls (bottom-left, above season wheel) */}
      <div className="absolute bottom-48 left-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={zoomIn}
          className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/[0.1]
            hover:bg-white/[0.15] transition-all flex items-center justify-center"
          aria-label="Zoom in"
        >
          <span className="text-white/70 text-lg font-light leading-none">+</span>
        </button>
        <button
          onClick={zoomReset}
          className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/[0.1]
            hover:bg-white/[0.15] transition-all flex items-center justify-center"
          aria-label="Reset zoom"
        >
          <span className="text-white/50 text-[10px] font-medium leading-none">{Math.round(zoom * 100)}%</span>
        </button>
        <button
          onClick={zoomOut}
          className="w-9 h-9 rounded-lg bg-white/[0.08] border border-white/[0.1]
            hover:bg-white/[0.15] transition-all flex items-center justify-center"
          aria-label="Zoom out"
        >
          <span className="text-white/70 text-lg font-light leading-none">&minus;</span>
        </button>
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        {/* Timeline button */}
        <button
          onClick={() => setActivePanel('timeline')}
          className="w-12 h-12 rounded-full
            bg-white/[0.08] border border-white/[0.1] backdrop-blur-sm
            hover:bg-white/[0.14] transition-all duration-200
            flex items-center justify-center group"
          aria-label="Timeline"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="text-white/60 group-hover:text-white/90 transition-colors"
          >
            <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="5" cy="9" r="1.5" fill="currentColor" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
            <circle cx="13" cy="9" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {/* Add person FAB */}
        <button
          onClick={handleAddPerson}
          className="w-12 h-12 rounded-full
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
      </div>

      {/* Settings / change region */}
      <button
        onClick={() => {
          if (confirm('Change your region? This will update your seasonal calendar and kinship template.')) {
            window.location.href = '/onboarding';
          }
        }}
        className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg
          bg-white/[0.04] border border-white/[0.06] text-white/50 text-xs
          hover:text-white/70 hover:bg-white/[0.06] transition-all"
      >
        {state.seasonalCalendar?.languageGroup ?? 'Settings'}
      </button>

      {/* Empty state */}
      {state.persons.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center animate-fade-in">
            <div className="w-4 h-4 rounded-full bg-white/30 mx-auto mb-4 animate-star-pulse" />
            <p className="text-white/40 text-sm">
              The sky is waiting for your family&apos;s stars.
            </p>
            <p className="text-white/25 text-xs mt-1">
              Tap + to add the first person.
            </p>
          </div>
        </div>
      )}

      {/* Panels */}
      {activePanel === 'addPerson' && (
        <QuickAddModal onClose={handleClosePanel} />
      )}
      {activePanel === 'person' && activePerson && (
        <PersonPanel
          person={activePerson}
          focusSection={personPanelFocus}
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
          onPersonClick={(personId) => handleSunClick(personId)}
        />
      )}
      {activePanel === 'timeline' && (
        <TimelinePanel
          onClose={handleClosePanel}
          onStoryClick={(personId) => handleSunClick(personId)}
        />
      )}

      {/* Story popup — appears when clicking a story satellite star */}
      {activeStory && (
        <StoryPopup
          story={activeStory.story}
          personName={activeStory.personName}
          seasonName={
            state.seasonalCalendar && activeStory.story.seasonTag !== 'unsure'
              ? getSeasonById(state.seasonalCalendar, activeStory.story.seasonTag)?.name
              : undefined
          }
          impactScore={impactScores[activeStory.story.id]}
          onClose={() => setActiveStory(null)}
        />
      )}
    </div>
  );
}
