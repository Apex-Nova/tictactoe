/**
 * Difficulty configuration table.
 *
 * Centralizes all tunable parameters per difficulty level.
 * Changing a difficulty's behavior = editing this file only.
 */

import type { AIDifficulty } from '@/types';
import type { AIPersonality, AIStrategyConfig } from '../types';

// ── Built-in personalities ────────────────────────────────────────────────────

export const PERSONALITIES: Record<string, AIPersonality> = {
  balanced: {
    name: 'balanced',
    attackWeight: 1.0,
    defenseWeight: 1.0,
    positionWeight: 1.0,
    randomnessFactor: 0,
  },
  aggressive: {
    name: 'aggressive',
    attackWeight: 1.4,
    defenseWeight: 0.7,
    positionWeight: 1.0,
    randomnessFactor: 0,
  },
  defensive: {
    name: 'defensive',
    attackWeight: 0.7,
    defenseWeight: 1.5,
    positionWeight: 1.0,
    randomnessFactor: 0,
  },
  tactical: {
    name: 'tactical',
    attackWeight: 1.1,
    defenseWeight: 1.1,
    positionWeight: 1.4,
    randomnessFactor: 0,
  },
  random: {
    name: 'random',
    attackWeight: 1.0,
    defenseWeight: 1.0,
    positionWeight: 1.0,
    randomnessFactor: 1.0,
  },
};

// ── Difficulty → Strategy config ──────────────────────────────────────────────

export const DIFFICULTY_CONFIG: Record<AIDifficulty, AIStrategyConfig> = {
  easy: {
    difficulty: 'easy',
    maxDepth: 0,       // No lookahead — pure random
    timeBudgetMs: 50,
    personality: PERSONALITIES.random,
  },
  medium: {
    difficulty: 'medium',
    maxDepth: 2,       // 1-2 ply: win/block + basic heuristic
    timeBudgetMs: 200,
    personality: PERSONALITIES.balanced,
  },
  hard: {
    difficulty: 'hard',
    maxDepth: 4,       // Alpha-beta minimax, depth 4
    timeBudgetMs: 1500,
    personality: PERSONALITIES.balanced,
  },
  expert: {
    difficulty: 'expert',
    maxDepth: 7,       // Iterative deepening up to depth 7 within time budget
    timeBudgetMs: 2500,
    personality: PERSONALITIES.tactical,
  },
};

// ── UX delays (separate from compute time) ────────────────────────────────────

/**
 * Minimum time the AI "thinks" before responding.
 * Actual compute may finish faster — we wait for max(compute, minDelay).
 * Ranges are randomized per move to feel more human.
 */
export const UX_DELAY_RANGE: Record<AIDifficulty, [min: number, max: number]> = {
  easy:   [500,  1000],
  medium: [800,  1500],
  hard:   [1000, 2000],
  expert: [1500, 2500],
};

export function sampleDelay(difficulty: AIDifficulty): number {
  const [min, max] = UX_DELAY_RANGE[difficulty];
  return min + Math.random() * (max - min);
}
