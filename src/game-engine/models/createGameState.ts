/**
 * GameState factory functions.
 *
 * These are the only entry points for creating a brand-new game.
 * They enforce default values, generate IDs, and timestamp the state.
 */

import type { ClassicGameState, CreateClassicGameOptions, CreateSuperGameOptions, SuperGameState } from '@/types';
import { createClassicBoard, createEmptyMacroGrid, createMicroBoards } from './createBoard';

function generateId(): string {
  // crypto.randomUUID() is available in Node 14.17+, browsers, and Edge workers.
  // React Native requires a polyfill (expo-crypto).
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createClassicGameState(options: CreateClassicGameOptions): ClassicGameState {
  const now = Date.now();
  const boardSize = options.boardSize ?? 3;
  return {
    id: generateId(),
    mode: 'classic',
    phase: 'active',
    players: options.players,
    currentPlayer: 'X',
    board: createClassicBoard(boardSize),
    boardSize,
    moveHistory: [],
    presetId: 'classic-ultimate',
    createdAt: now,
    updatedAt: now,
  };
}

export function createSuperGameState(options: CreateSuperGameOptions): SuperGameState {
  const now = Date.now();
  const boardSize = options.boardSize ?? 3;
  return {
    id: generateId(),
    mode: 'super',
    phase: 'active',
    players: options.players,
    currentPlayer: 'X',
    boardSize,
    microBoards: createMicroBoards(boardSize),
    macroGrid: createEmptyMacroGrid(boardSize),
    activeBoardIndex: null,
    moveHistory: [],
    presetId: options.preset.id,
    createdAt: now,
    updatedAt: now,
  };
}
