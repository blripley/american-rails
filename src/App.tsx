import { useState } from 'react';
import { createGame } from './engine/setup';
import { americanRailsBoard } from './engine/board/americanRails';
import type { GameState } from './engine/types';
import { Board } from './ui/Board';

// Stage 2 in progress: the real board now renders. Panels and click-to-play
// interactions land in the following tasks.
export function App() {
  const [game] = useState<GameState>(() =>
    createGame({ names: ['Ben', 'Wife', 'Friend 1', 'Friend 2'], seed: 5, board: americanRailsBoard }),
  );

  return (
    <div className="app">
      <header className="topbar">
        <h1>American Rails</h1>
        <span className="year">Year {game.year}</span>
      </header>
      <main className="layout">
        <div className="board-wrap">
          <Board board={americanRailsBoard} state={game} />
        </div>
      </main>
    </div>
  );
}
