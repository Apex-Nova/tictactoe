/**
 * Super move validator.
 *
 * All validation is pure and synchronous. Returns the first error found,
 * or null if the move is legal.
 *
 * Validation order matters — more fundamental errors are checked first
 * so error messages are always accurate and actionable.
 */

import type { MoveError, SuperGameState, SuperMove, ValidateSuperMove } from '@/types';
import { isValidIndex } from '../utils/boardUtils';

export const validateSuperMove: ValidateSuperMove = (
  state: SuperGameState,
  move: SuperMove,
): MoveError | null => {
  // 1. Game must be in an active phase
  if (state.phase === 'finished' || state.phase === 'abandoned') {
    return 'game-not-active';
  }

  // 2. Cannot play during awaiting-board-choice phase
  if (state.phase === 'awaiting-board-choice') {
    return 'awaiting-board-choice';
  }

  // 3. Validate index ranges
  if (!isValidIndex(move.boardIndex, state.microBoards.length)) {
    return 'invalid-board-index';
  }
  const targetBoardForValidation = state.microBoards[move.boardIndex];
  if (!targetBoardForValidation || !isValidIndex(move.cellIndex, targetBoardForValidation.cells.length)) {
    return 'invalid-cell-index';
  }

  // 4. Enforce active board constraint
  //    activeBoardIndex === null means free move (any active board is legal)
  if (state.activeBoardIndex !== null && move.boardIndex !== state.activeBoardIndex) {
    return 'wrong-board';
  }

  const targetBoard = state.microBoards[move.boardIndex];

  // 5. Target board must not be resolved
  if (targetBoard.status.kind !== 'active') {
    return 'board-resolved';
  }

  // 6. Target cell must be empty
  if (targetBoard.cells[move.cellIndex] !== null) {
    return 'cell-occupied';
  }

  return null;
};
