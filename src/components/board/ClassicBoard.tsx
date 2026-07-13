'use client';

/**
 * ClassicBoard — the 3×3 grid for Classic Tic Tac Toe.
 *
 * This component has zero game logic. It renders cells from state and
 * forwards click events upward via onPlay.
 *
 * Accessibility:
 *   - role="grid" with aria-label
 *   - Each cell has a descriptive aria-label
 *   - Arrow-key navigation handled by useKeyboardNav
 */

import type { ClassicGameState } from '@/types';
import { Cell } from './Cell';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';

interface Props {
  state: ClassicGameState;
  onPlay: (cellIndex: number) => void;
}

export function ClassicBoard({ state, onPlay }: Props) {
  const isActive = state.phase === 'active';
  const size = state.boardSize ?? 3;
  const { focusedIndex, handleKeyDown } = useKeyboardNav(size * size - 1);

  function handlePlay(cellIndex: number) {
    if (isActive) onPlay(cellIndex);
  }

  return (
    <div
      className="w-full max-w-[360px] mx-auto rounded-xl overflow-hidden shadow-2xl"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: '2px',
        background: 'var(--color-board-line)',
      }}
      role="grid"
      aria-label="Tic Tac Toe board"
      onKeyDown={(e) => handleKeyDown(e, handlePlay)}
    >
      {state.board.cells.map((value, index) => (
        <div
          key={index}
          role="gridcell"
          className="bg-[var(--color-surface-1)]"
          style={{ aspectRatio: '1' }}
        >
          <Cell
            value={value}
            cellIndex={index}
            isPlayable={isActive && value === null}
            isFocused={focusedIndex === index}
            currentPlayer={state.currentPlayer}
            onPlay={handlePlay}
            size="md"
          />
        </div>
      ))}
    </div>
  );
}
