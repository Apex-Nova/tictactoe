'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { BoardIndex, MicroBoard as MicroBoardType, Player } from '@/types';
import { PlayerMark } from './PlayerMark';

interface Props {
  board: MicroBoardType;
  boardIndex: BoardIndex;
  isActive: boolean;
  isPlayable: boolean;
  isControlChoice: boolean;
  currentPlayer: Player;
  cellPx?: number;
  onCellPlay: (boardIndex: BoardIndex, cellIndex: number) => void;
  onBoardSelect?: (boardIndex: BoardIndex) => void;
}

export function MicroBoard({
  board,
  boardIndex,
  isActive,
  isPlayable,
  isControlChoice,
  currentPlayer,
  cellPx = 150,
  onCellPlay,
  onBoardSelect,
}: Props) {
  const isResolved = board.status.kind !== 'active';
  const winner = board.status.kind === 'won' ? board.status.winner : null;
  const isDraw = board.status.kind === 'drawn';
  const n = Math.round(Math.sqrt(board.cells.length));
  // Scale marks proportionally to the rendered cell size
  const wonMarkSize = Math.max(10, Math.floor(cellPx * 0.42));
  const cellMarkSize = Math.max(7, Math.floor((cellPx / n) * 0.52));

  const ringClass = isControlChoice
    ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-surface-2)]'
    : isActive
    ? currentPlayer === 'X'
      ? 'ring-2 ring-[var(--color-x-primary)] ring-offset-1 ring-offset-[var(--color-surface-2)]'
      : 'ring-2 ring-[var(--color-o-primary)] ring-offset-1 ring-offset-[var(--color-surface-2)]'
    : '';

  const dimmed = !isPlayable && !isResolved && !isControlChoice;

  function handleBoardClick() {
    if (isControlChoice && onBoardSelect) onBoardSelect(boardIndex);
  }

  return (
    <motion.div
      className={`
        relative w-full h-full rounded-xl overflow-hidden
        bg-[var(--color-surface-1)]
        transition-opacity duration-200
        ${ringClass}
        ${dimmed ? 'opacity-55' : 'opacity-100'}
        ${isControlChoice ? 'cursor-pointer' : ''}
      `}
      onClick={isControlChoice ? handleBoardClick : undefined}
      whileHover={isControlChoice ? { scale: 1.03 } : undefined}
      aria-label={`Board ${boardIndex + 1}${winner ? `, won by ${winner}` : isDraw ? ', drawn' : isActive ? ', active' : ''}`}
    >
      {/* N×N cell grid */}
      {(() => {
        return (
          <div
            style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: '2px', padding: '3px' }}
          >
        {board.cells.map((value, cellIndex) => {
          const cellPlayable = isPlayable && !isResolved && value === null && !isControlChoice;
          const isEmpty = value === null;

          return (
            <button
              key={cellIndex}
              role="gridcell"
              aria-label={value ? `Cell ${cellIndex + 1}: ${value}` : cellPlayable ? `Cell ${cellIndex + 1}: empty, click to play` : `Cell ${cellIndex + 1}: empty`}
              aria-disabled={!cellPlayable}
              tabIndex={cellPlayable ? 0 : -1}
              disabled={!cellPlayable}
              onClick={() => { if (cellPlayable) onCellPlay(boardIndex, cellIndex); }}
              style={{ aspectRatio: '1' }}
              className={`
                relative flex items-center justify-center
                w-full rounded-md
                bg-[var(--color-surface-2)]
                transition-colors duration-100
                ${cellPlayable ? 'cursor-pointer hover:bg-[var(--color-cell-hover)]' : 'cursor-default'}
                focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]
              `}
            >
              {/* Hover ghost */}
              {isEmpty && cellPlayable && (
                <span
                  className={`
                    absolute inset-0 flex items-center justify-center
                    opacity-0 hover:opacity-20 transition-opacity duration-150
                    font-black select-none pointer-events-none
                    ${currentPlayer === 'X' ? 'mark-x' : 'mark-o'}
                  `}
                  style={{ fontSize: cellMarkSize }}
                  aria-hidden
                >
                  {currentPlayer}
                </span>
              )}

              {/* Placed mark */}
              {value && (
                <span
                  className={`font-black select-none ${value === 'X' ? 'mark-x' : 'mark-o'}`}
                  style={{ fontSize: cellMarkSize }}
                >
                  {value}
                </span>
              )}
            </button>
          );
        })}
          </div>
        );
      })()}

      {/* Won overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div
            key="won"
            className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-1)]/90 backdrop-blur-sm rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <motion.span
              className={`font-black leading-none select-none ${winner === 'X' ? 'mark-x' : 'mark-o'}`}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{ display: 'inline-block', fontSize: wonMarkSize }}
            >
              {winner}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draw overlay */}
      <AnimatePresence>
        {isDraw && (
          <motion.div
            key="draw"
            className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-1)]/75 backdrop-blur-sm rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-[var(--color-text-muted)] text-xl font-bold select-none">—</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
