/**
 * GameSimulator — runs AI vs AI matches without the React layer.
 *
 * Used for:
 *   - Statistical validation (win rates, draw rates)
 *   - Regression testing (did a strategy change break anything?)
 *   - Performance benchmarking (nodes/second, time per move)
 *
 * Completely synchronous and framework-free — runs in Node.js or Jest.
 */

import type { ClassicGameState, SuperGameState } from '@/types';
import type { AIConfig, SimulationConfig, SimulationResult } from '../types';
import { DIFFICULTY_CONFIG } from '../difficulty/difficultyConfig';
import { classicEngine } from '@/game-engine/ClassicEngine';
import { superEngine } from '@/game-engine/SuperEngine';
import { createClassicGameState, createSuperGameState } from '@/game-engine/models/createGameState';
import { CLASSIC_ULTIMATE_PRESET } from '@/game-engine/rules/presets';

import { classicRandomStrategy, superRandomStrategy } from '../strategies/randomStrategy';
import { classicTacticalStrategy, superTacticalStrategy } from '../strategies/tacticalStrategy';
import { classicMinimaxStrategy, superMinimaxStrategy, superExpertStrategy } from '../strategies/minimaxStrategy';
import { randomBoardChoice, tacticalBoardChoice, expertBoardChoice } from '../strategies/boardChoiceStrategy';
import type { ClassicStrategy, SuperStrategy, BoardChoiceStrategy } from '../types';

// ── Synchronous strategy resolver ─────────────────────────────────────────────

function getClassicStrategy(config: AIConfig): ClassicStrategy {
  switch (config.difficulty) {
    case 'easy':   return classicRandomStrategy;
    case 'medium': return classicTacticalStrategy;
    case 'hard':
    case 'expert': return classicMinimaxStrategy;
  }
}

function getSuperStrategy(config: AIConfig): SuperStrategy {
  switch (config.difficulty) {
    case 'easy':   return superRandomStrategy;
    case 'medium': return superTacticalStrategy;
    case 'hard':   return superMinimaxStrategy;
    case 'expert': return superExpertStrategy;
  }
}

function getBoardChoiceStrategy(config: AIConfig): BoardChoiceStrategy {
  switch (config.difficulty) {
    case 'easy':   return randomBoardChoice;
    case 'medium':
    case 'hard':   return tacticalBoardChoice;
    case 'expert': return expertBoardChoice;
  }
}

// ── Classic simulation ────────────────────────────────────────────────────────

export function simulateClassicGame(
  xConfig: AIConfig,
  oConfig: AIConfig,
  maxMoves = 9,
): { winner: 'X' | 'O' | 'draw'; moves: number; error?: string } {
  let state: ClassicGameState = createClassicGameState({
    players: [
      { player: 'X', displayName: 'AI-X', controlType: 'ai', difficulty: xConfig.difficulty },
      { player: 'O', displayName: 'AI-O', controlType: 'ai', difficulty: oConfig.difficulty },
    ],
  });

  const xStrat = getClassicStrategy(xConfig);
  const oStrat = getClassicStrategy(oConfig);

  for (let i = 0; i < maxMoves; i++) {
    if (state.phase !== 'active') break;

    const isX = state.currentPlayer === 'X';
    const config = isX ? xConfig : oConfig;
    const strategy = isX ? xStrat : oStrat;
    const stratConfig = { ...DIFFICULTY_CONFIG[config.difficulty], seed: i };

    try {
      const result = strategy(state, state.currentPlayer, stratConfig);
      const applied = classicEngine.applyMove(state, result.move);
      if (!applied.ok) return { winner: 'draw', moves: i, error: `Invalid move: ${applied.error}` };
      state = applied.state;
    } catch (e) {
      return { winner: 'draw', moves: i, error: String(e) };
    }
  }

  if (state.result?.kind === 'win') return { winner: state.result.winner, moves: state.moveHistory.length };
  return { winner: 'draw', moves: state.moveHistory.length };
}

