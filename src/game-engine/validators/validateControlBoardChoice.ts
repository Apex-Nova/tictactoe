/**
 * Validates a board choice submitted during the 'awaiting-board-choice' phase
 * (Preset B: Control Draw Rules).
 *
 * The chosen board must:
 *   - Be within 0–8 range
 *   - Not be won
 *   - Not be drawn
 *   - Have at least one empty cell
 */

import type { BoardIndex, MoveError, SuperGameState } from '@/types';
import { isValidIndex } from '../utils/boardUtils';

export function validateControlBoardChoice(
  state: SuperGameState,
  boardIndex: BoardIndex,
): MoveError | null {
  if (state.phase !== 'awaiting-board-choice') {
    return 'game-not-active';
  }

  if (!isValidIndex(boardIndex)) {
    return 'invalid-board-index';
  }

  const board = state.microBoards[boardIndex];

  if (board.status.kind !== 'active') {
    return 'invalid-board-choice';
  }

  if (!board.cells.some((c) => c === null)) {
    return 'invalid-board-choice';
  }

  return null;
}
