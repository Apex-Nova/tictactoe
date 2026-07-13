/**
 * Board factory functions.
 *
 * All initial board state is created through these functions.
 * This is the only place in the engine where board objects are constructed
 * from scratch — everywhere else produces new state via derivation.
 */

import type { BoardIndex, CellValue, Grid, MacroCellValue } from '@/types';
import type { ClassicBoard, MacroGrid, MicroBoard, MicroBoardStatus } from '@/types';

/** Creates a blank N²-cell grid (all nulls). */
export function createEmptyGrid(size = 3): Grid {
  return Array(size * size).fill(null) as Grid;
}

/** Creates a blank macro grid (all nulls, meaning all boards are active). */
export function createEmptyMacroGrid(size = 3): MacroGrid {
  return Array(size * size).fill(null) as MacroGrid;
}

/** Creates a single blank micro board. */
export function createMicroBoard(index: BoardIndex, size = 3): MicroBoard {
  return {
    index,
    cells: createEmptyGrid(size),
    status: { kind: 'active' },
  };
}

/** Creates the full set of NxN micro boards for a Super game. */
export function createMicroBoards(size = 3): MicroBoard[] {
  return Array.from({ length: size * size }, (_, i) => createMicroBoard(i as BoardIndex, size));
}

/** Creates a blank Classic board. */
export function createClassicBoard(size = 3): ClassicBoard {
  return { cells: createEmptyGrid(size) };
}

/**
 * Produces a new MicroBoard with the given cell updated.
 * Pure — does not mutate the input board.
 */
export function setMicroBoardCell(
  board: MicroBoard,
  cellIndex: number,
  value: CellValue,
  newStatus: MicroBoardStatus,
): MicroBoard {
  const cells = [...board.cells] as Grid;
  cells[cellIndex] = value;
  return { ...board, cells, status: newStatus };
}

/**
 * Produces a new MacroGrid with the given cell updated.
 * Pure — does not mutate the input grid.
 */
export function setMacroGridCell(
  grid: readonly MacroCellValue[],
  boardIndex: BoardIndex,
  value: MacroCellValue,
): MacroGrid {
  const next = [...grid] as MacroGrid;
  next[boardIndex] = value;
  return next;
}
