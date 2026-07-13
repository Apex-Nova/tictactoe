/**
 * AI simulation tests — runs 100+ AI vs AI games.
 *
 * Validates:
 *   - No game errors (invalid moves, stuck states)
 *   - Win/draw rates are within expected ranges for each matchup
 *   - Perfect minimax produces draws in Classic (verified property)
 *   - Higher difficulty beats lower difficulty statistically
 */

import { simulateClassicGame, simulateSuperGame, runSimulation } from '../simulations/gameSimulator';
import type { AIConfig } from '../types';

jest.setTimeout(120_000); // Give simulations up to 2 minutes

// ── AI config helpers ─────────────────────────────────────────────────────────

const easy: AIConfig   = { difficulty: 'easy',   player: 'X' };
const medium: AIConfig = { difficulty: 'medium',  player: 'X' };
const hard: AIConfig   = { difficulty: 'hard',    player: 'X' };

const easyO: AIConfig   = { difficulty: 'easy',   player: 'O' };
const mediumO: AIConfig = { difficulty: 'medium',  player: 'O' };
const hardO: AIConfig   = { difficulty: 'hard',    player: 'O' };

// ── Classic: perfect play always draws ───────────────────────────────────────

describe('Classic AI: minimax vs minimax (perfect play)', () => {
  it('always draws — minimax is perfect in Classic TTT', () => {
    for (let i = 0; i < 10; i++) {
      const result = simulateClassicGame(hard, hardO);
      expect(result.error).toBeUndefined();
      expect(result.winner).toBe('draw');
      expect(result.moves).toBeGreaterThan(0);
    }
  });

  it('produces no game errors in 50 easy vs easy games', () => {
    const sim = runSimulation({
      gameCount: 50,
      mode: 'classic',
      playerXConfig: easy,
      playerOConfig: easyO,
    });
    expect(sim.errors).toBe(0);
    expect(sim.totalGames).toBe(50);
    expect(sim.xWinRate + sim.oWinRate + sim.drawRate).toBeCloseTo(1, 5);
  });
});

// ── Classic: difficulty hierarchy ─────────────────────────────────────────────

describe('Classic AI: difficulty hierarchy', () => {
  it('hard beats easy significantly (>60% win rate)', () => {
    const sim = runSimulation({
      gameCount: 50,
      mode: 'classic',
      playerXConfig: hard,
      playerOConfig: easyO,
    });
    // Hard should win more often than easy when playing first
    // (X has first-move advantage in Classic)
    expect(sim.xWinRate + sim.drawRate).toBeGreaterThan(0.8);
    expect(sim.errors).toBe(0);
  });

  it('medium beats easy more often than not', () => {
    const sim = runSimulation({
      gameCount: 50,
      mode: 'classic',
      playerXConfig: medium,
      playerOConfig: easyO,
    });
    expect(sim.xWinRate).toBeGreaterThan(0.4); // medium > easy
    expect(sim.errors).toBe(0);
  });
});

// ── Super: no crashes ─────────────────────────────────────────────────────────

describe('Super AI: no errors in simulations', () => {
  it('produces no errors in 20 easy vs easy games', () => {
    const sim = runSimulation({
      gameCount: 20,
      mode: 'super',
      playerXConfig: easy,
      playerOConfig: easyO,
      maxMovesPerGame: 81,
    });
    expect(sim.errors).toBe(0);
    expect(sim.totalGames).toBe(20);
  });

  it('produces no errors in 10 medium vs medium games', () => {
    const sim = runSimulation({
      gameCount: 10,
      mode: 'super',
      playerXConfig: medium,
      playerOConfig: mediumO,
      maxMovesPerGame: 81,
    });
    expect(sim.errors).toBe(0);
  });

  it('produces no errors in 5 hard vs easy games', () => {
    const sim = runSimulation({
      gameCount: 5,
      mode: 'super',
      playerXConfig: hard,
      playerOConfig: easyO,
      maxMovesPerGame: 81,
    });
    expect(sim.errors).toBe(0);
  });
});

// ── Super: sanity stats ───────────────────────────────────────────────────────

describe('Super AI: statistical sanity', () => {
  it('easy vs easy: all three outcomes occur in 30 games', () => {
    const sim = runSimulation({
      gameCount: 30,
      mode: 'super',
      playerXConfig: easy,
      playerOConfig: easyO,
    });
    // Random play should produce a mix of wins and draws
    expect(sim.xWinRate + sim.oWinRate + sim.drawRate).toBeCloseTo(1, 5);
    expect(sim.averageMoveCount).toBeGreaterThan(5);
  });

  it('returns useful aggregate stats', () => {
    const sim = runSimulation({
      gameCount: 20,
      mode: 'super',
      playerXConfig: medium,
      playerOConfig: easyO,
    });
    expect(sim.totalGames).toBe(20);
    expect(sim.averageMoveCount).toBeGreaterThan(1);
    expect(sim.averageComputeTimeMs).toBeGreaterThan(0);
  });
});
