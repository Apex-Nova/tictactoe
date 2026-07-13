/**
 * Engine interface types.
 *
 * These types define the public contract of the game engine.
 * Components and hooks import from here — never from engine internals.
 * This boundary is what allows the engine to be tested in isolation and
 * reused in React Native without modification.
 */

import type { ClassicMove, SuperMove } from './board';
import type { BoardIndex } from './primitives';
import type { RulePreset } from './rules';
import type { ClassicGameState, GameResult, PlayerConfig, SuperGameState } from './game-state';

// ---------------------------------------------------------------------------
// Engine creation
// ---------------------------------------------------------------------------

export interface CreateClassicGameOptions {
  readonly players: readonly [PlayerConfig, PlayerConfig];
  readonly boardSize?: number; // default 3; win requires boardSize in a row
}

export interface CreateSuperGameOptions {
  readonly players: readonly [PlayerConfig, PlayerConfig];
  readonly preset: RulePreset;
  readonly boardSize?: number; // sub-board side length; macro board is same size
}

// ---------------------------------------------------------------------------
// Move application results
// ---------------------------------------------------------------------------

/** Returned by the engine after a move is applied. Always a new state object. */
export type MoveResult<S> =
  | { ok: true; state: S }
  | { ok: false; error: MoveError };

export type MoveError =
  | 'wrong-player'          // move submitted for a player who is not active
  | 'wrong-board'           // in Super mode: cell is in the wrong micro board
  | 'board-resolved'        // target micro board is already won or drawn
  | 'cell-occupied'         // target cell already has a mark
  | 'game-not-active'       // game is finished or not yet started
  | 'awaiting-board-choice' // Preset B: must resolve board choice first
  | 'invalid-board-choice'  // Preset B: chosen board is not valid
  | 'invalid-cell-index'    // index out of 0–8 range
  | 'invalid-board-index';  // index out of 0–8 range

// ---------------------------------------------------------------------------
// Engine interface (what hooks and services interact with)
// ---------------------------------------------------------------------------

export interface ClassicEngine {
  createGame(options: CreateClassicGameOptions): ClassicGameState;
  applyMove(state: ClassicGameState, move: ClassicMove): MoveResult<ClassicGameState>;
  getLegalMoves(state: ClassicGameState): readonly ClassicMove[];
}

export interface SuperEngine {
  createGame(options: CreateSuperGameOptions): SuperGameState;
  applyMove(state: SuperGameState, move: SuperMove, preset: RulePreset): Promise<MoveResult<SuperGameState>>;
  applyMoveSync(state: SuperGameState, move: SuperMove, preset: RulePreset): MoveResult<SuperGameState>;
  getLegalMoves(state: SuperGameState): readonly SuperMove[];
  resolveControlBoardChoice(state: SuperGameState, boardIndex: BoardIndex, preset: RulePreset): MoveResult<SuperGameState>;
}

// ---------------------------------------------------------------------------
// AI interface — pure function contract
// ---------------------------------------------------------------------------

/**
 * Every AI implementation — Easy, Medium, Hard, or a remote engine —
 * must satisfy this signature.
 *
 * The function is async to support:
 *   - Remote AI calls (future)
 *   - Heavy computation yielded to a worker thread
 *   - Simulated "thinking" delays in easy mode for UX
 */
export type ClassicAIMove = (
  state: ClassicGameState,
) => Promise<ClassicMove>;

export type SuperAIMove = (
  state: SuperGameState,
  preset: RulePreset,
) => Promise<SuperMove>;

// ---------------------------------------------------------------------------
// Validation function types
// ---------------------------------------------------------------------------

export type ValidateSuperMove = (
  state: SuperGameState,
  move: SuperMove,
) => MoveError | null;

export type ValidateClassicMove = (
  state: ClassicGameState,
  move: ClassicMove,
) => MoveError | null;
