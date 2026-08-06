import { americanRailsBoard } from '../src/engine/board/americanRails';
import { parseCoord } from '../src/engine/board/hexGrid';

const cells = Object.entries(americanRailsBoard.hexes).map(([id, def]) => {
  const { col, row } = parseCoord(id);
  const ch = def.city ? 'C' : def.terrain === 'plains' ? '.' : def.terrain === 'forest' ? 'f' : def.terrain === 'mountain' ? 'M' : '?';
  return { col, row, ch, city: def.city?.name };
});

const maxCol = Math.max(...cells.map((c) => c.col));
const maxRow = Math.max(...cells.map((c) => c.row));

// Text grid: odd columns nudged down half a line by interleaving.
for (let row = 0; row <= maxRow; row++) {
  let even = '';
  for (let col = 0; col <= maxCol; col++) {
    const cell = cells.find((c) => c.col === col && c.row === row);
    even += cell ? (col % 2 === 0 ? cell.ch : ' ') : '  '[0] ?? ' ';
    even += ' ';
  }
  let odd = ' ';
  for (let col = 0; col <= maxCol; col++) {
    const cell = cells.find((c) => c.col === col && c.row === row);
    odd += cell ? (col % 2 === 1 ? cell.ch : ' ') : ' ';
    odd += ' ';
  }
  console.log(even);
  console.log(odd);
}

console.log('\nCities by row:');
const byRow = new Map<number, string[]>();
for (const c of cells) if (c.city) (byRow.get(c.row) ?? byRow.set(c.row, []).get(c.row)!).push(`${c.city}(${c.col})`);
[...byRow.keys()].sort((a, b) => a - b).forEach((r) => console.log(`row ${r}:`, byRow.get(r)!.join(', ')));
console.log('\ntotal hexes:', cells.length);
