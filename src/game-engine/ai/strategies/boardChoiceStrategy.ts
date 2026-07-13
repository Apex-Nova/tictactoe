/**
 * Control Draw board-choice strategies (Preset B).
 *
 * Called when state.phase === 'awaiting-board-choice'.
 * The redirecting player selects where their opponent must play.
 *
 * Strategy per difficulty:
 *   Easy:   random valid board
 *   Medium: pick board most advantageous to AI (hardest for opponent)
 *   Hard:   pick board where opponent has fewest winning threats
 *   Expert: full minimax over board choices
 */

import type { BoardIndex, Player, RulePreset, SuperGameState } from '@/types';
import type { AIStrategyConfig, BoardChoiceStrategy } from '../types';
import { MACRO_BOARD_VALUES, CELL_POSITION_VALUES } from '../types';
import { evaluateSuperState } from '../evaluators/superEvaluator';
import { superEngine } from '@/game-engine/SuperEngine';
import { opponent } from '@/game-engine/utils/playerUtils';

export const randomBoardChoice: BoardChoiceStrategy = (
  _state,
  _aiPlayer,
  availableBoards,
  _preset,
  config,
): BoardIndex => {
  if (config.seed !== undefined) {
    const idx = ((config.seed * 1664525 + 1013904223) & 0xffffffff) >>> 0;
    return availableBoards[idx % availableBoards.length];
  }
  return availableBoards[Math.floor(Math.random() * availableBoards.length)];
};

export const tacticalBoardChoice: BoardChoiceStrategy = (
  state: SuperGameState,
  aiPlayer: Player,
  availableBoards: readonly BoardIndex[],
  preset: RulePreset,
  _config: AIStrategyConfig,
): BoardIndex => {
  const opp = opponent(aiPlayer);
  let bestBoard = availableBoards[0];
  let bestScore = -Infinity;

  for (const boardIndex of availableBoards) {
    const board = state.microBoards[boardIndex];
    const macroVal = MACRO_BOARD_VALUES[boardIndex];

    // Prefer boards where opponent has fewer marks and harder positions
    const oppCells = board.cells.filter((c) => c === opp).length;
    const aiCells = board.cells.filter((c) => c === aiPlayer).length;
    const emptyCells = board.cells.filter((c) => c === null).length;

    // Send opponent to boards where they have fewer pieces (harder for them)
    let score = macroVal * 2 + aiCells * 3 - oppCells * 5;

    // If opponent is close to winning there, avoid it (unless we want to block them)
    const oppThreats = countThreats(board.cells, opp);
    score -= oppThreats * 8;

    // Prefer boards where we have threats (opponent has to play defense)
    const aiThreats = countThreats(board.cells, aiPlayer);
    score += aiThreats * 4;

    if (score > bestScore) {
      bestScore = score;
      bestBoard = boardIndex;
    }
  }

  return bestBoard;
};

export const expertBoardChoice: BoardChoiceStrategy = (
  state: SuperGameState,
  aiPlayer: Player,
  availableBoards: readonly BoardIndex[],
  preset: RulePreset,
  config: AIStrategyConfig,
): BoardIndex => {
  // Evaluate each board choice one ply deep
  let bestBoard = availableBoards[0];
  let bestScore = -Infinity;

  for (const boardIndex of availableBoards) {
    const resolved = superEngine.resolveControlBoardChoice(state, boardIndex, preset);
    if (!resolved.ok) continue;

    // Evaluate the resulting state from AI's perspective
    const score = evaluateSuperState(resolved.state, aiPlayer, 1, preset, config.personality);
    if (score > bestScore) {
      bestScore = score;
      bestBoard = boardIndex;
    }
  }

  return bestBoard;
};

// ── Helper ────────────────────────────────────────────────────────────────────

import { WIN_LINES } from '@/types';
import type { CellValue } from '@/types';

function countThreats(cells: readonly CellValue[], player: Player): number {
  const opp = opponent(player);
  let count = 0;
  for (const [a, b, c] of WIN_LINES) {
    const vals = [cells[a], cells[b], cells[c]];
    const playerCount = vals.filter((v) => v === player).length;
    const oppCount = vals.filter((v) => v === opp).length;
    if (playerCount === 2 && oppCount === 0) count++;
  }
  return count;
}
