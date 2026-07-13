'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { GameRecord, PlayerStatistics } from '@/types/statistics';
import { loadStats, recordGame, saveStats, clearStats } from '@/services/StatsService';

interface StatsContextValue {
  stats: PlayerStatistics;
  addRecord: (record: GameRecord) => void;
  resetStats: () => void;
}

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<PlayerStatistics>(() => loadStats());

  // Sync to localStorage whenever stats change
  useEffect(() => { saveStats(stats); }, [stats]);

  const addRecord = useCallback((record: GameRecord) => {
    setStats((prev) => recordGame(prev, record));
  }, []);

  const resetStats = useCallback(() => {
    setStats(clearStats());
  }, []);

  const value = useMemo<StatsContextValue>(
    () => ({ stats, addRecord, resetStats }),
    [stats, addRecord, resetStats],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be inside <StatsProvider>');
  return ctx;
}
