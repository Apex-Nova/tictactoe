/**
 * Multiplayer protocol types — Phase 10 preparation.
 *
 * Defined now so that the engine, state shape, and game hooks are already
 * designed around these message contracts. When the backend is added, these
 * types get shared between client and server (monorepo packages).
 *
 * Message flow:
 *   Client → Server: ClientMessage
 *   Server → Client: ServerMessage
 *
 * The engine on the server runs identically to the client engine.
 * The server is authoritative: it validates every move, applies it, and
 * broadcasts the resulting GameState to all participants.
 */

import type { BoardIndex } from './primitives';
import type { ClassicMove, SuperMove } from './board';
import type { GameState } from './game-state';
import type { RulePresetId } from './primitives';

// ---------------------------------------------------------------------------
// Client → Server
// ---------------------------------------------------------------------------

export type ClientMessage =
  | { type: 'join-room';   roomCode: string; displayName: string }
  | { type: 'create-room'; presetId: RulePresetId; displayName: string }
  | { type: 'ready' }
  | { type: 'submit-move'; move: ClassicMove | SuperMove }
  | { type: 'choose-board'; boardIndex: BoardIndex }  // Preset B redirect
  | { type: 'resign' }
  | { type: 'offer-draw' }
  | { type: 'accept-draw' }
  | { type: 'decline-draw' }
  | { type: 'request-rematch' }
  | { type: 'ping';        sentAt: number };

// ---------------------------------------------------------------------------
// Server → Client
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: 'room-created';     roomCode: string }
  | { type: 'player-joined';    displayName: string }
  | { type: 'game-started';     state: GameState }
  | { type: 'state-update';     state: GameState }   // after every valid move
  | { type: 'move-rejected';    reason: string }
  | { type: 'choose-board';     availableBoards: readonly BoardIndex[] }
  | { type: 'player-resigned';  player: string }
  | { type: 'draw-offered';     by: string }
  | { type: 'draw-accepted' }
  | { type: 'draw-declined' }
  | { type: 'rematch-offered';  by: string }
  | { type: 'rematch-accepted'; state: GameState }
  | { type: 'opponent-disconnected' }
  | { type: 'pong';             echoedAt: number; serverAt: number };

// ---------------------------------------------------------------------------
// Room model (future)
// ---------------------------------------------------------------------------

export interface Room {
  readonly code: string;
  readonly hostUserId: string;
  readonly guestUserId?: string;
  readonly presetId: RulePresetId;
  readonly state?: GameState;
  readonly createdAt: number;
}
