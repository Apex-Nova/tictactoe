/**
 * Central type barrel.
 *
 * All consumers import from '@/types' — never from sub-paths.
 * This keeps import paths stable when files are reorganized internally.
 */

export type * from './primitives';
export type * from './board';
export type * from './rules';
export type * from './game-state';
export type * from './engine';
export type * from './ai';
export type * from './theme';
export type * from './audio';
export type * from './statistics';
export type * from './multiplayer';

// Re-export WIN_LINES (value, not type) from board
export { WIN_LINES } from './board';
