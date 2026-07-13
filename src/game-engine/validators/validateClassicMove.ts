import type { ClassicGameState, ClassicMove, MoveError, ValidateClassicMove } from '@/types';
import { isValidIndex } from '../utils/boardUtils';

export const validateClassicMove: ValidateClassicMove = (
  state: ClassicGameState,
  move: ClassicMove,
): MoveError | null => {
  if (state.phase !== 'active') {
    return 'game-not-active';
  }

  if (!isValidIndex(move.cellIndex, state.board.cells.length)) {
    return 'invalid-cell-index';
  }

  if (state.board.cells[move.cellIndex] !== null) {
    return 'cell-occupied';
  }

  return null;
};
