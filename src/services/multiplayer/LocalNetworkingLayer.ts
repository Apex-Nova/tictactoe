/**
 * LocalNetworkingLayer — stub implementation of NetworkingLayer that
 * resolves every call immediately without any network I/O.
 *
 * Purpose: keeps the app fully functional offline while the real backend
 * (Socket.IO or Supabase) is being built. Drop in the real adapter when ready.
 */

import type {
  ConnectionState,
  Lobby,
  LobbyAdapter,
  LobbyEvent,
  MatchAdapter,
  MatchEvent,
  NetworkingLayer,
  PlayerAdapter,
  RemotePlayer,
  RemoteMoveEvent,
  StateSyncAdapter,
} from './types';
import type { MatchConfig } from '@/contexts/GameContext';

const NOT_IMPLEMENTED = 'Online multiplayer is not yet available.';

// ── Stub adapters ─────────────────────────────────────────────────────────────

const stubLobby: LobbyAdapter = {
  createLobby: async (_config: MatchConfig): Promise<Lobby> => { throw new Error(NOT_IMPLEMENTED); },
  joinLobby:   async (_id: string): Promise<Lobby>           => { throw new Error(NOT_IMPLEMENTED); },
  leaveLobby:  async (_id: string): Promise<void>            => { throw new Error(NOT_IMPLEMENTED); },
  subscribeToLobby: (_id: string, _cb: (e: LobbyEvent) => void) => () => {},
};

const stubMatch: MatchAdapter = {
  sendMove:        async (_matchId: string, _e: RemoteMoveEvent): Promise<void> => { throw new Error(NOT_IMPLEMENTED); },
  subscribeToMatch: (_matchId: string, _cb: (e: MatchEvent) => void) => () => {},
  disconnect: () => {},
};

const stubPlayer: PlayerAdapter = {
  getCurrentPlayer: async (): Promise<RemotePlayer | null> => null,
  updateProfile: async (_u: Partial<RemotePlayer>): Promise<RemotePlayer> => { throw new Error(NOT_IMPLEMENTED); },
  getPlayerById: async (_id: string): Promise<RemotePlayer | null> => null,
};

const stubStateSync: StateSyncAdapter = {
  broadcastState:  async (): Promise<void>    => {},
  requestFullSync: async (): Promise<unknown> => null,
};

// ── Layer ─────────────────────────────────────────────────────────────────────

export class LocalNetworkingLayer implements NetworkingLayer {
  readonly lobby     = stubLobby;
  readonly match     = stubMatch;
  readonly player    = stubPlayer;
  readonly stateSync = stubStateSync;

  get connection(): ConnectionState {
    return { status: 'disconnected' };
  }

  async connect(_endpoint: string, _authToken: string): Promise<void> {
    // No-op for local / offline mode
  }

  async disconnect(): Promise<void> {
    // No-op
  }
}

export const localNetworkingLayer = new LocalNetworkingLayer();
