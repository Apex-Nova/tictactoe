'use client';

/**
 * MultiplayerContext — manages a single peer-to-peer game session.
 *
 * Supports two transports:
 *   'lan'    — SDP exchange via QR codes (zero internet)
 *   'online' — SDP exchange via Supabase Realtime
 *
 * After the WebRTC data channel opens, all game messages go over it directly.
 * The host picks sides and sends the initial MatchConfig to the guest.
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { PeerConnection, type PeerMessage } from '@/services/webrtc/PeerConnection';
import { generateRoomCode, hostRoom, guestJoinRoom, sendHostIce } from '@/services/signaling/SupabaseSignaling';
import { localHostRoom, localGuestJoinRoom, localSendHostIce } from '@/services/signaling/LocalSignaling';
import { PeerJSSession } from '@/services/signaling/PeerJSSignaling';
import { SocketMultiplayer } from '@/services/multiplayer/SocketMultiplayer';
import type { MatchConfig } from '@/contexts/GameContext';
import type { ClassicMove, SuperMove } from '@/types';
import type { BoardIndex } from '@/types';

export type MPTransport = 'lan' | 'online';
export type MPRole      = 'host' | 'guest';
export type MPStatus =
  | 'idle'
  | 'creating'        // host: generating offer
  | 'waiting'         // host: waiting for guest to join
  | 'joining'         // guest: generating answer
  | 'connecting'      // WebRTC handshake in progress
  | 'connected'       // data channel open
  | 'disconnected'
  | 'error';

export type MPMove =
  | { type: 'classic-move'; move: ClassicMove }
  | { type: 'super-move';   move: SuperMove }
  | { type: 'control-board-choice'; boardIndex: BoardIndex };

interface MPContextValue {
  status: MPStatus;
  role: MPRole | null;
  transport: MPTransport | null;
  roomCode: string | null;
  errorMsg: string | null;
  /** LAN: returns the offer SDP string to encode into a QR */
  createLanRoom: (config: MatchConfig) => Promise<string>;
  /** LAN: given the guest's answer SDP string (from QR), complete connection */
  acceptLanAnswer: (answerJson: string) => Promise<void>;
  /** LAN: given the host's offer SDP string (from QR), returns answer SDP to show as QR */
  joinLanRoom: (offerJson: string) => Promise<string>;
  /** Socket: create a room via Socket.io server, returns room code */
  createSocketRoom: (config: MatchConfig) => Promise<string>;
  /** Socket: join a room via Socket.io server */
  joinSocketRoom: (code: string) => Promise<void>;
  /** LAN: create a room via PeerJS, returns room code */
  createPeerJSRoom: (config: MatchConfig) => Promise<string>;
  /** LAN: join via PeerJS room code */
  joinPeerJSRoom: (code: string) => Promise<void>;
  /** LAN: create a room via local server, returns room code */
  createLocalRoom: (config: MatchConfig) => Promise<string>;
  /** LAN: join via local server using room code */
  joinLocalRoom: (code: string, base: string) => Promise<void>;
  /** Online: create a room, returns room code */
  createOnlineRoom: (config: MatchConfig) => Promise<string>;
  /** Online: join by room code */
  joinOnlineRoom: (code: string) => Promise<void>;
  /** Send a game move to the remote peer */
  sendMove: (move: MPMove) => void;
  /** Register a callback for incoming moves */
  onMove: (cb: (move: MPMove) => void) => void;
  /** Register a callback for when config arrives (guest side) */
  onConfig: (cb: (config: MatchConfig) => void) => void;
  disconnect: () => void;
}

const Ctx = createContext<MPContextValue | null>(null);

