/**
 * Hard + Expert AI — Minimax with Alpha-Beta Pruning.
 *
 * Classic mode:
 *   Full minimax, no depth limit. Perfect play guaranteed.
 *   The tree is bounded (~362K nodes max before pruning).
 *
 * Super mode:
 *   Depth-limited minimax with alpha-beta pruning.
 *   Hard: max depth 4
 *   Expert: iterative deepening with wall-clock time budget
 *
 * Performance techniques:
 *   1. Alpha-beta pruning (cuts ~50–80% of the tree in practice)
 *   2. Move ordering (win-first, block-first, center, corners, edges)
 *   3. Iterative deepening (Expert) — always has a best move available
 *   4. Transposition table (Expert) — memoizes previously evaluated positions
 *
 * Multiplayer note: these are pure functions over serialized state.
 * The same code runs in a Web Worker, on the server, or inline.
 */

import type {
  ClassicGameState,
  ClassicMove,
  Player,
  RulePreset,
  SuperGameState,
  SuperMove,
} from '@/types';
import type { AIResult, AIStrategyConfig, ClassicStrategy, SuperStrategy } from '../types';
import { WIN_SCORE, CELL_POSITION_VALUES, MACRO_BOARD_VALUES } from '../types';
import { classicEngine } from '@/game-engine/ClassicEngine';
import { superEngine } from '@/game-engine/SuperEngine';
import { evaluateClassicBoard } from '../evaluators/classicEvaluator';
import { evaluateSuperState } from '../evaluators/superEvaluator';
import { opponent } from '@/game-engine/utils/playerUtils';

// ── Transposition table ───────────────────────────────────────────────────────

type TTEntry = { score: number; depth: number; flag: 'exact' | 'lower' | 'upper' };
const MAX_TT_SIZE = 100_000;

class TranspositionTable {
  private table = new Map<string, TTEntry>();

  get(key: string): TTEntry | undefined {
    return this.table.get(key);
  }

  set(key: string, entry: TTEntry): void {
    if (this.table.size >= MAX_TT_SIZE) {
      // Evict first entry (simple FIFO — good enough for short-lived search)
      const firstKey = this.table.keys().next().value;
      if (firstKey) this.table.delete(firstKey);
    }
    this.table.set(key, entry);
  }

  clear(): void {
    this.table.clear();
  }
}

// ── Classic Minimax ───────────────────────────────────────────────────────────

export const classicMinimaxStrategy: ClassicStrategy = (
  state: ClassicGameState,
  aiPlayer: Player,
  config: AIStrategyConfig,
): AIResult<ClassicMove> => {
  const moves = classicEngine.getLegalMoves(state);
  if (moves.length === 0) throw new Error('No legal moves');
  if (moves.length === 1) return { move: moves[0], nodesEvaluated: 1 };

  const ordered = orderClassicMoves(moves, state, aiPlayer);
  let bestMove = ordered[0];
  let bestScore = -Infinity;
  let nodes = 0;

  const isMaximizing = state.currentPlayer === aiPlayer;

  for (const move of ordered) {
    const result = classicEngine.applyMove(state, move);
    if (!result.ok) continue;

    const score = classicMinimax(
      result.state,
      aiPlayer,
      !isMaximizing, // next player is opposite
      1,
      -Infinity,
      Infinity,
      { count: 0 },
    );

    nodes += 1;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { move: bestMove, score: bestScore, nodesEvaluated: nodes };
};

function classicMinimax(
  state: ClassicGameState,
  aiPlayer: Player,
  isMaximizing: boolean,
  depth: number,
  alpha: number,
  beta: number,
  counter: { count: number },
): number {
  counter.count++;

  // Terminal check
  if (state.phase === 'finished') {
    if (state.result?.kind === 'win') {
      return state.result.winner === aiPlayer
        ? WIN_SCORE - depth
        : -(WIN_SCORE - depth);
    }
    return 0; // draw
  }

  const moves = classicEngine.getLegalMoves(state);
  const ordered = orderClassicMoves(moves, state, aiPlayer);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of ordered) {
      const result = classicEngine.applyMove(state, move);
      if (!result.ok) continue;
      const score = classicMinimax(result.state, aiPlayer, false, depth + 1, alpha, beta, counter);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // β-cutoff
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of ordered) {
      const result = classicEngine.applyMove(state, move);
      if (!result.ok) continue;
      const score = classicMinimax(result.state, aiPlayer, true, depth + 1, alpha, beta, counter);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // α-cutoff
    }
    return minScore;
  }
}

