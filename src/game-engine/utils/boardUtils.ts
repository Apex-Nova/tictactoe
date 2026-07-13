import type { BoardIndex, CellValue, MacroCellValue } from '@/types';
import type { MicroBoard } from '@/types';

/**
 * Returns all BoardIndex values for micro boards that are still active
 * (not won and not drawn) and have at least one empty cell.
 *
 * Used by:
 *   - free-move redirect logic
 *   - portal-board redirect logic
 *   - control-board valid destination computation
 *   - AI legal board enumeration
 */
export function getActiveBoards(microBoards: readonly MicroBoard[]): BoardIndex[] {
  return microBoards
    .filter((b) => b.status.kind === 'active' && b.cells.some((c) => c === null))
    .map((b) => b.index as BoardIndex);
}

/**
 * Returns true if an index is a non-negative integer within [0, max).
 * Pass the cell/board count as `max` (e.g. state.board.cells.length).
 * Defaults to 9 (legacy 3×3) when no max supplied.
 */
export function isValidIndex(index: number, max = 9): index is BoardIndex {
  return Number.isInteger(index) && index >= 0 && index < max;
}

/**
 * Converts a MacroCellValue to a CellValue for use by win-detection,
 * which operates on CellValue grids.
 * 'D' (draw) is treated as null — a drawn board does not count toward wins.
 */
export function macroCellToWinCell(value: MacroCellValue): CellValue {
  if (value === 'X' || value === 'O') return value;
  return null;
}
