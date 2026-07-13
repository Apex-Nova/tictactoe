/**
 * Rule preset types.
 *
 * The rule system is the most critical extensibility point in the engine.
 * Every behavioral decision the engine makes during a game is determined
 * by querying this config object — never by switching on a mode name.
 *
 * Adding a new rule variant = creating a new RulePreset object.
 * Zero changes to engine code.
 */

import type { BoardIndex, Player, ResolvedBoardBehavior, RulePresetId } from './primitives';

// ---------------------------------------------------------------------------
// Board resolution behaviors
// ---------------------------------------------------------------------------

/**
 * What happens when the active board constraint points to a board that
 * has already been won.
 */
export interface WonBoardBehavior {
  readonly type: ResolvedBoardBehavior;
}

/**
 * What happens when the active board constraint points to a board that
 * has already been drawn.
 */
export interface DrawnBoardBehavior {
  readonly type: ResolvedBoardBehavior;
}

// ---------------------------------------------------------------------------
// Control Draw: the redirecting player picks the next board
// ---------------------------------------------------------------------------

/**
 * In Preset B (Control Draw), when O is sent to a drawn board by X,
 * X gets to choose where O must play next.
 *
 * This callback is invoked by the engine when this situation arises.
 * In local multiplayer, the UI presents a board picker to player X.
 * In AI mode, the AI computes a strategic destination.
 * In online mode, the server emits a 'choose-redirect' event.
 *
 * The engine waits for this promise to resolve before continuing.
 */
export type ControlBoardChooser = (
  redirectingPlayer: Player,
  availableBoards: readonly BoardIndex[]
) => Promise<BoardIndex>;

// ---------------------------------------------------------------------------
// Full Rule Preset
// ---------------------------------------------------------------------------

export interface RulePreset {
  /** Stable identifier used for serialization and analytics. */
  readonly id: RulePresetId;

  /** Human-readable name shown in the UI. */
  readonly displayName: string;

  /** Short description shown in the match setup screen. */
  readonly description: string;

  /** Behavior when sent to a won board. */
  readonly wonBoardBehavior: WonBoardBehavior;

  /** Behavior when sent to a drawn board. */
  readonly drawnBoardBehavior: DrawnBoardBehavior;

  /**
   * Only required when drawnBoardBehavior.type === 'control-board'.
   * The engine will throw if this is missing in that configuration.
   */
  readonly controlBoardChooser?: ControlBoardChooser;

  /**
   * Whether a player may send their opponent to a board that is already
   * resolved (won or drawn). In some house rule variants, this is
   * disallowed even if the rule preset would otherwise permit free moves.
   *
   * Default: false (players may freely target any board)
   */
  readonly preventSendingToResolvedBoard?: boolean;

  /**
   * Whether a game ending in all 9 boards drawn (no macro winner) is
   * treated as a draw or requires further tiebreaking.
   *
   * Default: 'draw'
   */
  readonly globalDrawResolution?: 'draw' | 'tiebreak';
}
