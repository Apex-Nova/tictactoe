'use client';

/**
 * GameContext — single source of truth for all game session state.
 *
 * Phase 4 additions:
 *   - AI move triggering after human moves (useEffect watches currentPlayer)
 *   - Control Draw board choice for AI (Preset B)
 *   - isAIThinking state for UI indicators
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type {
  AIDifficulty,
  BoardIndex,
  ClassicGameState,
  ClassicMove,
  PlayerConfig,
  RulePreset,
  SuperGameState,
  SuperMove,
} from '@/types';
import { CLASSIC_ULTIMATE_PRESET } from '@/game-engine/rules/presets';
import * as GameService from '@/services/GameService';
import {
  computeClassicMove,
  computeSuperMove,
  computeControlBoardChoice,
} from '@/game-engine/ai/AIService';
import { useStats } from '@/contexts/StatsContext';
import type { GameRecord } from '@/types/statistics';

// ── Match configuration ───────────────────────────────────────────────────────

export interface MatchConfig {
  mode: 'classic' | 'super';
  players: [PlayerConfig, PlayerConfig];
  preset: RulePreset;
  boardSize?: number; // default 3
}

// ── Session state ─────────────────────────────────────────────────────────────

export interface SessionState {
  matchConfig: MatchConfig | null;
  classicState: ClassicGameState | null;
  superState: SuperGameState | null;
  isProcessing: boolean;
  isAIThinking: boolean;
  error: string | null;
}

const initialState: SessionState = {
  matchConfig: null,
  classicState: null,
  superState: null,
  isProcessing: false,
  isAIThinking: false,
  error: null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────

type SessionAction =
  | { type: 'GAME_STARTED'; config: MatchConfig; classicState?: ClassicGameState; superState?: SuperGameState }
  | { type: 'CLASSIC_STATE_UPDATED'; state: ClassicGameState }
  | { type: 'SUPER_STATE_UPDATED'; state: SuperGameState }
  | { type: 'PROCESSING_START' }
  | { type: 'AI_THINKING_START' }
  | { type: 'AI_THINKING_END' }
  | { type: 'MOVE_ERROR'; error: string }
  | { type: 'ERROR_CLEARED' }
  | { type: 'SESSION_RESET' };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'GAME_STARTED':
      return {
        ...state,
        matchConfig: action.config,
        classicState: action.classicState ?? null,
        superState: action.superState ?? null,
        isProcessing: false,
        isAIThinking: false,
        error: null,
      };
    case 'CLASSIC_STATE_UPDATED':
      return { ...state, classicState: action.state, isProcessing: false, isAIThinking: false, error: null };
    case 'SUPER_STATE_UPDATED':
      return { ...state, superState: action.state, isProcessing: false, isAIThinking: false, error: null };
    case 'PROCESSING_START':
      return { ...state, isProcessing: true, error: null };
    case 'AI_THINKING_START':
      return { ...state, isAIThinking: true };
    case 'AI_THINKING_END':
      return { ...state, isAIThinking: false };
    case 'MOVE_ERROR':
      return { ...state, isProcessing: false, isAIThinking: false, error: action.error };
    case 'ERROR_CLEARED':
      return { ...state, error: null };
    case 'SESSION_RESET':
      return { ...initialState };
    default:
      return state;
  }
}

// ── Context value ─────────────────────────────────────────────────────────────

interface GameContextValue {
  session: SessionState;
  startGame: (config: MatchConfig) => void;
  makeClassicMove: (move: ClassicMove) => void;
  makeSuperMove: (move: SuperMove) => Promise<void>;
  chooseControlBoard: (boardIndex: BoardIndex) => void;
  resetGame: () => void;
  restartCurrentGame: () => void;
  clearError: () => void;
  playableBoardIndices: readonly BoardIndex[];
  controlChoiceBoards: readonly BoardIndex[];
}

const GameContext = createContext<GameContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAIPlayer(config: PlayerConfig): boolean {
  return config.controlType === 'ai';
}

function getAIDifficulty(config: PlayerConfig): AIDifficulty {
  return config.difficulty ?? 'medium';
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, initialState);
  const { addRecord } = useStats();

  // Ref to avoid stale closures in AI useEffect
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // ── Auto-record finished games ─────────────────────────────────────────────
  const recordedGameRef = useRef<string | null>(null); // tracks gameId to avoid double-record

  useEffect(() => {
    const { classicState, superState, matchConfig } = session;
    const state = classicState ?? superState;
    if (!state || !matchConfig || state.phase !== 'finished') return;

    const gameId = `${matchConfig.mode}-${state.moveHistory.length}-${Date.now()}`;
    if (recordedGameRef.current === gameId) return;
    recordedGameRef.current = gameId;

    const humanPlayer = matchConfig.players.find((p) => p.controlType === 'human')?.player ?? 'X';
    const aiPlayer    = matchConfig.players.find((p) => p.controlType === 'ai');
    const result = state.result?.kind === 'win'
      ? (state.result.winner === humanPlayer ? 'win' : 'loss')
      : 'draw';

    const record: GameRecord = {
      gameId,
      mode:         matchConfig.mode,
      presetId:     matchConfig.mode === 'super' ? (matchConfig.preset.id as any) : undefined,
      result,
      playerSide:   humanPlayer,
      opponentType: aiPlayer ? 'ai' : 'human',
      difficulty:   aiPlayer?.difficulty,
      moveCount:    state.moveHistory.length,
      durationMs:   0,
      playedAt:     Date.now(),
    };
    addRecord(record);
  }, [session.classicState?.phase, session.superState?.phase, addRecord]);

  // ── startGame ──────────────────────────────────────────────────────────────

  const startGame = useCallback((config: MatchConfig) => {
    if (config.mode === 'classic') {
      const classicState = GameService.createClassicGame({ players: config.players, boardSize: config.boardSize });
      dispatch({ type: 'GAME_STARTED', config, classicState });
    } else {
      const superState = GameService.createSuperGame({ players: config.players, preset: config.preset, boardSize: config.boardSize });
      dispatch({ type: 'GAME_STARTED', config, superState });
    }
  }, []);

  // ── makeClassicMove ────────────────────────────────────────────────────────

  const makeClassicMove = useCallback((move: ClassicMove) => {
    const { classicState, isProcessing, isAIThinking } = sessionRef.current;
    if (!classicState || isProcessing || isAIThinking) return;

    const result = GameService.applyClassicMove(classicState, move);
    if (result.ok) {
      dispatch({ type: 'CLASSIC_STATE_UPDATED', state: result.state });
    } else {
      dispatch({ type: 'MOVE_ERROR', error: result.error });
    }
  }, []);

  // ── makeSuperMove ──────────────────────────────────────────────────────────

  const makeSuperMove = useCallback(async (move: SuperMove) => {
    const { superState, matchConfig, isProcessing, isAIThinking } = sessionRef.current;
    if (!superState || !matchConfig || isProcessing || isAIThinking) return;

    dispatch({ type: 'PROCESSING_START' });
    const result = await GameService.applySuperMove(superState, move, matchConfig.preset);
    if (result.ok) {
      dispatch({ type: 'SUPER_STATE_UPDATED', state: result.state });
    } else {
      dispatch({ type: 'MOVE_ERROR', error: result.error });
    }
  }, []);

  // ── chooseControlBoard ─────────────────────────────────────────────────────

  const chooseControlBoard = useCallback((boardIndex: BoardIndex) => {
    const { superState, matchConfig } = sessionRef.current;
    if (!superState || !matchConfig) return;

    const result = GameService.resolveControlBoardChoice(superState, boardIndex, matchConfig.preset);
    if (result.ok) {
      dispatch({ type: 'SUPER_STATE_UPDATED', state: result.state });
    } else {
      dispatch({ type: 'MOVE_ERROR', error: result.error });
    }
  }, []);

  // ── AI trigger: Classic ────────────────────────────────────────────────────

  useEffect(() => {
    const { classicState, matchConfig, isProcessing, isAIThinking } = session;
    if (!classicState || !matchConfig || isProcessing || isAIThinking) return;
    if (classicState.phase !== 'active') return;

    const currentPlayerConfig = matchConfig.players.find(
      (p) => p.player === classicState.currentPlayer,
    );
    if (!currentPlayerConfig || !isAIPlayer(currentPlayerConfig)) return;

    dispatch({ type: 'AI_THINKING_START' });

    const difficulty = getAIDifficulty(currentPlayerConfig);
    computeClassicMove(classicState, { difficulty, player: classicState.currentPlayer }).then(
      (move) => {
        const current = sessionRef.current;
        if (!current.classicState) return;
        const result = GameService.applyClassicMove(current.classicState, move);
        if (result.ok) {
          dispatch({ type: 'CLASSIC_STATE_UPDATED', state: result.state });
        } else {
          dispatch({ type: 'AI_THINKING_END' });
        }
      },
    );
  }, [session.classicState?.currentPlayer, session.classicState?.phase, session.isProcessing]);

  // ── AI trigger: Super (moves) ──────────────────────────────────────────────

  useEffect(() => {
    const { superState, matchConfig, isProcessing, isAIThinking } = session;
    if (!superState || !matchConfig || isProcessing || isAIThinking) return;
    if (superState.phase !== 'active') return;

    const currentPlayerConfig = matchConfig.players.find(
      (p) => p.player === superState.currentPlayer,
    );
    if (!currentPlayerConfig || !isAIPlayer(currentPlayerConfig)) return;

    dispatch({ type: 'AI_THINKING_START' });

    const difficulty = getAIDifficulty(currentPlayerConfig);
    computeSuperMove(superState, { difficulty, player: superState.currentPlayer }, matchConfig.preset).then(
      async (move) => {
        const current = sessionRef.current;
        if (!current.superState || !current.matchConfig) return;
        const result = await GameService.applySuperMove(
          current.superState,
          move,
          current.matchConfig.preset,
        );
        if (result.ok) {
          dispatch({ type: 'SUPER_STATE_UPDATED', state: result.state });
        } else {
          dispatch({ type: 'AI_THINKING_END' });
        }
      },
    );
  }, [session.superState?.currentPlayer, session.superState?.phase, session.isProcessing]);

  // ── AI trigger: Super (Control Draw board choice) ──────────────────────────

  useEffect(() => {
    const { superState, matchConfig, isProcessing, isAIThinking } = session;
    if (!superState || !matchConfig || isProcessing || isAIThinking) return;
    if (superState.phase !== 'awaiting-board-choice') return;

    const redirectingPlayer = superState.redirectingPlayer;
    if (!redirectingPlayer) return;

    const redirectorConfig = matchConfig.players.find((p) => p.player === redirectingPlayer);
    if (!redirectorConfig || !isAIPlayer(redirectorConfig)) return;

    dispatch({ type: 'AI_THINKING_START' });

    const difficulty = getAIDifficulty(redirectorConfig);
    const availableBoards = GameService.getControlChoiceBoards(superState);

    computeControlBoardChoice(
      superState,
      { difficulty, player: redirectingPlayer },
      availableBoards,
      matchConfig.preset,
    ).then((boardIndex) => {
      const current = sessionRef.current;
      if (!current.superState || !current.matchConfig) return;
      const result = GameService.resolveControlBoardChoice(
        current.superState,
        boardIndex,
        current.matchConfig.preset,
      );
      if (result.ok) {
        dispatch({ type: 'SUPER_STATE_UPDATED', state: result.state });
      } else {
        dispatch({ type: 'AI_THINKING_END' });
      }
    });
  }, [session.superState?.phase, session.isProcessing]);

  // ── Session management ─────────────────────────────────────────────────────

  const resetGame = useCallback(() => dispatch({ type: 'SESSION_RESET' }), []);

  const restartCurrentGame = useCallback(() => {
    const { matchConfig } = sessionRef.current;
    if (!matchConfig) return;
    if (matchConfig.mode === 'classic') {
      dispatch({ type: 'GAME_STARTED', config: matchConfig, classicState: GameService.createClassicGame({ players: matchConfig.players, boardSize: matchConfig.boardSize }) });
    } else {
      dispatch({ type: 'GAME_STARTED', config: matchConfig, superState: GameService.createSuperGame({ players: matchConfig.players, preset: matchConfig.preset, boardSize: matchConfig.boardSize }) });
    }
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'ERROR_CLEARED' }), []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const playableBoardIndices = useMemo<readonly BoardIndex[]>(() => {
    if (!session.superState) return [];
    return GameService.getPlayableBoardIndices(session.superState);
  }, [session.superState]);

  const controlChoiceBoards = useMemo<readonly BoardIndex[]>(() => {
    if (!session.superState) return [];
    return GameService.getControlChoiceBoards(session.superState);
  }, [session.superState]);

  const value = useMemo<GameContextValue>(
    () => ({
      session,
      startGame,
      makeClassicMove,
      makeSuperMove,
      chooseControlBoard,
      resetGame,
      restartCurrentGame,
      clearError,
      playableBoardIndices,
      controlChoiceBoards,
    }),
    [session, startGame, makeClassicMove, makeSuperMove, chooseControlBoard, resetGame, restartCurrentGame, clearError, playableBoardIndices, controlChoiceBoards],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}

export { CLASSIC_ULTIMATE_PRESET as defaultPreset };
