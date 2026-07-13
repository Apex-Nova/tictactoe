'use client';

/**
 * InGameTutorial — contextual step-by-step tooltip overlay shown during gameplay.
 *
 * Classic: 4 steps explaining how to play and win.
 * Super:   6 steps walking through board selection, redirection, and winning.
 *
 * Only renders when tutorialMode is enabled.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';

interface Step { title: string; body: string; emoji: string; }

const CLASSIC_STEPS: Step[] = [
  { emoji: '👋', title: "It's your turn!", body: "Tap any empty cell to place your mark. X always goes first." },
  { emoji: '🎯', title: 'Aim for 3 in a row', body: 'Try to get 3 of your marks in a horizontal, vertical, or diagonal line.' },
  { emoji: '🛡️', title: 'Block your opponent', body: "If your opponent is about to get 3 in a row, block them by playing in that spot." },
  { emoji: '🏆', title: 'First to 3 wins!', body: 'Get 3 in a row before your opponent does. Good luck!' },
];

const SUPER_STEPS: Step[] = [
  { emoji: '🗺️', title: 'You have 9 boards', body: 'Each small board is its own Tic Tac Toe game. Win 3 of them in a row to win overall.' },
  { emoji: '➡️', title: 'Your move controls theirs', body: 'The cell you pick sends your opponent to that matching board. Top-right cell → top-right board.' },
  { emoji: '✨', title: 'Glow = where to play', body: 'The highlighted board is where you must play. You cannot play anywhere else (unless it is won or drawn).' },
  { emoji: '🔒', title: 'Win a board to lock it', body: 'Get 3 in a row in a small board to claim it. Claimed boards are locked — no more moves inside.' },
  { emoji: '🌀', title: 'Sent to a finished board?', body: "If your opponent sends you to a won or drawn board, you get a free move on any open board!" },
  { emoji: '🏆', title: 'Connect 3 boards to win!', body: 'Three claimed boards in a row (across the big grid) wins the entire match. Think big!' },
];

interface InGameTutorialProps {
  mode: 'classic' | 'super';
}

export function InGameTutorial({ mode }: InGameTutorialProps) {
  const { tutorialMode } = useTutorial();
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const steps = mode === 'classic' ? CLASSIC_STEPS : SUPER_STEPS;
  const current = steps[step];

  // Reset when mode changes
  useEffect(() => {
    setStep(0);
    setDismissed(false);
    setMinimized(false);
  }, [mode]);

  if (!tutorialMode || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            background: 'var(--th-bg-1)',
            border: '1px solid var(--th-bg-3)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: 'var(--th-bg-3)', background: 'var(--th-bg-0)' }}
          >
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--th-accent)' }}>
              Tutorial Hint {step + 1}/{steps.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setMinimized((v) => !v)}
                className="text-xs px-2 py-0.5 rounded transition-colors"
                style={{ color: 'var(--th-text-muted)' }}
              >
                {minimized ? '▲' : '▼'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs px-2 py-0.5 rounded transition-colors"
                style={{ color: 'var(--th-text-muted)' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <AnimatePresence>
            {!minimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    className="px-4 py-3"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="font-bold text-base mb-1" style={{ color: 'var(--th-text-primary)' }}>
                      {current.emoji} {current.title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--th-text-muted)' }}>
                      {current.body}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Step dots + nav */}
                <div className="flex items-center gap-2 px-4 pb-3">
                  <div className="flex gap-1.5 flex-1">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setStep(i)}
                        className="rounded-full transition-all duration-200"
                        style={{
                          height: 6,
                          width: i === step ? 18 : 6,
                          background: i === step ? 'var(--th-accent)' : 'var(--th-bg-3)',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setStep((s) => Math.max(s - 1, 0))}
                    disabled={step === 0}
                    className="text-xs px-2 py-1 rounded-lg font-semibold disabled:opacity-30 transition-colors"
                    style={{ background: 'var(--th-bg-2)', color: 'var(--th-text-primary)' }}
                  >
                    ←
                  </button>
                  {step < steps.length - 1 ? (
                    <button
                      onClick={() => setStep((s) => s + 1)}
                      className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
                      style={{ background: 'var(--th-accent)', color: '#fff' }}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={() => setDismissed(true)}
                      className="text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
                      style={{ background: 'var(--th-accent)', color: '#fff' }}
                    >
                      Got it! ✓
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
