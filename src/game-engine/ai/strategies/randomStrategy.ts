/**
 * Easy AI — pure random legal move selection.
 *
 * No lookahead. No heuristics. Fastest possible.
 * Used as the baseline and as the randomization layer
 * injected into other difficulties via personality.randomnessFactor.
 */

import type { ClassicGameState, ClassicMove, Player, RulePreset, SuperGameState, SuperMove } from '@/types';
import type { AIResult, ClassicStrategy, SuperStrategy } from '../types';
import { classicEngine } from '@/game-engine/ClassicEngine';
import { superEngine } from '@/game-engine/SuperEngine';

function pickRandom<T>(arr: readonly T[], seed?: number): T {
  // Simple LCG for deterministic seeding in tests
  if (seed !== undefined) {
    const lcg = ((seed * 1664525 + 1013904223) & 0xffffffff) >>> 0;
    return arr[lcg % arr.length];
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

export const classicRandomStrategy: ClassicStrategy = (
  state: ClassicGameState,
  _aiPlayer: Player,
  config,
): AIResult<ClassicMove> => {
  const moves = classicEngine.getLegalMoves(state);
  if (moves.length === 0) throw new Error('No legal moves available');
  return { move: pickRandom(moves, config.seed), nodesEvaluated: 1 };
};

export const superRandomStrategy: SuperStrategy = (
  state: SuperGameState,
  _aiPlayer: Player,
  _preset: RulePreset,
  config,
): AIResult<SuperMove> => {
  const moves = superEngine.getLegalMoves(state);
  if (moves.length === 0) throw new Error('No legal moves available');
  return { move: pickRandom(moves, config.seed), nodesEvaluated: 1 };
};
