import { GameState } from '../engine/types';
import { BoardDef } from '../engine/board/boardTypes';
import { hexPixel, parseCoord } from '../engine/board/hexGrid';
import { Hex } from './Hex';
import { TerrainDefs } from './terrainPatterns';

export interface BoardProps {
  board: BoardDef;
  state: GameState;
  highlighted?: Set<string>;
  onHexClick?: (hexId: string) => void;
}

const SIZE = 30; // hex radius in px

export function Board({ board, state, highlighted, onHexClick }: BoardProps) {
  const ids = Object.keys(board.hexes);

  // Compute pixel centres and the overall bounds for the viewBox.
  const centres = ids.map((id) => {
    const { col, row } = parseCoord(id);
    return { id, ...hexPixel(col, row, SIZE) };
  });
  const xs = centres.map((c) => c.x);
  const ys = centres.map((c) => c.y);
  const pad = SIZE * 1.4;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const width = Math.max(...xs) - Math.min(...xs) + pad * 2;
  const height = Math.max(...ys) - Math.min(...ys) + pad * 2;

  return (
    <svg
      className="board"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${minX} ${minY} ${width} ${height}`}
      role="img"
      aria-label="American Rails map"
    >
      <TerrainDefs />
      {centres.map(({ id, x, y }) => {
        const def = board.hexes[id]!;
        const hexState = state.hexes[id] ?? { cubes: [], developed: false };
        const isHi = highlighted?.has(id) ?? false;
        return (
          <Hex
            key={id}
            cx={x}
            cy={y}
            size={SIZE}
            terrain={def.terrain}
            city={def.city}
            cubes={hexState.cubes}
            developed={hexState.developed}
            highlighted={isHi}
            onClick={onHexClick && isHi ? () => onHexClick(id) : undefined}
          />
        );
      })}
    </svg>
  );
}
