'use client';

/**
 * VictoryScreen — shown when phase === 'finished' and result.kind === 'win'.
 *
 * Displays winner, preset used, move count, and action buttons.
 * Animations are set up for Phase 7 to enhance (confetti, 3D reveal, etc.)
 */

import { motion } from 'framer-motion';
import type { GameState } from '@/types';
import { PlayerMark } from '../board/PlayerMark';
import { Confetti } from './Confetti';

interface Props {
  state: GameState;
  playerXName: string;
  playerOName: string;
  presetDisplayName: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function VictoryScreen({
  state,
  playerXName,
  playerOName,
  presetDisplayName,
  onPlayAgain,
  onMainMenu,
}: Props) {
  if (state.phase !== 'finished' || state.result?.kind !== 'win') return null;

  const winner = state.result.winner;
  const winnerName = winner === 'X' ? playerXName : playerOName;
  const isX = winner === 'X';

  const colorClass = isX
    ? 'text-[var(--color-x-primary)]'
    : 'text-[var(--color-o-primary)]';

  const glowClass = isX
    ? 'shadow-[0_0_60px_var(--color-x-glow)]'
    : 'shadow-[0_0_60px_var(--color-o-glow)]';

  const bgClass = isX
    ? 'bg-[var(--color-x-bg)] border-[var(--color-x-primary)]/20'
    : 'bg-[var(--color-o-bg)] border-[var(--color-o-primary)]/20';

  const moveCount = state.moveHistory.length;

  return (
    <>
    <Confetti active />
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-0)]/85 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal
      aria-label={`${winnerName} wins!`}
    >
      <motion.div
        className={`
          flex flex-col items-center gap-6 p-8 rounded-2xl
          border ${bgClass} ${glowClass}
          max-w-sm w-full text-center
        `}
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
      >
        {/* Winner mark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 18, delay: 0.25 }}
        >
          <PlayerMark player={winner} size="xl" animate={false} />
        </motion.div>

        {/* Winner name */}
        <div>
          <h2 className={`text-3xl font-black ${colorClass}`}>{winnerName}</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">wins the match!</p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm text-[var(--color-text-muted)]">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{moveCount}</div>
            <div>Moves</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-[var(--color-text-secondary)] mt-1">
              {presetDisplayName}
            </div>
            <div>Rule Set</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className={`
              flex-1 py-3 rounded-xl font-bold text-sm
              ${isX
                ? 'bg-[var(--color-x-primary)] hover:bg-blue-400'
                : 'bg-[var(--color-o-primary)] hover:bg-orange-400'
              }
              text-white transition-colors duration-150 active:scale-95
            `}
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="
              flex-1 py-3 rounded-xl font-bold text-sm
              bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]
              text-[var(--color-text-secondary)]
              border border-[var(--color-surface-3)]
              transition-colors duration-150 active:scale-95
            "
          >
            Main Menu
          </button>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
}
