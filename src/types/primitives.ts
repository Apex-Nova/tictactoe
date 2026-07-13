/**
 * Core primitive types.
 *
 * These are the atoms of the entire system. Every other type builds on these.
 * Keeping them as string/number literals (not enums) ensures they are:
 *   - JSON-serializable without transformation (multiplayer-ready)
 *   - Readable in logs and debug output
 *   - Importable in React Native without circular dependency risk
 */

/** The two players. 'X' always moves first by convention. */
export type Player = 'X' | 'O';

/** Returns the opponent of a given player. */
export type Opponent<P extends Player> = P extends 'X' ? 'O' : 'X';

/**
 * A 0-based index into a flat N×N grid.
 * Widened to `number` to support boards larger than 3×3.
 */
export type CellIndex = number;

/**
 * Alias used when referring to a position on the macro (outer) board.
 * Numerically identical to CellIndex but semantically distinct.
 */
export type BoardIndex = number;

/** The value stored in a single cell of a micro board. */
export type CellValue = Player | null;

/** Represents a row of cells in a TTT grid (variable length). */
export type Row = CellValue[];

/** A full N×N board as a flat array. Length = N². */
export type Grid = CellValue[];

/** Board size options — 3 through 6. */
export type BoardSize = 3 | 4 | 5 | 6;

/** All supported game mode identifiers. */
export type GameMode = 'classic' | 'super';

/** All supported AI difficulty levels. */
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

/** How a player slot is controlled. */
export type PlayerControlType = 'human' | 'ai' | 'remote';

/** Which rule preset is active. 'custom' means a user-defined RulePreset. */
export type RulePresetId = 'classic-ultimate' | 'control-draw' | 'portal-draw' | 'custom';

/**
 * What happens when a player is sent to an already-resolved board.
 *
 * free-move     — player may play in any open board
 * control-board — the redirecting player chooses the destination board
 * portal-board  — the sent player chooses any valid board
 */
export type ResolvedBoardBehavior = 'free-move' | 'control-board' | 'portal-board';
