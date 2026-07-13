/**
 * GameState — the single source of truth for a game in progress.
 *
 * Design principles:
 *   1. Fully serializable: no functions, no class instances, no Symbols.
 *      The entire object can be JSON.stringify()'d and sent over a socket.
 *   2. Immutable at the type level: all fields are `readonly`.
 *      The engine always produces a new state object; it never mutates.
 *   3. Self-describing: the state contains everything needed to reconstruct
 *      the board, validate moves, render the UI, and replay the game.
 *   4. Mode-discriminated: a union type ensures Classic and Super states
 *      can never be confused. TypeScript narrows them correctly.
 */

import type { ClassicBoard, MacroCellValue, MicroBoard, SuperMove, WinResult } from './board';
import type { ClassicMove } from './board';
import type { AIDifficulty, BoardIndex, GameMode, Player, PlayerControlType, RulePresetId } from './primitives';

// ---------------------------------------------------------------------------
// Player slot configuration
// ---------------------------------------------------------------------------

export interface PlayerConfig {
  readonly player: Player;
  readonly displayName: string;
  readonly controlType: PlayerControlType;
  readonly difficulty?: AIDifficulty; // only when controlType === 'ai'
  readonly avatarId?: string;         // future cosmetics
  readonly userId?: string;           // future online accounts
}

// ---------------------------------------------------------------------------
// Move history
// ---------------------------------------------------------------------------

export interface HistoricalMove {
  readonly moveNumber: number;
  readonly player: Player;
  readonly move: SuperMove | ClassicMove;
  readonly timestamp: number; // epoch ms — needed for online replay sync
}

// ---------------------------------------------------------------------------
// Game phase
// ---------------------------------------------------------------------------

/**
 * The phase tracks the lifecycle of a game session.
 *
 * setup          → match not started yet (lobby / match setup screen)
 * active         → game in progress, awaiting a move
 * awaiting-board-choice → Preset B: the redirecting player must pick a board
 * finished       → game over, result determined
 * abandoned      → game was quit before finishing
 */
export type GamePhase =
  | 'setup'
  | 'active'
  | 'awaiting-board-choice'
  | 'finished'
  | 'abandoned';

// ---------------------------------------------------------------------------
// Game result
// ---------------------------------------------------------------------------

export type GameResult =
  | { kind: 'win'; winner: Player; winLine?: readonly number[] }
  | { kind: 'draw' }
  | { kind: 'abandoned' };

// ---------------------------------------------------------------------------
// Shared base for both game modes
// ---------------------------------------------------------------------------

interface BaseGameState {
  readonly id: string;               // UUID, used as session key for online play
  readonly mode: GameMode;
  readonly phase: GamePhase;
  readonly players: readonly [PlayerConfig, PlayerConfig];
  readonly currentPlayer: Player;
  readonly moveHistory: readonly HistoricalMove[];
  readonly result?: GameResult;
  readonly createdAt: number;        // epoch ms
  readonly updatedAt: number;        // epoch ms
  readonly presetId: RulePresetId;   // stored for serialization; actual preset injected separately
}

// ---------------------------------------------------------------------------
// Classic Tic Tac Toe state
// ---------------------------------------------------------------------------

export interface ClassicGameState extends BaseGameState {
  readonly mode: 'classic';
  readonly board: ClassicBoard;
  readonly boardSize: number; // side length; cells = boardSize²
}

// ---------------------------------------------------------------------------
// Super Tic Tac Toe state
// ---------------------------------------------------------------------------

export interface SuperGameState extends BaseGameState {
  readonly mode: 'super';
  readonly boardSize: number; // sub-board side length; macro board is also boardSize×boardSize
  readonly microBoards: readonly MicroBoard[];

  /**
   * The macro grid: a flat 9-element array where each element reflects
   * the resolved status of the corresponding micro board.
   * null = still active, 'D' = drawn, 'X'/'O' = won by that player.
   */
  readonly macroGrid: readonly MacroCellValue[];

  /**
   * The board index the current player MUST play in.
   * null means the player has a free move (can choose any active board).
   */
  readonly activeBoardIndex: BoardIndex | null;

  /**
   * Only set when phase === 'awaiting-board-choice' (Preset B).
   * Identifies which player must choose the redirect destination.
   */
  readonly redirectingPlayer?: Player;

  /**
   * If the macro game has been won, stores the winning line for
   * highlight animations.
   */
  readonly macroWinResult?: WinResult;
}

// ---------------------------------------------------------------------------
// Union type — narrows correctly with mode discriminant
// ---------------------------------------------------------------------------

export type GameState = ClassicGameState | SuperGameState;
