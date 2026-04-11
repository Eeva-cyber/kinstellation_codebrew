'use client';

import type { MediaEntry, Person } from '@/lib/types';
import { useApp } from '@/lib/store/AppContext';
import { getSeasonById } from '@/lib/utils/season';

interface MediaEntryViewProps {
  entry: MediaEntry;
  person: Person;
  onClose: () => void;
}

// Planet color palette per entry type/season
function getPlanetStyle(entry: MediaEntry, seasonalCalendar: ReturnType<typeof useApp>['state']['seasonalCalendar']) {
  if (entry.type === 'article') return { base: '#8898C8', glow: '#A0B4E8', ring: true, ringColor: '#B0C4F8' };
  if (entry.type === 'video')   return { base: '#C89848', glow: '#E8B860', ring: true, ringColor: '#F0CC80' };

  // Journal / Photo — use season color if available
  const tag = (entry as { seasonTag: string }).seasonTag;
  if (tag && tag !== 'unsure' && seasonalCalendar) {
    const season = getSeasonById(seasonalCalendar, tag);
    if (season) {
      return { base: season.colorPalette.accentColor, glow: season.colorPalette.accentColor, ring: false, ringColor: '' };
    }
  }
  // No season
  return { base: '#9890B8', glow: '#B0A8D0', ring: false, ringColor: '' };
}

function BigPlanet({ entry, style }: { entry: MediaEntry; style: ReturnType<typeof getPlanetStyle> }) {
  const isPhoto = entry.type === 'photo';
  const r = 110; // planet radius in SVG units

  return (
    <svg width="340" height="340" viewBox="0 0 340 340" className="mx-auto">
      <defs>
        <radialGradient id="bpg" cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="white"       stopOpacity={0.35} />
          <stop offset="30%"  stopColor={style.glow}  stopOpacity={0.9} />
          <stop offset="75%"  stopColor={style.base}  stopOpacity={1} />
          <stop offset="100%" stopColor={style.base}  stopOpacity={0.55} />
        </radialGradient>
        <clipPath id="bpc"><circle cx={170} cy={170} r={r} /></clipPath>
        <filter id="bpglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="bpglow2" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="22" result="blur" />
          <feMerge><feMergeNode in="blur" /></feMerge>
        </filter>
      </defs>

      {/* Outer atmosphere haze */}
      <circle cx={170} cy={170} r={r + 55} fill={style.glow} opacity={0.04} />
      <circle cx={170} cy={170} r={r + 35} fill={style.glow} opacity={0.07} />
      <circle cx={170} cy={170} r={r + 18} fill={style.glow} opacity={0.13} />

      {/* Ring system (articles/videos) — behind planet */}
      {style.ring && (
        <>
          <ellipse cx={170} cy={170} rx={r * 1.95} ry={r * 0.38}
            fill="none" stroke={style.ringColor} strokeWidth={14} opacity={0.18} />
          <ellipse cx={170} cy={170} rx={r * 1.65} ry={r * 0.32}
            fill="none" stroke={style.ringColor} strokeWidth={9}  opacity={0.28} />
          <ellipse cx={170} cy={170} rx={r * 1.38} ry={r * 0.26}
            fill="none" stroke={style.ringColor} strokeWidth={5}  opacity={0.40} />
        </>
      )}

      {/* Planet body */}
      <circle cx={170} cy={170} r={r} fill={`url(#bpg)`} filter="url(#bpglow)" />

      {/* Gas bands */}
      <rect x={170 - r} y={170 - r * 0.45} width={r * 2} height={r * 0.22}
        fill={style.base} opacity={0.25} clipPath="url(#bpc)" />
      <rect x={170 - r} y={170 + r * 0.10} width={r * 2} height={r * 0.18}
        fill={style.glow} opacity={0.18} clipPath="url(#bpc)" />
      <rect x={170 - r} y={170 - r * 0.75} width={r * 2} height={r * 0.12}
        fill="white" opacity={0.08} clipPath="url(#bpc)" />

      {/* Photo golden border ring */}
      {isPhoto && (
        <circle cx={170} cy={170} r={r + 6}
          fill="none" stroke="#D4A454" strokeWidth={2.5} opacity={0.7} />
      )}

      {/* Specular highlight */}
      <circle cx={170 - r * 0.28} cy={170 - r * 0.32} r={r * 0.28}
        fill="white" opacity={0.22} clipPath="url(#bpc)" />

      {/* Ring system — front portion (articles/videos) */}
      {style.ring && (
        <>
          <ellipse cx={170} cy={170} rx={r * 1.95} ry={r * 0.38}
            fill="none" stroke={style.ringColor} strokeWidth={14} opacity={0.12}
            strokeDasharray={`${r * 6.1} ${r * 6.1}`} strokeDashoffset={r * 3.05} />
          <ellipse cx={170} cy={170} rx={r * 1.65} ry={r * 0.32}
            fill="none" stroke={style.ringColor} strokeWidth={9} opacity={0.20}
            strokeDasharray={`${r * 5.2} ${r * 5.2}`} strokeDashoffset={r * 2.6} />
        </>
      )}
    </svg>
  );
}