function orderClassicMoves(
  moves: readonly ClassicMove[],
  state: ClassicGameState,
  aiPlayer: Player,
): ClassicMove[] {
  return [...moves].sort((a, b) => {
    // Wins first, then blocks, then position value
    const aIsWin = wouldWinClassic(state, a, state.currentPlayer);
    const bIsWin = wouldWinClassic(state, b, state.currentPlayer);
    if (aIsWin && !bIsWin) return -1;
    if (!aIsWin && bIsWin) return 1;
    return CELL_POSITION_VALUES[b.cellIndex] - CELL_POSITION_VALUES[a.cellIndex];
  });
}

function wouldWinClassic(state: ClassicGameState, move: ClassicMove, player: Player): boolean {
  const result = classicEngine.applyMove(state, move);
  return result.ok && result.state.phase === 'finished' && result.state.result?.kind === 'win';
}

// ── Super Minimax (Hard) ──────────────────────────────────────────────────────

export const superMinimaxStrategy: SuperStrategy = (
  state: SuperGameState,
  aiPlayer: Player,
  preset: RulePreset,
  config: AIStrategyConfig,
): AIResult<SuperMove> => {
  const moves = superEngine.getLegalMoves(state);
  if (moves.length === 0) throw new Error('No legal moves');
  if (moves.length === 1) return { move: moves[0], nodesEvaluated: 1 };

  // Adaptive depth: fewer legal moves → search deeper
  const adaptiveDepth = adaptDepth(moves.length, config.maxDepth);
  const ordered = orderSuperMoves(moves, state, aiPlayer, preset);

  let bestMove = ordered[0];
  let bestScore = -Infinity;
  let nodes = 0;

  for (const move of ordered) {
    const result = applySuperMoveSync(state, move, preset);
    if (!result) continue;

    const score = superMinimax(
      result,
      aiPlayer,
      false, // opponent moves next
      1,
      adaptiveDepth,
      -Infinity,
      Infinity,
      preset,
      config,
      { count: 0 },
    );
    nodes++;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { move: bestMove, score: bestScore, nodesEvaluated: nodes, depthReached: adaptiveDepth };
};

function superMinimax(
  state: SuperGameState,
  aiPlayer: Player,
  isMaximizing: boolean,
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number,
  preset: RulePreset,
  config: AIStrategyConfig,
  counter: { count: number },
): number {
  counter.count++;

  // Terminal or depth limit
  if (state.phase === 'finished' || depth >= maxDepth) {
    return evaluateSuperState(state, aiPlayer, depth, preset, config.personality);
  }

  // Handle awaiting-board-choice (Preset B): skip this "move" for the redirecting player
  // by having the AI automatically pick the best board for them
  if (state.phase === 'awaiting-board-choice') {
    return handleControlDrawInMinimax(state, aiPlayer, isMaximizing, depth, maxDepth, alpha, beta, preset, config, counter);
  }

  const moves = superEngine.getLegalMoves(state);
  if (moves.length === 0) {
    return evaluateSuperState(state, aiPlayer, depth, preset, config.personality);
  }

  const ordered = orderSuperMoves(moves, state, aiPlayer, preset);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of ordered) {
      const next = applySuperMoveSync(state, move, preset);
      if (!next) continue;
      const score = superMinimax(next, aiPlayer, false, depth + 1, maxDepth, alpha, beta, preset, config, counter);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of ordered) {
      const next = applySuperMoveSync(state, move, preset);
      if (!next) continue;
      const score = superMinimax(next, aiPlayer, true, depth + 1, maxDepth, alpha, beta, preset, config, counter);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

function handleControlDrawInMinimax(
  state: SuperGameState,
  aiPlayer: Player,
  isMaximizing: boolean,
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number,
  preset: RulePreset,
  config: AIStrategyConfig,
  counter: { count: number },
): number {
  // The redirecting player picks the best board for them
  const redirector = state.redirectingPlayer!;
  const isAIRedirecting = redirector === aiPlayer;

  // Get available boards
  const availableBoards = state.microBoards
    .filter((b) => b.status.kind === 'active' && b.cells.some((c) => c === null))
    .map((b) => b.index);

  if (availableBoards.length === 0) {
    return evaluateSuperState(state, aiPlayer, depth, preset, config.personality);
  }

  let bestScore = isAIRedirecting ? -Infinity : Infinity;

  for (const boardIndex of availableBoards) {
    const resolved = superEngine.resolveControlBoardChoice(state, boardIndex as any, preset);
    if (!resolved.ok) continue;

    const score = superMinimax(
      resolved.state,
      aiPlayer,
      isMaximizing,
      depth,           // don't increment depth for board choice
      maxDepth,
      alpha,
      beta,
      preset,
      config,
      counter,
    );

    if (isAIRedirecting) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }

  return bestScore;
}

// ── Super Minimax (Expert) — iterative deepening ──────────────────────────────

export const superExpertStrategy: SuperStrategy = (
  state: SuperGameState,
  aiPlayer: Player,
  preset: RulePreset,
  config: AIStrategyConfig,
): AIResult<SuperMove> => {
  const moves = superEngine.getLegalMoves(state);
  if (moves.length === 0) throw new Error('No legal moves');
  if (moves.length === 1) return { move: moves[0], nodesEvaluated: 1 };

  const tt = new TranspositionTable();
  const deadline = Date.now() + config.timeBudgetMs;
  let bestMove = moves[0];
  let bestScore = -Infinity;
  let totalNodes = 0;
  let depthReached = 1;

  const ordered = orderSuperMoves(moves, state, aiPlayer, preset);

  // Iterative deepening: start at depth 1, go deeper until time runs out
  for (let depth = 1; depth <= config.maxDepth; depth++) {
    if (Date.now() >= deadline) break;

    let currentBest = ordered[0];
    let currentBestScore = -Infinity;

    for (const move of ordered) {
      if (Date.now() >= deadline) break;

      const next = applySuperMoveSync(state, move, preset);
      if (!next) continue;

      const score = superMinimaxTT(
        next,
        aiPlayer,
        false,
        1,
        depth,
        -Infinity,
        Infinity,
        preset,
        config,
        { count: 0 },
        tt,
        deadline,
      );
      totalNodes++;

      if (score > currentBestScore) {
        currentBestScore = score;
        currentBest = move;
      }
    }

    // Only update best if we completed the depth fully (no time cutoff mid-search)
    if (Date.now() < deadline) {
      bestMove = currentBest;
      bestScore = currentBestScore;
      depthReached = depth;
    }
  }

  return { move: bestMove, score: bestScore, nodesEvaluated: totalNodes, depthReached };
};

function superMinimaxTT(
  state: SuperGameState,
  aiPlayer: Player,
  isMaximizing: boolean,
  depth: number,
  maxDepth: number,
  alpha: number,
  beta: number,
  preset: RulePreset,
  config: AIStrategyConfig,
  counter: { count: number },
  tt: TranspositionTable,
  deadline: number,
): number {
  counter.count++;

  if (Date.now() >= deadline) {
    return evaluateSuperState(state, aiPlayer, depth, preset, config.personality);
  }

  if (state.phase === 'finished' || depth >= maxDepth) {
    return evaluateSuperState(state, aiPlayer, depth, preset, config.personality);
  }

  if (state.phase === 'awaiting-board-choice') {
    return handleControlDrawInMinimax(state, aiPlayer, isMaximizing, depth, maxDepth, alpha, beta, preset, config, counter);
  }

  // Transposition table lookup
  const key = stateKey(state);
  const cached = tt.get(key);
  if (cached && cached.depth >= maxDepth - depth) {
    if (cached.flag === 'exact') return cached.score;
    if (cached.flag === 'lower') alpha = Math.max(alpha, cached.score);
    if (cached.flag === 'upper') beta = Math.min(beta, cached.score);
    if (alpha >= beta) return cached.score;
  }

  const moves = superEngine.getLegalMoves(state);
  if (moves.length === 0) {
    return evaluateSuperState(state, aiPlayer, depth, preset, config.personality);
  }

  const ordered = orderSuperMoves(moves, state, aiPlayer, preset);
  const originalAlpha = alpha;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of ordered) {
    if (Date.now() >= deadline) break;

    const next = applySuperMoveSync(state, move, preset);
    if (!next) continue;

    const score = superMinimaxTT(next, aiPlayer, !isMaximizing, depth + 1, maxDepth, alpha, beta, preset, config, counter, tt, deadline);

    if (isMaximizing) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }

  // Store in transposition table
  const flag: TTEntry['flag'] =
    bestScore <= originalAlpha ? 'upper' : bestScore >= beta ? 'lower' : 'exact';
  tt.set(key, { score: bestScore, depth: maxDepth - depth, flag });

  return bestScore;
}

// ── Move ordering ─────────────────────────────────────────────────────────────

function orderSuperMoves(
  moves: readonly SuperMove[],
  state: SuperGameState,
  aiPlayer: Player,
  _preset: RulePreset,
): SuperMove[] {
  const opp = opponent(aiPlayer);

  return [...moves].sort((a, b) => {
    const scoreA = movePriority(a, state, aiPlayer, opp);
    const scoreB = movePriority(b, state, aiPlayer, opp);
    return scoreB - scoreA; // descending — best first
  });
}

function movePriority(
  move: SuperMove,
  state: SuperGameState,
  aiPlayer: Player,
  opp: Player,
): number {
  const board = state.microBoards[move.boardIndex];
  const macroVal = MACRO_BOARD_VALUES[move.boardIndex];
  const cellVal = CELL_POSITION_VALUES[move.cellIndex];

  // Quick win/block check
  const tempCells = [...board.cells];
  tempCells[move.cellIndex] = aiPlayer;
  const aiWins = checkWinQuick(tempCells, aiPlayer);
  if (aiWins) return 10000 + macroVal * 100;

  const oppWins = checkWinQuick(board.cells.map((c, i) => i === move.cellIndex ? opp : c), opp);
  if (oppWins) return 5000 + macroVal * 100;

  return macroVal * 10 + cellVal;
}

function checkWinQuick(cells: readonly (string | null)[], player: string): boolean {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return lines.some(([a,b,c]) => cells[a]===player && cells[b]===player && cells[c]===player);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Synchronous wrapper for the engine's async applyMove.
 * Safe because the engine's async is a thin Promise.resolve() wrapper.
 */
function applySuperMoveSync(
  state: SuperGameState,
  move: SuperMove,
  preset: RulePreset,
): SuperGameState | null {
  const result = superEngine.applyMoveSync(state, move, preset);
  return result.ok ? result.state : null;
}

function adaptDepth(legalMoveCount: number, configDepth: number): number {
  if (legalMoveCount <= 5)  return Math.min(configDepth + 3, 10);
  if (legalMoveCount <= 15) return Math.min(configDepth + 1, 8);
  if (legalMoveCount <= 30) return configDepth;
  return Math.max(configDepth - 1, 2); // Wide positions: search shallower
}

function stateKey(state: SuperGameState): string {
  // Compact state representation for transposition table
  return (
    state.macroGrid.map((v) => v ?? '_').join('') +
    state.activeBoardIndex +
    state.currentPlayer +
    state.microBoards.map((b) => b.cells.map((c) => c ?? '_').join('')).join('|')
  );
}
