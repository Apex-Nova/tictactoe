/**
 * GameService — pure, framework-independent bridge between engine and React.
 *
 * This is NOT a React hook. It has no React imports.
 * It wraps engine calls, adds error normalization, and provides helpers
 * the context/hooks use. This separation means the service is reusable
 * in React Native, a CLI test runner, or a Node.js online game server.
 */

import { classicEngine } from '@/game-engine/ClassicEngine';
import { superEngine } from '@/game-engine/SuperEngine';
import { getActiveBoards } from '@/game-engine/utils/boardUtils';
import type {
  BoardIndex,
  ClassicGameState,
  ClassicMove,
  CreateClassicGameOptions,
  CreateSuperGameOptions,
  MoveResult,
  RulePreset,
  SuperGameState,
  SuperMove,
} from '@/types';

// ── Classic ───────────────────────────────────────────────────────────────────

export function createClassicGame(options: CreateClassicGameOptions): ClassicGameState {
  return classicEngine.createGame(options);
}

export function applyClassicMove(
  state: ClassicGameState,
  move: ClassicMove,
): MoveResult<ClassicGameState> {
  return classicEngine.applyMove(state, move);
}

export function getClassicLegalMoves(state: ClassicGameState): readonly ClassicMove[] {
  return classicEngine.getLegalMoves(state);
}

// ── Super ─────────────────────────────────────────────────────────────────────

export function createSuperGame(options: CreateSuperGameOptions): SuperGameState {
  return superEngine.createGame(options);
}

export async function applySuperMove(
  state: SuperGameState,
  move: SuperMove,
  preset: RulePreset,
): Promise<MoveResult<SuperGameState>> {
  return superEngine.applyMove(state, move, preset);
}

export function resolveControlBoardChoice(
  state: SuperGameState,
  boardIndex: BoardIndex,
  preset: RulePreset,
): MoveResult<SuperGameState> {
  return superEngine.resolveControlBoardChoice(state, boardIndex, preset);
}

export function getSuperLegalMoves(state: SuperGameState): readonly SuperMove[] {
  return superEngine.getLegalMoves(state);
}

// ── Derived state helpers ─────────────────────────────────────────────────────

/** Returns the board indices where the current player may legally play. */
export function getPlayableBoardIndices(state: SuperGameState): readonly BoardIndex[] {
  if (state.phase !== 'active') return [];
  if (state.activeBoardIndex !== null) return [state.activeBoardIndex];
  return getActiveBoards(state.microBoards);
}

/** Returns the board indices available for Preset B control selection. */
export function getControlChoiceBoards(state: SuperGameState): readonly BoardIndex[] {
  if (state.phase !== 'awaiting-board-choice') return [];
  return getActiveBoards(state.microBoards);
}

/** Returns true if the given board is playable right now. */
export function isBoardPlayable(state: SuperGameState, boardIndex: BoardIndex): boolean {
  return getPlayableBoardIndices(state).includes(boardIndex);
}

/** Returns true if a cell is a legal destination for the current player. */
export function isCellLegal(
  state: SuperGameState,
  boardIndex: BoardIndex,
  cellIndex: number,
): boolean {
  if (state.phase !== 'active') return false;
  if (!isBoardPlayable(state, boardIndex)) return false;
  const board = state.microBoards[boardIndex];
  return board.status.kind === 'active' && board.cells[cellIndex] === null;
}
