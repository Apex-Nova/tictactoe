/**
 * Core win detection.
 *
 * This single function serves dual purpose:
 *   1. Detecting a winner in a micro (small) TTT board.
 *   2. Detecting a winner in the macro board — by passing the macro grid
 *      converted to a CellValue array (see macroCellToWinCell in boardUtils).
 *
 * The same algorithm handles both cases. This is intentional — it means the
 * global win condition and the local win condition share exactly one
 * implementation, with no duplication and no divergence risk.
 *
 * Returns the WinResult (winner + winning line) or null if no winner yet.
 */

import type { CellValue } from '@/types';
import type { WinResult } from '@/types';
import { getWinLines } from './generateWinLines';

export function checkWinner(cells: readonly CellValue[], size = 3): WinResult | null {
  const lines = getWinLines(size, size);
  for (const line of lines) {
    const first = cells[line[0]];
    if (first !== null && line.every((i) => cells[i] === first)) {
      return { winner: first as 'X' | 'O', line };
    }
  }
  return null;
}
