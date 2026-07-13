/**
 * AI Strategy unit tests.
 *
 * Tests each strategy in isolation — no React, no delays, no async.
 * Strategies are pure synchronous functions.
 */

import { classicEngine } from '../../ClassicEngine';
import { superEngine } from '../../SuperEngine';
import { createClassicGameState, createSuperGameState } from '../../models/createGameState';
import { CLASSIC_ULTIMATE_PRESET, CONTROL_DRAW_PRESET } from '../../rules/presets';
import { DIFFICULTY_CONFIG } from '../difficulty/difficultyConfig';
import { classicRandomStrategy, superRandomStrategy } from '../strategies/randomStrategy';
import { classicTacticalStrategy, superTacticalStrategy } from '../strategies/tacticalStrategy';
import { classicMinimaxStrategy, superMinimaxStrategy } from '../strategies/minimaxStrategy';
import { tacticalBoardChoice } from '../strategies/boardChoiceStrategy';
import type { ClassicGameState, PlayerConfig, SuperGameState } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const humanX: PlayerConfig = { player: 'X', displayName: 'X', controlType: 'human' };
const aiO: PlayerConfig = { player: 'O', displayName: 'AI-O', controlType: 'ai', difficulty: 'hard' };

function newClassic(): ClassicGameState {
  return createClassicGameState({ players: [humanX, aiO] });
}

function newSuper(): SuperGameState {
  return createSuperGameState({ players: [humanX, aiO], preset: CLASSIC_ULTIMATE_PRESET });
}

const easyConfig = DIFFICULTY_CONFIG.easy;
const mediumConfig = DIFFICULTY_CONFIG.medium;
const hardConfig = DIFFICULTY_CONFIG.hard;

// ── Random strategy ───────────────────────────────────────────────────────────

describe('classicRandomStrategy', () => {
  it('returns a legal move', () => {
    const state = newClassic();
    const result = classicRandomStrategy(state, 'X', easyConfig);
    const legal = classicEngine.getLegalMoves(state);
    expect(legal.map((m) => m.cellIndex)).toContain(result.move.cellIndex);
  });

  it('is deterministic with a seed', () => {
    const state = newClassic();
    const r1 = classicRandomStrategy(state, 'X', { ...easyConfig, seed: 42 });
    const r2 = classicRandomStrategy(state, 'X', { ...easyConfig, seed: 42 });
    expect(r1.move.cellIndex).toBe(r2.move.cellIndex);
  });
});

describe('superRandomStrategy', () => {
  it('returns a legal move from the full 81', () => {
    const state = newSuper();
    const result = superRandomStrategy(state, 'X', CLASSIC_ULTIMATE_PRESET, easyConfig);
    const legal = superEngine.getLegalMoves(state);
    const legalSet = new Set(legal.map((m) => `${m.boardIndex}-${m.cellIndex}`));
    expect(legalSet.has(`${result.move.boardIndex}-${result.move.cellIndex}`)).toBe(true);
  });

  it('respects activeBoardIndex constraint', async () => {
    const s0 = newSuper();
    const r1 = await superEngine.applyMove(s0, { boardIndex: 0, cellIndex: 4 }, CLASSIC_ULTIMATE_PRESET);
    if (!r1.ok) throw new Error();
    const constrained = r1.state; // activeBoardIndex === 4

    const result = superRandomStrategy(constrained, 'O', CLASSIC_ULTIMATE_PRESET, easyConfig);
    expect(result.move.boardIndex).toBe(4);
  });
});

// ── Tactical strategy ─────────────────────────────────────────────────────────

