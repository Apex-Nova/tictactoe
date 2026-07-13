/**
 * Super TTT board evaluator.
 *
 * Two-level evaluation:
 *   1. Macro level: who controls/threatens the outer 3×3 board
 *   2. Micro level: weighted sum of each active inner board's state
 *
 * Preset-aware bonuses:
 *   - Control Draw: reward placing marks in boards that are close to drawn
 *     (intentionally causing a draw can give strategic control over redirection)
 *   - Portal Draw: reward moves that would trigger a free-board situation
 *     when it benefits the AI
 */

import type { CellValue, MacroCellValue, Player, RulePreset, SuperGameState } from '@/types';
import { WIN_LINES } from '@/types';
import {
  WIN_SCORE,
  DRAW_SCORE,
  CELL_POSITION_VALUES,
  MACRO_BOARD_VALUES,
} from '../types';
import type { AIPersonality } from '../types';
import { opponent } from '@/game-engine/utils/playerUtils';
import { checkWinner } from '@/game-engine/win-detection/checkWinner';
import { macroCellToWinCell } from '@/game-engine/utils/boardUtils';

// ── Main evaluator entry ──────────────────────────────────────────────────────

export function evaluateSuperState(
  state: SuperGameState,
  aiPlayer: Player,
  depth: number = 0,
  preset?: RulePreset,
  personality?: AIPersonality,
): number {
  const opp = opponent(aiPlayer);
  const attack = personality?.attackWeight ?? 1;
  const defense = personality?.defenseWeight ?? 1;
  const positionMult = personality?.positionWeight ?? 1;

  // ── Terminal states ─────────────────────────────────────────────────────────
  if (state.phase === 'finished') {
    if (state.result?.kind === 'win') {
      const winner = state.result.winner;
      return winner === aiPlayer
        ? (WIN_SCORE - depth) * attack
        : -(WIN_SCORE - depth) * defense;
    }
    return DRAW_SCORE;
  }

  let score = 0;

  // ── Macro board threats ─────────────────────────────────────────────────────
  const macroCells = state.macroGrid.map(macroCellToWinCell);
  score += evaluateLine(macroCells, aiPlayer, attack, defense) * 200 * positionMult;

  // Macro position bonuses (who controls which macro cells)
  for (let i = 0; i < 9; i++) {
    const mv = state.macroGrid[i];
    const boardVal = MACRO_BOARD_VALUES[i] * positionMult;
    if (mv === aiPlayer) score += boardVal * 30;
    else if (mv === opp) score -= boardVal * 30;
    // Drawn board: slight penalty for the player who caused the draw
    // (unless it's strategic — handled by preset bonus below)
  }

  // ── Micro board evaluations ─────────────────────────────────────────────────
  for (const board of state.microBoards) {
    if (board.status.kind !== 'active') continue;

    const macroVal = MACRO_BOARD_VALUES[board.index] * positionMult;
    const microScore = evaluateMicroBoard(board.cells, aiPlayer, attack, defense);
    score += microScore * macroVal;
  }

  // ── Active board constraint value ───────────────────────────────────────────
  // Being sent to a high-value board where the opponent has threats = bad.
  // Being sent to a low-value board where the opponent has threats = less bad.
  if (state.activeBoardIndex !== null) {
    const forcedBoard = state.microBoards[state.activeBoardIndex];
    const forcedMacroVal = MACRO_BOARD_VALUES[state.activeBoardIndex];
    const activePlayer = state.currentPlayer;
    const activeOpp = opponent(activePlayer);

    // Count active player's threats on the forced board
    let activeThreatCount = 0;
    let oppThreatCount = 0;
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      const vals = [forcedBoard.cells[a], forcedBoard.cells[b], forcedBoard.cells[c]];
      const ap = vals.filter((v) => v === activePlayer).length;
      const op = vals.filter((v) => v === activeOpp).length;
      const em = vals.filter((v) => v === null).length;
      if (ap === 2 && em === 1) activeThreatCount++;
      if (op === 2 && em === 1) oppThreatCount++;
    }

    // From aiPlayer's perspective: good if opponent is forced to bad board, bad if AI is forced to good board for opponent
    if (activePlayer === aiPlayer) {
      // AI is being forced here — being sent to a high-value board where AI has threats is good
      score += activeThreatCount * 15;
      score -= oppThreatCount * 20;
      // Low-value board means less at stake
      score -= forcedMacroVal * 3;
    } else {
      // Opponent is being forced here — being sent to high-value board with their threats = bad for AI
      score -= activeThreatCount * 15;
      score += oppThreatCount * 20;
      score += forcedMacroVal * 3;
    }
  }

  // ── Preset-aware bonuses ────────────────────────────────────────────────────
  if (preset) {
    score += presetBonus(state, aiPlayer, preset, positionMult);
  }

  // ── Slight bonus for having the move ───────────────────────────────────────
  if (state.currentPlayer === aiPlayer) score += 5;

  return score;
}

