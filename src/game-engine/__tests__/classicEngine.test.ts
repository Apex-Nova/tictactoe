/**
 * Classic Engine — unit tests.
 *
 * These tests are runnable with Jest or Vitest with zero configuration changes.
 * They validate the engine in isolation — no React, no UI, no DOM.
 */

import { classicEngine } from '../ClassicEngine';
import type { ClassicGameState, PlayerConfig } from '@/types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const humanX: PlayerConfig = { player: 'X', displayName: 'Alice', controlType: 'human' };
const humanO: PlayerConfig = { player: 'O', displayName: 'Bob', controlType: 'human' };

function newGame(): ClassicGameState {
  return classicEngine.createGame({ players: [humanX, humanO] });
}

// ── createGame ────────────────────────────────────────────────────────────────

describe('classicEngine.createGame', () => {
  it('starts with an empty board', () => {
    const state = newGame();
    expect(state.board.cells.every((c) => c === null)).toBe(true);
  });

  it('starts with X as the first player', () => {
    expect(newGame().currentPlayer).toBe('X');
  });

  it('starts in active phase', () => {
    expect(newGame().phase).toBe('active');
  });
});

// ── applyMove — turn management ───────────────────────────────────────────────

describe('classicEngine.applyMove — turn management', () => {
  it('switches player after a valid move', () => {
    const s0 = newGame();
    const r1 = classicEngine.applyMove(s0, { cellIndex: 0 });
    expect(r1.ok).toBe(true);
    if (!r1.ok) throw new Error();
    expect(r1.state.currentPlayer).toBe('O');
  });

  it('rejects a move to an occupied cell', () => {
    const s0 = newGame();
    const r1 = classicEngine.applyMove(s0, { cellIndex: 4 });
    if (!r1.ok) throw new Error();
    const r2 = classicEngine.applyMove(r1.state, { cellIndex: 4 });
    expect(r2.ok).toBe(false);
    if (r2.ok) throw new Error();
    expect(r2.error).toBe('cell-occupied');
  });

  it('records each move in history', () => {
    const s0 = newGame();
    const r1 = classicEngine.applyMove(s0, { cellIndex: 0 });
    if (!r1.ok) throw new Error();
    const r2 = classicEngine.applyMove(r1.state, { cellIndex: 1 });
    if (!r2.ok) throw new Error();
    expect(r2.state.moveHistory).toHaveLength(2);
    expect(r2.state.moveHistory[0].player).toBe('X');
    expect(r2.state.moveHistory[1].player).toBe('O');
  });
});

// ── applyMove — win detection ─────────────────────────────────────────────────

describe('classicEngine.applyMove — win detection', () => {
  it('detects a horizontal win for X', () => {
    // X: 0,1,2 — O: 3,4
    let state = newGame();
    for (const [x, o] of [[0, 3], [1, 4], [2, -1]] as [number, number][]) {
      const rx = classicEngine.applyMove(state, { cellIndex: x as any });
      if (!rx.ok) throw new Error(`X move ${x} failed: ${(rx as any).error}`);
      state = rx.state;
      if (o === -1) break;
      const ro = classicEngine.applyMove(state, { cellIndex: o as any });
      if (!ro.ok) throw new Error(`O move ${o} failed: ${(ro as any).error}`);
      state = ro.state;
    }
    expect(state.phase).toBe('finished');
    expect(state.result?.kind).toBe('win');
    if (state.result?.kind === 'win') {
      expect(state.result.winner).toBe('X');
    }
  });

  it('detects a diagonal win', () => {
    // X: 0,4,8 — O: 1,2
    let state = newGame();
    const moves: [number, number | null][] = [[0, 1], [4, 2], [8, null]];
    for (const [x, o] of moves) {
      const rx = classicEngine.applyMove(state, { cellIndex: x as any });
      if (!rx.ok) throw new Error();
      state = rx.state;
      if (o !== null) {
        const ro = classicEngine.applyMove(state, { cellIndex: o as any });
        if (!ro.ok) throw new Error();
        state = ro.state;
      }
    }
    expect(state.result?.kind).toBe('win');
  });

  it('detects a draw', () => {
    // Force a draw: X wins no line, board fully filled
    // X: 0,2,5,6,7  O: 1,3,4,8
    //   X | O | X
    //   O | O | X
    //   X | X | O
    let state = newGame();
    const xMoves = [0, 2, 5, 6, 7];
    const oMoves = [1, 3, 4, 8];
    const sequence: number[] = [];
    for (let i = 0; i < Math.max(xMoves.length, oMoves.length); i++) {
      if (xMoves[i] !== undefined) sequence.push(xMoves[i]);
      if (oMoves[i] !== undefined) sequence.push(oMoves[i]);
    }
    for (const cell of sequence) {
      const r = classicEngine.applyMove(state, { cellIndex: cell as any });
      if (!r.ok) throw new Error(`Move to ${cell} failed: ${(r as any).error}`);
      state = r.state;
    }
    expect(state.result?.kind).toBe('draw');
  });
});

// ── getLegalMoves ─────────────────────────────────────────────────────────────

describe('classicEngine.getLegalMoves', () => {
  it('returns 9 legal moves on a fresh board', () => {
    expect(classicEngine.getLegalMoves(newGame())).toHaveLength(9);
  });

  it('returns 0 legal moves when game is finished', () => {
    // Fill a win quickly
    let state = newGame();
    for (const [x, o] of [[0, 3], [1, 4], [2, -1]] as [number, number][]) {
      const rx = classicEngine.applyMove(state, { cellIndex: x as any });
      if (!rx.ok) break;
      state = rx.state;
      if (o === -1) break;
      const ro = classicEngine.applyMove(state, { cellIndex: o as any });
      if (!ro.ok) break;
      state = ro.state;
    }
    expect(classicEngine.getLegalMoves(state)).toHaveLength(0);
  });
});
