/**
 * Example game flow — demonstrates engine API usage end-to-end.
 *
 * This file is NOT a test file. It's a readable walkthrough of how the
 * engine is consumed by the service/hook layer (Phase 3+).
 * Run with: npx ts-node src/game-engine/__tests__/exampleGameFlow.ts
 */

import { superEngine } from '../SuperEngine';
import { classicEngine } from '../ClassicEngine';
import { CLASSIC_ULTIMATE_PRESET, CONTROL_DRAW_PRESET, withControlChooser } from '../rules/presets';
import type { PlayerConfig, SuperGameState } from '@/types';

// ── Players ───────────────────────────────────────────────────────────────────

const alice: PlayerConfig = { player: 'X', displayName: 'Alice', controlType: 'human' };
const bob: PlayerConfig = { player: 'O', displayName: 'Bob', controlType: 'human' };

// ── Example 1: Classic Tic Tac Toe ───────────────────────────────────────────

function runClassicExample() {
  console.log('\n=== Classic Tic Tac Toe ===');
  let state = classicEngine.createGame({ players: [alice, bob] });
  console.log('Game created. Phase:', state.phase, '| Current player:', state.currentPlayer);

  const moves = [4, 0, 8, 1, 2, 3, 6]; // X wins anti-diagonal + row
  for (const cellIndex of moves) {
    const r = classicEngine.applyMove(state, { cellIndex: cellIndex as any });
    if (!r.ok) { console.log(`Move ${cellIndex} rejected:`, r.error); continue; }
    state = r.state;
    console.log(`Move ${cellIndex} by ${state.moveHistory.at(-1)?.player} | Phase: ${state.phase}`);
    if (state.phase === 'finished') {
      console.log('Result:', JSON.stringify(state.result));
      break;
    }
  }
}

// ── Example 2: Super TTT — Preset A flow ─────────────────────────────────────

async function runSuperClassicExample() {
  console.log('\n=== Super Tic Tac Toe (Preset A: Classic Ultimate) ===');
  let state = superEngine.createGame({ players: [alice, bob], preset: CLASSIC_ULTIMATE_PRESET });
  console.log('Game created | activeBoardIndex:', state.activeBoardIndex, '(null = free move)');

  // Turn 1: X plays board 4, cell 0 → O sent to board 0
  const r1 = await superEngine.applyMove(state, { boardIndex: 4, cellIndex: 0 }, CLASSIC_ULTIMATE_PRESET);
  if (!r1.ok) throw new Error(r1.error);
  state = r1.state;
  console.log(`X played b4/c0 | O must play in board: ${state.activeBoardIndex}`);

  // Turn 2: O plays board 0, cell 4 → X sent to board 4
  const r2 = await superEngine.applyMove(state, { boardIndex: 0, cellIndex: 4 }, CLASSIC_ULTIMATE_PRESET);
  if (!r2.ok) throw new Error(r2.error);
  state = r2.state;
  console.log(`O played b0/c4 | X must play in board: ${state.activeBoardIndex}`);

  // Turn 3: X plays wrong board (should be rejected)
  const r3 = await superEngine.applyMove(state, { boardIndex: 0, cellIndex: 0 }, CLASSIC_ULTIMATE_PRESET);
  console.log(`X tried b0/c0 (wrong board) → ok: ${r3.ok}${!r3.ok ? ', error: ' + r3.error : ''}`);

  console.log('Legal moves available:', superEngine.getLegalMoves(state).length);
}

// ── Example 3: Preset B — Control Draw flow ───────────────────────────────────

async function runControlDrawExample() {
  console.log('\n=== Super Tic Tac Toe (Preset B: Control Draw) ===');

  // The control chooser simulates the UI asking the redirecting player
  // where to send the opponent. In real usage, this opens a board picker.
  const preset = withControlChooser(CONTROL_DRAW_PRESET, async (redirectingPlayer, availableBoards) => {
    console.log(`  [Preset B] ${redirectingPlayer} chooses where opponent plays.`);
    console.log(`  Available boards: [${availableBoards.join(', ')}]`);
    // Simulate picking the first available board
    return availableBoards[0];
  });

  let state = superEngine.createGame({ players: [alice, bob], preset });

  // Build a state where board 2 is drawn, then have a move redirect to it.
  // We'll demonstrate the phase transition by forcing a drawn micro board state.
  const drawnBoard2State: SuperGameState = {
    ...state,
    microBoards: state.microBoards.map((b, i) =>
      i === 2
        ? {
            ...b,
            // X,O,X / O,O,X / O,X,O — a draw layout
            cells: ['X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', 'O'] as any,
            status: { kind: 'drawn' },
          }
        : b,
    ),
    macroGrid: [null, null, 'D', null, null, null, null, null, null],
    activeBoardIndex: null,
    currentPlayer: 'X',
  };

  // X plays in any board, cell 2 → O sent to board 2 (which is drawn)
  // With Preset B, X (the redirector) must choose where O plays
  const r1 = await superEngine.applyMove(
    drawnBoard2State,
    { boardIndex: 0, cellIndex: 2 },
    preset,
  );
  if (!r1.ok) { console.log('Move failed:', r1.error); return; }
  state = r1.state;

  console.log('Phase after move to drawn board:', state.phase);
  console.log('Redirecting player:', state.redirectingPlayer);

  if (state.phase === 'awaiting-board-choice') {
    // UI calls resolveControlBoardChoice with the chosen board
    const chosenBoard = 5; // X picks board 5 for O
    console.log(`X chooses board ${chosenBoard} for O`);
    const r2 = superEngine.resolveControlBoardChoice(state, chosenBoard, preset);
    if (!r2.ok) { console.log('Board choice failed:', r2.error); return; }
    state = r2.state;
    console.log('Phase after resolution:', state.phase);
    console.log('O must now play in board:', state.activeBoardIndex);
    console.log('Current player:', state.currentPlayer);
  }
}

// ── Run all examples ──────────────────────────────────────────────────────────

(async () => {
  runClassicExample();
  await runSuperClassicExample();
  await runControlDrawExample();
  console.log('\n✓ All example flows completed.\n');
})().catch(console.error);
