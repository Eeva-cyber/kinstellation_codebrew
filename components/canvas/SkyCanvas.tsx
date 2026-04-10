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
import { GalaxyBackground } from '@/components/landing/GalaxyBackground';
import { GalaxyShapes } from './GalaxyShapes';
import { MilkyWay } from './MilkyWay';
import { MoietyRegions } from './MoietyRegions';
import { SeasonalAmbient } from './SeasonalAmbient';
import { ConstellationLine } from './ConstellationLine';
import { SolarSystemNode } from './SolarSystemNode';
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
  const [activeStory, setActiveStory] = useState<{ story: Story; personName: string; personId: string } | null>(null);
  const [impactScores, setImpactScores] = useState<Record<string, number>>({});
  const scoringInFlight = useRef<Set<string>>(new Set());
  const dragOffset = useRef({ x: 0, y: 0 });
  const simulationRef = useRef<ReturnType<typeof forceSimulation<NodeDatum>> | null>(null);
  // Stable refs so the wheel handler (mounted once) always sees current values
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const nodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const activePersonIdRef = useRef<string | null>(null);
  const animRef = useRef<number | null>(null);
  const [filterSeasonIds, setFilterSeasonIds] = useState<string[]>([]);
  const [activeMoiety, setActiveMoiety] = useState<string | null>(null);

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const moietyNames = state.kinshipTemplate?.moietyNames;

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

  // Stable ref for dimensions (so wheel handler sees current size without re-mounting)
  const dimensionsRef = useRef({ width: 0, height: 0 });
  useEffect(() => { dimensionsRef.current = dimensions; }, [dimensions]);

  // Keep stable refs in sync with state (so wheel handler never needs re-mounting)
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { nodePositionsRef.current = nodePositions; }, [nodePositions]);
  useEffect(() => { activePersonIdRef.current = activePersonId; }, [activePersonId]);

  // Wheel zoom/pan handler — mounted once; reads current values from refs
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      // Let panel elements scroll natively
      if ((e.target as Element).closest?.('.panel-scroll')) return;
      e.preventDefault();

      // Input classification:
      //  • Pinch (macOS trackpad): e.ctrlKey === true
      //  • Two-finger scroll (trackpad): e.ctrlKey === false, deltaMode=0, |deltaY| < 50
      //  • Mouse wheel: e.ctrlKey === false, deltaMode=1 OR |deltaY| >= 50
      const isPinch = e.ctrlKey;
      const isMouseWheel = !e.ctrlKey && (e.deltaMode === 1 || Math.abs(e.deltaY) >= 50);
      const isTrackpadScroll = !e.ctrlKey && !isMouseWheel;

      if (isTrackpadScroll) {
        // Two-finger scroll → pan naturally
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        return;
      }

      // Zoom (pinch or mouse wheel)
      let rawDelta: number;
      if (isPinch) {
        rawDelta = e.deltaMode === 0 ? e.deltaY * 12 : e.deltaY * 150;
      } else {
        rawDelta = e.deltaMode === 0 ? e.deltaY : e.deltaY * 35;
      }

      // Regulated: capped at 18% per tick
      const factor = Math.min(Math.abs(rawDelta) * 0.0014, 0.18) * (rawDelta > 0 ? -1 : 1);

      const rect = el!.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      let pivotX = cursorX;
      let pivotY = cursorY;

      // Priority 1: if a person is selected, always zoom centered on their star
      const activeId = activePersonIdRef.current;
      const activePos = activeId ? nodePositionsRef.current[activeId] : null;

      if (activePos) {
        // Center-lock: keep active star at screen center during zoom
        const { width, height } = dimensionsRef.current;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * (1 + factor)));
        if (next !== currentZoom) {
          setZoom(next);
          setPan({ x: width / 2 - activePos.x * next, y: height / 2 - activePos.y * next });
        }
        return;
      } else {
        // Priority 2: snap to nearest star within 200 world-px of cursor
        const worldX = (cursorX - currentPan.x) / currentZoom;
        const worldY = (cursorY - currentPan.y) / currentZoom;
        let minDist = 200 / currentZoom;

        for (const pos of Object.values(nodePositionsRef.current)) {
          const d = Math.hypot(pos.x - worldX, pos.y - worldY);
          if (d < minDist) {
            minDist = d;
            pivotX = pos.x * currentZoom + currentPan.x;
            pivotY = pos.y * currentZoom + currentPan.y;
          }
        }
      }

      setZoom((prev) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * (1 + factor)));
        if (next === prev) return prev;
        const scale = next / prev;
        setPan((p) => ({
          x: pivotX - scale * (pivotX - p.x),
          y: pivotY - scale * (pivotY - p.y),
        }));
        return next;
      });
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // refs are stable — no deps needed

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

  // Pan on left-click drag on empty canvas — only for SVG elements, never HTML panels
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0 || e.button === 1) {
        if (!(e.target instanceof SVGElement)) return;
        // Cancel any in-flight centering animation so drag takes over immediately
        if (animRef.current) {
          cancelAnimationFrame(animRef.current);
          animRef.current = null;
        }
        e.preventDefault();
        setPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan],
  );

  // Animate the canvas to center a person's star in the viewport
  const centerOnPerson = useCallback((personId: string) => {
    const pos = nodePositionsRef.current[personId];
    if (!pos || !dimensions.width || !dimensions.height) return;

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    const startZoom = zoomRef.current;
    const startPan = { ...panRef.current };
    const targetZoom = Math.max(startZoom, 1.5);
    const targetPanX = dimensions.width / 2 - pos.x * targetZoom;
    const targetPanY = dimensions.height / 2 - pos.y * targetZoom;
    const startTime = performance.now();
    const DURATION = 520;

    function tick(now: number) {
      const rawT = Math.min((now - startTime) / DURATION, 1);
      const t = 1 - Math.pow(1 - rawT, 3); // ease-out cubic
      setZoom(startZoom + (targetZoom - startZoom) * t);
      setPan({
        x: startPan.x + (targetPanX - startPan.x) * t,
        y: startPan.y + (targetPanY - startPan.y) * t,
      });
      if (rawT < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    }
    animRef.current = requestAnimationFrame(tick);
  }, [dimensions]);

  const handleSunClick = useCallback((personId: string) => {
    setActivePersonId(personId);
    setPersonPanelFocus(undefined);
    setActivePanel('person');
    centerOnPerson(personId);
  }, [centerOnPerson]);

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

  function toggleSeasonFilter(id: string) {
    setFilterSeasonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function isPersonDimmed(person: Person): boolean {
    if (activeMoiety && person.moiety !== activeMoiety) return true;
    if (filterSeasonIds.length === 0) return false;
    return !person.stories.some((s) => filterSeasonIds.includes(s.seasonTag));
  }

  function isPersonBoosted(person: Person): boolean {
    if (filterSeasonIds.length === 0 && !activeMoiety) return false;
    if (activeMoiety && person.moiety !== activeMoiety) return false;
    if (filterSeasonIds.length === 0) return activeMoiety === person.moiety;
    return person.stories.some((s) => filterSeasonIds.includes(s.seasonTag));
  }

  // Zoom controls
  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.15)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.15)), []);
  const zoomReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden select-none ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onMouseDown={handleCanvasMouseDown}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Layer 1: Seasonal ambient background — color shifts with current season */}
      <SeasonalAmbient />

      {/* Layer 2: Rich star field — colored + twinkling + shooting stars */}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <GalaxyBackground />
      </div>

      {/* Layer 3: Distant galaxy shapes */}
      <GalaxyShapes />

      {/* Nebula color blobs — large soft glows like landing page */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 55% 45% at 15% 70%, rgba(107,47,212,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 85% 15%, rgba(212,164,84,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 35% 25% at 80% 80%, rgba(180,40,80,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 25% 20% at 28% 22%, rgba(90,30,180,0.06) 0%, transparent 70%)
          `
        }} />
      </div>

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
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ willChange: 'transform' }}>
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
              // High-impact stories orbit very close; low-impact orbit far out.
              // Range: score 10 → +8px from star edge; score 1 → +8+63 = +71px (63px spread).
              // This makes a 1-sentence story visibly far from the sun vs. a rich long story.
              const orbitRadius =
                impact !== null
                  ? personRadius + 8 + (10 - impact) * 7.0
                  : personRadius + 43; // pending: mid-range placeholder

              const angle = (i / storyCount) * Math.PI * 2 - Math.PI / 2;
              const sx = pos.x + Math.cos(angle) * orbitRadius;
              const sy = pos.y + Math.sin(angle) * orbitRadius;

              let storyColor = 'rgba(255,255,255,0.9)';
              if (state.seasonalCalendar && story.seasonTag !== 'unsure') {
                const season = getSeasonById(state.seasonalCalendar, story.seasonTag);
                if (season) storyColor = season.colorPalette.accentColor;
              }

              const glowR = impact !== null ? 6 + (impact / 10) * 5 : 7;
              const bodyR = impact !== null ? 3 + (impact / 10) * 2 : 4;

              // Per-story season dimming: matching stories shine bright, others fade
              const seasonMatch = filterSeasonIds.length === 0 || filterSeasonIds.includes(story.seasonTag);
              const effectiveOpacity = filterSeasonIds.length > 0
                ? (seasonMatch ? Math.min(chainOpacity * 2.0, 1.0) : chainOpacity * 0.08)
                : chainOpacity;

              return (
                <g
                  key={story.id}
                  className="cursor-pointer"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setActiveStory({ story, personName: person.displayName, personId: person.id }); }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Story: ${story.title}`}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveStory({ story, personName: person.displayName, personId: person.id }); }}
                >
                  {/* Larger transparent hit area for easier clicking */}
                  <circle cx={sx} cy={sy} r={16} fill="transparent" />
                  <line x1={pos.x} y1={pos.y} x2={sx} y2={sy} stroke="white" strokeOpacity={effectiveOpacity} strokeWidth={0.6} strokeDasharray="2 3.5" strokeLinecap="round" />
                  <circle cx={sx} cy={sy} r={glowR} fill={storyColor} opacity={effectiveOpacity * 0.2} filter="url(#starGlow)" />
                  <circle cx={sx} cy={sy} r={bodyR} fill={storyColor} opacity={Math.min(effectiveOpacity * 1.4, 1)} />
                  <circle cx={sx} cy={sy} r={bodyR * 0.38} fill="white" opacity={Math.min(effectiveOpacity * 1.6, 1)} />
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
                currentSeasonId={state.currentSeasonId}
                moietyNames={moietyNames}
                seasonalCalendar={state.seasonalCalendar}
                connectionCount={connectionCounts[person.id] ?? 0}
                zoom={zoom}
                dimmed={isPersonDimmed(person)}
                boosted={isPersonBoosted(person)}
                filterSeasonIds={filterSeasonIds}
                onSunClick={() => handleSunClick(person.id)}
                onPlanetClick={(action) => handlePlanetClick(person.id, action)}
                onDragStart={handleDragStart(person.id)}
              />
            );
          })}
        </g>
      </svg>

      {/* Season wheel (bottom-left) — hidden when timeline panel is open */}
      {activePanel !== 'timeline' && (
        <SeasonWheel
          activeSeasonFilters={filterSeasonIds}
          onSeasonClick={toggleSeasonFilter}
          onClearFilters={() => setFilterSeasonIds([])}
        />
      )}

      {/* Moiety name HTML overlays — click to filter, hover for tooltip */}
      {moietyNames && dimensions.width > 0 && (
        <>
          <div
            className="absolute top-6 z-20 pointer-events-auto"
            style={{ left: `${dimensions.width * 0.25}px`, transform: 'translateX(-50%)' }}
          >
            <WordTooltip term={moietyNames[0]} direction="down">
              <span
                onClick={(e) => { e.stopPropagation(); setActiveMoiety((prev) => prev === moietyNames[0] ? null : moietyNames[0]); }}
                className="cursor-pointer text-sm font-medium tracking-[0.18em] uppercase transition-all duration-300 select-none"
                style={{
                  color: activeMoiety === moietyNames[0] ? 'rgba(212,160,87,1)' : activeMoiety ? 'rgba(212,160,87,0.3)' : 'rgba(212,160,87,0.85)',
                  textShadow: activeMoiety === moietyNames[0]
                    ? '0 0 16px rgba(212,160,87,0.8), 0 0 36px rgba(212,160,87,0.4)'
                    : '0 0 12px rgba(212,160,87,0.5), 0 0 28px rgba(212,160,87,0.25)',
                }}
              >
                {moietyNames[0]}
              </span>
            </WordTooltip>
          </div>
          <div
            className="absolute top-6 z-20 pointer-events-auto"
            style={{ left: `${dimensions.width * 0.75}px`, transform: 'translateX(-50%)' }}
          >
            <WordTooltip term={moietyNames[1]} direction="down">
              <span
                onClick={(e) => { e.stopPropagation(); setActiveMoiety((prev) => prev === moietyNames[1] ? null : moietyNames[1]); }}
                className="cursor-pointer text-sm font-medium tracking-[0.18em] uppercase transition-all duration-300 select-none"
                style={{
                  color: activeMoiety === moietyNames[1] ? 'rgba(140,170,230,1)' : activeMoiety ? 'rgba(140,170,230,0.3)' : 'rgba(140,170,230,0.85)',
                  textShadow: activeMoiety === moietyNames[1]
                    ? '0 0 16px rgba(140,170,230,0.8), 0 0 36px rgba(140,170,230,0.4)'
                    : '0 0 12px rgba(140,170,230,0.5), 0 0 28px rgba(140,170,230,0.25)',
                }}
              >
                {moietyNames[1]}
              </span>
            </WordTooltip>
          </div>
        </>
      )}

      {/* Zoom controls — left edge, vertically centered. Fades in when hovering the zone. */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[50] flex flex-col gap-2 pl-3 pr-5 py-6 group/zoom">
        <button
          onClick={zoomIn}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover/zoom:opacity-100 -translate-x-2 group-hover/zoom:translate-x-0"
          style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(109,40,217,0.75)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(88,28,135,0.6)')}
          aria-label="Zoom in"
        >
          <span className="text-purple-100 text-2xl font-light leading-none">+</span>
        </button>
        <button
          onClick={zoomReset}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover/zoom:opacity-100 -translate-x-2 group-hover/zoom:translate-x-0"
          style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(109,40,217,0.75)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(88,28,135,0.6)')}
          aria-label="Reset zoom"
        >
          <span className="text-purple-200 text-[11px] font-semibold leading-none">{Math.round(zoom * 100)}%</span>
        </button>
        <button
          onClick={zoomOut}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover/zoom:opacity-100 -translate-x-2 group-hover/zoom:translate-x-0"
          style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(109,40,217,0.75)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(88,28,135,0.6)')}
          aria-label="Zoom out"
        >
          <span className="text-purple-100 text-2xl font-light leading-none">&minus;</span>
        </button>
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-3 items-end">
        {/* Timeline button */}
        <div className="flex items-center gap-3 group/tl">
          <span className="text-xs text-white/0 group-hover/tl:text-white/50 transition-all duration-200 tracking-wide font-light">
            Story timeline
          </span>
          <button
            onClick={() => setActivePanel('timeline')}
            className="w-14 h-14 rounded-2xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center group shadow-lg"
            style={{
              background: 'rgba(88,28,135,0.55)',
              border: '1px solid rgba(139,92,246,0.35)',
              boxShadow: '0 4px 24px rgba(88,28,135,0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(109,40,217,0.7)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
            aria-label="Timeline"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-purple-200/80 group-hover:text-purple-100 transition-colors">
              <line x1="4" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="6" cy="11" r="2" fill="currentColor" />
              <circle cx="11" cy="11" r="2" fill="currentColor" />
              <circle cx="16" cy="11" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Add person FAB */}
        <div className="flex items-center gap-3 group/add">
          <span className="text-xs text-white/0 group-hover/add:text-white/50 transition-all duration-200 tracking-wide font-light">
            Add a star
          </span>
          <button
            onClick={handleAddPerson}
            className="w-14 h-14 rounded-2xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center group shadow-lg"
            style={{
              background: 'rgba(88,28,135,0.55)',
              border: '1px solid rgba(212,164,84,0.3)',
              boxShadow: '0 4px 24px rgba(88,28,135,0.3)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(109,40,217,0.7)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
            aria-label="Add person"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-200/80 group-hover:text-amber-100 transition-colors">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
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
        <QuickAddModal
          onClose={handleClosePanel}
          onPersonAdded={(personId) => {
            setActivePersonId(personId);
            setActivePanel('person');
            centerOnPerson(personId);
          }}
        />
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
          onAddStoryForPerson={(personId) => {
            setActivePersonId(personId);
            setActivePanel('story');
          }}
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
          personId={activeStory.personId}
          personName={activeStory.personName}
          seasonName={
            state.seasonalCalendar && activeStory.story.seasonTag !== 'unsure'
              ? getSeasonById(state.seasonalCalendar, activeStory.story.seasonTag)?.name
              : undefined
          }
          impactScore={impactScores[activeStory.story.id]}
          onClose={() => setActiveStory(null)}
          onStoryUpdated={(updated) =>
            setActiveStory((prev) => prev ? { ...prev, story: updated } : null)
          }
        />
      )}
    </div>
  );
}
