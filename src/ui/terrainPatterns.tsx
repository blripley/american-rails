// Procedural SVG texture patterns that evoke the physical board's artwork:
// grass-blade strokes on plains, leaf clusters on forest, rocky peaks on
// mountains, and an aged-parchment wash. Original art is not reproduced; these
// are hand-built marks in the same spirit. Rendered once in the board <defs>.

export function TerrainDefs() {
  return (
    <defs>
      {/* Plains — golden ground with scattered grass blades */}
      <pattern id="pat-plains" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#d7b346" />
        <g stroke="#a97f25" strokeWidth="0.9" strokeLinecap="round" opacity="0.55">
          <path d="M3 13 l1.4 -4" /><path d="M4.4 13 l0 -4" /><path d="M5.8 13 l-1.4 -4" />
          <path d="M11 8 l1.4 -4" /><path d="M12.4 8 l0 -4" /><path d="M13.8 8 l-1.4 -4" />
        </g>
      </pattern>

      {/* Forest — olive ground with rounded tree/leaf clusters */}
      <pattern id="pat-forest" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="#6f7d38" />
        <g fill="#586128" opacity="0.6">
          <circle cx="5" cy="6" r="2.1" /><circle cx="8" cy="5" r="1.7" /><circle cx="6.5" cy="8.5" r="1.7" />
          <circle cx="13" cy="13" r="2.1" /><circle cx="15.5" cy="12" r="1.5" /><circle cx="14" cy="15.5" r="1.5" />
        </g>
      </pattern>

      {/* Mountain — grey rock with dark peak chevrons */}
      <pattern id="pat-mountain" width="20" height="16" patternUnits="userSpaceOnUse">
        <rect width="20" height="16" fill="#8b9099" />
        <g fill="none" stroke="#565a62" strokeWidth="1.1" opacity="0.65">
          <path d="M2 12 l4 -6 l4 6" /><path d="M11 13 l4 -6 l4 6" />
          <path d="M6 5 l2.5 -3 l2.5 3" />
        </g>
      </pattern>

      {/* City — pale parchment ground */}
      <pattern id="pat-city" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#efe7d2" />
        <circle cx="2" cy="3" r="0.5" fill="#cdbf9c" opacity="0.5" />
        <circle cx="6" cy="6" r="0.5" fill="#cdbf9c" opacity="0.5" />
      </pattern>

      {/* soft inner shadow for hex depth */}
      <radialGradient id="hex-vignette" cx="50%" cy="42%" r="60%">
        <stop offset="70%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#3a2f1a" stopOpacity="0.28" />
      </radialGradient>
    </defs>
  );
}

export const TERRAIN_PATTERN: Record<string, string> = {
  plains: 'url(#pat-plains)',
  forest: 'url(#pat-forest)',
  mountain: 'url(#pat-mountain)',
  city: 'url(#pat-city)',
  water: '#2f5a74',
};
