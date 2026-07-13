'use client';

import { useEffect, useRef, useState } from 'react';

export interface MatchTimer {
  elapsedMs: number;
  formatted: string;
  isRunning: boolean;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function useMatchTimer(autoStart = true): MatchTimer {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const startRef  = useRef<number | null>(null);
  const accRef    = useRef(0);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(rafRef.current);
      if (startRef.current !== null) {
        accRef.current += Date.now() - startRef.current;
        startRef.current = null;
      }
      return;
    }
    startRef.current = Date.now();

    const tick = () => {
      if (startRef.current === null) return;
      setElapsedMs(accRef.current + Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning]);

  return {
    elapsedMs,
    formatted: formatMs(elapsedMs),
    isRunning,
    pause:  () => setIsRunning(false),
    resume: () => setIsRunning(true),
    reset:  () => { accRef.current = 0; startRef.current = isRunning ? Date.now() : null; setElapsedMs(0); },
  };
}
