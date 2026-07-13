'use client';

import { io, type Socket } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'https://tictactoe-zwih.onrender.com';

export type GameMove = Record<string, unknown>;

interface Opts {
  onRoomCreated: (code: string) => void;
  onOpen:        () => void;
  onMove:        (move: GameMove) => void;
  onConfig:      (config: unknown) => void;
  onClose:       (reason: string) => void;
  onError:       (msg: string) => void;
}

export class SocketMultiplayer {
  private socket: Socket;
  private opts: Opts;
  private code = '';

  constructor(opts: Opts) {
    this.opts   = opts;
    this.socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 45_000,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('room-created', ({ code }: { code: string }) => {
      this.code = code;
      this.opts.onRoomCreated(code);
    });

    this.socket.on('guest-joined', () => {
      this.opts.onOpen(); // host side: channel open when guest joins
    });

    this.socket.on('room-joined', ({ config }: { config: unknown }) => {
      this.opts.onConfig(config);
      this.opts.onOpen(); // guest side: channel is now open
    });

    this.socket.on('game-move', ({ move }: { move: GameMove }) => {
      this.opts.onMove(move);
    });

    this.socket.on('opponent-left', () => {
      this.opts.onClose('opponent-left');
    });

    this.socket.on('room-error', ({ message }: { message: string }) => {
      this.opts.onError(message);
    });

    this.socket.on('connect_error', () => {
      this.opts.onError('Cannot reach game server. Check your internet connection.');
    });

    this.socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        this.opts.onClose(reason);
      }
    });
  }

  /** Host: create a new room with this config */
  createRoom(config: unknown): void {
    this.socket.emit('create-room', { config });
  }

  /** Guest: join an existing room */
  joinRoom(code: string): void {
    this.code = code.toUpperCase();
    this.socket.emit('join-room', { code });
  }

  /** Send a game move to the other player */
  send(move: GameMove): void {
    this.socket.emit('game-move', { code: this.code, move });
  }

  getCode(): string {
    return this.code;
  }

  close(): void {
    this.socket.disconnect();
  }
}
