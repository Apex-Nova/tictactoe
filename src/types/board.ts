/**
 * Board state types.
 *
 * The board model is deliberately separated from GameState so it can be
 * reasoned about independently (e.g., win detection runs on a MicroBoard
 * without needing the full game tree).
 */

import type { BoardIndex, CellIndex, CellValue, Grid, Player } from './primitives'; // eslint-disable-line @typescript-eslint/no-unused-vars

// ---------------------------------------------------------------------------
// Micro Board (one of the 9 small TTT boards in Super mode)
// ---------------------------------------------------------------------------

/** The outcome status of a single micro board. */
export type MicroBoardStatus =
  | { kind: 'active' }
  | { kind: 'won'; winner: Player }
  | { kind: 'drawn' };

/**
 * One 3×3 micro board.
 *
 * `cells` is the canonical source of truth for cell content.
 * `status` is a derived/cached value recomputed after every move.
 * Caching avoids re-running win detection on every render.
 */
export interface MicroBoard {
  readonly index: BoardIndex;
  readonly cells: Grid;
  readonly status: MicroBoardStatus;
}

// ---------------------------------------------------------------------------
// Macro Board (the outer 3×3 board whose cells are MicroBoards)
// ---------------------------------------------------------------------------

/**
 * The macro cells that compose the Super board (N² entries for an N×N game).
 * Kept flat so macro win detection reuses the same checkWinner algorithm.
 */
export type MacroGrid = MacroCellValue[];

/**
 * The value of a macro cell.
 * null  → board is still active (not yet resolved)
 * 'D'   → board ended in a draw
 * Player → board was won by that player
 */
export type MacroCellValue = Player | 'D' | null;

/** The full Super Tic Tac Toe board structure. */
export interface SuperBoard {
  readonly microBoards: readonly MicroBoard[];
  readonly macroGrid: MacroGrid;
}

// ---------------------------------------------------------------------------
// Classic Board (simple 3×3)
// ---------------------------------------------------------------------------

export interface ClassicBoard {
  readonly cells: Grid;
}

// ---------------------------------------------------------------------------
// Move descriptor
// ---------------------------------------------------------------------------

/**
 * A fully-qualified move in Super mode.
 * boardIndex — which micro board (0–8)
 * cellIndex  — which cell within that board (0–8)
 */
export interface SuperMove {
  readonly boardIndex: BoardIndex;
  readonly cellIndex: CellIndex;
}

/** A move in Classic mode. Only a cell index is needed. */
export interface ClassicMove {
  readonly cellIndex: CellIndex;
}

/** Union of all move types — used in AI interface and history. */
export type Move = SuperMove | ClassicMove;

// ---------------------------------------------------------------------------
// Win lines
// ---------------------------------------------------------------------------

/**
 * A winning line — variable length to support boards larger than 3×3.
 * For a 3×3 board this will always be 3 cells; for 4×4 it is 4, etc.
 */
export type WinLine = readonly number[];

/** Legacy 3×3 win lines kept for AI evaluators that haven't been updated yet. */
export const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

export interface WinResult {
  readonly winner: Player;
  readonly line: WinLine;
}
