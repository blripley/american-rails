import { renderToStaticMarkup } from 'react-dom/server';
import { createElement as h } from 'react';
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { createGame } from '../src/engine/setup';
import { americanRailsBoard } from '../src/engine/board/americanRails';
import { Board } from '../src/ui/Board';

const OUT = process.argv[2] ?? 'board.png';
const game = createGame({ names: ['A', 'B', 'C', 'D'], seed: 5, board: americanRailsBoard });
const svg = renderToStaticMarkup(h(Board, { board: americanRailsBoard, state: game }));

// Board renders a full <svg>; hand it to resvg to rasterize at a fixed width.
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1600 }, background: '#14304a' }).render().asPng();
writeFileSync(OUT, png);
console.log('wrote', OUT);
