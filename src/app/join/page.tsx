'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMultiplayer } from '@/contexts/MultiplayerContext';
import { useGame } from '@/contexts/GameContext';

function JoinContent() {
  const params     = useSearchParams();
  const router     = useRouter();
  const mp         = useMultiplayer();
  const { startGame } = useGame();
  const [status, setStatus] = useState<'joining' | 'waiting' | 'error'>('joining');
  const [msg, setMsg]       = useState('');

  const code = params.get('code')?.toUpperCase() ?? '';
  const mode = params.get('mode') ?? 'online';       // 'lan' | 'online'
  const base = params.get('base') ?? '';             // only for lan mode

  useEffect(() => {
    if (!code) { setStatus('error'); setMsg('No room code in URL.'); return; }

    mp.joinSocketRoom(code).catch((e: unknown) => {
      setStatus('error');
      setMsg(String(e));
    });
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mp.status === 'connecting' || mp.status === 'waiting') setStatus('waiting');
    if (mp.status === 'connected') {
      mp.onConfig((config) => {
        startGame(config);
        router.replace('/game/super');
      });
    }
    if (mp.status === 'error') {
      setStatus('error');
      setMsg(mp.errorMsg ?? 'Connection failed');
    }
  }, [mp.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div className="flex flex-col items-center gap-5 text-center"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

      <div className="text-5xl">{status === 'error' ? '❌' : '🎮'}</div>

      <div>
        <h1 className="text-2xl font-black text-[var(--color-text-primary)]">
          {status === 'error' ? 'Connection Failed' : 'Joining Game'}
        </h1>
        <div className="text-xs font-bold uppercase tracking-widest mt-1"
          style={{ color: 'var(--color-text-muted)' }}>
          {mode === 'lan' ? 'LAN / Wi-Fi' : 'Online'}
        </div>
        {code && status !== 'error' && (
          <div className="text-3xl font-black font-mono tracking-widest mt-1"
            style={{ color: 'var(--color-accent)' }}>
            {code}
          </div>
        )}
      </div>

      {status !== 'error' ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">
            {status === 'joining' ? 'Connecting to room…' : 'Waiting for host to start…'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{msg}</p>
          <button onClick={() => router.push('/play/multiplayer')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]">
            Back to Menu
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: 'var(--th-bg-0)' }}>
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        </div>
      }>
        <JoinContent />
      </Suspense>
    </div>
  );
}
