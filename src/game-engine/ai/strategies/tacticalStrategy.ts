/**
 * Medium AI — tactical heuristic strategy.
 *
 * Priority order (checked in sequence):
 *   1. Take an immediate win (macro win or micro win on high-value board)
 *   2. Block an immediate opponent win
 *   3. Take center of active micro board(s)
 *   4. Take corners of active micro board(s)
 *   5. Prefer macro-board-valuable positions
 *   6. Fallback: random
 *
 * No minimax — O(moves) per turn. Stays under 5ms even for 81-move positions.
 */

import type {
  BoardIndex,
  ClassicGameState,
  ClassicMove,
  Player,
  RulePreset,
  SuperGameState,
  SuperMove,
} from '@/types';
import type { AIResult, ClassicStrategy, SuperStrategy } from '../types';
import { CELL_POSITION_VALUES, MACRO_BOARD_VALUES } from '../types';
import { classicEngine } from '@/game-engine/ClassicEngine';
import { superEngine } from '@/game-engine/SuperEngine';
import { evaluateClassicBoard } from '../evaluators/classicEvaluator';
import { opponent } from '@/game-engine/utils/playerUtils';

// ── Classic tactical ──────────────────────────────────────────────────────────

export const classicTacticalStrategy: ClassicStrategy = (
  state: ClassicGameState,
  aiPlayer: Player,
  config,
): AIResult<ClassicMove> => {
  const moves = classicEngine.getLegalMoves(state);
  if (moves.length === 0) throw new Error('No legal moves');

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const result = classicEngine.applyMove(state, move);
    if (!result.ok) continue;

    let score: number;

    // Immediate win
    if (result.state.phase === 'finished' && result.state.result?.kind === 'win') {
      return { move, score: 10000, nodesEvaluated: moves.length };
    }

    // Heuristic score
    score = evaluateClassicBoard(result.state.board.cells, aiPlayer, 1, config.personality);

    // Tiebreak: position value
    score += CELL_POSITION_VALUES[move.cellIndex] * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { move: bestMove, score: bestScore, nodesEvaluated: moves.length };
};

// ── Super tactical ────────────────────────────────────────────────────────────

export const superTacticalStrategy: SuperStrategy = (
  state: SuperGameState,
  aiPlayer: Player,
  preset: RulePreset,
  config,
): AIResult<SuperMove> => {
  const moves = superEngine.getLegalMoves(state);
  if (moves.length === 0) throw new Error('No legal moves');

  const opp = opponent(aiPlayer);
  let bestMove = moves[0];
  let bestScore = -Infinity;
  let nodes = 0;

  for (const move of moves) {
    nodes++;
    let score = scoreSuperMove(state, move, aiPlayer, opp, preset);

    // Personality randomness injection
    const rf = config.personality?.randomnessFactor ?? 0;
    if (rf > 0) score += (Math.random() - 0.5) * rf * 50;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { move: bestMove, score: bestScore, nodesEvaluated: nodes };
};

function scoreSuperMove(
  state: SuperGameState,
  move: SuperMove,
  aiPlayer: Player,
  opp: Player,
  preset: RulePreset,
): number {
  let score = 0;

  const board = state.microBoards[move.boardIndex];
  const macroVal = MACRO_BOARD_VALUES[move.boardIndex];
  const cellVal = CELL_POSITION_VALUES[move.cellIndex];

  // ── Micro board win check ─────────────────────────────────────────────────
  // Simulate placing the mark and check if this micro board gets won
  // Does placing here complete AI's own winning line?
  const tempCells = [...board.cells];
  tempCells[move.cellIndex] = aiPlayer;
  const aiWinsBoard = checkLineForPlayer(tempCells, aiPlayer);

  // Does placing here fill the empty slot of an opponent 2-in-a-row (blocking)?
  let oppWouldWin = false;
  for (const [a, b, c] of WIN_LINES) {
    const line = [a, b, c];
    if (!line.includes(move.cellIndex)) continue;
    const oppCount = line.filter((i) => board.cells[i] === opp).length;
    const emptyCount = line.filter((i) => board.cells[i] === null).length;
    if (oppCount === 2 && emptyCount === 1) { oppWouldWin = true; break; }
  }

  if (aiWinsBoard) {
    // Will we win the macro with this board win?
    const tempMacro = [...state.macroGrid];
    tempMacro[move.boardIndex] = aiPlayer;
    if (checkLineForPlayer(tempMacro as any, aiPlayer)) {
      score += 50000; // Macro win — always prioritize
    } else {
      score += 1000 * macroVal; // Micro win on valuable board
    }
  }

  // ── Block opponent micro win ─────────────────────────────────────────────
  if (oppWouldWin && !aiWinsBoard) {
    score += 800 * macroVal;
  }

  // ── Position value ────────────────────────────────────────────────────────
  score += cellVal * macroVal * 5;

  // ── Redirection quality: where does this send the opponent? ───────────────
  // Playing cell C sends the opponent to board C.
  // A good redirect: board where opponent has few threats, low macro value.
  // A bad redirect: board where opponent already has 2-in-a-row, or center.
  const targetBoardIndex = move.cellIndex as BoardIndex;
  const targetBoard = state.microBoards[targetBoardIndex];

  if (targetBoard.status.kind === 'active') {
    const targetMacroVal = MACRO_BOARD_VALUES[targetBoardIndex];

    // Count opponent threats on target board (lines with 2 opp + 1 empty)
    let oppThreatCount = 0;
    for (const [a, b, c] of WIN_LINES) {
      const vals = [targetBoard.cells[a], targetBoard.cells[b], targetBoard.cells[c]];
      const oppCount = vals.filter((v) => v === opp).length;
      const emptyCount = vals.filter((v) => v === null).length;
      if (oppCount === 2 && emptyCount === 1) oppThreatCount++;
    }

    // Penalize: sending to a high-value board hands the opponent prime real estate
    score -= targetMacroVal * 12;

    // Penalize heavily: sending opponent to a board where they have winning threats
    score -= oppThreatCount * 40;

    // Small bonus: opponent already has many marks there (harder for them to play freely)
    const targetOppCells = targetBoard.cells.filter((c) => c === opp).length;
    score += targetOppCells * 5;
  } else {
    // Sending to resolved board → opponent gets free move next
    // Slightly bad but unavoidable sometimes
    score -= 20;
  }

  // ── Control Draw preset: value intentional draws ──────────────────────────
  if (preset.drawnBoardBehavior.type === 'control-board') {
    // If this board is close to drawn and low-value, drawing it might be strategic
    const emptyCells = board.cells.filter((c) => c === null).length;
    if (emptyCells <= 2 && macroVal <= 2) {
      score += 15; // Slight bonus for pushing toward draws on edge boards
    }
  }

  return score;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

import { WIN_LINES } from '@/types';

function checkLineForPlayer(cells: readonly (string | null)[], player: string): boolean {
  for (const [a, b, c] of WIN_LINES) {
    if (cells[a] === player && cells[b] === player && cells[c] === player) return true;
  }
  return false;
}
