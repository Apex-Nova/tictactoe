/**
 * Super Tic Tac Toe engine.
 *
 * State machine transitions:
 *
 *   setup
 *     └─ createGame()  ──────────────────────────────────► active
 *
 *   active
 *     └─ applyMove()
 *           ├─ validation fails ──────────────────────────► active  (unchanged, error returned)
 *           ├─ game won/drawn ────────────────────────────► finished
 *           ├─ next board resolved (Preset B) ────────────► awaiting-board-choice
 *           └─ normal / free-move / portal ──────────────► active  (activeBoardIndex updated)
 *
 *   awaiting-board-choice  (Preset B only)
 *     └─ resolveControlBoardChoice()
 *           ├─ invalid choice ────────────────────────────► awaiting-board-choice (unchanged, error returned)
 *           └─ valid choice ──────────────────────────────► active  (activeBoardIndex set)
 *
 *   finished  (terminal — no transitions)
 *   abandoned (terminal — no transitions)
 *
 * Multiplayer note: `applyMove` is synchronous and returns a fully resolved
 * state or an `awaiting-board-choice` state. In online mode:
 *   - Server calls applyMove, broadcasts resulting state to both clients.
 *   - If phase = awaiting-board-choice, server emits a 'choose-board' event.
 *   - The redirecting client responds with 'choose-board', server calls
 *     resolveControlBoardChoice, and broadcasts again.
 * Zero changes to the engine are required — only the transport layer differs.
 */

import type {
  BoardIndex,
  MacroCellValue,
  MoveResult,
  RulePreset,
  SuperEngine as ISuperEngine,
  SuperGameState,
  SuperMove,
  CreateSuperGameOptions,
} from '@/types';
import type { Grid, MicroBoard, MicroBoardStatus } from '@/types';
import { createSuperGameState } from './models/createGameState';
import { setMicroBoardCell, setMacroGridCell } from './models/createBoard';
import { validateSuperMove } from './validators/validateSuperMove';
import { validateControlBoardChoice } from './validators/validateControlBoardChoice';
import { checkWinner } from './win-detection/checkWinner';
import { checkDraw } from './win-detection/checkDraw';
import { checkMacroWinner, checkMacroDraw } from './win-detection/checkMacroWin';
import { resolveNextBoard } from './rules/ruleResolver';
import { opponent } from './utils/playerUtils';
import { getActiveBoards } from './utils/boardUtils';

class SuperEngineImpl implements ISuperEngine {
  createGame(options: CreateSuperGameOptions): SuperGameState {
    return createSuperGameState(options);
  }

  applyMove(
    state: SuperGameState,
    move: SuperMove,
    preset: RulePreset,
  ): Promise<MoveResult<SuperGameState>> {
    return Promise.resolve(this.applyMoveSync(state, move, preset));
  }

