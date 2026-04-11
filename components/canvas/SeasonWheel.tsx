'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';

/**
 * Aboriginal season icons — culturally resonant motifs, not generic weather.
 *
 * Design language: dot art, animal tracks, fire/water/earth patterns,
 * concentric circles (meeting place), U-shapes (people sitting), spiral paths.
 */

// Map season IDs to icon category
const SEASON_ICON: Record<string, string> = {
  // Noongar (SW WA)
  birak: 'fire',        // First summer — fire and heat, zamia nuts
  bunuru: 'drought',    // Second summer — hottest/driest, cracked earth
  djeran: 'ants',       // Autumn — cooling, ant hills rising
  makuru: 'rain',       // Winter — cold rain and storms
  djilba: 'wattle',     // Late winter/spring — wattle blossoms
  kambarang: 'bloom',   // Wildflower season — flowering of the land

  // Yolngu (Arnhem Land)
  dharratharramirri: 'buildup', // Pre-wet heat buildup, lightning
  barramirri: 'monsoon',        // Wet monsoon, heavy rain, flooding
  mainmak: 'storm',             // Knock-em-down storms, tall grasses
  midawarr: 'harvest',          // Mid-dry, abundance and ceremony
  dharratharr: 'drysun',        // Late dry, cooler nights
  rarranhdharr: 'stars',        // Cool dry, stars and rest

  // D'harawal (Sydney Basin)
  ngoonungi: 'cool',       // Cool becoming cold
  wiritjiribin: 'cold',    // Coldest, short days
  tumburung: 'sprout',     // Cold becoming warm, growth stirs
  marrai_gang: 'warmrain', // Warm and wet
  gadalung_marool: 'heat', // Hot and dry, brightest
  burran: 'eel',           // Eel run, hot becoming cool

  // Torres Strait
  kuki: 'monsoon',     // NW monsoon, rough seas
  sager: 'tradewind',  // SE trade winds, calmer
  naigai: 'transition', // Transitional

  // Generic 6-season fallback
  fire_season: 'fire',
  rain_season: 'rain',
  harvest_season: 'harvest',
  cold_season: 'cold',
  flower_season: 'bloom',
  storm_season: 'storm',
};

/**
 * Each icon is drawn in a ~20×20 coordinate space, centered at (0,0).
 * Uses Aboriginal art motifs: dots, concentric circles, tracks, spirals.
 */
