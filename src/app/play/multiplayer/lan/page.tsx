'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayer } from '@/contexts/MultiplayerContext';
import { useGame } from '@/contexts/GameContext';
import { QRCodeDisplay } from '@/components/multiplayer/QRCodeDisplay';
import { ALL_PRESETS } from '@/game-engine/rules/presets';
import type { RulePreset } from '@/types';
import type { PlayerConfig } from '@/types';

type Step = 'choose-side' | 'host-setup' | 'host-waiting' | 'join-input' | 'connecting' | 'error';

export default function LanPage() {
  const router = useRouter();
  const mp = useMultiplayer();
  const { startGame } = useGame();

  const [step, setStep]         = useState<Step>('choose-side');
  const [code, setCode]         = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [localBase, setLocalBase] = useState('');  // e.g. http://192.168.1.5:3000
  const [boardSize, setBoardSize] = useState(3);
  const [preset, setPreset]     = useState<RulePreset>(ALL_PRESETS[0]);
  const [playerName, setPlayerName] = useState('');
  const [copied, setCopied]     = useState(false);
  const hostConfigRef = useRef<Parameters<typeof startGame>[0] | null>(null);

  // Reset stale connection state on mount
  useEffect(() => { mp.disconnect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect local IP from server API (only works on dev server)
  useEffect(() => {
    fetch('/api/local-ip')
      .then(r => r.json())
      .then(({ ip }: { ip: string }) => {
        const port = window.location.port ? `:${window.location.port}` : '';
        setLocalBase(`http://${ip}${port}`);
      })
      .catch(() => setLocalBase(window.location.origin));
  }, []);

  // Host: when peer connects → go to game
  useEffect(() => {
    if (mp.status === 'connected' && (step === 'host-waiting' || step === 'connecting')) {
      if (hostConfigRef.current) startGame(hostConfigRef.current);
      router.push('/game/super');
    }
    // Only show error if we actually started something (not on initial load with stale state)
    if (mp.status === 'error' && step !== 'error' && step !== 'choose-side') setStep('error');
  }, [mp.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const siteBase = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tictactoe-three-sigma.vercel.app';
  const joinUrl = code ? `${siteBase}/join?code=${code}&mode=lan` : '';

  async function handleHostStart() {
    try {
      const config = {
        mode: 'super' as const,
        preset,
        boardSize,
        players: [
          { player: 'X' as const, displayName: playerName.trim() || 'Host', controlType: 'human' as const },
          { player: 'O' as const, displayName: 'Guest', controlType: 'remote' as const },
        ] as [PlayerConfig, PlayerConfig],
      };
      hostConfigRef.current = config;
      const roomCode = await mp.createSocketRoom(config);
      setCode(roomCode);
      setStep('host-waiting');
    } catch { setStep('error'); }
  }

  async function handleJoin() {
    const c = joinCode.trim().toUpperCase();
    if (!c) return;
    try {
      setStep('connecting');
      await mp.joinSocketRoom(c);
      mp.onConfig((config) => {
        startGame(config);
        router.push('/game/super');
      });
    } catch { setStep('error'); }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('input');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6"
      style={{ background: 'var(--th-bg-0)' }}>

      <motion.div className="w-full max-w-sm flex flex-col gap-5"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-1">LAN / Wi-Fi</div>
          <h1 className="text-2xl font-black text-[var(--color-text-primary)]">Play on Same Network</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Same network · game data is peer-to-peer</p>
        </div>

        <AnimatePresence mode="wait">

          {step === 'choose-side' && (
            <motion.div key="choose" className="flex flex-col gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Instruction banner */}
              <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-4 py-3 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <span className="font-bold text-[var(--color-accent)]">How it works:</span> Host creates a room and shares a QR code. Guest scans it on their phone — the game starts automatically. Both need internet (Wi-Fi is fine).
              </div>

              <SideBtn title="Host a Game" desc="Create a room · share QR with phone" icon="🏠"
                onClick={() => setStep('host-setup')} />
              <SideBtn title="Join a Game" desc="Enter room code (same Wi-Fi only)" icon="🔑"
                onClick={() => setStep('join-input')} />
            </motion.div>
          )}

          {step === 'host-setup' && (
            <motion.div key="setup" className="flex flex-col gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              <Field label="Your Name">
                <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                  placeholder="Player X" maxLength={20}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
                    text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]" />
              </Field>

              <Field label="Board Size">
                <div className="flex items-center gap-3">
                  <button onClick={() => setBoardSize(s => Math.max(2, s - 1))}
                    className="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] font-bold text-lg">−</button>
                  <span className="flex-1 text-center font-bold text-xl" style={{ color: 'var(--color-accent)' }}>{boardSize}×{boardSize}</span>
                  <button onClick={() => setBoardSize(s => Math.min(10, s + 1))}
                    className="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] font-bold text-lg">+</button>
                </div>
              </Field>

              <Field label="Rule Preset">
                <div className="flex flex-col divide-y divide-[var(--color-surface-3)] rounded-xl overflow-hidden border border-[var(--color-surface-3)]">
                  {ALL_PRESETS.filter(p => p.id !== 'custom').map(p => (
                    <button key={p.id} onClick={() => setPreset(p)}
                      className={`px-3 py-2.5 text-left text-sm transition-colors
                        ${preset.id === p.id ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-[var(--color-surface-1)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>
                      <span className="font-semibold">{p.displayName}</span>
                      <span className="text-xs opacity-60 ml-2">{p.description}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <motion.button onClick={handleHostStart} whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-black text-white"
                style={{ background: 'var(--color-accent)' }}>
                Create Room
              </motion.button>
            </motion.div>
          )}

          {step === 'host-waiting' && (
            <motion.div key="waiting" className="flex flex-col items-center gap-5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                Have your friend scan this with their phone camera.
                <br /><span className="text-xs text-[var(--color-text-muted)]">Both must be on the same Wi-Fi network.</span>
              </p>

              {joinUrl ? (
                <QRCodeDisplay value={joinUrl} label="" />
              ) : (
                <div className="w-[220px] h-[220px] rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
                </div>
              )}

              {/* Local IP hint */}
              {localBase && (
                <div className="text-xs text-center text-[var(--color-text-muted)] bg-[var(--color-surface-2)] rounded-lg px-3 py-2 border border-[var(--color-surface-3)]">
                  Phone opens: <span className="font-mono font-bold text-[var(--color-accent)]">{localBase}</span>
                </div>
              )}

              {/* Room code */}
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-xs text-[var(--color-text-muted)]">Or share the room code manually:</p>
                <div className="flex items-center gap-3 w-full justify-center">
                  <div className="text-3xl font-black font-mono tracking-[0.25em]"
                    style={{ color: 'var(--color-accent)' }}>{code}</div>
                  <button onClick={copyCode}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                    style={{
                      borderColor: copied ? 'var(--color-accent)' : 'var(--color-surface-3)',
                      color: copied ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      background: 'var(--color-surface-2)',
                    }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                Waiting for opponent to join…
              </div>
            </motion.div>
          )}

          {step === 'join-input' && (
            <motion.div key="join" className="flex flex-col gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              <div className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] px-4 py-3 text-xs text-[var(--color-text-muted)] leading-relaxed">
                You must be on the <span className="font-bold text-[var(--color-text-secondary)]">same Wi-Fi</span> as the host.
                Or just scan the QR code the host shows — it opens this automatically.
              </div>

              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                autoFocus
                className="w-full px-4 py-4 rounded-xl text-center text-3xl font-black font-mono tracking-[0.3em]
                  bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
                  text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <motion.button onClick={handleJoin} whileTap={{ scale: 0.97 }}
                disabled={joinCode.length !== 6}
                className="w-full py-3.5 rounded-xl font-black text-white disabled:opacity-40 transition-all"
                style={{ background: 'var(--color-accent)' }}>
                Join Game
              </motion.button>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div key="conn" className="flex flex-col items-center gap-3 py-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-10 h-10 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
              <p className="text-sm text-[var(--color-text-muted)]">Connecting…</p>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="err" className="flex flex-col items-center gap-3 py-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-[var(--color-error)] text-sm text-center">{mp.errorMsg ?? 'Connection failed'}</p>
              <button onClick={() => { mp.disconnect(); setStep('choose-side'); }}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-surface-2)] text-sm font-bold border border-[var(--color-surface-3)]">
                Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        <button onClick={() => router.push('/play/multiplayer')}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm text-center transition-colors">
          ← Back
        </button>
      </motion.div>
    </div>
  );
}

function SideBtn({ title, desc, icon, onClick }: { title: string; desc: string; icon: string; onClick: () => void }) {
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.97 }}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left w-full
        bg-[var(--color-surface-1)] border-[var(--color-surface-3)]
        hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-bold text-[var(--color-text-primary)]">{title}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{desc}</div>
      </div>
    </motion.button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</span>
      {children}
    </div>
  );
}
