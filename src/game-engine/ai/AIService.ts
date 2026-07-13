/**
 * AIService — the single public entry point for AI move computation.
 *
 * Responsibilities:
 *   1. Select the correct strategy for the given difficulty
 *   2. Run computation without blocking the UI thread (via async + yielding)
 *   3. Enforce the UX thinking delay (min delay even if computation is instant)
 *   4. Expose a clean async API for the React hook layer
 *
 * Hard/Expert computation runs in a Promise that yields to the event loop
 * first (via `new Promise(resolve => setTimeout(resolve, 0))`), preventing
 * the UI from freezing on the frame the move is requested.
 *
 * Web Worker upgrade path (Phase 10):
 *   Replace the `computeInBackground` call for Hard/Expert with a Worker
 *   postMessage. The strategy functions are already pure and serializable.
 *   Zero changes to the public API needed.
 *
 * Multiplayer compatibility:
 *   In online play, the AI runs on the server using the same strategy
 *   functions. The server calls computeClassicMove / computeSuperMove
 *   directly (no UX delay) and sends the result over the socket.
 */

import type {
  AIDifficulty,
  BoardIndex,
  ClassicGameState,
  ClassicMove,
  Player,
  RulePreset,
  SuperGameState,
  SuperMove,
} from '@/types';
import type { AIConfig } from './types';
import { DIFFICULTY_CONFIG, sampleDelay } from './difficulty/difficultyConfig';

import { classicRandomStrategy, superRandomStrategy } from './strategies/randomStrategy';
import { classicTacticalStrategy, superTacticalStrategy } from './strategies/tacticalStrategy';
import {
  classicMinimaxStrategy,
  superMinimaxStrategy,
  superExpertStrategy,
} from './strategies/minimaxStrategy';
import {
  randomBoardChoice,
  tacticalBoardChoice,
  expertBoardChoice,
} from './strategies/boardChoiceStrategy';

import type { ClassicStrategy, SuperStrategy, BoardChoiceStrategy } from './types';

// ── Strategy registry ─────────────────────────────────────────────────────────

const CLASSIC_STRATEGIES: Record<AIDifficulty, ClassicStrategy> = {
  easy:   classicRandomStrategy,
  medium: classicTacticalStrategy,
  hard:   classicMinimaxStrategy,
  expert: classicMinimaxStrategy,  // Classic is solved — minimax is perfect at any depth
};

const SUPER_STRATEGIES: Record<AIDifficulty, SuperStrategy> = {
  easy:   superRandomStrategy,
  medium: superTacticalStrategy,
  hard:   superMinimaxStrategy,
  expert: superExpertStrategy,
};

const BOARD_CHOICE_STRATEGIES: Record<AIDifficulty, BoardChoiceStrategy> = {
  easy:   randomBoardChoice,
  medium: tacticalBoardChoice,
  hard:   tacticalBoardChoice,
  expert: expertBoardChoice,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes the AI's next move in Classic mode.
 * Always resolves with a legal move — never throws in normal play.
 */
export async function computeClassicMove(
  state: ClassicGameState,
  config: AIConfig,
): Promise<ClassicMove> {
  const stratConfig = {
    ...DIFFICULTY_CONFIG[config.difficulty],
    personality: config.personality ?? DIFFICULTY_CONFIG[config.difficulty].personality,
  };

  const strategy = CLASSIC_STRATEGIES[config.difficulty];
  const delay = sampleDelay(config.difficulty);

  const [result] = await Promise.all([
    computeInBackground(() => strategy(state, config.player, stratConfig)),
    wait(delay),
  ]);

  return result.move;
}

/**
 * Computes the AI's next move in Super mode.
 * Always resolves with a legal move.
 */
export async function computeSuperMove(
  state: SuperGameState,
  config: AIConfig,
  preset: RulePreset,
): Promise<SuperMove> {
  const stratConfig = {
    ...DIFFICULTY_CONFIG[config.difficulty],
    personality: config.personality ?? DIFFICULTY_CONFIG[config.difficulty].personality,
  };

  const strategy = SUPER_STRATEGIES[config.difficulty];
  const delay = sampleDelay(config.difficulty);

  const [result] = await Promise.all([
    computeInBackground(() => strategy(state, config.player, preset, stratConfig)),
    wait(delay),
  ]);

  return result.move;
}

/**
 * Computes the AI's board choice during Preset B (Control Draw).
 * Called when state.phase === 'awaiting-board-choice' and AI is the redirecting player.
 */
export async function computeControlBoardChoice(
  state: SuperGameState,
  config: AIConfig,
  availableBoards: readonly BoardIndex[],
  preset: RulePreset,
): Promise<BoardIndex> {
  const stratConfig = DIFFICULTY_CONFIG[config.difficulty];
  const strategy = BOARD_CHOICE_STRATEGIES[config.difficulty];

  // Board choice uses a shorter delay (it's a secondary action)
  const delay = sampleDelay(config.difficulty) * 0.5;

  const [boardIndex] = await Promise.all([
    computeInBackground(() =>
      strategy(state, config.player, availableBoards, preset, stratConfig),
    ),
    wait(delay),
  ]);

  return boardIndex;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Yields to the event loop before running computation.
 * This prevents the computation from freezing the current frame.
 * For Hard/Expert, this is where a Web Worker would be injected.
 */
function computeInBackground<T>(fn: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Yield one macrotask — gives React time to render "AI thinking" state
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