describe('classicTacticalStrategy', () => {
  it('takes an immediate winning move', () => {
    // X has two in top row — O should take 0,1 to block, but we're testing X taking win
    let state = newClassic();
    // Set up X with 0,1 placed — X's turn to place 2 and win
    const r1 = classicEngine.applyMove(state, { cellIndex: 0 });
    if (!r1.ok) throw new Error();
    const r2 = classicEngine.applyMove(r1.state, { cellIndex: 3 });
    if (!r2.ok) throw new Error();
    const r3 = classicEngine.applyMove(r2.state, { cellIndex: 1 });
    if (!r3.ok) throw new Error();
    const r4 = classicEngine.applyMove(r3.state, { cellIndex: 4 });
    if (!r4.ok) throw new Error();
    // X's turn: cells 0,1 taken by X, 3,4 by O. X should play 2 to win.
    const result = classicTacticalStrategy(r4.state, 'X', mediumConfig);
    expect(result.move.cellIndex).toBe(2);
  });

  it('blocks opponent winning move', () => {
    // O has 3,4 — X's turn, should block 5
    let state = newClassic();
    const r1 = classicEngine.applyMove(state, { cellIndex: 0 });
    if (!r1.ok) throw new Error();
    const r2 = classicEngine.applyMove(r1.state, { cellIndex: 3 });
    if (!r2.ok) throw new Error();
    const r3 = classicEngine.applyMove(r2.state, { cellIndex: 1 });
    if (!r3.ok) throw new Error();
    const r4 = classicEngine.applyMove(r3.state, { cellIndex: 4 });
    if (!r4.ok) throw new Error();
    // State: X has 0,1 — O has 3,4. But now it's X's turn (not O).
    // Let's set up a scenario where it's O's turn to take a winning spot
    // and X must block. Actually in this sequence X should win at cell 2.
    // Let's build O having 3,4 and it being X's turn:
    const r5 = classicEngine.applyMove(r4.state, { cellIndex: 6 }); // X plays 6
    if (!r5.ok) throw new Error();
    // O has 3,4 and X must block 5 (O's potential win: 3,4,5)
    const result = classicTacticalStrategy(r5.state, 'X', mediumConfig);
    expect(result.move.cellIndex).toBe(5);
  });
});

// ── Minimax strategy ──────────────────────────────────────────────────────────

describe('classicMinimaxStrategy', () => {
  it('always takes the winning move', () => {
    // X: 0,1 placed, X to move — should play 2 to win
    let state = newClassic();
    const moves = [
      { cell: 0, expected: 'X' },
    ];
    const r1 = classicEngine.applyMove(state, { cellIndex: 0 });
    if (!r1.ok) throw new Error();
    const r2 = classicEngine.applyMove(r1.state, { cellIndex: 3 });
    if (!r2.ok) throw new Error();
    const r3 = classicEngine.applyMove(r2.state, { cellIndex: 1 });
    if (!r3.ok) throw new Error();
    const r4 = classicEngine.applyMove(r3.state, { cellIndex: 4 });
    if (!r4.ok) throw new Error();
    // X's turn with 0,1 → minimax should pick 2 (top-row win)
    const result = classicMinimaxStrategy(r4.state, 'X', hardConfig);
    expect(result.move.cellIndex).toBe(2);
  });

  it('picks center on empty board', () => {
    const state = newClassic();
    const result = classicMinimaxStrategy(state, 'X', hardConfig);
    // Center (4) is the objectively best first move
    expect(result.move.cellIndex).toBe(4);
  });

  it('forces a draw against itself (perfect play)', () => {
    // Minimax vs minimax on classic should always draw
    let state = newClassic();
    let moves = 0;
    while (state.phase === 'active' && moves < 9) {
      const player = state.currentPlayer;
      const result = classicMinimaxStrategy(state, player, hardConfig);
      const applied = classicEngine.applyMove(state, result.move);
      if (!applied.ok) break;
      state = applied.state;
      moves++;
    }
    // Perfect minimax should never lose — result is always draw
    expect(['win', 'draw']).toContain(state.result?.kind);
    if (state.result?.kind === 'win') {
      // Should not happen with perfect play on both sides
      throw new Error(`Unexpected winner: ${state.result.winner}`);
    }
  });
});

// ── Super strategies ──────────────────────────────────────────────────────────

