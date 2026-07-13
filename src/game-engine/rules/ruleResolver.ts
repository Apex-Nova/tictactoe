/**
 * Rule Resolver — the strategy layer between the engine and a RulePreset.
 *
 * The engine calls exactly one function: `resolveNextBoard`.
 * That function reads the preset's behavior fields and returns one of:
 *
 *   { kind: 'fixed';       boardIndex: BoardIndex }   → play in this board
 *   { kind: 'free-move' }                             → player picks any active board
 *   { kind: 'portal' }                                → sent player picks any active board
 *   { kind: 'control' }                               → redirecting player picks (Preset B)
 *
 * The engine then acts on the returned directive:
 *   - 'fixed'      → set activeBoardIndex
 *   - 'free-move'  → set activeBoardIndex = null
 *   - 'portal'     → set activeBoardIndex = null (same behavior, distinct semantic)
 *   - 'control'    → set phase = 'awaiting-board-choice'
 *
 * No switch statements on preset IDs anywhere in the engine.
 * All branching is data-driven from the preset object.
 */

import type { BoardIndex, RulePreset } from '@/types';
import type { MicroBoard, MicroBoardStatus } from '@/types';
import { getActiveBoards } from '../utils/boardUtils';

export type NextBoardDirective =
  | { kind: 'fixed';      boardIndex: BoardIndex }
  | { kind: 'free-move' }
  | { kind: 'portal' }
  | { kind: 'control' };

/**
 * Determines what happens after a move is made.
 *
 * @param cellIndex    The cell played — this maps 1:1 to the next board index
 * @param microBoards  Current state of all micro boards (post-move)
 * @param preset       The active rule preset
 */
export function resolveNextBoard(
  cellIndex: number,
  microBoards: readonly MicroBoard[],
  preset: RulePreset,
): NextBoardDirective {
  const targetBoardIndex = cellIndex as BoardIndex;
  const targetBoard = microBoards[targetBoardIndex];
  const targetStatus: MicroBoardStatus = targetBoard.status;

  // Happy path: target board is still active — send player there.
  if (targetStatus.kind === 'active') {
    // Edge case: the board is active but all cells are filled.
    // This can only happen transiently if a win check is pending.
    // We treat it as a free move to be safe.
    if (targetBoard.cells.some((c) => c === null)) {
      return { kind: 'fixed', boardIndex: targetBoardIndex };
    }
  }

  // Target board is won — consult wonBoardBehavior
  if (targetStatus.kind === 'won') {
    return resolveFreeBehavior(preset.wonBoardBehavior.type, microBoards);
  }

  // Target board is drawn — consult drawnBoardBehavior
  if (targetStatus.kind === 'drawn') {
    return resolveFreeBehavior(preset.drawnBoardBehavior.type, microBoards);
  }

  // Fallback: target board was somehow occupied — free move
  return resolveFreeBehavior(preset.wonBoardBehavior.type, microBoards);
}

function resolveFreeBehavior(
  behaviorType: RulePreset['wonBoardBehavior']['type'],
  microBoards: readonly MicroBoard[],
): NextBoardDirective {
  switch (behaviorType) {
    case 'free-move':
      return { kind: 'free-move' };
    case 'portal-board':
      return { kind: 'portal' };
    case 'control-board': {
      // Only emit control directive if there are valid boards to choose from.
      // If every board is resolved, the game should already be over — but guard anyway.
      const available = getActiveBoards(microBoards);
      if (available.length === 0) return { kind: 'free-move' };
      return { kind: 'control' };
    }
  }
}
