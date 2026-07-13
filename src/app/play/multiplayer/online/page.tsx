'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayer } from '@/contexts/MultiplayerContext';
import { useGame } from '@/contexts/GameContext';
import { QRCodeDisplay } from '@/components/multiplayer/QRCodeDisplay';
import { ALL_PRESETS } from '@/game-engine/rules/presets';
import type { RulePreset, PlayerConfig } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tictactoe-three-sigma.vercel.app';

type Step = 'choose-side' | 'host-setup' | 'host-waiting' | 'join-input' | 'connecting' | 'error';

export default function OnlinePage() {
  const router = useRouter();
  const mp = useMultiplayer();
  const { startGame } = useGame();

  const [step, setStep]       = useState<Step>('choose-side');
  const [code, setCode]       = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [boardSize, setBoardSize] = useState(3);
  const [preset, setPreset]   = useState<RulePreset>(ALL_PRESETS[0]);
  const [playerName, setPlayerName] = useState('');
  const [copied, setCopied]   = useState(false);

  // Reset stale connection state on mount
  useEffect(() => { mp.disconnect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const joinUrl = `${BASE_URL}/join?code=${code}`;

  // When peer connects (host side) → go to game
  if (mp.status === 'connected' && step !== 'connecting') {
    setStep('connecting');
    router.push('/game/super');
  }

  async function handleHostStart() {
    try {
      const config = {
        mode: 'super' as const,
        preset,
        boardSize,
        players: [
          { player: 'X' as const, displayName: playerName.trim() || 'Host', controlType: 'human' as const },
          { player: 'O' as const, displayName: 'Opponent', controlType: 'remote' as const },
        ] as [PlayerConfig, PlayerConfig],
      };
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6"
      style={{ background: 'var(--th-bg-0)' }}>

      <motion.div className="w-full max-w-sm flex flex-col gap-5"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-o-primary)' }}>Online</div>
          <h1 className="text-2xl font-black text-[var(--color-text-primary)]">Play with Friends</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Join from anywhere in the world</p>
        </div>

        <AnimatePresence mode="wait">

          {step === 'choose-side' && (
            <motion.div key="choose" className="flex flex-col gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SideBtn title="Create Room" desc="Get a code · share with your friend" icon="🏠"
                accent="var(--color-o-primary)" onClick={() => setStep('host-setup')} />
              <SideBtn title="Join Room" desc="Enter the code your friend sent you" icon="🔑"
                accent="var(--color-o-primary)" onClick={() => setStep('join-input')} />
            </motion.div>
          )}

          {step === 'host-setup' && (
            <motion.div key="setup" className="flex flex-col gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              <Field label="Your Name">
                <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                  placeholder="Player X" maxLength={20}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
                    text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-o-primary)]" />
              </Field>

              <Field label="Board Size">
                <div className="flex items-center gap-3">
                  <button onClick={() => setBoardSize(s => Math.max(2, s - 1))}
                    className="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] font-bold text-lg">−</button>
                  <span className="flex-1 text-center font-bold text-xl" style={{ color: 'var(--color-o-primary)' }}>{boardSize}×{boardSize}</span>
                  <button onClick={() => setBoardSize(s => Math.min(10, s + 1))}
                    className="w-9 h-9 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] font-bold text-lg">+</button>
                </div>
              </Field>

              <Field label="Rule Preset">
                <div className="flex flex-col divide-y divide-[var(--color-surface-3)] rounded-xl overflow-hidden border border-[var(--color-surface-3)]">
                  {ALL_PRESETS.filter(p => p.id !== 'custom').map(p => (
                    <button key={p.id} onClick={() => setPreset(p)}
                      className={`px-3 py-2.5 text-left text-sm transition-colors
                        ${preset.id === p.id ? 'bg-[var(--color-o-primary)]/10 text-[var(--color-o-primary)]' : 'bg-[var(--color-surface-1)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}>
                      <span className="font-semibold">{p.displayName}</span>
                      <span className="text-xs opacity-60 ml-2">{p.description}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <motion.button onClick={handleHostStart} whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-black text-white"
                style={{ background: 'var(--color-o-primary)' }}>
                Create Room
              </motion.button>
            </motion.div>
          )}

          {step === 'host-waiting' && (
            <motion.div key="waiting" className="flex flex-col items-center gap-5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                Share this with your friend — they scan the QR or enter the code to join instantly.
              </p>

              <QRCodeDisplay value={joinUrl} label="" />

              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-xs text-[var(--color-text-muted)]">Room code:</p>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black font-mono tracking-[0.25em]"
                    style={{ color: 'var(--color-o-primary)' }}>
                    {code}
                  </div>
                  <button onClick={copyCode}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                    style={{
                      borderColor: copied ? 'var(--color-o-primary)' : 'var(--color-surface-3)',
                      color: copied ? 'var(--color-o-primary)' : 'var(--color-text-muted)',
                      background: 'var(--color-surface-2)',
                    }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-o-primary)' }} />
                Waiting for opponent to join…
              </div>
            </motion.div>
          )}

          {step === 'join-input' && (
            <motion.div key="join" className="flex flex-col gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-[var(--color-text-muted)] text-center">
                Enter the 6-character room code from your friend.
              </p>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                autoFocus
                className="w-full px-4 py-4 rounded-xl text-center text-3xl font-black font-mono tracking-[0.3em]
                  bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
                  text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-o-primary)]"
              />
              <motion.button onClick={handleJoin} whileTap={{ scale: 0.97 }}
                disabled={joinCode.length !== 6}
                className="w-full py-3.5 rounded-xl font-black text-white disabled:opacity-40 transition-all"
                style={{ background: 'var(--color-o-primary)' }}>
                Join Game
              </motion.button>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div key="conn" className="flex flex-col items-center gap-3 py-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--color-o-primary)', borderTopColor: 'transparent' }} />
              <p className="text-sm text-[var(--color-text-muted)]">Connecting…</p>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div key="err" className="flex flex-col items-center gap-3 py-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm text-center" style={{ color: 'var(--color-error)' }}>{mp.errorMsg ?? 'Connection failed'}</p>
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

function SideBtn({ title, desc, icon, onClick, accent }:
  { title: string; desc: string; icon: string; onClick: () => void; accent: string }) {
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.97 }}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left w-full
        bg-[var(--color-surface-1)] border-[var(--color-surface-3)]"
      whileHover={{ borderColor: accent }}>
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