function SeasonIcon({ type, x, y, color, size = 1 }: {
  type: string; x: number; y: number; color: string; size?: number;
}) {
  const s = size;
  const dotR = 1.4 * s;

  const g = (children: React.ReactNode) => (
    <g transform={`translate(${x},${y})`} fill={color} stroke="none">
      {children}
    </g>
  );

  switch (type) {

    // ── FIRE — concentric arcs like flame tongues + ember dots ──
    case 'fire': return g(<>
      {/* Flame arcs */}
      {[0, 1, 2].map((i) => (
        <path key={i}
          d={`M ${-4 + i * 1.5} ${6 * s} Q ${-3 + i * 1.5} ${(0 - i * 2.5) * s} ${1 + i * 0.5} ${(-6 + i) * s}`}
          fill="none" stroke={color} strokeWidth={1.5 * s} strokeLinecap="round" opacity={1 - i * 0.25}
        />
      ))}
      {/* Ember dots at base */}
      {[[-3 * s, 7 * s], [0, 7.5 * s], [3 * s, 6.8 * s]].map(([ex, ey], i) => (
        <circle key={i} cx={ex} cy={ey} r={dotR * 0.8} opacity={0.9} />
      ))}
      {/* Heat shimmer dots */}
      <circle cx={-5 * s} cy={2 * s} r={dotR * 0.6} opacity={0.5} />
      <circle cx={5 * s} cy={0 * s} r={dotR * 0.6} opacity={0.5} />
    </>);

    // ── DROUGHT — cracked earth pattern + intense sun rays ──
    case 'drought': return g(<>
      {/* Cracked earth lines */}
      <path d="M 0 0 L 4 3 L 2 7" stroke={color} strokeWidth={1.2 * s} strokeLinecap="round" fill="none" />
      <path d="M 0 0 L -5 2 L -4 6" stroke={color} strokeWidth={1.2 * s} strokeLinecap="round" fill="none" />
      <path d="M 0 0 L 1 -5 L 4 -7" stroke={color} strokeWidth={1.2 * s} strokeLinecap="round" fill="none" />
      <path d="M 0 0 L -3 -4" stroke={color} strokeWidth={1.2 * s} strokeLinecap="round" fill="none" />
      {/* Central dot — meeting place symbol */}
      <circle cx={0} cy={0} r={2 * s} opacity={0.95} />
      <circle cx={0} cy={0} r={dotR * 0.5} fill="white" opacity={0.7} />
      {/* Outer rim dots */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <circle key={deg} cx={8 * s * Math.cos(rad)} cy={8 * s * Math.sin(rad)} r={dotR * 0.55} opacity={0.45} />;
      })}
    </>);

    // ── ANTS — ant tracks: three U-shapes (sitting people / ant bodies) ──
    case 'ants': return g(<>
      {/* Ant track U-shapes — Aboriginal "people sitting" motif */}
      {[[-4 * s, 2 * s, 0], [0, -3 * s, 45], [4 * s, 3 * s, -30]].map(([tx, ty, rot], i) => (
        <g key={i} transform={`translate(${tx},${ty}) rotate(${rot})`}>
          <path d={`M -2.5 0 Q -2.5 -4 0 -4 Q 2.5 -4 2.5 0`}
            stroke={color} strokeWidth={1.3 * s} fill="none" strokeLinecap="round" />
          <circle cx={-2.5} cy={0} r={dotR * 0.7} />
          <circle cx={2.5} cy={0} r={dotR * 0.7} />
        </g>
      ))}
      {/* Trail dots */}
      {[[-1 * s, 6 * s], [2 * s, 7 * s], [-3 * s, -6 * s]].map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={dotR * 0.55} opacity={0.6} />
      ))}
    </>);

    // ── RAIN — curved rain lines + water dots ──
    case 'rain': return g(<>
      {/* Rain drops as angled dashes */}
      {[-5, -2, 1, 4].map((ox, i) => (
        <line key={i}
          x1={ox * s} y1={(-4 + (i % 2) * 1.5) * s}
          x2={(ox - 2) * s} y2={(3 + (i % 2) * 1.5) * s}
          stroke={color} strokeWidth={1.4 * s} strokeLinecap="round" opacity={0.8 + (i % 2) * 0.15}
        />
      ))}
      {/* Cloud-like arc at top */}
      <path d="M -6 -5 Q -3 -8.5 0 -8.5 Q 3 -8.5 6 -5"
        stroke={color} strokeWidth={1.5 * s} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* Puddle dots at bottom */}
      {[-3 * s, 0, 3 * s].map((dx, i) => (
        <circle key={i} cx={dx} cy={7 * s} r={dotR * 0.65} opacity={0.6} />
      ))}
    </>);

    // ── WATTLE — wattle blossom: round pom-pom clusters ──
    case 'wattle': return g(<>
      {/* Stem */}
      <path d={`M 0 ${8 * s} Q 0 ${3 * s} -2 0`} stroke={color} strokeWidth={1.2 * s} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d={`M 0 ${8 * s} Q 1 ${4 * s} 3 ${1 * s}`} stroke={color} strokeWidth={1.2 * s} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* Wattle pom-poms — clusters of dots */}
      {[[-2, 0], [3, 1], [-4, -3], [1, -5], [4, -4]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx * s} cy={cy * s} r={2.2 * s} opacity={0.25} />
          {[0, 72, 144, 216, 288].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return <circle key={deg} cx={cx * s + 1.5 * s * Math.cos(r)} cy={cy * s + 1.5 * s * Math.sin(r)} r={dotR * 0.6} opacity={0.9} />;
          })}
          <circle cx={cx * s} cy={cy * s} r={dotR * 0.7} />
        </g>
      ))}
    </>);

    // ── BLOOM — wildflower: native bloom with petal dots ──
    case 'bloom': return g(<>
      {/* Petals using arcs */}
      {[0, 51, 102, 154, 205, 257, 308].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const px = 5 * s * Math.cos(rad);
        const py = 5 * s * Math.sin(rad);
        return (
          <ellipse key={deg} cx={px} cy={py} rx={1.8 * s} ry={3.2 * s}
            transform={`rotate(${deg}, ${px}, ${py})`}
            opacity={0.75} />
        );
      })}
      {/* Centre dot — meeting place circle */}
      <circle cx={0} cy={0} r={2.8 * s} opacity={0.9} />
      <circle cx={0} cy={0} r={dotR * 0.55} fill="white" opacity={0.85} />
      {/* Surrounding pollen dots */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return <circle key={deg} cx={3.2 * s * Math.cos(r)} cy={3.2 * s * Math.sin(r)} r={dotR * 0.45} opacity={0.5} />;
      })}
    </>);

    // ── BUILDUP — lightning + heat spiral (pre-wet season) ──
    case 'buildup': return g(<>
      {/* Spiral path outward */}
      <path d="M 0 0 Q 3 -3 4 0 Q 5 4 1 6 Q -4 7 -6 2 Q -7 -4 -2 -7"
        stroke={color} strokeWidth={1.3 * s} fill="none" strokeLinecap="round" opacity={0.55} />
      {/* Lightning bolt */}
      <path d={`M ${2 * s} ${-7 * s} L ${-1 * s} ${-1 * s} L ${1.5 * s} ${-1 * s} L ${-2 * s} ${7 * s}`}
        stroke={color} strokeWidth={1.6 * s} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.95} />
      {/* Energy dots */}
      {[[-5 * s, -3 * s], [5 * s, 2 * s], [3 * s, -5 * s], [-4 * s, 5 * s]].map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={dotR * 0.65} opacity={0.55} />
      ))}
    </>);

    // ── MONSOON — heavy curved rain bands ──
    case 'monsoon': return g(<>
      {/* Three sweeping rain arcs */}
      {[-4, 0, 4].map((ox, i) => (
        <path key={i}
          d={`M ${(ox - 2) * s} ${-5 * s} Q ${(ox + 1) * s} ${0 * s} ${(ox - 1) * s} ${6 * s}`}
          stroke={color} strokeWidth={(1.8 - i * 0.2) * s} strokeLinecap="round" fill="none"
          opacity={0.9 - i * 0.15}
        />
      ))}
      {/* Top cloud dots */}
      {[-4 * s, -1 * s, 2 * s, 5 * s].map((dx, i) => (
        <circle key={i} cx={dx} cy={-6 * s} r={dotR * (0.8 - i * 0.05)} opacity={0.6} />
      ))}
      {/* Water pool dots */}
      {[-3 * s, 0, 3 * s].map((dx, i) => (
        <circle key={i} cx={dx} cy={7.5 * s} r={dotR * 0.6} opacity={0.5} />
      ))}
    </>);

    // ── STORM — cyclone spiral + knock-em-down bent grass ──
    case 'storm': return g(<>
      {/* Spiral cyclone */}
      <path d="M 0 0 Q 3 -2 3 -5 Q 3 -8 0 -7 Q -6 -6 -6 0 Q -6 6 0 7 Q 7 7 7 0"
        stroke={color} strokeWidth={1.5 * s} fill="none" strokeLinecap="round" opacity={0.75} />
      {/* Bent grass blades */}
      {[-5, -2, 1, 4].map((ox, i) => (
        <path key={i}
          d={`M ${ox * s} ${8 * s} Q ${(ox + 3) * s} ${4 * s} ${(ox + 5) * s} ${2 * s}`}
          stroke={color} strokeWidth={1.2 * s} fill="none" strokeLinecap="round" opacity={0.6}
        />
      ))}
    </>);

    // ── HARVEST — abundance: concentric circles (ceremony ground) ──
    case 'harvest': return g(<>
      {/* Concentric ceremonial circles */}
      {[7 * s, 5 * s, 3 * s, 1.3 * s].map((r, i) => (
        <circle key={i} cx={0} cy={0} r={r} fill="none" stroke={color} strokeWidth={0.9 * s} opacity={0.35 + i * 0.18} />
      ))}
      {/* Centre dot */}
      <circle cx={0} cy={0} r={dotR} />
      {/* Radiating track dots — animal coming to water */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        return <circle key={deg} cx={6.5 * s * Math.cos(r)} cy={6.5 * s * Math.sin(r)} r={dotR * (i % 2 === 0 ? 0.75 : 0.45)} opacity={i % 2 === 0 ? 0.85 : 0.45} />;
      })}
    </>);

    // ── DRY SUN — late dry sun with heat shimmer dots ──
    case 'drysun': return g(<>
      {/* Sun circle */}
      <circle cx={0} cy={0} r={4 * s} fill="none" stroke={color} strokeWidth={1.2 * s} opacity={0.9} />
      <circle cx={0} cy={0} r={2 * s} opacity={0.95} />
      <circle cx={0} cy={0} r={dotR * 0.5} fill="white" opacity={0.8} />
      {/* Short rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const inner = 5 * s, outer = (i % 2 === 0 ? 8 : 6.5) * s;
        return <line key={deg} x1={Math.cos(rad) * inner} y1={Math.sin(rad) * inner}
          x2={Math.cos(rad) * outer} y2={Math.sin(rad) * outer}
          stroke={color} strokeWidth={(i % 2 === 0 ? 1.1 : 0.7) * s} strokeLinecap="round" opacity={0.7} />;
      })}
      {/* Shimmer dots below — heat rising */}
      {[-4 * s, -1.5 * s, 1 * s, 3.5 * s].map((dx, i) => (
        <circle key={i} cx={dx} cy={(i % 2 === 0 ? 9.5 : 8.5) * s} r={dotR * 0.5} opacity={0.35} />
      ))}
    </>);

    // ── STARS — cool dry, Milky Way dots ──
    case 'stars': return g(<>
      {/* Star field dots — varying sizes */}
      {[
        [0, 0, 2.2], [-5, -3, 1.4], [5, -4, 1.2], [-3, 4, 1.3], [4, 5, 1.4],
        [-6, 1, 1], [6, 2, 0.9], [1, -7, 1.1], [-2, 7, 1], [3, -2, 0.9],
        [-1, 3, 0.8], [2, 1, 0.7],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx * s} cy={cy * s} r={r * s} opacity={0.4 + (r as number / 2.2) * 0.55} />
      ))}
      {/* Milky Way arc */}
      <path d="M -7 5 Q 0 -2 7 -5" stroke={color} strokeWidth={0.8 * s} fill="none" opacity={0.3} />
    </>);

    // ── COOL — cooling air: wavy lines + morning dew dots ──
    case 'cool': return g(<>
      {/* Wavy cooling lines */}
      {[-4, 0, 4].map((oy, i) => (
        <path key={i}
          d={`M -7 ${oy * s} Q -3.5 ${(oy - 2.5) * s} 0 ${oy * s} Q 3.5 ${(oy + 2.5) * s} 7 ${oy * s}`}
          stroke={color} strokeWidth={(1.4 - i * 0.15) * s} fill="none" strokeLinecap="round"
          opacity={0.65 + i * 0.1}
        />
      ))}
      {/* Morning dew dots */}
      {[-5 * s, -1 * s, 3 * s].map((dx, i) => (
        <circle key={i} cx={dx} cy={7 * s} r={dotR * 0.7} opacity={0.5} />
      ))}
    </>);

    // ── COLD — winter: frost crystal pattern ──
    case 'cold': return g(<>
      {/* Snowflake/frost — 6 arms */}
      {[0, 60, 120].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <g key={deg}>
            <line x1={-7 * s * Math.cos(rad)} y1={-7 * s * Math.sin(rad)}
              x2={7 * s * Math.cos(rad)} y2={7 * s * Math.sin(rad)}
              stroke={color} strokeWidth={1.3 * s} strokeLinecap="round" opacity={0.85} />
            {/* Branch nodes */}
            {[-1, 1].map((dir) => {
              const bx = dir * 3.5 * s * Math.cos(rad), by = dir * 3.5 * s * Math.sin(rad);
              const pr = ((deg + 90) * Math.PI) / 180;
              return [2, -2].map((bl) => (
                <line key={`${dir}${bl}`}
                  x1={bx} y1={by}
                  x2={bx + bl * 2 * s * Math.cos(pr)} y2={by + bl * 2 * s * Math.sin(pr)}
                  stroke={color} strokeWidth={0.8 * s} strokeLinecap="round" opacity={0.65} />
              ));
            })}
          </g>
        );
      })}
      {/* Centre dot */}
      <circle cx={0} cy={0} r={dotR} />
    </>);

    // ── SPROUT — new growth emerging from earth ──
    case 'sprout': return g(<>
      {/* Earth line */}
      <line x1={-7 * s} y1={3 * s} x2={7 * s} y2={3 * s} stroke={color} strokeWidth={1.2 * s} strokeLinecap="round" opacity={0.5} />
      {/* Stem */}
      <path d={`M 0 ${3 * s} Q -1 ${-1 * s} 0 ${-4 * s}`} stroke={color} strokeWidth={1.5 * s} fill="none" strokeLinecap="round" />
      {/* Leaves */}
      <path d={`M 0 ${0 * s} Q -4 ${-2 * s} -5 ${-5 * s} Q -1 ${-3 * s} 0 ${0 * s}`} opacity={0.9} />
      <path d={`M 0 ${-2 * s} Q 4 ${-3 * s} 5 ${-7 * s} Q 1 ${-5 * s} 0 ${-2 * s}`} opacity={0.75} />
      {/* Earth dots */}
      {[-4 * s, -1.5 * s, 1.5 * s, 4 * s].map((dx, i) => (
        <circle key={i} cx={dx} cy={5 * s} r={dotR * 0.6} opacity={0.4} />
      ))}
    </>);

    // ── WARM RAIN — warm and wet: sun + rain together ──
    case 'warmrain': return g(<>
      {/* Sun arc above */}
      <path d="M -5 -4 Q 0 -9 5 -4" stroke={color} strokeWidth={1.4 * s} fill="none" strokeLinecap="round" opacity={0.8} />
      {[[-45, -7], [0, -8.5], [45, -7]].map(([deg, r], i) => {
        const rad = (deg * Math.PI) / 180;
        return <line key={i} x1={r * s * Math.cos(rad)} y1={r * s * Math.sin(rad)}
          x2={(r as number + 3) * s * Math.cos(rad)} y2={(r as number + 3) * s * Math.sin(rad)}
          stroke={color} strokeWidth={1 * s} strokeLinecap="round" opacity={0.65} />;
      })}
      {/* Rain below */}
      {[-4, -1, 2, 5].map((ox, i) => (
        <line key={i}
          x1={ox * s} y1={1 * s} x2={(ox - 1.5) * s} y2={(6 + (i % 2) * 1.5) * s}
          stroke={color} strokeWidth={1.3 * s} strokeLinecap="round" opacity={0.75}
        />
      ))}
    </>);

    // ── HEAT — intense hot and dry sun ──
    case 'heat': return g(<>
      {/* Intense sun — double ring */}
      <circle cx={0} cy={0} r={3.5 * s} opacity={0.95} />
      <circle cx={0} cy={0} r={dotR * 0.4} fill="white" opacity={0.9} />
      <circle cx={0} cy={0} r={5.5 * s} fill="none" stroke={color} strokeWidth={0.9 * s} opacity={0.4} />
      {/* Long hot rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const inner = 6.5 * s, outer = (i % 3 === 0 ? 9.5 : i % 3 === 1 ? 8.5 : 7.5) * s;
        return <line key={deg} x1={Math.cos(rad) * inner} y1={Math.sin(rad) * inner}
          x2={Math.cos(rad) * outer} y2={Math.sin(rad) * outer}
          stroke={color} strokeWidth={(i % 3 === 0 ? 1.4 : 0.9) * s} strokeLinecap="round" opacity={0.85} />;
      })}
    </>);

    // ── EEL — eel run: serpentine wave with water dots ──
    case 'eel': return g(<>
      {/* Eel body — sinuous curve */}
      <path d="M -7 4 Q -4 -1 -1 0 Q 2 1 4 -3 Q 5 -6 7 -5"
        stroke={color} strokeWidth={2.2 * s} fill="none" strokeLinecap="round" opacity={0.9} />
      {/* Head dot */}
      <circle cx={7 * s} cy={-5 * s} r={dotR * 1.1} />
      {/* Water flow dots */}
      {[[-5 * s, 6 * s], [-2 * s, 5.5 * s], [1 * s, 5 * s], [4 * s, 4.5 * s]].map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={dotR * (0.5 + i * 0.08)} opacity={0.45} />
      ))}
    </>);

    // ── TRADE WIND — SE trade winds: flowing lines across water ──
    case 'tradewind': return g(<>
      {/* Three sweeping wind lines */}
      {[[-3, -2], [0, 0.5], [3, 3]].map(([oy, d], i) => (
        <path key={i}
          d={`M -7 ${(oy) * s} Q ${d * s} ${(oy - 2) * s} 7 ${(oy + 1) * s}`}
          stroke={color} strokeWidth={(1.5 - i * 0.2) * s} fill="none" strokeLinecap="round"
          opacity={0.75 - i * 0.1}
        />
      ))}
      {/* Wave dots */}
      {[-5 * s, -1.5 * s, 2 * s, 5.5 * s].map((dx, i) => (
        <circle key={i} cx={dx} cy={(5 + (i % 2)) * s} r={dotR * 0.6} opacity={0.45} />
      ))}
    </>);

    // ── TRANSITION — change: half-and-half pattern ──
    case 'transition': return g(<>
      {/* Left half dots (old season) */}
      {[[-5, -3], [-4, 1], [-6, 4], [-2, -5]].map(([dx, dy], i) => (
        <circle key={i} cx={dx * s} cy={dy * s} r={dotR * (0.7 + i * 0.05)} opacity={0.45} />
      ))}
      {/* Dividing line */}
      <line x1={0} y1={-8 * s} x2={0} y2={8 * s} stroke={color} strokeWidth={0.8 * s} opacity={0.35} strokeDasharray={`${2 * s} ${2 * s}`} />
      {/* Right half connected circles */}
      <circle cx={4 * s} cy={-2 * s} r={2 * s} fill="none" stroke={color} strokeWidth={1.1 * s} opacity={0.7} />
      <circle cx={4 * s} cy={-2 * s} r={dotR * 0.6} />
      <circle cx={5 * s} cy={3 * s} r={1.5 * s} fill="none" stroke={color} strokeWidth={0.9 * s} opacity={0.55} />
      <circle cx={5 * s} cy={3 * s} r={dotR * 0.5} />
      {/* Joining arc */}
      <path d="M 2 -7 Q 5 0 2 7" stroke={color} strokeWidth={1.1 * s} fill="none" opacity={0.5} strokeLinecap="round" />
    </>);

    // ── DEFAULT: concentric circles (meeting place) ──
    default: return g(<>
      {[6 * s, 4 * s, 2.2 * s].map((r, i) => (
        <circle key={i} cx={0} cy={0} r={r} fill="none" stroke={color} strokeWidth={0.9 * s} opacity={0.3 + i * 0.25} />
      ))}
      <circle cx={0} cy={0} r={dotR} />
    </>);
  }
}

