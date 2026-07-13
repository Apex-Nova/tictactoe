/**
 * Classic TTT board evaluator.
 *
 * Used by Medium (heuristic) and as the terminal-state evaluator for minimax.
 * For classic TTT, minimax with perfect play is the definitive evaluator —
 * this heuristic is only used at non-terminal nodes in depth-limited searches
 * (which shouldn't occur since the full classic tree is tiny).
 */

import type { CellValue, Player } from '@/types';
import { WIN_LINES } from '@/types';
import { WIN_SCORE, CELL_POSITION_VALUES } from '../types';
import type { AIPersonality } from '../types';
import { opponent } from '@/game-engine/utils/playerUtils';

/**
 * Evaluates a Classic board from the perspective of `aiPlayer`.
 * Positive = good for AI, negative = good for opponent.
 *
 * @param cells  9-element flat board array
 * @param aiPlayer  The AI's player symbol
 * @param depth  Current search depth (used to prefer faster wins)
 * @param personality  Evaluation weight modifiers
 */
export function evaluateClassicBoard(
  cells: readonly CellValue[],
  aiPlayer: Player,
  depth: number = 0,
  personality?: AIPersonality,
): number {
  const opp = opponent(aiPlayer);
  const attack = personality?.attackWeight ?? 1;
  const defense = personality?.defenseWeight ?? 1;
  const position = personality?.positionWeight ?? 1;

  let score = 0;

  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const vals = [cells[a], cells[b], cells[c]];

    const aiCount = vals.filter((v) => v === aiPlayer).length;
    const oppCount = vals.filter((v) => v === opp).length;

    // Skip mixed lines — they're dead
    if (aiCount > 0 && oppCount > 0) continue;

    if (aiCount === 3) return (WIN_SCORE - depth) * attack;
    if (oppCount === 3) return -(WIN_SCORE - depth) * defense;

    // Threat scoring: 2-in-a-row > 1-in-a-row
    if (aiCount === 2 && oppCount === 0) score += 10 * attack;
    if (aiCount === 1 && oppCount === 0) score += 1 * attack;
    if (oppCount === 2 && aiCount === 0) score -= 10 * defense;
    if (oppCount === 1 && aiCount === 0) score -= 1 * defense;
  }

  // Position bonuses
  for (let i = 0; i < 9; i++) {
    const posVal = CELL_POSITION_VALUES[i] * position;
    if (cells[i] === aiPlayer) score += posVal;
    else if (cells[i] === opp) score -= posVal;
  }

  return score;
}
