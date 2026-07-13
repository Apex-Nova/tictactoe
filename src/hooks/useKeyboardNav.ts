'use client';

/**
 * useKeyboardNav — arrow-key navigation within a 3×3 grid.
 *
 * Keeps a focused cell index in local state. The consumer passes
 * this index to the board's cell components and calls onSelect when
 * Enter/Space is pressed.
 *
 * Grid layout (row-major):
 *   0 | 1 | 2
 *   3 | 4 | 5
 *   6 | 7 | 8
 */

import { useCallback, useState } from 'react';

const COLS = 3;

export function useKeyboardNav(initialIndex = 4) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, onSelect: (index: number) => void) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((i) => (i % COLS === COLS - 1 ? i : i + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((i) => (i % COLS === 0 ? i : i - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((i) => (i + COLS < 9 ? i + COLS : i));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((i) => (i - COLS >= 0 ? i - COLS : i));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(focusedIndex);
          break;
      }
    },
    [focusedIndex],
  );

  return { focusedIndex, setFocusedIndex, handleKeyDown };
}