// ── Central sun symbol ─────────────────────────────────────────────────────────
function SunCenter({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const r = 7;
  return (
    <g>
      {/* Outer atmospheric glow */}
      <circle cx={cx} cy={cy} r={r + 10} fill={color} opacity={0.04} />
      <circle cx={cx} cy={cy} r={r + 6} fill={color} opacity={0.07} />
      {/* Rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const inner = r + 2, outer = r + (i % 2 === 0 ? 7 : 5);
        return (
          <line key={deg}
            x1={cx + Math.cos(rad) * inner} y1={cy + Math.sin(rad) * inner}
            x2={cx + Math.cos(rad) * outer} y2={cy + Math.sin(rad) * outer}
            stroke={color} strokeWidth={i % 2 === 0 ? 1.2 : 0.7}
            strokeLinecap="round" opacity={0.7}
          />
        );
      })}
      {/* Core */}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.2} />
      <circle cx={cx} cy={cy} r={r * 0.65} fill={color} opacity={0.5} />
      <circle cx={cx} cy={cy} r={r * 0.28} fill="white" opacity={0.75} />
    </g>
  );
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
  const [hoveredSeasonId, setHoveredSeasonId] = useState<string | null>(null);

  if (seasons.length === 0) return null;

  const size = 224;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 97;
  const innerR = 32;
  const arcCount = seasons.length;
  const gap = arcCount > 4 ? 0.02 : 0.012;

  function describeDonutArc(index: number): string {
    const startAngle = (2 * Math.PI * index) / arcCount - Math.PI / 2 + gap;
    const endAngle = (2 * Math.PI * (index + 1)) / arcCount - Math.PI / 2 - gap;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const ox1 = cx + outerR * Math.cos(startAngle), oy1 = cy + outerR * Math.sin(startAngle);
    const ox2 = cx + outerR * Math.cos(endAngle),   oy2 = cy + outerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(endAngle),   iy2 = cy + innerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle), iy1 = cy + innerR * Math.sin(startAngle);
    return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
  }

  const currentSeason = seasons.find((s) => s.id === currentSeasonId);
  const lastActiveId = activeSeasonFilters[activeSeasonFilters.length - 1] ?? null;
  const activeSeason = lastActiveId ? seasons.find((s) => s.id === lastActiveId) : null;
  const hoveredSeason = hoveredSeasonId ? seasons.find((s) => s.id === hoveredSeasonId) : null;
  const displaySeason = activeSeason ?? hoveredSeason ?? null;
  const centerColor = currentSeason?.colorPalette.accentColor ?? 'rgba(255,220,160,0.7)';

  // Gradient IDs per segment
  const gradIds = seasons.map((s) => `seg-grad-${s.id}`);

  return (
    <div className="absolute bottom-4 left-4 z-[50] select-none flex flex-col gap-1">
      {/* Season info card — shows on hover or when a filter is active; rendered above the wheel */}
      {displaySeason && (
        <div
          className="px-3 py-2 rounded-xl"
          style={{
            maxWidth: size,
            background: 'rgba(4,3,14,0.82)',
            border: '1px solid rgba(139,92,246,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: displaySeason.colorPalette.accentColor,
                boxShadow: `0 0 6px ${displaySeason.colorPalette.accentColor}`,
              }}
            />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {displaySeason.name}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {displaySeason.nameEnglish}
            </span>
          </div>
          <p className="text-[9px] mt-0.5 leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.22)' }}>
            {displaySeason.description.split('.')[0]}.
          </p>
          {activeSeasonFilters.length > 0 && (
            <button
              onClick={onClearFilters}
              className="mt-1.5 text-[9px] uppercase tracking-wider transition-colors"
              style={{ color: 'rgba(212,164,84,0.55)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(212,164,84,0.9)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(212,164,84,0.55)')}
            >
              clear {activeSeasonFilters.length > 1 ? `${activeSeasonFilters.length} filters` : 'filter'} ×
            </button>
          )}
        </div>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        <defs>
          {/* Radial gradient per segment */}
          {seasons.map((season, i) => (
            <radialGradient key={season.id} id={gradIds[i]} cx="50%" cy="50%" r="50%">
              <stop offset="40%" stopColor={season.colorPalette.accentColor} stopOpacity={0.55} />
              <stop offset="100%" stopColor={season.colorPalette.accentColor} stopOpacity={0.85} />
            </radialGradient>
          ))}

          <filter id="wheelGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="activeGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="centerGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={centerColor} stopOpacity={0.08} />
            <stop offset="100%" stopColor="black" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Background ambient glow */}
        <circle cx={cx} cy={cy} r={outerR + 12} fill="url(#wheelBg)" />

        {/* Outer decoration ring */}
        <circle cx={cx} cy={cy} r={outerR + 5} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <circle cx={cx} cy={cy} r={outerR + 1} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

        {/* Tick marks */}
        {seasons.map((_, i) => {
          const angle = (2 * Math.PI * i) / arcCount - Math.PI / 2;
          return (
            <line key={i}
              x1={cx + (outerR + 2) * Math.cos(angle)} y1={cy + (outerR + 2) * Math.sin(angle)}
              x2={cx + (outerR + 7) * Math.cos(angle)} y2={cy + (outerR + 7) * Math.sin(angle)}
              stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeLinecap="round"
            />
          );
        })}

        {/* Season segments */}
        {seasons.map((season, i) => {
          const isActive = activeSeasonFilters.includes(season.id);
          const isCurrent = currentSeasonId === season.id;
          const baseOpacity = isActive ? 1 : activeSeasonFilters.length > 0 ? 0.15 : isCurrent ? 0.82 : 0.44;

          const midAngle = (2 * Math.PI * (i + 0.5)) / arcCount - Math.PI / 2;
          const iconR = innerR + (outerR - innerR) * 0.5;
          const ix = cx + iconR * Math.cos(midAngle);
          const iy = cy + iconR * Math.sin(midAngle);
          const iconType = SEASON_ICON[season.id] ?? 'harvest';

          // Current season pulsing dot
          const dotR = outerR - 6;
          const dx = cx + dotR * Math.cos(midAngle);
          const dy = cy + dotR * Math.sin(midAngle);

          // Season name — inside segment for ≤4 seasons
          const showName = arcCount <= 4;
          const nameR = innerR + (outerR - innerR) * 0.82;
          const lx = cx + nameR * Math.cos(midAngle);
          const ly = cy + nameR * Math.sin(midAngle);

          return (
            <g key={season.id}
              onClick={() => onSeasonClick(season.id)}
              onMouseEnter={() => setHoveredSeasonId(season.id)}
              onMouseLeave={() => setHoveredSeasonId(null)}
              className="cursor-pointer"
              role="button"
              aria-label={`Filter by ${season.name}`}
            >
              <title>{season.name} · {season.nameEnglish}</title>

              {/* Active halo glow */}
              {isActive && (
                <path d={describeDonutArc(i)}
                  fill={season.colorPalette.accentColor}
                  opacity={0.28}
                  filter="url(#activeGlow)"
                  className="pointer-events-none"
                />
              )}

              {/* Current season soft glow */}
              {isCurrent && !isActive && (
                <path d={describeDonutArc(i)}
                  fill={season.colorPalette.accentColor}
                  opacity={0.15}
                  filter="url(#wheelGlow)"
                  className="pointer-events-none"
                />
              )}

              {/* Segment fill — gradient from inner to outer */}
              <path d={describeDonutArc(i)}
                fill={`url(#${gradIds[i]})`}
                opacity={baseOpacity}
                className="transition-opacity duration-300"
              />

              {/* Active border */}
              {isActive && (
                <path d={describeDonutArc(i)}
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth={1.8}
                  className="pointer-events-none"
                />
              )}

              {/* Icon */}
              <g opacity={Math.min(baseOpacity * 1.35, 1)} className="pointer-events-none">
                <SeasonIcon type={iconType} x={ix} y={iy} color="white" size={0.82} />
              </g>

              {/* Name label (wide arcs only) */}
              {showName && (
                <text x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize={8.5} fontWeight={isActive ? 700 : 400}
                  opacity={isActive ? 0.98 : Math.min(baseOpacity * 2, 0.85)}
                  className="pointer-events-none select-none"
                  style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.03em' }}
                >
                  {season.name.length > 8 ? season.name.slice(0, 7) + '…' : season.name}
                </text>
              )}

              {/* Abbreviated initials for dense wheels */}
              {!showName && (
                <text
                  x={cx + (innerR + 11) * Math.cos(midAngle)}
                  y={cy + (innerR + 11) * Math.sin(midAngle)}
                  textAnchor="middle" dominantBaseline="central"
                  fill="white" fontSize={6.5} fontWeight={400}
                  opacity={Math.min(baseOpacity * 1.5, 0.6)}
                  className="pointer-events-none select-none"
                  style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.06em' }}
                >
                  {season.name.slice(0, 3).toUpperCase()}
                </text>
              )}

              {/* Current season pulsing indicator dot */}
              {isCurrent && (
                <circle cx={dx} cy={dy} r={3.5}
                  fill="white" opacity={0.88}
                  className="pointer-events-none animate-star-pulse"
                />
              )}
            </g>
          );
        })}

        {/* Ring borders */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.7} />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={0.7} />

        {/* Dark inner disc */}
        <circle cx={cx} cy={cy} r={innerR - 1} fill="rgba(4,3,14,0.94)" />

        {/* Centre sun */}
        <g filter="url(#centerGlow)">
          <SunCenter cx={cx} cy={cy} color={centerColor} />
        </g>
      </svg>
    </div>
  );
}
