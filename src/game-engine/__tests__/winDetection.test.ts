/**
 * Win detection — isolated unit tests.
 *
 * checkWinner and checkDraw are pure functions over arrays.
 * Every edge case is testable without game state.
 */

import { checkWinner } from '../win-detection/checkWinner';
import { checkDraw, isBoardResolved } from '../win-detection/checkDraw';
import { checkMacroWinner, checkMacroDraw } from '../win-detection/checkMacroWin';
import type { CellValue, MacroCellValue } from '@/types';

// ── checkWinner ───────────────────────────────────────────────────────────────

describe('checkWinner', () => {
  it('returns null for an empty board', () => {
    expect(checkWinner(Array(9).fill(null) as CellValue[])).toBeNull();
  });

  it('detects all 8 winning lines for X', () => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6],             // diagonals
    ];
    for (const line of lines) {
      const cells: CellValue[] = Array(9).fill(null);
      line.forEach((i) => { cells[i] = 'X'; });
      const result = checkWinner(cells);
      expect(result).not.toBeNull();
      expect(result!.winner).toBe('X');
      expect(result!.line).toEqual(line);
    }
  });

  it('does not false-positive on two-in-a-row', () => {
    const cells: CellValue[] = ['X', 'X', null, null, null, null, null, null, null];
    expect(checkWinner(cells)).toBeNull();
  });

  it('does not count mixed cells as a win', () => {
    const cells: CellValue[] = ['X', 'O', 'X', null, null, null, null, null, null];
    expect(checkWinner(cells)).toBeNull();
  });
});

// ── checkDraw ─────────────────────────────────────────────────────────────────

describe('checkDraw', () => {
  it('returns false for an empty board', () => {
    expect(checkDraw(Array(9).fill(null) as CellValue[])).toBe(false);
  });

  it('returns false when board has empty cells', () => {
    const cells: CellValue[] = ['X', 'O', 'X', 'O', 'X', 'O', 'O', null, null];
    expect(checkDraw(cells)).toBe(false);
  });

  it('returns false when board is full but has a winner', () => {
    // X wins col 0: X,O,X,X,O,O,X,O,X  wait: X,O,_,X,O,_,X,O,_ col0=X wins
    const cells: CellValue[] = ['X', 'O', 'O', 'X', 'O', 'X', 'X', 'X', 'O'];
    // Verify it's a win first
    expect(checkWinner(cells)).not.toBeNull();
    expect(checkDraw(cells)).toBe(false);
  });

  it('returns true for a genuine draw', () => {
    // X,O,X / O,O,X / O,X,O — no winner, all filled
    const cells: CellValue[] = ['X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', 'O'];
    expect(checkWinner(cells)).toBeNull();
    expect(checkDraw(cells)).toBe(true);
  });
});

// ── checkMacroWinner ──────────────────────────────────────────────────────────

describe('checkMacroWinner', () => {
  it('detects a macro win ignoring drawn boards', () => {
    // X wins macro top row, board1 is drawn
    const macro: MacroCellValue[] = ['X', 'D', 'X', null, null, null, null, null, null];
    // 'D' in position 1 should NOT count as X win for the top row [0,1,2]
    expect(checkMacroWinner(macro)).toBeNull();
  });

  it('detects X winning macro top row', () => {
    const macro: MacroCellValue[] = ['X', 'X', 'X', null, null, null, null, null, null];
    const result = checkMacroWinner(macro);
    expect(result?.winner).toBe('X');
  });

  it('detects O winning macro diagonal', () => {
    const macro: MacroCellValue[] = ['O', null, null, null, 'O', null, null, null, 'O'];
    const result = checkMacroWinner(macro);
    expect(result?.winner).toBe('O');
  });
});

// ── checkMacroDraw ────────────────────────────────────────────────────────────

describe('checkMacroDraw', () => {
  it('returns false when boards are still active (null)', () => {
    const macro: MacroCellValue[] = ['X', 'O', 'X', 'D', 'X', 'O', null, 'X', 'O'];
    expect(checkMacroDraw(macro)).toBe(false);
  });

  it('returns true when all boards resolved and no macro winner', () => {
    // No 3-in-a-row for either player
    const macro: MacroCellValue[] = ['X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', 'D'];
    // Verify no winner
    expect(checkMacroWinner(macro)).toBeNull();
    expect(checkMacroDraw(macro)).toBe(true);
  });
});
