/**
 * Multiplayer adapter interfaces.
 *
 * Phase 10 — architecture only. No backend is implemented.
 * All real-time and match-making functionality is expressed as interfaces here
 * so the game engine and UI can be wired in without modification when a
 * backend (Socket.IO + Node.js or Supabase Realtime) is added.
 */

import type { MatchConfig } from '@/contexts/GameContext';
import type { ClassicMove, SuperMove, BoardIndex } from '@/types';

// ── Identity ──────────────────────────────────────────────────────────────────

export interface RemotePlayer {
  readonly userId: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly rating?: number;
}

// ── Lobby ─────────────────────────────────────────────────────────────────────

export type LobbyStatus = 'waiting' | 'ready' | 'starting' | 'in-progress' | 'finished';

export interface Lobby {
  readonly lobbyId: string;
  readonly host: RemotePlayer;
  readonly guest?: RemotePlayer;
  readonly config: MatchConfig;
  readonly status: LobbyStatus;
  readonly createdAt: number;
}

export interface LobbyEvent {
  type: 'guest-joined' | 'guest-left' | 'match-started' | 'match-cancelled';
  lobby: Lobby;
}

// ── Match events (realtime) ───────────────────────────────────────────────────

export type RemoteMoveEvent =
  | { type: 'classic-move'; move: ClassicMove; player: string; timestamp: number }
  | { type: 'super-move';   move: SuperMove;   player: string; timestamp: number }
  | { type: 'control-board-choice'; boardIndex: BoardIndex; player: string; timestamp: number };

export type MatchEvent =
  | RemoteMoveEvent
  | { type: 'player-disconnected'; userId: string }
  | { type: 'player-reconnected';  userId: string }
  | { type: 'match-aborted';       reason: string }
  | { type: 'match-finished';      winnerId?: string };

// ── Connection state ──────────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ConnectionState {
  readonly status: ConnectionStatus;
  readonly latencyMs?: number;
  readonly errorMessage?: string;
}

// ── Adapters (interfaces) ─────────────────────────────────────────────────────

/**
 * LobbyAdapter — match-making and lobby management.
 * Implement with Socket.IO or Supabase Realtime.
 */
export interface LobbyAdapter {
  createLobby(config: MatchConfig): Promise<Lobby>;
  joinLobby(lobbyId: string): Promise<Lobby>;
  leaveLobby(lobbyId: string): Promise<void>;
  subscribeToLobby(lobbyId: string, onEvent: (e: LobbyEvent) => void): () => void;
}

/**
 * MatchAdapter — in-match real-time event exchange.
 * Implement with Socket.IO rooms or Supabase Realtime channels.
 */
export interface MatchAdapter {
  sendMove(matchId: string, event: RemoteMoveEvent): Promise<void>;
  subscribeToMatch(matchId: string, onEvent: (e: MatchEvent) => void): () => void;
  disconnect(): void;
}

/**
 * PlayerAdapter — account and profile management.
 * Implement with Supabase Auth or custom Node.js auth.
 */
export interface PlayerAdapter {
  getCurrentPlayer(): Promise<RemotePlayer | null>;
  updateProfile(updates: Partial<Pick<RemotePlayer, 'displayName' | 'avatarUrl'>>): Promise<RemotePlayer>;
  getPlayerById(userId: string): Promise<RemotePlayer | null>;
}

/**
 * StateSyncAdapter — game state synchronisation between clients.
 * Responsible for delta broadcasts and full re-sync on reconnect.
 */
export interface StateSyncAdapter {
  broadcastState(matchId: string, stateSnapshot: unknown): Promise<void>;
  requestFullSync(matchId: string): Promise<unknown>;
}

/**
 * NetworkingLayer — top-level composition of all adapters.
 * A single concrete implementation (e.g. SocketIONetworkingLayer) satisfies this.
 */
export interface NetworkingLayer {
  readonly lobby:     LobbyAdapter;
  readonly match:     MatchAdapter;
  readonly player:    PlayerAdapter;
  readonly stateSync: StateSyncAdapter;
  readonly connection: ConnectionState;
  connect(endpoint: string, authToken: string): Promise<void>;
  disconnect(): Promise<void>;
}
