/**
 * Audio system types.
 *
 * Architecture is defined now so the UI can wire up audio event hooks
 * without knowing the implementation (Howler.js, Web Audio API, Expo AV).
 * The actual audio files and player are injected via a service — never imported
 * directly from components.
 */

export type AudioEventId =
  | 'cell-place'
  | 'board-win'
  | 'board-draw'
  | 'game-win'
  | 'game-draw'
  | 'hover'
  | 'menu-click'
  | 'turn-change'
  | 'invalid-move';

export interface AudioTrack {
  readonly id: AudioEventId;
  readonly src: string;       // relative to /assets/sounds/
  readonly volume?: number;   // 0–1, default 1
  readonly loop?: boolean;
}

export interface AudioService {
  play(event: AudioEventId): void;
  stop(event: AudioEventId): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  preload(events: readonly AudioEventId[]): Promise<void>;
}
