import { GameState, COMPANY_IDS, END_LOW_SUPPLIES } from './types';
import { cloneState } from './clone';

// Number of in-play supplies (each company's cube supply + the development-marker
// supply) with two or fewer remaining. The 3-player removed company is excluded.
export function suppliesLow(s: GameState): number {
  let count = 0;
  for (const id of COMPANY_IDS) {
    const c = s.companies[id]!;
    if (c.removed) continue;
    if (c.cubesInSupply <= 2) count += 1;
  }
  if (s.developmentSupply <= 2) count += 1;
  return count;
}

export function allSharesGone(s: GameState): boolean {
  return COMPANY_IDS.every((id) => s.companies[id]!.sharesInSupply === 0);
}

// Checked after a dividend. Ends the game (setting winnerIds to the richest
// players) when the year has reached 1857, all shares are gone, or enough
// supplies have run low. Otherwise returns the state unchanged.
export function checkGameEnd(s: GameState): GameState {
  const threshold = END_LOW_SUPPLIES[s.players.length]!;
  const ended = s.year >= 1857 || allSharesGone(s) || suppliesLow(s) >= threshold;
  if (!ended) return s;

  const next = cloneState(s);
  const most = Math.max(...next.players.map((p) => p.money));
  next.winnerIds = next.players.filter((p) => p.money === most).map((p) => p.id);
  next.phase = 'ended';
  next.activePlayerId = null;
  next.log.push(`Game over. Winner(s): ${next.winnerIds.map((id) => next.players.find((p) => p.id === id)!.name).join(', ')}.`);
  return next;
}
