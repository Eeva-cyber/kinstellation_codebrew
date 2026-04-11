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
import { getSeasonById } from '@/lib/utils/season';
import { StarFieldBg } from './StarFieldBg';
import { GalaxyShapes } from './GalaxyShapes';
import { MilkyWay } from './MilkyWay';
import { MoietyRegions } from './MoietyRegions';
import { SeasonalAmbient } from './SeasonalAmbient';
import { ConstellationLine } from './ConstellationLine';
import { SolarSystemNode } from './SolarSystemNode';
import { SeasonIndicator } from './SeasonIndicator';
import { SeasonWheel } from './SeasonWheel';
import { PersonPanel } from '@/components/panels/PersonPanel';
import { MediaEntryView } from '@/components/panels/MediaEntryView';
import { StoryPanel } from '@/components/panels/StoryPanel';
import { AddConnectionPanel } from '@/components/panels/AddConnectionPanel';
import { StoriesRiverPanel } from '@/components/panels/StoriesRiverPanel';
import { QuickAddModal } from '@/components/panels/QuickAddModal';
import { TimelinePanel } from '@/components/panels/TimelinePanel';
import { StoryPopup } from '@/components/ui/StoryPopup';
import { WordTooltip } from '@/components/ui/WordTooltip';
import type { Person, Story, MediaEntry } from '@/lib/types';

