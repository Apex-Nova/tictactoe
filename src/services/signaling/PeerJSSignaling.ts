/**
 * PeerJSSignaling — WebRTC via PeerJS public server.
 * Works over any internet-connected Wi-Fi, no local server or Supabase needed.
 */

import type { PeerMessage } from '@/services/webrtc/PeerConnection';

export type PeerJSGameMessage = PeerMessage;

type OnMessage = (msg: PeerJSGameMessage) => void;
type OnOpen    = () => void;
type OnClose   = (reason?: string) => void;

export class PeerJSSession {
  private peer: import('peerjs').Peer | null = null;
  private conn: import('peerjs').DataConnection | null = null;
  private onMessage: OnMessage;
  private onOpen: OnOpen;
  private onClose: OnClose;

  constructor(opts: { onMessage: OnMessage; onOpen: OnOpen; onClose: OnClose }) {
    this.onMessage = opts.onMessage;
    this.onOpen    = opts.onOpen;
    this.onClose   = opts.onClose;
  }

  /** Host: create a peer with this room code as the ID */
  async host(code: string): Promise<void> {
    const { Peer } = await import('peerjs');
    this.peer = new Peer(code, { debug: 0 });

    await new Promise<void>((resolve, reject) => {
      this.peer!.on('open', () => resolve());
      this.peer!.on('error', (e) => reject(new Error(String(e))));
      setTimeout(() => reject(new Error('PeerJS connection timed out')), 15000);
    });

    this.peer.on('connection', (conn) => {
      this.conn = conn;
      this.wireConn(conn);
    });

    this.peer.on('error', (e) => this.onClose(String(e)));
  }

  /** Guest: connect to the host's room code */
  async join(code: string): Promise<void> {
    const { Peer } = await import('peerjs');
    this.peer = new Peer({ debug: 0 });

    await new Promise<void>((resolve, reject) => {
      this.peer!.on('open', () => resolve());
      this.peer!.on('error', (e) => reject(new Error(String(e))));
      setTimeout(() => reject(new Error('PeerJS connection timed out')), 15000);
    });

    const conn = this.peer.connect(code, { reliable: true });
    this.conn = conn;
    this.wireConn(conn);
    this.peer.on('error', (e) => this.onClose(String(e)));
  }

  private wireConn(conn: import('peerjs').DataConnection) {
    conn.on('open', () => this.onOpen());
    conn.on('data', (data) => {
      try { this.onMessage(data as PeerJSGameMessage); } catch { /* ignore */ }
    });
    conn.on('close', () => this.onClose('connection-closed'));
    conn.on('error', (e) => this.onClose(String(e)));
  }

  send(msg: PeerJSGameMessage) {
    if (this.conn?.open) this.conn.send(msg);
  }

  close() {
    this.conn?.close();
    this.peer?.destroy();
    this.conn = null;
    this.peer = null;
  }
}