describe('superTacticalStrategy', () => {
  it('returns a legal move', () => {
    const state = newSuper();
    const result = superTacticalStrategy(state, 'X', CLASSIC_ULTIMATE_PRESET, mediumConfig);
    const legal = superEngine.getLegalMoves(state);
    const legalSet = new Set(legal.map((m) => `${m.boardIndex}-${m.cellIndex}`));
    expect(legalSet.has(`${result.move.boardIndex}-${result.move.cellIndex}`)).toBe(true);
  });

  it('takes micro board win on high-value board', async () => {
    // Set up board 4 (center, highest value) with X having 0,1 — AI is X and should play 2 to win board 4
    const base = newSuper();
    const stateWithSetup: SuperGameState = {
      ...base,
      microBoards: base.microBoards.map((b, i) =>
        i === 4
          ? { ...b, cells: ['X', 'X', null, null, null, null, null, null, null] as any }
          : b,
      ),
      activeBoardIndex: 4,
      currentPlayer: 'X',
    };
    const result = superTacticalStrategy(stateWithSetup, 'X', CLASSIC_ULTIMATE_PRESET, mediumConfig);
    expect(result.move.boardIndex).toBe(4);
    expect(result.move.cellIndex).toBe(2); // Completes top row
  });
});

describe('superMinimaxStrategy', () => {
  it('returns a legal move', () => {
    const state = newSuper();
    const result = superMinimaxStrategy(state, 'X', CLASSIC_ULTIMATE_PRESET, {
      ...hardConfig,
      maxDepth: 2, // Keep shallow for test speed
    });
    const legal = superEngine.getLegalMoves(state);
    const legalSet = new Set(legal.map((m) => `${m.boardIndex}-${m.cellIndex}`));
    expect(legalSet.has(`${result.move.boardIndex}-${result.move.cellIndex}`)).toBe(true);
  });

  it('takes macro-winning move', () => {
    // X has won boards 0,1 — should play to win board 2 for macro win
    const base = newSuper();
    const preWin: SuperGameState = {
      ...base,
      macroGrid: ['X', 'X', null, null, null, null, null, null, null],
      microBoards: base.microBoards.map((b, i) => {
        if (i === 0 || i === 1) return { ...b, status: { kind: 'won' as const, winner: 'X' as const } };
        if (i === 2) return { ...b, cells: ['X', 'X', null, null, null, null, null, null, null] as any };
        return b;
      }),
      activeBoardIndex: 2,
      currentPlayer: 'X',
    };
    const result = superMinimaxStrategy(preWin, 'X', CLASSIC_ULTIMATE_PRESET, {
      ...hardConfig,
      maxDepth: 3,
    });
    expect(result.move.boardIndex).toBe(2);
    expect(result.move.cellIndex).toBe(2); // Completes top row → wins board 2 → wins macro
  });
});

// ── Board choice strategy (Preset B) ─────────────────────────────────────────

describe('tacticalBoardChoice', () => {
  it('returns a valid board index', () => {
    const state = newSuper();
    const available: any[] = [1, 2, 3, 5, 6, 7, 8];
    const choice = tacticalBoardChoice(state, 'X', available, CONTROL_DRAW_PRESET, mediumConfig);
    expect(available).toContain(choice);
  });

  it('avoids sending opponent to a board where they have threats', () => {
    // If board 5 has O winning threats and board 3 is clean, X should prefer board 3
    const base = newSuper();
    const stateWithThreats: SuperGameState = {
      ...base,
      microBoards: base.microBoards.map((b, i) =>
        i === 5
          ? { ...b, cells: ['O', 'O', null, null, null, null, null, null, null] as any }
          : b,
      ),
    };
    const available: any[] = [3, 5]; // 5 has O threats
    const choice = tacticalBoardChoice(stateWithThreats, 'X', available, CONTROL_DRAW_PRESET, mediumConfig);
    // Should prefer board 3 over board 5 (where O has a 2-in-a-row)
    expect(choice).toBe(3);
  });
});
