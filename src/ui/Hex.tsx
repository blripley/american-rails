import { COMPANIES, CompanyId, Terrain } from '../engine/types';
import { CityInfo } from '../engine/board/boardTypes';
import { hexPolygon } from '../engine/board/hexGrid';

const TERRAIN_FILL: Record<Terrain, string> = {
  plains: '#d9b84a',
  forest: '#71803c',
  mountain: '#8b909a',
  city: '#efe6cf',
  water: '#2f5a74',
};

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

export function Hex({ cx, cy, size, terrain, city, cubes, developed, highlighted, onClick }: HexProps) {
  const cubeSize = size * 0.34;
  return (
    <g className={highlighted ? 'hex highlighted' : 'hex'} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <polygon
        points={hexPolygon(cx, cy, size)}
        fill={TERRAIN_FILL[terrain]}
        stroke={highlighted ? '#ffd76a' : '#3a352a'}
        strokeWidth={highlighted ? 3 : 1}
      />
      {city && (
        <>
          <text x={cx} y={cy - size * 0.32} textAnchor="middle" className="city-name" fontSize={size * 0.26}>
            {city.name}
          </text>
          <text x={cx} y={cy - size * 0.02} textAnchor="middle" className="city-value" fontSize={size * 0.34}>
            {city.full}/{city.shared}
          </text>
          {HUBS.has(city.name) && <rect x={cx - size * 0.62} y={cy - size * 0.18} width={size * 0.16} height={size * 0.16} fill="#111" />}
          {SPECIALS.has(city.name) && <circle cx={cx + size * 0.54} cy={cy - size * 0.1} r={size * 0.1} fill="#b8422f" />}
        </>
      )}
      {developed && <rect x={cx - cubeSize / 2} y={cy - size * 0.62} width={cubeSize} height={cubeSize} fill="#111" />}
      {cubes.map((c, i) => (
        <rect
          key={c}
          x={cx - cubes.length * cubeSize * 0.6 + i * cubeSize * 1.2}
          y={cy + size * 0.28}
          width={cubeSize}
          height={cubeSize}
          fill={COMPANIES[c].color}
          stroke="#222"
          strokeWidth={0.5}
        />
      ))}
    </g>
  );
}
