'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/types';

interface Props {
  state: GameState;
  presetDisplayName: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function DrawScreen({ state, presetDisplayName, onPlayAgain, onMainMenu }: Props) {
  if (state.phase !== 'finished' || state.result?.kind !== 'draw') return null;

  const moveCount = state.moveHistory.length;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-0)]/85 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal
      aria-label="Match drawn"
    >
      <motion.div
        className="
          flex flex-col items-center gap-6 p-8 rounded-2xl
          border border-[var(--color-surface-3)]
          bg-[var(--color-surface-1)]
          max-w-sm w-full text-center
          shadow-2xl
        "
        initial={{ scale: 0.75, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
      >
        <motion.div
          className="text-6xl font-black text-[var(--color-text-muted)] select-none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 18, delay: 0.2 }}
        >
          ═
        </motion.div>

        <div>
          <h2 className="text-3xl font-black text-[var(--color-text-primary)]">Draw</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">No winner this time</p>
        </div>

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

        <div className="flex gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="
              flex-1 py-3 rounded-xl font-bold text-sm
              bg-[var(--color-accent)] hover:bg-indigo-400
              text-white transition-colors duration-150 active:scale-95
            "
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
  );
}
