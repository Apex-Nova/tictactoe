'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStats } from '@/contexts/StatsContext';
import type { AggregateStats } from '@/types/statistics';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-xl border"
      style={{ background: 'var(--th-bg-1)', borderColor: 'var(--th-bg-3)' }}
    >
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--th-text-muted)' }}>{label}</span>
      <span className="text-2xl font-black" style={{ color: 'var(--th-text-primary)' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'var(--th-text-muted)' }}>{sub}</span>}
    </div>
  );
}

function ModeStats({ title, stats }: { title: string; stats: AggregateStats }) {
  const pct = stats.totalGames > 0 ? Math.round(stats.winRate * 100) : 0;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-black">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Games"   value={stats.totalGames} />
        <StatCard label="Win %"   value={`${pct}%`} sub={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`} />
        <StatCard label="Streak"  value={stats.currentStreak} sub={`Best: ${stats.longestWinStreak}`} />
        <StatCard label="Avg Moves" value={stats.averageMoveCount > 0 ? stats.averageMoveCount.toFixed(1) : '—'} />
      </div>
    </div>
  );
}

export function StatsScreen() {
  const router = useRouter();
  const { stats, resetStats } = useStats();

  const recentHistory = [...stats.history].reverse().slice(0, 20);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--th-bg-0)', color: 'var(--th-text-primary)' }}>
      <div className="flex items-center gap-4 px-6 pt-8 pb-4">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-bold px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--th-bg-3)', color: 'var(--th-text-muted)' }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-black flex-1">Statistics</h1>
        <button
          onClick={() => { if (confirm('Reset all statistics?')) resetStats(); }}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--th-bg-3)', color: 'var(--th-text-muted)' }}
        >
          Reset
        </button>
      </div>

      <motion.div
        className="flex-1 px-6 pb-10 flex flex-col gap-8 max-w-3xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ModeStats title="Classic Mode" stats={stats.classic} />
        <ModeStats title="Super Mode"   stats={stats.super} />

        {/* Match history */}
        {recentHistory.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-black">Recent Matches</h2>
            <div className="flex flex-col gap-2">
              {recentHistory.map((r) => {
                const resultColor = r.result === 'win' ? 'var(--th-x-primary)' : r.result === 'loss' ? 'var(--th-o-primary)' : 'var(--th-text-muted)';
                return (
                  <div
                    key={r.gameId}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl border"
                    style={{ background: 'var(--th-bg-1)', borderColor: 'var(--th-bg-3)' }}
                  >
                    <span className="font-black text-sm capitalize" style={{ color: resultColor, minWidth: 36 }}>{r.result}</span>
                    <span className="text-xs capitalize" style={{ color: 'var(--th-text-muted)' }}>{r.mode}</span>
                    {r.opponentType === 'ai' && r.difficulty && (
                      <span className="text-xs capitalize" style={{ color: 'var(--th-text-muted)' }}>vs AI ({r.difficulty})</span>
                    )}
                    {r.opponentType === 'human' && (
                      <span className="text-xs" style={{ color: 'var(--th-text-muted)' }}>vs Human</span>
                    )}
                    <span className="ml-auto text-xs" style={{ color: 'var(--th-text-muted)' }}>{r.moveCount} moves</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stats.history.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--th-text-muted)' }}>
            <div className="text-4xl mb-4">🎮</div>
            <div className="font-semibold">No games played yet</div>
            <div className="text-sm mt-1">Start a match to track your progress</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
