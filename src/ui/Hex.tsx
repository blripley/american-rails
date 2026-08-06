import { COMPANIES, CompanyId, Terrain } from '../engine/types';
import { CityInfo } from '../engine/board/boardTypes';
import { hexPolygon } from '../engine/board/hexGrid';
import { TERRAIN_PATTERN } from './terrainPatterns';

const HUBS = new Set(['New York', 'Baltimore', 'Philadelphia', 'Boston', 'Chicago']);
const SPECIALS = new Set(['Chicago', 'New York', 'Atlanta']);

export interface HexProps {
  cx: number;
  cy: number;
  size: number;
  terrain: Terrain;
  city?: CityInfo;
  cubes: CompanyId[];
  developed: boolean;
  highlighted: boolean;
  onClick?: () => void;
}

// A tiny cluster of "buildings" drawn behind the city label, echoing the board's
// engraved town illustrations.
function TownGlyph({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const s = size * 0.11;
  const b = (dx: number, dy: number, h: number) => (
    <rect x={cx + dx * s} y={cy + dy * s - h * s} width={s * 1.4} height={h * s} fill="#b9a67d" stroke="#7c6a44" strokeWidth={0.4} />
  );
  return (
    <g opacity={0.7}>
      {b(-2.4, 2.2, 2.6)}
      {b(-0.8, 2.2, 3.6)}
      {b(0.9, 2.2, 2.2)}
      {b(2.4, 2.2, 3.0)}
    </g>
  );
}

export function Hex({ cx, cy, size, terrain, city, cubes, developed, highlighted, onClick }: HexProps) {
  const cubeSize = size * 0.32;
  const points = hexPolygon(cx, cy, size);
  return (
    <g className={highlighted ? 'hex highlighted' : 'hex'} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <polygon points={points} fill={TERRAIN_PATTERN[terrain]} stroke="#2c2519" strokeWidth={1.1} />
      <polygon points={points} fill="url(#hex-vignette)" pointerEvents="none" />
      {highlighted && <polygon points={points} fill="none" stroke="#ffdd6b" strokeWidth={3} pointerEvents="none" />}

      {city && (
        <>
          <TownGlyph cx={cx} cy={cy + size * 0.06} size={size} />
          <text x={cx} y={cy - size * 0.34} textAnchor="middle" className="city-name" fontSize={size * 0.24}>
            {city.name}
          </text>
          <text x={cx} y={cy - size * 0.02} textAnchor="middle" className="city-value" fontSize={size * 0.38}>
            {city.full}/{city.shared}
          </text>
          {HUBS.has(city.name) && <rect x={cx - size * 0.66} y={cy - size * 0.5} width={size * 0.16} height={size * 0.16} fill="#161310" />}
          {SPECIALS.has(city.name) && <circle cx={cx + size * 0.56} cy={cy - size * 0.42} r={size * 0.1} fill="#b8422f" stroke="#5f1d13" strokeWidth={0.6} />}
        </>
      )}

      {developed && (
        <path
          d={`M ${cx - cubeSize * 0.7} ${cy - size * 0.52} l ${cubeSize * 0.7} ${-cubeSize * 0.55} l ${cubeSize * 0.7} ${cubeSize * 0.55} z M ${cx - cubeSize * 0.6} ${cy - size * 0.52} h ${cubeSize * 1.2} v ${cubeSize * 0.7} h ${-cubeSize * 1.2} z`}
          fill="#1a1712"
        />
      )}

      {cubes.map((c, i) => (
        <rect
          key={c}
          x={cx - cubes.length * cubeSize * 0.62 + i * cubeSize * 1.24}
          y={cy + size * 0.3}
          width={cubeSize}
          height={cubeSize}
          rx={1}
          fill={COMPANIES[c].color}
          stroke="#1c1c1c"
          strokeWidth={0.7}
        />
      ))}
    </g>
  );
}
