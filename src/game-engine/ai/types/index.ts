/**
 * AI subsystem internal types.
 *
 * These extend the public types in @/types with AI-specific contracts.
 * Nothing here imports from React or browser APIs.
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

// ── Strategy result ───────────────────────────────────────────────────────────

export interface AIResult<M> {
  move: M;
  /** Evaluation score at root — useful for debugging and tests. */
  score?: number;
  /** How many nodes the search visited — useful for performance tuning. */
  nodesEvaluated?: number;
  depthReached?: number;
}

// ── Strategy function signatures ──────────────────────────────────────────────

/**
 * Every difficulty level implements this signature for Classic mode.
 * Pure function — no side effects, no delays.
 */
export type ClassicStrategy = (
  state: ClassicGameState,
  aiPlayer: Player,
  config: AIStrategyConfig,
) => AIResult<ClassicMove>;

/**
 * Every difficulty level implements this signature for Super mode.
 * Pure function — no side effects, no delays.
 */
export type SuperStrategy = (
  state: SuperGameState,
  aiPlayer: Player,
  preset: RulePreset,
  config: AIStrategyConfig,
) => AIResult<SuperMove>;

/**
 * Board choice strategy for Preset B (Control Draw).
 * Called when phase === 'awaiting-board-choice'.
 */
export type BoardChoiceStrategy = (
  state: SuperGameState,
  aiPlayer: Player,
  availableBoards: readonly BoardIndex[],
  preset: RulePreset,
  config: AIStrategyConfig,
) => BoardIndex;

// ── Strategy config ───────────────────────────────────────────────────────────

export interface AIStrategyConfig {
  difficulty: AIDifficulty;
  /** Max search depth for minimax. */
  maxDepth: number;
  /** Wall-clock time budget in ms (for iterative deepening). */
  timeBudgetMs: number;
  /** Random seed for deterministic testing. Omit for real games. */
  seed?: number;
  personality?: AIPersonality;
}

// ── AI session config (public) ────────────────────────────────────────────────

export interface AIConfig {
  difficulty: AIDifficulty;
  player: Player;
  preset?: RulePreset;
  personality?: AIPersonality;
}

// ── Personalities ─────────────────────────────────────────────────────────────

/**
 * Personality modifies the evaluator weights without changing the algorithm.
 * Adding a new personality = adding a new weight set here.
 */
export type AIPersonalityName =
  | 'balanced'
  | 'aggressive'
  | 'defensive'
  | 'tactical'
  | 'random';

export interface AIPersonality {
  name: AIPersonalityName;
  /** Multiplier on attack scores (own threats). Default 1.0 */
  attackWeight: number;
  /** Multiplier on defense scores (opponent threats). Default 1.0 */
  defenseWeight: number;
  /** Multiplier on center/corner position bonuses. Default 1.0 */
  positionWeight: number;
  /** 0–1 randomization factor injected into move scores. Default 0 */
  randomnessFactor: number;
}

// ── Simulation ────────────────────────────────────────────────────────────────

export interface SimulationConfig {
  gameCount: number;
  mode: 'classic' | 'super';
  playerXConfig: AIConfig;
  playerOConfig: AIConfig;
  preset?: RulePreset;
  maxMovesPerGame?: number;
}

export interface SimulationResult {
  totalGames: number;
  xWins: number;
  oWins: number;
  draws: number;
  xWinRate: number;
  oWinRate: number;
  drawRate: number;
  averageMoveCount: number;
  averageComputeTimeMs: number;
  errors: number;
}

// ── Evaluation constants ──────────────────────────────────────────────────────

/** Returned when a player wins — use ±INF scaled by depth to prefer fast wins */
export const WIN_SCORE = 100_000;
export const DRAW_SCORE = 0;

/** Position values within a 3×3 grid (index 0–8). */
export const CELL_POSITION_VALUES: Record<number, number> = {
  0: 3, 1: 2, 2: 3,   // corners get 3, edges get 2
  3: 2, 4: 4, 5: 2,   // center gets 4
  6: 3, 7: 2, 8: 3,
};

/** Macro board position values — center and corners worth more globally. */
export const MACRO_BOARD_VALUES: Record<number, number> = {
  0: 3, 1: 2, 2: 3,
  3: 2, 4: 5, 5: 2,
  6: 3, 7: 2, 8: 3,
};