type PanelType = 'person' | 'addPerson' | 'story' | 'connection' | 'river' | 'timeline' | null;

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.025;

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
  const [personPanelFocus, setPersonPanelFocus] = useState<'identity' | 'stories' | 'connections' | undefined>(undefined);
  const [dragging, setDragging] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<{ story: Story; personName: string; personId: string } | null>(null);
  const [activeMediaEntry, setActiveMediaEntry] = useState<{ entry: MediaEntry; person: Person } | null>(null);
  const [impactScores, setImpactScores] = useState<Record<string, number>>({});
  const scoringInFlight = useRef<Set<string>>(new Set());
  const dragOffset = useRef({ x: 0, y: 0 });
  const simulationRef = useRef<ReturnType<typeof forceSimulation<NodeDatum>> | null>(null);
  const [filterSeasonIds, setFilterSeasonIds] = useState<string[]>([]);
  const [activeMoiety, setActiveMoiety] = useState<string | null>(null);
  const [zoomVisible, setZoomVisible] = useState(false);
  const zoomHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showInviteOverlay, setShowInviteOverlay] = useState(false);
  const pendingCenterId = useRef<string | null>(null);

  // Refs that always hold the latest state — used by event handlers that can't be re-registered
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const activePersonIdRef = useRef<string | null>(null);
  const activePanelRef = useRef<PanelType>(null);
  const nodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  function toggleSeasonFilter(id: string) {
    setFilterSeasonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Keep refs in sync with latest state (used by wheel handler without re-registering)
  zoomRef.current = zoom;
  panRef.current = pan;
  activePersonIdRef.current = activePersonId;
  activePanelRef.current = activePanel;
  nodePositionsRef.current = nodePositions;

  const moietyNames = state.kinshipTemplate?.moietyNames;
  const [selfPersonId, setSelfPersonId] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem("kinstellation_self_id");
    if (stored) setSelfPersonId(stored);
  }, [state.persons]);

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

  // Helper: get the screen pivot point — either the active star or a given screen coord
  function getZoomPivot(fallbackX: number, fallbackY: number): { cx: number; cy: number } {
    const pid = activePersonIdRef.current;
    const panel = activePanelRef.current;
    if (pid && panel === 'person') {
      const pos = nodePositionsRef.current[pid];
      if (pos) {
        // Convert world coords to current screen coords
        return {
          cx: pos.x * zoomRef.current + panRef.current.x,
          cy: pos.y * zoomRef.current + panRef.current.y,
        };
      }
    }
    return { cx: fallbackX, cy: fallbackY };
  }

  // Wheel zoom/pan handler — platform-aware
  // • ctrlKey=true  → pinch gesture (macOS/Windows trackpad) OR Ctrl+scroll → ZOOM
  // • deltaMode=1   → mouse wheel line scroll → ZOOM
  // • deltaMode=0 no ctrlKey → trackpad two-finger scroll → PAN
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      // If the scroll originated inside a panel scrollable area, let the
      // browser handle it normally so the panel can scroll its own content.
      const target = e.target as Element | null;
      if (target) {
        const scrollable = target.closest(
          '.panel-scroll, .panel-scroll-x, .panel-scroll-col, [data-panel-scroll]',
        );
        if (scrollable) return; // don't preventDefault — let panel scroll naturally
      }

      e.preventDefault();

      const isZoomIntent = e.ctrlKey || e.metaKey || e.deltaMode === 1;

      if (isZoomIntent) {
        // ── Zoom ──────────────────────────────────────────────────────────────
        setZoomVisible(true);
        if (zoomHideTimer.current) clearTimeout(zoomHideTimer.current);
        zoomHideTimer.current = setTimeout(() => setZoomVisible(false), 2000);

        const prev = zoomRef.current;
        // Pinch gesture sends fractional ctrlKey-deltas; mouse wheel sends larger chunks
        const step = e.ctrlKey ? ZOOM_STEP * 0.6 : ZOOM_STEP;
        const delta = e.deltaY > 0 ? -step : step;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
        const scale = next / prev;

        const rect = el!.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const { cx, cy } = getZoomPivot(cursorX, cursorY);

        setPan((p) => ({
          x: cx - scale * (cx - p.x),
          y: cy - scale * (cy - p.y),
        }));
        setZoom(next);
      } else {
        // ── Pan (trackpad two-finger scroll) ──────────────────────────────────
        const dx = e.deltaX ?? 0;
        const dy = e.deltaY ?? 0;
        setPan((p) => ({ x: p.x - dx, y: p.y - dy }));
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    pendingCenterId.current = personId;
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

  const handleInvite = useCallback(async () => {
    setShowInviteOverlay((v) => !v);
    if (inviteLink) return;
    setInviteLoading(true);
    try {
      const res = await fetch('/api/invite/create', { method: 'POST' });
      const data = await res.json();
      if (data.token) setInviteLink(`${window.location.origin}/invite/${data.token}`);
    } catch { /* ignore */ }
    setInviteLoading(false);
  }, [inviteLink]);

  const activePerson = activePersonId
    ? state.persons.find((p) => p.id === activePersonId) ?? null
    : null;

  const allStories = state.persons.flatMap((p) =>
    p.stories.map((s) => ({ ...s, personName: p.displayName, personId: p.id })),
  );

  function isPersonDimmed(person: Person): boolean {
    // Dim if a moiety filter is active and person is NOT in it (including unassigned)
    if (activeMoiety && person.moiety !== activeMoiety) return true;
    if (filterSeasonIds.length > 0 && !person.stories.some((s) => filterSeasonIds.includes(s.seasonTag))) return true;
    return false;
  }

  function isPersonBoosted(person: Person): boolean {
    // Boosted = active moiety is set AND this person is explicitly in it
    return !!(activeMoiety && person.moiety === activeMoiety);
  }

  // Center on a person — accounts for the 22rem side panel when it's open
  function centerOnPerson(personId: string, withPanel = false) {
    const pos = nodePositions[personId];
    if (!pos || !containerRef.current) return;
    const { clientWidth: w, clientHeight: h } = containerRef.current;
    const PANEL_W = withPanel ? 352 : 0;
    setPan({ x: (w - PANEL_W) / 2 - pos.x * zoom, y: h / 2 - pos.y * zoom });
  }

  // Fire deferred centering after panel opens (pendingCenterId set by handleSunClick)
  useEffect(() => {
    const id = pendingCenterId.current;
    if (!id) return;
    pendingCenterId.current = null;
    centerOnPerson(id, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersonId, activePanel, nodePositions]);

  // Zoom controls — pivot on the active star when one is centered, else screen centre
  function applyZoomStep(step: number) {
    const prev = zoomRef.current;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + step));
    const scale = next / prev;
    const el = containerRef.current;
    const fallbackX = el ? el.clientWidth / 2 : 0;
    const fallbackY = el ? el.clientHeight / 2 : 0;
    const { cx, cy } = getZoomPivot(fallbackX, fallbackY);
    setPan((p) => ({
      x: cx - scale * (cx - p.x),
      y: cy - scale * (cy - p.y),
    }));
    setZoom(next);
  }
  const zoomIn  = useCallback(() => applyZoomStep(+0.15), []); // eslint-disable-line react-hooks/exhaustive-deps
  const zoomOut = useCallback(() => applyZoomStep(-0.15), []); // eslint-disable-line react-hooks/exhaustive-deps
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
      {/* Deep space base — matches landing page */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 100% 80% at 50% 0%, #100508 0%, #04030A 50%),
          radial-gradient(ellipse 60% 40% at 10% 60%, #0D0520 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 90% 40%, #100508 0%, transparent 60%),
          #04030A
        `,
      }} />

      {/* Nebula blobs */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 40% 30% at 15% 70%, rgba(107,47,212,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 50% 35% at 85% 30%, rgba(212,164,84,0.05) 0%, transparent 70%),
          radial-gradient(ellipse 40% 30% at 75% 85%, rgba(78,205,196,0.04) 0%, transparent 70%)
        `,
      }} />

      {/* Layer 1: Seasonal ambient background */}
      <SeasonalAmbient />

      {/* Layer 2: Decorative static star field + distant galaxies */}
      <StarFieldBg />
      <GalaxyShapes />

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

          {/* Constellation lines */}
          {state.relationships.map((rel) => {
            const fromPos = nodePositions[rel.fromPersonId];
            const toPos = nodePositions[rel.toPersonId];
            if (!fromPos || !toPos) return null;
            const fromPerson = state.persons.find((p) => p.id === rel.fromPersonId);
            const toPerson   = state.persons.find((p) => p.id === rel.toPersonId);

            let lineState: 'bright' | 'dim' | 'normal' = 'normal';
            if (activeMoiety) {
              const fromInActive = fromPerson?.moiety === activeMoiety;
              const toInActive   = toPerson?.moiety   === activeMoiety;
              lineState = (fromInActive && toInActive) ? 'bright' : 'dim';
            }

            return (
              <ConstellationLine
                key={rel.id}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                relationshipType={rel.relationshipType}
                isAvoidance={rel.isAvoidance}
                lineState={lineState}
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
                boosted={isPersonBoosted(person)}
                onSunClick={() => handleSunClick(person.id)}
                onStoryClick={(story) => setActiveStory({ story, personName: person.displayName, personId: person.id })}
                onPlanetClick={(action) => handlePlanetClick(person.id, action)}
                onMediaEntryClick={(entry) => setActiveMediaEntry({ entry, person })}
                onDragStart={handleDragStart(person.id)}
              />
            );
          })}
        </g>
      </svg>

      {/* Season indicator */}
      <SeasonIndicator />

      {/* Season wheel (bottom-left) — hidden when timeline panel is open */}
      {activePanel !== 'timeline' && (
        <SeasonWheel
          activeSeasonFilters={filterSeasonIds}
          onSeasonClick={toggleSeasonFilter}
          onClearFilters={() => setFilterSeasonIds([])}
        />
      )}

      {/* Moiety name overlays — bright, clickable, filter-aware */}
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

      {/* Zoom controls — left edge, hover-reveal */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[50] flex flex-col gap-2 pl-3 pr-5 py-6 group/zoom">
        <button onClick={zoomIn} aria-label="Zoom in"
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${zoomVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover/zoom:opacity-100 group-hover/zoom:translate-x-0'}`}
          style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(109,40,217,0.75)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(88,28,135,0.6)')}
        >
          <span className="text-purple-100 text-2xl font-light leading-none">+</span>
        </button>
        <button onClick={zoomReset} aria-label="Reset zoom"
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${zoomVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover/zoom:opacity-100 group-hover/zoom:translate-x-0'}`}
          style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(109,40,217,0.75)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(88,28,135,0.6)')}
        >
          <span className="text-purple-200 text-[11px] font-semibold leading-none">{Math.round(zoom * 100)}%</span>
        </button>
        <button onClick={zoomOut} aria-label="Zoom out"
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${zoomVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover/zoom:opacity-100 group-hover/zoom:translate-x-0'}`}
          style={{ background: 'rgba(88,28,135,0.6)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 12px rgba(139,92,246,0.2)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(109,40,217,0.75)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(88,28,135,0.6)')}
        >
          <span className="text-purple-100 text-2xl font-light leading-none">&minus;</span>
        </button>
      </div>

      {/* Invite overlay */}
      {showInviteOverlay && (
        <div
          className="absolute bottom-24 right-6 z-30 w-72 rounded-xl p-4 animate-fade-in"
          style={{ background: 'rgba(8,4,22,0.97)', border: '1px solid rgba(88,28,135,0.4)' }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs uppercase tracking-wider" style={{ color: 'rgba(212,164,84,0.7)' }}>
              Invite to your constellation
            </h3>
            <button
              onClick={() => setShowInviteOverlay(false)}
              className="text-white/30 hover:text-white/60 text-lg leading-none"
            >
              &times;
            </button>
          </div>
          {inviteLoading ? (
            <p className="text-xs text-white/30">Creating link…</p>
          ) : inviteLink ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/70 truncate"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2000);
                  }}
                  className="text-xs shrink-0 transition-colors"
                  style={{ color: inviteCopied ? 'rgba(212,164,84,0.9)' : 'rgba(212,164,84,0.5)' }}
                >
                  {inviteCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-white/20">Expires in 7 days. Share this link to connect your stars.</p>
            </div>
          ) : (
            <p className="text-xs text-red-400/60">Failed to create link. Try again.</p>
          )}
        </div>
      )}


      {/* Bottom toolbar — larger purple/gold FABs */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-3 items-end">
        <div className="flex items-center gap-3 group/tl">
          <span className="text-xs opacity-0 group-hover/tl:opacity-100 transition-all duration-200 tracking-wide font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Story timeline
          </span>
          <button
            onClick={() => setActivePanel('timeline')}
            className="w-14 h-14 rounded-2xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center group shadow-lg"
            style={{ background: 'rgba(88,28,135,0.55)', border: '1px solid rgba(139,92,246,0.35)', boxShadow: '0 4px 24px rgba(88,28,135,0.3)' }}
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
        <div className="flex items-center gap-3 group/inv">
          <span className="text-xs opacity-0 group-hover/inv:opacity-100 transition-all duration-200 tracking-wide font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Invite someone
          </span>
          <button
            onClick={handleInvite}
            className="w-14 h-14 rounded-2xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center group shadow-lg"
            style={{ background: 'rgba(88,28,135,0.55)', border: '1px solid rgba(212,164,84,0.3)', boxShadow: '0 4px 24px rgba(88,28,135,0.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(109,40,217,0.7)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(88,28,135,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
            aria-label="Invite to constellation"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" className="text-amber-200/80 group-hover:text-amber-100 transition-colors">
              <path d="M7.5 10.5a3.5 3.5 0 0 0 5 0l2-2a3.536 3.536 0 0 0-5-5l-1 1"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 7.5a3.5 3.5 0 0 0-5 0l-2 2a3.536 3.536 0 0 0 5 5l1-1"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-3 group/add">
          <span className="text-xs opacity-0 group-hover/add:opacity-100 transition-all duration-200 tracking-wide font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Add a star
          </span>
          <button
            onClick={handleAddPerson}
            className="w-14 h-14 rounded-2xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center group shadow-lg"
            style={{ background: 'rgba(88,28,135,0.55)', border: '1px solid rgba(212,164,84,0.3)', boxShadow: '0 4px 24px rgba(88,28,135,0.3)' }}
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

      {/* Scroll hint — bottom centre, fades after first wheel event */}
      {state.persons.length > 0 && !zoomVisible && activePanel === null && (
        <div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none animate-fade-in"
          style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          Scroll to pan · Ctrl + scroll or pinch to zoom · Drag to move stars
        </div>
      )}

      {/* Settings / change region */}
      <button
        onClick={() => {
          if (confirm('Change your region? This will update your seasonal calendar and kinship template.')) {
            window.location.href = '/canvas';
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
          isSelf={activePerson.id === selfPersonId}
          focusSection={personPanelFocus}
          onClose={handleClosePanel}
          onAddStory={(personId) => handleOpenStoryPanel(personId)}
          onAddConnection={(personId) => handleOpenConnectionPanel(personId)}
          onMediaEntryClick={(entry) => setActiveMediaEntry({ entry, person: activePerson })}
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
          onAddStoryForPerson={(personId) => handleOpenStoryPanel(personId)}
        />
      )}
      {activePanel === 'timeline' && (
        <TimelinePanel
          onClose={handleClosePanel}
          onStoryClick={(personId) => handleSunClick(personId)}
        />
      )}

      {/* Media entry full-screen overlay */}
      {activeMediaEntry && (
        <MediaEntryView
          entry={activeMediaEntry.entry}
          person={activeMediaEntry.person}
          onClose={() => setActiveMediaEntry(null)}
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