export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus]     = useState<MPStatus>('idle');
  const [role, setRole]         = useState<MPRole | null>(null);
  const [transport, setTransport] = useState<MPTransport | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const peerRef        = useRef<PeerConnection | null>(null);
  const peerJSRef      = useRef<PeerJSSession | null>(null);
  const socketRef      = useRef<SocketMultiplayer | null>(null);
  const moveCallbackRef  = useRef<((m: MPMove) => void) | null>(null);
  const configCallbackRef = useRef<((c: MatchConfig) => void) | null>(null);
  const onlineCleanupRef = useRef<(() => void) | null>(null);
  // Stores MatchConfig temporarily until channel is open (host side)
  const pendingConfigRef = useRef<MatchConfig | null>(null);

  const setError = (msg: string) => { setStatus('error'); setErrorMsg(msg); };

  function buildPeer(r: MPRole): PeerConnection {
    const pc = new PeerConnection({
      role: r,
      onOpen: () => {
        setStatus('connected');
        // Host sends config when channel opens
        if (r === 'host' && pendingConfigRef.current) {
          pc.send({ type: 'match-config', config: pendingConfigRef.current as unknown as Record<string, unknown> });
        }
      },
      onMessage: (msg: PeerMessage) => handleRemoteMessage(msg),
      onClose: (reason) => {
        setStatus('disconnected');
        setErrorMsg(reason ?? 'Connection closed');
      },
    });
    peerRef.current = pc;
    return pc;
  }

  function handleRemoteMessage(msg: PeerMessage) {
    if (msg.type === 'match-config') {
      configCallbackRef.current?.(msg.config as unknown as MatchConfig);
    } else if (
      msg.type === 'classic-move' ||
      msg.type === 'super-move' ||
      msg.type === 'control-board-choice'
    ) {
      moveCallbackRef.current?.(msg as unknown as MPMove);
    }
  }

  // ── LAN ───────────────────────────────────────────────────────────────────

  const createLanRoom = useCallback(async (config: MatchConfig): Promise<string> => {
    setStatus('creating');
    setRole('host');
    setTransport('lan');
    pendingConfigRef.current = config;
    try {
      const pc = buildPeer('host');
      const offer = await pc.createOffer();
      setStatus('waiting');
      return JSON.stringify(offer);
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptLanAnswer = useCallback(async (answerJson: string) => {
    try {
      const answer = JSON.parse(answerJson) as RTCSessionDescriptionInit;
      await peerRef.current?.acceptAnswer(answer);
      setStatus('connecting');
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []);

  const joinLanRoom = useCallback(async (offerJson: string): Promise<string> => {
    setStatus('joining');
    setRole('guest');
    setTransport('lan');
    try {
      const offer = JSON.parse(offerJson) as RTCSessionDescriptionInit;
      const pc = buildPeer('guest');
      const answer = await pc.createAnswer(offer);
      setStatus('connecting');
      return JSON.stringify(answer);
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket.io (unified online + LAN) ──────────────────────────────────────

  const createSocketRoom = useCallback((config: MatchConfig): Promise<string> => {
    setStatus('creating');
    setRole('host');
    setTransport('online');
    pendingConfigRef.current = config;
    return new Promise((resolve, reject) => {
      const sock = new SocketMultiplayer({
        onRoomCreated: (code) => { setRoomCode(code); setStatus('waiting'); resolve(code); },
        onOpen: () => {
          setStatus('connected');
          // Send config to guest via game-move channel
          if (pendingConfigRef.current) {
            sock.send({ type: 'match-config', config: pendingConfigRef.current as unknown as Record<string, unknown> });
          }
        },
        onConfig: () => {},
        onMove: (move) => handleRemoteMessage(move as PeerMessage),
        onClose: (reason) => { setStatus('disconnected'); setErrorMsg(reason); },
        onError: (msg) => { setError(msg); reject(new Error(msg)); },
      });
      socketRef.current = sock;
      sock.createRoom(config);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinSocketRoom = useCallback((code: string): Promise<void> => {
    setStatus('joining');
    setRole('guest');
    setTransport('online');
    setRoomCode(code.toUpperCase());
    return new Promise((resolve, reject) => {
      const sock = new SocketMultiplayer({
        onRoomCreated: () => {},
        onOpen: () => { setStatus('connected'); resolve(); },
        onConfig: (cfg) => { configCallbackRef.current?.(cfg as MatchConfig); },
        onMove: (move) => handleRemoteMessage(move as PeerMessage),
        onClose: (reason) => { setStatus('disconnected'); setErrorMsg(reason); },
        onError: (msg) => { setError(msg); reject(new Error(msg)); },
      });
      socketRef.current = sock;
      sock.joinRoom(code);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PeerJS (LAN via internet signaling) ────────────────────────────────────

  const createPeerJSRoom = useCallback(async (config: MatchConfig): Promise<string> => {
    setStatus('creating');
    setRole('host');
    setTransport('lan');
    pendingConfigRef.current = config;
    try {
      const code = generateRoomCode();
      setRoomCode(code);
      const session = new PeerJSSession({
        onOpen: () => {
          setStatus('connected');
          if (pendingConfigRef.current) {
            session.send({ type: 'match-config', config: pendingConfigRef.current as unknown as Record<string, unknown> });
          }
        },
        onMessage: (msg) => handleRemoteMessage(msg),
        onClose: (reason) => { setStatus('disconnected'); setErrorMsg(reason ?? 'Connection closed'); },
      });
      peerJSRef.current = session;
      await session.host(code);
      setStatus('waiting');
      return code;
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinPeerJSRoom = useCallback(async (code: string) => {
    setStatus('joining');
    setRole('guest');
    setTransport('lan');
    setRoomCode(code.toUpperCase());
    try {
      const session = new PeerJSSession({
        onOpen: () => setStatus('connected'),
        onMessage: (msg) => handleRemoteMessage(msg),
        onClose: (reason) => { setStatus('disconnected'); setErrorMsg(reason ?? 'Connection closed'); },
      });
      peerJSRef.current = session;
      await session.join(code.toUpperCase());
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── LAN Local ──────────────────────────────────────────────────────────────

  const createLocalRoom = useCallback(async (config: MatchConfig): Promise<string> => {
    setStatus('creating');
    setRole('host');
    setTransport('lan');
    pendingConfigRef.current = config;
    try {
      const code = generateRoomCode();
      setRoomCode(code);
      const base = window.location.origin;
      const pc = buildPeer('host');
      const offer = await pc.createOffer();
      const cleanup = await localHostRoom(base, code, offer, async (msg) => {
        if (msg.type === 'answer') {
          await pc.acceptAnswer(msg.sdp);
          setStatus('connecting');
        } else if (msg.type === 'ice-candidate') {
          await pc.addIceCandidate(msg.candidate).catch(() => {});
        }
      });
      onlineCleanupRef.current = cleanup;
      pc.setOnIceCandidate((c) => { localSendHostIce(base, code, c).catch(() => {}); });
      setStatus('waiting');
      return code;
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinLocalRoom = useCallback(async (code: string, base: string) => {
    setStatus('joining');
    setRole('guest');
    setTransport('lan');
    setRoomCode(code.toUpperCase());
    try {
      const pc = buildPeer('guest');
      const { sendAnswer, sendGuestIce, cleanup } = await localGuestJoinRoom(base, code.toUpperCase(), async (msg) => {
        if (msg.type === 'offer') {
          const answer = await pc.createAnswer(msg.sdp);
          await sendAnswer(answer);
          setStatus('connecting');
        } else if (msg.type === 'ice-candidate') {
          await pc.addIceCandidate(msg.candidate).catch(() => {});
        }
      });
      onlineCleanupRef.current = cleanup;
      pc.setOnIceCandidate((c) => { sendGuestIce(c).catch(() => {}); });
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Online ─────────────────────────────────────────────────────────────────

  const createOnlineRoom = useCallback(async (config: MatchConfig): Promise<string> => {
    setStatus('creating');
    setRole('host');
    setTransport('online');
    pendingConfigRef.current = config;
    try {
      const code = generateRoomCode();
      setRoomCode(code);
      const pc = buildPeer('host');
      const offer = await pc.createOffer();

      const cleanup = await hostRoom(code, offer, async (msg) => {
        if (msg.type === 'answer') {
          await pc.acceptAnswer(msg.sdp);
          setStatus('connecting');
        } else if (msg.type === 'ice-candidate') {
          await pc.addIceCandidate(msg.candidate).catch(() => {});
        }
      });
      onlineCleanupRef.current = cleanup;

      // Trickle host ICE to guest via database
      pc.setOnIceCandidate((c) => { sendHostIce(code, c).catch(() => {}); });

      setStatus('waiting');
      return code;
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinOnlineRoom = useCallback(async (code: string) => {
    setStatus('joining');
    setRole('guest');
    setTransport('online');
    setRoomCode(code.toUpperCase());
    try {
      const pc = buildPeer('guest');

      const { sendAnswer, sendGuestIce, cleanup } = await guestJoinRoom(code.toUpperCase(), async (msg) => {
        if (msg.type === 'offer') {
          const answer = await pc.createAnswer(msg.sdp);
          await sendAnswer(answer);
          setStatus('connecting');
        } else if (msg.type === 'ice-candidate') {
          await pc.addIceCandidate(msg.candidate).catch(() => {});
        }
      });

      onlineCleanupRef.current = cleanup;

      // Trickle guest ICE back to host via database
      pc.setOnIceCandidate((c) => { sendGuestIce(c).catch(() => {}); });
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared ─────────────────────────────────────────────────────────────────

  const sendMove = useCallback((move: MPMove) => {
    if (socketRef.current) {
      socketRef.current.send(move as unknown as Record<string, unknown>);
    } else if (peerJSRef.current) {
      peerJSRef.current.send(move as unknown as PeerMessage);
    } else {
      peerRef.current?.send(move as unknown as PeerMessage);
    }
  }, []);

  const onMove = useCallback((cb: (move: MPMove) => void) => {
    moveCallbackRef.current = cb;
  }, []);

  const onConfig = useCallback((cb: (config: MatchConfig) => void) => {
    configCallbackRef.current = cb;
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    peerJSRef.current?.close();
    peerJSRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    onlineCleanupRef.current?.();
    onlineCleanupRef.current = null;
    setStatus('idle');
    setRole(null);
    setTransport(null);
    setRoomCode(null);
    setErrorMsg(null);
  }, []);

  return (
    <Ctx.Provider value={{
      status, role, transport, roomCode, errorMsg,
      createLanRoom, acceptLanAnswer, joinLanRoom,
      createSocketRoom, joinSocketRoom,
      createPeerJSRoom, joinPeerJSRoom,
      createLocalRoom, joinLocalRoom,
      createOnlineRoom, joinOnlineRoom,
      sendMove, onMove, onConfig, disconnect,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMultiplayer(): MPContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useMultiplayer must be used inside MultiplayerProvider');
  return ctx;
}
