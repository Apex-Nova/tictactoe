/**
 * Draw detection for a single board (micro or classic).
 *
 * A board is drawn when:
 *   - All cells are occupied (no nulls remain), AND
 *   - No winner exists.
 *
 * The caller is responsible for checking win first and only calling this
 * if checkWinner returned null — but this function is safe to call in any order.
 *
 * For the macro board, call this on the macroGrid (converted via macroCellToWinCell)
 * after confirming no macro winner. A macro draw means all 9 micro boards are
 * resolved (won or drawn) and no player achieved 3 in a row on the macro grid.
 */

import type { CellValue } from '@/types';
import { checkWinner } from './checkWinner';

export function checkDraw(cells: readonly CellValue[], size = 3): boolean {
  const allFilled = cells.every((cell) => cell !== null);
  if (!allFilled) return false;
  return checkWinner(cells, size) === null;
}

/**
 * Checks if a micro board is fully resolved (won or drawn).
 * Alias for clarity at call sites in the Super engine.
 */
export function isBoardResolved(cells: readonly CellValue[], size = 3): boolean {
  return checkWinner(cells, size) !== null || checkDraw(cells, size);
}