// ── Super simulation ──────────────────────────────────────────────────────────

export function simulateSuperGame(
  xConfig: AIConfig,
  oConfig: AIConfig,
  maxMoves = 81,
): { winner: 'X' | 'O' | 'draw'; moves: number; error?: string } {
  const preset = CLASSIC_ULTIMATE_PRESET;

  let state: SuperGameState = createSuperGameState({
    players: [
      { player: 'X', displayName: 'AI-X', controlType: 'ai', difficulty: xConfig.difficulty },
      { player: 'O', displayName: 'AI-O', controlType: 'ai', difficulty: oConfig.difficulty },
    ],
    preset,
  });

  const xStrat = getSuperStrategy(xConfig);
  const oStrat = getSuperStrategy(oConfig);
  const xBoardChoice = getBoardChoiceStrategy(xConfig);
  const oBoardChoice = getBoardChoiceStrategy(oConfig);

  for (let i = 0; i < maxMoves; i++) {
    if (state.phase === 'finished' || state.phase === 'abandoned') break;

    // Handle awaiting-board-choice (Preset B)
    if (state.phase === 'awaiting-board-choice') {
      const redirector = state.redirectingPlayer!;
      const chooser = redirector === 'X' ? xBoardChoice : oBoardChoice;
      const chooserConfig = redirector === 'X' ? xConfig : oConfig;
      const stratConfig = { ...DIFFICULTY_CONFIG[chooserConfig.difficulty], seed: i };
      const availableBoards = state.microBoards
        .filter((b) => b.status.kind === 'active' && b.cells.some((c) => c === null))
        .map((b) => b.index as any);

      const boardIndex = chooser(state, redirector, availableBoards, preset, stratConfig);
      const resolved = superEngine.resolveControlBoardChoice(state, boardIndex, preset);
      if (!resolved.ok) return { winner: 'draw', moves: i, error: resolved.error };
      state = resolved.state;
      continue;
    }

    const isX = state.currentPlayer === 'X';
    const config = isX ? xConfig : oConfig;
    const strategy = isX ? xStrat : oStrat;
    const stratConfig = { ...DIFFICULTY_CONFIG[config.difficulty], seed: i };

    try {
      const result = strategy(state, state.currentPlayer, preset, stratConfig);

      const applied = superEngine.applyMoveSync(state, result.move, preset);
      if (!applied.ok) return { winner: 'draw', moves: i, error: `Invalid move: ${applied.error}` };
      state = applied.state;
    } catch (e) {
      return { winner: 'draw', moves: i, error: String(e) };
    }
  }

  if (state.result?.kind === 'win') return { winner: state.result.winner, moves: state.moveHistory.length };
  return { winner: 'draw', moves: state.moveHistory.length };
}

// ── Batch runner ──────────────────────────────────────────────────────────────

export function runSimulation(config: SimulationConfig): SimulationResult {
  let xWins = 0, oWins = 0, draws = 0, errors = 0;
  let totalMoves = 0;
  const startTime = Date.now();

  for (let i = 0; i < config.gameCount; i++) {
    const result =
      config.mode === 'classic'
        ? simulateClassicGame(config.playerXConfig, config.playerOConfig, config.maxMovesPerGame)
        : simulateSuperGame(config.playerXConfig, config.playerOConfig, config.maxMovesPerGame);

    if (result.error) errors++;
    if (result.winner === 'X') xWins++;
    else if (result.winner === 'O') oWins++;
    else draws++;
    totalMoves += result.moves;
  }

  const total = config.gameCount;
  const elapsed = Date.now() - startTime;

  return {
    totalGames: total,
    xWins,
    oWins,
    draws,
    xWinRate: xWins / total,
    oWinRate: oWins / total,
    drawRate: draws / total,
    averageMoveCount: totalMoves / total,
    averageComputeTimeMs: elapsed / total,
    errors,
  };
}
