/**
 * PeerConnection — thin WebRTC wrapper.
 *
 * Handles:
 *  - RTCPeerConnection lifecycle
 *  - Reliable ordered data channel
 *  - ICE candidate accumulation
 *  - JSON message framing over the data channel
 *
 * Works for both LAN (local ICE candidates only) and Online (STUN).
 */

export type PeerRole = 'host' | 'guest';

export interface PeerMessage {
  type: string;
  [key: string]: unknown;
}

export interface PeerConnectionOptions {
  role: PeerRole;
  /** Called when the data channel is open and ready to use */
  onOpen: () => void;
  /** Called for every JSON message received from the remote peer */
  onMessage: (msg: PeerMessage) => void;
  /** Called when the connection closes or errors */
  onClose: (reason?: string) => void;
  /** Called when an ICE candidate is gathered — used for progressive signaling */
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
}

// STUN servers for online NAT traversal (not needed on LAN but harmless)
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class PeerConnection {
  private pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  readonly role: PeerRole;
  private opts: PeerConnectionOptions;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private remoteDescSet = false;

  constructor(opts: PeerConnectionOptions) {
    this.role = opts.role;
    this.opts = opts;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.onicecandidate = (e) => {
      if (e.candidate) opts.onIceCandidate?.(e.candidate.toJSON());
    };

    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState;
      if (s === 'failed' || s === 'closed') opts.onClose(s);
    };

    if (opts.role === 'host') {
      this.channel = this.pc.createDataChannel('game', {
        ordered: true,
        maxRetransmits: 10,
      });
      this.wireChannel(this.channel);
    } else {
      this.pc.ondatachannel = (e) => {
        this.channel = e.channel;
        this.wireChannel(this.channel);
      };
    }
  }

  private wireChannel(ch: RTCDataChannel) {
    ch.onopen  = () => this.opts.onOpen();
    ch.onclose = () => this.opts.onClose('channel-closed');
    ch.onerror = (e) => this.opts.onClose(String(e));
    ch.onmessage = (e) => {
      try {
        this.opts.onMessage(JSON.parse(e.data));
      } catch { /* ignore malformed messages */ }
    };
  }

  // ── Signaling ──────────────────────────────────────────────────────────────

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.waitForIceGathering();
    return this.pc.localDescription!.toJSON();
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(offer);
    this.remoteDescSet = true;
    await this.flushPendingCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this.waitForIceGathering();
    return this.pc.localDescription!.toJSON();
  }

  async acceptAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(answer);
    this.remoteDescSet = true;
    await this.flushPendingCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.remoteDescSet) {
      await this.pc.addIceCandidate(candidate);
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  private async flushPendingCandidates() {
    for (const c of this.pendingCandidates) {
      await this.pc.addIceCandidate(c).catch(() => {});
    }
    this.pendingCandidates = [];
  }

  /** Wait for ICE gathering to complete (trickle-free signaling via QR) */
  private waitForIceGathering(): Promise<void> {
    if (this.pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise(resolve => {
      const check = () => {
        if (this.pc.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      this.pc.addEventListener('icegatheringstatechange', check);
      // Timeout fallback — after 5s proceed even if not complete
      setTimeout(resolve, 5000);
    });
  }

  setOnIceCandidate(cb: (c: RTCIceCandidateInit) => void) {
    this.opts.onIceCandidate = cb;
  }

  // ── Messaging ──────────────────────────────────────────────────────────────

  send(msg: PeerMessage) {
    if (this.channel?.readyState === 'open') {
      this.channel.send(JSON.stringify(msg));
    }
  }

  close() {
    this.channel?.close();
    this.pc.close();
  }

  get state() {
    return this.pc.connectionState;
  }
}