  applyMoveSync(
    state: SuperGameState,
    move: SuperMove,
    preset: RulePreset,
  ): MoveResult<SuperGameState> {
    // ── 1. Validate ──────────────────────────────────────────────────────────
    const error = validateSuperMove(state, move);
    if (error) return { ok: false, error };

    const now = Date.now();
    const { boardIndex, cellIndex } = move;
    const player = state.currentPlayer;

    // ── 2. Place mark (immutable) ─────────────────────────────────────────────
    const oldBoard = state.microBoards[boardIndex];

    // Compute new micro board status
    const newCells = [...oldBoard.cells] as Grid;
    newCells[cellIndex] = player;
    const size = state.boardSize;
    const microWin = checkWinner(newCells, size);
    const newMicroStatus: MicroBoardStatus = microWin
      ? { kind: 'won', winner: microWin.winner }
      : checkDraw(newCells, size)
      ? { kind: 'drawn' }
      : { kind: 'active' };

    const updatedMicroBoard = setMicroBoardCell(oldBoard, cellIndex, player, newMicroStatus);

    // Build updated micro boards array (immutable)
    const nextMicroBoards: MicroBoard[] = state.microBoards.map((b, i) =>
      i === boardIndex ? updatedMicroBoard : b,
    );

    // ── 3. Update macro grid ──────────────────────────────────────────────────
    let nextMacroGrid = [...state.macroGrid] as MacroCellValue[];
    if (newMicroStatus.kind === 'won') {
      nextMacroGrid = setMacroGridCell(state.macroGrid, boardIndex, player);
    } else if (newMicroStatus.kind === 'drawn') {
      nextMacroGrid = setMacroGridCell(state.macroGrid, boardIndex, 'D');
    }

    // ── 4. Check global win / draw ────────────────────────────────────────────
    const macroWin = checkMacroWinner(nextMacroGrid, size);
    const macroDraw = !macroWin && checkMacroDraw(nextMacroGrid, size);

    const historyEntry = {
      moveNumber: state.moveHistory.length + 1,
      player,
      move,
      timestamp: now,
    };

    const baseState: SuperGameState = {
      ...state,
      microBoards: nextMicroBoards,
      macroGrid: nextMacroGrid,
      moveHistory: [...state.moveHistory, historyEntry],
      updatedAt: now,
    };

    // ── 5. Terminal states ────────────────────────────────────────────────────
    if (macroWin) {
      return {
        ok: true,
        state: {
          ...baseState,
          phase: 'finished',
          result: { kind: 'win', winner: macroWin.winner, winLine: macroWin.line },
          macroWinResult: macroWin,
          currentPlayer: opponent(player), // preserve for UI display
          activeBoardIndex: null,
        },
      };
    }

    if (macroDraw) {
      return {
        ok: true,
        state: {
          ...baseState,
          phase: 'finished',
          result: { kind: 'draw' },
          activeBoardIndex: null,
        },
      };
    }

    // ── 6. Determine next board via rule preset ───────────────────────────────
    const directive = resolveNextBoard(cellIndex, nextMicroBoards, preset);
    const nextPlayer = opponent(player);

    switch (directive.kind) {
      case 'fixed':
        return {
          ok: true,
          state: {
            ...baseState,
            currentPlayer: nextPlayer,
            activeBoardIndex: directive.boardIndex,
            phase: 'active',
          },
        };

      case 'free-move':
      case 'portal':
        // Both resolve to: next player has a free choice of any active board.
        // The UI may style them differently (e.g., portal animation) but
        // the engine state is identical.
        return {
          ok: true,
          state: {
            ...baseState,
            currentPlayer: nextPlayer,
            activeBoardIndex: null,
            phase: 'active',
          },
        };

      case 'control':
        // Preset B: the player who just moved chooses where the opponent goes.
        // Switch to awaiting-board-choice phase WITHOUT switching currentPlayer yet.
        // After the board choice is resolved, currentPlayer switches to nextPlayer.
        return {
          ok: true,
          state: {
            ...baseState,
            currentPlayer: player,         // still the redirecting player's "turn" to choose
            activeBoardIndex: null,
            phase: 'awaiting-board-choice',
            redirectingPlayer: player,
          },
        };
    }
  }

  /**
   * Resolves a board choice during Preset B's 'awaiting-board-choice' phase.
   *
   * Called by:
   *   - UI: after a human player selects a board via the picker
   *   - AI: after the AI strategy computes a control-draw destination
   *   - Online: after receiving a 'choose-board' message from the server
   */
  resolveControlBoardChoice(
    state: SuperGameState,
    boardIndex: BoardIndex,
    preset: RulePreset,
  ): MoveResult<SuperGameState> {
    const error = validateControlBoardChoice(state, boardIndex);
    if (error) return { ok: false, error };

    // The redirecting player has chosen — now the opponent plays in that board.
    const nextPlayer = opponent(state.redirectingPlayer!);

    return {
      ok: true,
      state: {
        ...state,
        phase: 'active',
        currentPlayer: nextPlayer,
        activeBoardIndex: boardIndex,
        redirectingPlayer: undefined,
        updatedAt: Date.now(),
      },
    };
  }

  getLegalMoves(state: SuperGameState): readonly SuperMove[] {
    if (state.phase !== 'active') return [];

    const boards =
      state.activeBoardIndex !== null
        ? [state.microBoards[state.activeBoardIndex]]
        : getActiveBoards(state.microBoards).map((i) => state.microBoards[i]);

    const moves: SuperMove[] = [];
    for (const board of boards) {
      if (board.status.kind !== 'active') continue;
      for (let c = 0; c < board.cells.length; c++) {
        if (board.cells[c] === null) {
          moves.push({ boardIndex: board.index as BoardIndex, cellIndex: c as SuperMove['cellIndex'] });
        }
      }
    }
    return moves;
  }
}

export const superEngine: ISuperEngine = new SuperEngineImpl();
