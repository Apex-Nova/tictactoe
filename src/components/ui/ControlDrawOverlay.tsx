'use client';

/**
 * ControlDrawOverlay — Preset B UX.
 *
 * Shown when state.phase === 'awaiting-board-choice'.
 * Instructs the redirecting player to pick a destination board for their opponent.
 *
 * The board selection itself happens on the MacroBoard (boards pulse with a
 * control ring style). This overlay provides the explanatory context.
 */

import { motion } from 'framer-motion';
import type { Player } from '@/types';

interface Props {
  redirectingPlayer: Player;
  playerName: string;
  availableBoardCount: number;
}

export function ControlDrawOverlay({
  redirectingPlayer,
  playerName,
  availableBoardCount,
}: Props) {
  const colorClass =
    redirectingPlayer === 'X'
      ? 'text-[var(--color-x-primary)]'
      : 'text-[var(--color-o-primary)]';

  const bgClass =
    redirectingPlayer === 'X'
      ? 'bg-[var(--color-x-bg)] border-[var(--color-x-primary)]/30'
      : 'bg-[var(--color-o-bg)] border-[var(--color-o-primary)]/30';

  return (
    <motion.div
      className={`
        flex flex-col items-center gap-2 px-6 py-4
        rounded-xl border ${bgClass}
        text-center
      `}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 24 }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        <span className={`text-xl font-black ${colorClass}`}>{redirectingPlayer}</span>
        <span className="text-[var(--color-text-primary)] font-semibold">{playerName}</span>
        <span className="text-[var(--color-text-secondary)] text-sm">— Control Draw</span>
      </div>
      <p className="text-[var(--color-text-secondary)] text-sm leading-snug max-w-xs">
        Your opponent landed on a drawn board.{' '}
        <strong className="text-[var(--color-text-primary)]">
          Select one of the {availableBoardCount} highlighted boards
        </strong>{' '}
        to send them there.
      </p>
    </motion.div>
  );
}
