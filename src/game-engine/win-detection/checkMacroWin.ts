/**
 * Macro-level (global) win and draw detection.
 *
 * The macro board is a 9-element array of MacroCellValue.
 * To reuse the same checkWinner / checkDraw logic, we project MacroCellValue
 * → CellValue by treating 'D' (drawn board) as null (doesn't count as a win).
 *
 * This projection is the only Super-specific logic here. Everything else
 * delegates to the shared micro-board functions.
 */

import type { MacroCellValue, CellValue } from '@/types';
import type { WinResult } from '@/types';
import { checkWinner } from './checkWinner';
import { checkDraw } from './checkDraw';
import { macroCellToWinCell } from '../utils/boardUtils';

function projectMacroGrid(macroGrid: readonly MacroCellValue[]): CellValue[] {
  return macroGrid.map(macroCellToWinCell);
}

export function checkMacroWinner(macroGrid: readonly MacroCellValue[], size = 3): WinResult | null {
  return checkWinner(projectMacroGrid(macroGrid), size);
}

/**
 * A macro draw occurs when every micro board is resolved (none are null)
 * and no player has won the macro board.
 *
 * Note: a board with MacroCellValue === null is still active — not yet resolved.
 */
export function checkMacroDraw(macroGrid: readonly MacroCellValue[], size = 3): boolean {
  const allResolved = macroGrid.every((v) => v !== null);
  if (!allResolved) return false;
  return checkMacroWinner(macroGrid, size) === null;
}
