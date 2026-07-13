/**
 * Classic Tic Tac Toe engine.
 *
 * Implements the ClassicEngine interface. Fully stateless — every method is a
 * pure function: same inputs always produce the same output, no side effects.
 *
 * Multiplayer note: the server and client run identical engine instances.
 * The server applies the move authoritatively and sends the resulting state.
 * The client may optimistically render the move but reconciles on the server's
 * state response — made trivial by the immutable, serializable state design.
 */

import type {
  ClassicEngine as IClassicEngine,
  ClassicGameState,
  ClassicMove,
  CreateClassicGameOptions,
  MoveResult,
} from '@/types';
import { createClassicGameState } from './models/createGameState';
import { validateClassicMove } from './validators/validateClassicMove';
import { checkWinner } from './win-detection/checkWinner';
import { checkDraw } from './win-detection/checkDraw';
import { opponent } from './utils/playerUtils';
import type { Grid } from '@/types';

class ClassicEngineImpl implements IClassicEngine {
  createGame(options: CreateClassicGameOptions): ClassicGameState {
    return createClassicGameState(options);
  }

  applyMove(state: ClassicGameState, move: ClassicMove): MoveResult<ClassicGameState> {
    const error = validateClassicMove(state, move);
    if (error) return { ok: false, error };

    const now = Date.now();

    // Immutably update the board cells
    const cells = [...state.board.cells] as Grid;
    cells[move.cellIndex] = state.currentPlayer;

    const newBoard = { cells };

    // Append to move history
    const historyEntry = {
      moveNumber: state.moveHistory.length + 1,
      player: state.currentPlayer,
      move,
      timestamp: now,
    };

    // Check for winner
    const winResult = checkWinner(cells, state.boardSize);
    if (winResult) {
      const nextState: ClassicGameState = {
        ...state,
        board: newBoard,
        phase: 'finished',
        result: { kind: 'win', winner: winResult.winner, winLine: winResult.line },
        moveHistory: [...state.moveHistory, historyEntry],
        updatedAt: now,
      };
      return { ok: true, state: nextState };
    }

    // Check for draw
    if (checkDraw(cells, state.boardSize)) {
      const nextState: ClassicGameState = {
        ...state,
        board: newBoard,
        phase: 'finished',
        result: { kind: 'draw' },
        moveHistory: [...state.moveHistory, historyEntry],
        updatedAt: now,
      };
      return { ok: true, state: nextState };
    }

    // Game continues — switch player
    const nextState: ClassicGameState = {
      ...state,
      board: newBoard,
      currentPlayer: opponent(state.currentPlayer),
      moveHistory: [...state.moveHistory, historyEntry],
      updatedAt: now,
    };
    return { ok: true, state: nextState };
  }

  getLegalMoves(state: ClassicGameState): readonly ClassicMove[] {
    if (state.phase !== 'active') return [];
    return state.board.cells
      .map((cell, index) => (cell === null ? { cellIndex: index as ClassicMove['cellIndex'] } : null))
      .filter((m): m is ClassicMove => m !== null);
  }
}

export const classicEngine: IClassicEngine = new ClassicEngineImpl();
