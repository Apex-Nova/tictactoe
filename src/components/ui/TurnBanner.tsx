'use client';

/**
 * TurnBanner — displays which player's turn it is.
 *
 * Animates smoothly when the player switches.
 * Also shows "Free Move" when activeBoardIndex is null in Super mode.
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { Player } from '@/types';

interface Props {
  currentPlayer: Player;
  playerXName: string;
  playerOName: string;
  isFreeMove?: boolean;
  isAwaitingChoice?: boolean;
  phase: string;
}

export function TurnBanner({
  currentPlayer,
  playerXName,
  playerOName,
  isFreeMove = false,
  isAwaitingChoice = false,
  phase,
}: Props) {
  if (phase === 'finished' || phase === 'abandoned') return null;

  const isX = currentPlayer === 'X';
  const displayName = isX ? playerXName : playerOName;

  const colorClass = isX
    ? 'text-[var(--color-x-primary)]'
    : 'text-[var(--color-o-primary)]';

  const bgClass = isX
    ? 'bg-[var(--color-x-bg)] border-[var(--color-x-primary)]/30'
    : 'bg-[var(--color-o-bg)] border-[var(--color-o-primary)]/30';

  const subText = isAwaitingChoice
    ? 'Choose a destination board'
    : isFreeMove
    ? 'Free move — choose any board'
    : "It's your turn";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPlayer + phase}
        className={`
          flex flex-col items-center gap-1 px-6 py-3
          rounded-xl border ${bgClass}
          transition-colors duration-300
        `}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18 }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            className={`text-2xl font-black ${colorClass}`}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            {currentPlayer}
          </motion.span>
          <span className="text-[var(--color-text-primary)] font-semibold text-lg">
            {displayName}
          </span>
        </div>
        <span className="text-[var(--color-text-secondary)] text-sm">{subText}</span>
      </motion.div>
    </AnimatePresence>
  );
}
