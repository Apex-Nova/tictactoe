'use client';

/**
 * FreeMoveNotice — shown when activeBoardIndex is null in Super mode.
 *
 * Distinguishes between Preset A/B free-move and Preset C portal visually.
 */

import { motion } from 'framer-motion';
import type { ResolvedBoardBehavior } from '@/types';

interface Props {
  behavior: ResolvedBoardBehavior | 'initial';
  currentPlayer: 'X' | 'O';
}

const labels: Record<string, string> = {
  initial:       'First move — play anywhere',
  'free-move':   'Free move — choose any board',
  'portal-board':'Portal — jump to any board',
  'control-board': '', // handled by ControlDrawOverlay, not this component
};

export function FreeMoveNotice({ behavior, currentPlayer }: Props) {
  if (behavior === 'control-board') return null;
  const label = labels[behavior] ?? 'Free move';
  const colorClass = currentPlayer === 'X'
    ? 'text-[var(--color-x-primary)]'
    : 'text-[var(--color-o-primary)]';

  return (
    <motion.div
      key={behavior}
      className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <span className={`text-base ${colorClass}`}>✦</span>
      <span>{label}</span>
    </motion.div>
  );
}
