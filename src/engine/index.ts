// Public API of the American Rails rules engine.
export * from './types';
export * from './board/boardTypes';
export { createGame } from './setup';
export type { CreateGameOptions } from './setup';
export { applyMove, legalMoves } from './game';
export type { Move } from './game';
export { testBoard, specialBoard } from './board/testBoard';
export { neighbors, isCity, cityInfo, connectedCities } from './board/board';