// ── Micro board evaluator ─────────────────────────────────────────────────────

function evaluateMicroBoard(
  cells: readonly CellValue[],
  aiPlayer: Player,
  attack: number,
  defense: number,
): number {
  const opp = opponent(aiPlayer);
  let score = 0;

  score += evaluateLine(cells as CellValue[], aiPlayer, attack, defense) * 10;

  for (let i = 0; i < 9; i++) {
    const posVal = CELL_POSITION_VALUES[i];
    if (cells[i] === aiPlayer) score += posVal * attack;
    else if (cells[i] === opp) score -= posVal * defense;
  }

  return score;
}

// ── Line threat scorer ────────────────────────────────────────────────────────

function evaluateLine(
  cells: readonly CellValue[],
  aiPlayer: Player,
  attack: number,
  defense: number,
): number {
  const opp = opponent(aiPlayer);
  let score = 0;

  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const vals = [cells[a], cells[b], cells[c]];
    const aiCount = vals.filter((v) => v === aiPlayer).length;
    const oppCount = vals.filter((v) => v === opp).length;

    if (aiCount > 0 && oppCount > 0) continue;

    if (aiCount === 3) score += 50 * attack;
    else if (aiCount === 2) score += 8 * attack;
    else if (aiCount === 1) score += 1 * attack;

    if (oppCount === 3) score -= 50 * defense;
    else if (oppCount === 2) score -= 12 * defense; // block threats weighted heavier
    else if (oppCount === 1) score -= 1 * defense;
  }

  return score;
}

// ── Preset-aware bonuses ──────────────────────────────────────────────────────

function presetBonus(
  state: SuperGameState,
  aiPlayer: Player,
  preset: RulePreset,
  positionMult: number,
): number {
  let bonus = 0;
  const opp = opponent(aiPlayer);

  if (preset.drawnBoardBehavior.type === 'control-board') {
    // Control Draw: AI values having many active boards where it's ahead.
    // Intentionally drawing a board can be beneficial IF it's in a bad position
    // for the AI, removing it from opponent's "freely forced" boards.
    for (const board of state.microBoards) {
      if (board.status.kind === 'drawn') {
        // A drawn board on a high-value position slightly benefits the player
        // who has more control remaining (since they can control-redirect)
        const macroVal = MACRO_BOARD_VALUES[board.index];
        bonus += macroVal * 2 * positionMult;
      }
    }
  }

  if (preset.drawnBoardBehavior.type === 'portal-board') {
    // Portal Draw: free-move situations are valuable — the player can pick
    // any active board, which is strategically powerful.
    // Count how many "drawn" boards exist — more drawn boards = more portals
    const drawnCount = state.microBoards.filter((b) => b.status.kind === 'drawn').length;
    // Value portal situations slightly (they give flexibility)
    bonus += drawnCount * 3 * positionMult;
  }

  return bonus;
}
