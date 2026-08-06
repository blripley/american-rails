import { useState } from 'react';
import { createGame } from './engine/setup';
import { integrationBoard } from './engine/board/integrationBoard';
import type { GameState } from './engine/types';

// Placeholder shell for Stage 2. Real board, panels, and interactions land in
// the following tasks. For now it proves the engine + React pipeline works.
export function App() {
  const [game] = useState<GameState>(() =>
    createGame({ names: ['Ben', 'Wife', 'Friend 1', 'Friend 2'], seed: 5, board: integrationBoard }),
  );

  return (
    <div className="app">
      <header className="topbar">
        <h1>American Rails</h1>
        <span className="year">Year {game.year}</span>
      </header>
      <p className="status">
        Engine loaded. {game.players.length} players seated, {Object.keys(game.companies).length} companies ready.
      </p>
      <p className="hint">Board, panels, and click-to-play are being built next.</p>
    </div>
  );
}
