import { GameState, COMPANY_IDS, CompanyId } from './types';
import { cloneState } from './clone';

export function sharesHeldByPlayers(s: GameState, companyId: CompanyId): number {
  return s.players.reduce((n, p) => n + p.shares.filter((c) => c === companyId).length, 0);
}

// Pay each company's dividend: income divided by the number of its shares held by
// players, rounded up. Unsold and removed shares are excluded. Companies with no
// player-held shares pay nothing. Money comes from the bank.
export function payDividends(s: GameState): GameState {
  const next = cloneState(s);
  for (const id of COMPANY_IDS) {
    const held = sharesHeldByPlayers(next, id);
    if (held <= 0) continue;
    const perShare = Math.ceil(next.companies[id]!.income / held);
    if (perShare <= 0) continue;
    for (const p of next.players) {
      const owned = p.shares.filter((c) => c === id).length;
      if (owned > 0) p.money += perShare * owned;
    }
    next.log.push(`${id} paid $${perShare} per share.`);
  }
  return next;
}