export function MediaEntryView({ entry, person, onClose }: MediaEntryViewProps) {
  const { state } = useApp();
  const style = getPlanetStyle(entry, state.seasonalCalendar);

  const seasonName = (() => {
    if (entry.type === 'article' || entry.type === 'video') return null;
    if (entry.seasonTag === 'unsure' || !state.seasonalCalendar) return null;
    return getSeasonById(state.seasonalCalendar, entry.seasonTag)?.name ?? null;
  })();

  const formattedDate = (() => {
    if (entry.type === 'article' || entry.type === 'video') return null;
    if (!entry.date) return null;
    const d = new Date(entry.date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="absolute inset-0 z-50 flex animate-fade-in" style={{ background: 'rgba(3,4,18,0.97)' }}>

      {/* Left — large planet */}
      <div className="flex flex-col items-center justify-center flex-shrink-0"
        style={{ width: '45%', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <BigPlanet entry={entry} style={style} />
        <p className="mt-4 text-xs tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.25)' }}>
          {entry.type}
        </p>
        <p className="mt-1 text-sm font-medium text-center px-6"
          style={{ color: 'rgba(212,164,84,0.8)' }}>
          {person.displayName}
        </p>
      </div>

      {/* Right — content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-medium leading-snug"
              style={{ color: 'rgba(255,255,255,0.88)' }}>
              {entry.type === 'article' || entry.type === 'video' ? entry.title : entry.type === 'photo' ? entry.caption : entry.title}
            </h2>
            {/* Date / season */}
            {(formattedDate || seasonName) && (
              <div className="flex items-center gap-2 mt-2">
                {seasonName && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: `${style.base}22`,
                      border: `1px solid ${style.base}44`,
                      color: style.glow,
                    }}>
                    {seasonName}
                  </span>
                )}
                {formattedDate && (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {formattedDate}
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
            aria-label="Close">
            &times;
          </button>
        </div>

        {/* ── Journal content ── */}
        {entry.type === 'journal' && (
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              {entry.text}
            </p>
          </div>
        )}

        {/* ── Photo content ── */}
        {entry.type === 'photo' && (
          <div>
            <div className="rounded-xl overflow-hidden mb-4"
              style={{ border: '2px solid rgba(212,164,84,0.5)', boxShadow: '0 0 24px rgba(212,164,84,0.12)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.imageData} alt={entry.caption}
                className="w-full object-cover" style={{ maxHeight: '400px' }} />
            </div>
            {entry.caption && (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {entry.caption}
              </p>
            )}
          </div>
        )}

        {/* ── Article / Video content ── */}
        {(entry.type === 'article' || entry.type === 'video') && (
          <div className="space-y-5">
            {entry.note && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'rgba(255,255,255,0.65)' }}>
                {entry.note}
              </p>
            )}
            <a href={entry.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: 'rgba(212,164,84,0.12)',
                border: '1px solid rgba(212,164,84,0.3)',
                color: 'rgba(212,164,84,0.9)',
              }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M6 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8M9 1h4m0 0v4m0-4L6 8"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {entry.type === 'video' ? 'Watch video' : 'Read article'}
            </a>
          </div>
        )}


      </div>
    </div>
  );
}
