'use client';

/**
 * Cell — a single playable cell in either Classic or Super mode.
 *
 * Responsibilities:
 *   - Render the player mark (X or O) or an empty state
 *   - Apply hover preview, disabled, and focused styles
 *   - Fire onPlay callback — never contains logic about whether the move is legal
 *   - Accessible: role="button", aria-label, keyboard support
 *
 * The parent (ClassicBoard / MicroBoard) determines isPlayable.
 */

import { motion } from 'framer-motion';
import type { CellValue, Player } from '@/types';
import { PlayerMark } from './PlayerMark';

interface Props {
  value: CellValue;
  cellIndex: number;
  isPlayable: boolean;
  isFocused?: boolean;
  currentPlayer: Player;
  onPlay: (cellIndex: number) => void;
  size?: 'sm' | 'md';
}

export function Cell({
  value,
  cellIndex,
  isPlayable,
  isFocused = false,
  currentPlayer,
  onPlay,
  size = 'md',
}: Props) {
  const isEmpty = value === null;
  const isClickable = isEmpty && isPlayable;
  const markSize = size === 'sm' ? 'sm' : 'md';

  const ariaLabel = value
    ? `Cell ${cellIndex + 1}: ${value}`
    : isPlayable
    ? `Cell ${cellIndex + 1}: empty, click to play`
    : `Cell ${cellIndex + 1}: empty`;

  function handleClick() {
    if (isClickable) onPlay(cellIndex);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
      e.preventDefault();
      onPlay(cellIndex);
    }
  }

  return (
    <motion.button
      className={[
        'relative flex items-center justify-center w-full h-full',
        'rounded-md border border-transparent transition-colors duration-100',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
        isClickable
          ? 'cursor-pointer hover:bg-[var(--color-cell-hover)]'
          : 'cursor-default',
        isFocused && isClickable
          ? 'bg-[var(--color-cell-hover)] outline-2 outline-[var(--color-accent)]'
          : '',
      ].join(' ')}
      role="button"
      aria-label={ariaLabel}
      aria-disabled={!isClickable}
      tabIndex={isPlayable ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileTap={isClickable ? { scale: 0.9 } : undefined}
    >
      {/* Hover preview of current player's mark */}
      {isEmpty && isPlayable && (
        <span
          className={`
            absolute inset-0 flex items-center justify-center
            opacity-0 hover:opacity-25 transition-opacity duration-150
            ${currentPlayer === 'X' ? 'mark-x' : 'mark-o'}
            ${markSize === 'sm' ? 'text-lg font-black' : 'text-2xl font-black'}
            select-none pointer-events-none
          `}
          aria-hidden
        >
          {currentPlayer}
        </span>
      )}

      {/* Placed mark */}
      {value && <PlayerMark player={value} size={markSize} animate />}
    </motion.button>
  );
}
