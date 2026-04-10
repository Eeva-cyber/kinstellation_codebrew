'use client';

/**
 * Static galaxy shapes rendered as SVG behind the interactive layer.
 * Three distant galaxies: upper-right (blue-white), lower-left (amber), mid-left (purple).
 * Uses viewBox 0-100 with preserveAspectRatio="none" so positions are % of screen.
 */
export function GalaxyShapes() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 3 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="gHaze1" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        <filter id="gHaze2" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id="gHaze3" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* ── Galaxy 1: upper-right — blue-white elongated spiral ── */}
      <g transform="rotate(-32, 78, 16)">
        {/* Outer diffuse disk */}
        <ellipse cx="78" cy="16" rx="13" ry="4.5" fill="rgba(200,220,255,0.05)" filter="url(#gHaze3)" />
        {/* Mid disk */}
        <ellipse cx="78" cy="16" rx="8" ry="2.8" fill="rgba(210,228,255,0.08)" filter="url(#gHaze1)" />
        {/* Core glow */}
        <ellipse cx="78" cy="16" rx="3.5" ry="1.2" fill="rgba(230,242,255,0.22)" filter="url(#gHaze2)" />
        {/* Bright nucleus */}
        <ellipse cx="78" cy="16" rx="0.9" ry="0.45" fill="rgba(255,255,255,0.65)" />
        {/* Disk star field — scattered bright dots */}
        <circle cx="72.5" cy="15.3" r="0.22" fill="rgba(255,255,255,0.55)" />
        <circle cx="74.8" cy="16.8" r="0.18" fill="rgba(255,255,255,0.45)" />
        <circle cx="76.2" cy="15.0" r="0.25" fill="rgba(220,235,255,0.6)" />
        <circle cx="79.5" cy="17.1" r="0.2"  fill="rgba(255,255,255,0.5)" />
        <circle cx="81.8" cy="15.7" r="0.22" fill="rgba(200,225,255,0.5)" />
        <circle cx="83.5" cy="16.5" r="0.15" fill="rgba(255,255,255,0.45)" />
        <circle cx="70.8" cy="16.2" r="0.16" fill="rgba(210,230,255,0.4)" />
      </g>

      {/* ── Galaxy 2: lower-left — warm amber-orange elliptical ── */}
      <g transform="rotate(22, 18, 76)">
        {/* Outer halo */}
        <ellipse cx="18" cy="76" rx="10" ry="3.5" fill="rgba(255,215,140,0.04)" filter="url(#gHaze3)" />
        {/* Disk */}
        <ellipse cx="18" cy="76" rx="5.5" ry="1.8" fill="rgba(255,225,155,0.09)" filter="url(#gHaze1)" />
        {/* Core */}
        <ellipse cx="18" cy="76" rx="2"   ry="0.75" fill="rgba(255,240,180,0.28)" filter="url(#gHaze2)" />
        {/* Nucleus */}
        <ellipse cx="18" cy="76" rx="0.65" ry="0.32" fill="rgba(255,255,220,0.7)" />
        {/* Stars */}
        <circle cx="13.5" cy="75.5" r="0.2"  fill="rgba(255,230,170,0.5)" />
        <circle cx="15.8" cy="76.8" r="0.16" fill="rgba(255,245,200,0.45)" />
        <circle cx="20.2" cy="75.2" r="0.22" fill="rgba(255,235,160,0.55)" />
        <circle cx="22.4" cy="76.5" r="0.18" fill="rgba(255,225,145,0.45)" />
      </g>

      {/* ── Galaxy 3: mid-left — small purple/violet ── */}
      <g transform="rotate(-18, 9, 44)">
        {/* Halo */}
        <ellipse cx="9" cy="44" rx="7" ry="2.4" fill="rgba(180,130,255,0.04)" filter="url(#gHaze3)" />
        {/* Disk */}
        <ellipse cx="9" cy="44" rx="3.8" ry="1.3" fill="rgba(195,155,255,0.1)" filter="url(#gHaze1)" />
        {/* Core */}
        <ellipse cx="9" cy="44" rx="1.4" ry="0.55" fill="rgba(215,185,255,0.25)" filter="url(#gHaze2)" />
        {/* Nucleus */}
        <ellipse cx="9" cy="44" rx="0.5" ry="0.25" fill="rgba(235,215,255,0.65)" />
        {/* Stars */}
        <circle cx="5.5"  cy="43.5" r="0.18" fill="rgba(200,170,255,0.45)" />
        <circle cx="11.8" cy="44.5" r="0.2"  fill="rgba(210,180,255,0.5)" />
        <circle cx="7.2"  cy="43.2" r="0.15" fill="rgba(225,200,255,0.4)" />
      </g>

      {/* ── Galaxy 4: upper-left corner — tiny distant smudge ── */}
      <g transform="rotate(10, 5, 12)">
        <ellipse cx="5" cy="12" rx="4.5" ry="1.5" fill="rgba(200,255,230,0.04)" filter="url(#gHaze3)" />
        <ellipse cx="5" cy="12" rx="1.8" ry="0.6" fill="rgba(180,255,215,0.1)"  filter="url(#gHaze2)" />
        <ellipse cx="5" cy="12" rx="0.5" ry="0.2" fill="rgba(220,255,240,0.6)" />
      </g>
    </svg>
  );
}
