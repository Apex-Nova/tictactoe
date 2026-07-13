/**
 * AI subsystem types.
 *
 * The AI layer is designed as a strategy pattern:
 *   - Each difficulty is an implementation of the same interface.
 *   - The engine and hooks never know which difficulty is active.
 *   - Future "online AI" (server-side minimax) just implements the same contract.
 */

import type { AIDifficulty, Player } from './primitives';
import type { ClassicAIMove, SuperAIMove } from './engine';

export interface AIStrategy {
  readonly difficulty: AIDifficulty;
  readonly player: Player;
  readonly computeClassicMove: ClassicAIMove;
  readonly computeSuperMove: SuperAIMove;

  /**
   * Optional: estimated thinking time in ms.
   * Used by the UI to show a "thinking" indicator of appropriate length.
   * Easy: ~200ms, Medium: ~500ms, Hard: up to 2000ms.
   */
  readonly estimatedDelayMs?: number;
}
