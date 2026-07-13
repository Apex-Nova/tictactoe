/**
 * StatsService — localStorage-backed statistics persistence.
 *
 * Framework-free. No React imports.
 * All mutations are pure functions that return new state objects.
 */

import type { AggregateStats, GameRecord, PlayerStatistics } from '@/types/statistics';

const STORAGE_KEY = 'superttt-stats';

// ── Defaults ──────────────────────────────────────────────────────────────────

function emptyAggregate(): AggregateStats {
  return {
    totalGames: 0, wins: 0, losses: 0, draws: 0,
    winRate: 0, averageMoveCount: 0,
    longestWinStreak: 0, currentStreak: 0,
    favoritePreset: undefined,
  };
}

function emptyStats(): PlayerStatistics {
  return {
    classic: emptyAggregate(),
    super:   emptyAggregate(),
    history: [],
    updatedAt: Date.now(),
  };
}

// ── Load / save ───────────────────────────────────────────────────────────────

export function loadStats(): PlayerStatistics {
  if (typeof localStorage === 'undefined') return emptyStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    return JSON.parse(raw) as PlayerStatistics;
  } catch {
    return emptyStats();
  }
}

export function saveStats(stats: PlayerStatistics): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage full or disabled — silently skip
  }
}

// ── Record a game ─────────────────────────────────────────────────────────────

export function recordGame(stats: PlayerStatistics, record: GameRecord): PlayerStatistics {
  const aggregate = stats[record.mode];
  const isWin  = record.result === 'win';
  const isLoss = record.result === 'loss';
  const isDraw = record.result === 'draw';

  const newTotal  = aggregate.totalGames + 1;
  const newWins   = aggregate.wins   + (isWin  ? 1 : 0);
  const newLosses = aggregate.losses + (isLoss ? 1 : 0);
  const newDraws  = aggregate.draws  + (isDraw ? 1 : 0);

  const newStreak = isWin
    ? aggregate.currentStreak + 1
    : (isLoss ? 0 : aggregate.currentStreak);
  const newLongest = Math.max(aggregate.longestWinStreak, newStreak);

  const newAvgMoves = Math.round(
    (aggregate.averageMoveCount * aggregate.totalGames + record.moveCount) / newTotal,
  );

  // Derive favorite preset from history (most-played super preset)
  const allHistory = [...stats.history, record];
  const presetCounts: Record<string, number> = {};
  for (const r of allHistory) {
    if (r.mode === 'super' && r.presetId) {
      presetCounts[r.presetId] = (presetCounts[r.presetId] ?? 0) + 1;
    }
  }
  const favoritePreset = Object.entries(presetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as any;

  const newAggregate: AggregateStats = {
    totalGames: newTotal,
    wins:       newWins,
    losses:     newLosses,
    draws:      newDraws,
    winRate:    newTotal > 0 ? newWins / newTotal : 0,
    averageMoveCount: newAvgMoves,
    longestWinStreak: newLongest,
    currentStreak:    newStreak,
    favoritePreset,
  };

  return {
    ...stats,
    [record.mode]: newAggregate,
    history: [...stats.history, record].slice(-200), // keep last 200 games
    updatedAt: Date.now(),
  };
}

export function clearStats(): PlayerStatistics {
  const fresh = emptyStats();
  saveStats(fresh);
  return fresh;
}
