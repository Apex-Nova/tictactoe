/**
 * Statistics types.
 *
 * Stored locally (Phase 9) and synced to a user account (future online phase).
 * Designed to be forward-compatible: optional fields can be added without
 * breaking existing saved data.
 */

import type { AIDifficulty, GameMode, Player, RulePresetId } from './primitives';

export interface GameRecord {
  readonly gameId: string;
  readonly mode: GameMode;
  readonly presetId?: RulePresetId;      // only Super mode
  readonly result: 'win' | 'loss' | 'draw';
  readonly playerSide: Player;
  readonly opponentType: 'human' | 'ai' | 'remote';
  readonly difficulty?: AIDifficulty;    // only when opponentType === 'ai'
  readonly moveCount: number;
  readonly durationMs: number;
  readonly playedAt: number;             // epoch ms
}

export interface AggregateStats {
  readonly totalGames: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  readonly winRate: number;              // 0–1
  readonly averageMoveCount: number;
  readonly longestWinStreak: number;
  readonly currentStreak: number;
  readonly favoritePreset?: RulePresetId;
}

export interface PlayerStatistics {
  readonly userId?: string;              // null for guest
  readonly classic: AggregateStats;
  readonly super: AggregateStats;
  readonly history: readonly GameRecord[];
  readonly updatedAt: number;
}
