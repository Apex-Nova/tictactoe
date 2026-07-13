'use client';

/**
 * TutorialModal — animated video-style walkthrough.
 * Visuals are self-explanatory animations; text is supplementary only.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

function Mark({ v, delay = 0, size = 'lg' }: { v: 'X' | 'O'; delay?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-3xl';
  const color = v === 'X' ? 'var(--th-x-primary)' : 'var(--th-o-primary)';
  const shadow = v === 'X' ? 'var(--th-x-glow)' : 'var(--th-o-glow)';
  return (
    <motion.span
      className={`font-black ${sz} select-none`}
      style={{ color, textShadow: `0 0 16px ${shadow}` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay }}
    >
      {v}
    </motion.span>
  );
}

// A single cell in a big animated board
function BigCell({
  value,
  highlight,
  pulse,
  label,
  dim,
}: {
  value?: 'X' | 'O' | null;
  highlight?: boolean;
  pulse?: boolean;
  label?: string;
  dim?: boolean;
}) {
  return (
    <motion.div
      className="aspect-square flex flex-col items-center justify-center rounded-lg relative overflow-hidden"
      style={{
        background: highlight
          ? 'var(--th-accent-glow)'
          : 'var(--th-bg-2)',
        border: `2px solid ${highlight ? 'var(--th-accent)' : 'var(--th-bg-3)'}`,
        opacity: dim ? 0.35 : 1,
      }}
      animate={pulse ? { scale: [1, 1.08, 1] } : {}}
      transition={pulse ? { duration: 0.8, repeat: Infinity } : {}}
    >
      {label && !value && (
        <span className="text-xs font-bold opacity-40" style={{ color: 'var(--th-text-muted)' }}>
          {label}
        </span>
      )}
      {value && <Mark v={value} size="lg" />}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Classic visuals
// ─────────────────────────────────────────────────────────────────────────────

// Slide 1: marks appearing one by one
function ClassicIntroVisual() {
  const sequence: Array<{ cell: number; v: 'X' | 'O' }> = [
    { cell: 4, v: 'X' }, { cell: 0, v: 'O' }, { cell: 8, v: 'X' },
    { cell: 6, v: 'O' }, { cell: 2, v: 'X' },
  ];
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    let i = 0;
    const tick = () => {
      i++;
      setRevealed(i);
      if (i < sequence.length) setTimeout(tick, 600);
    };
    const t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cells: ('X' | 'O' | null)[] = Array(9).fill(null);
  sequence.slice(0, revealed).forEach(({ cell, v }) => { cells[cell] = v; });

  return (
    <div className="flex flex-col items-center gap-3 w-full px-6">
      <div className="flex gap-4 mb-1">
        <motion.div className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: 'var(--th-x-bg)', border: '1px solid var(--th-x-primary)' }}>
          <span className="font-black text-sm" style={{ color: 'var(--th-x-primary)' }}>X</span>
          <span className="text-xs" style={{ color: 'var(--th-text-muted)' }}>Player 1</span>
        </motion.div>
        <motion.div className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: 'var(--th-o-bg)', border: '1px solid var(--th-o-primary)' }}>
          <span className="font-black text-sm" style={{ color: 'var(--th-o-primary)' }}>O</span>
          <span className="text-xs" style={{ color: 'var(--th-text-muted)' }}>Player 2</span>
        </motion.div>
      </div>
      <div className="grid grid-cols-3 gap-2 w-44">
        {cells.map((v, i) => <BigCell key={i} value={v} />)}
      </div>
    </div>
  );
}

// Slide 2: animated cursor clicking a cell
function ClassicClickVisual() {
  const [clickedCell, setClickedCell] = useState<number | null>(null);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setClickedCell(null);
    setShowCursor(true);
    const t1 = setTimeout(() => setClickedCell(1), 800);
    const t2 = setTimeout(() => {
      setClickedCell(null);
      setShowCursor(false);
    }, 1600);
    const t3 = setTimeout(() => {
      setShowCursor(true);
      setClickedCell(5);
    }, 2400);
    const t4 = setTimeout(() => setClickedCell(null), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const placed: Record<number, 'X' | 'O'> = { 4: 'X', 2: 'O', 6: 'X', 0: 'O' };
  if (clickedCell === 1) placed[1] = 'X';
  if (clickedCell === 5) placed[5] = 'O';

  return (
    <div className="flex flex-col items-center gap-3 w-full px-6">
      <div className="relative">
        <div className="grid grid-cols-3 gap-2 w-44">
          {Array(9).fill(null).map((_, i) => (
            <BigCell key={i} value={placed[i] ?? null} highlight={i === clickedCell} />
          ))}
        </div>
        {showCursor && (
          <motion.div
            className="absolute text-2xl pointer-events-none"
            style={{ top: clickedCell === 5 ? '63%' : '20%', left: clickedCell === 5 ? '63%' : '33%' }}
            animate={{ scale: clickedCell !== null ? 0.7 : 1 }}
            transition={{ duration: 0.1 }}
          >
            👆
          </motion.div>
        )}
      </div>
      <p className="text-xs font-semibold" style={{ color: 'var(--th-text-muted)' }}>Tap any empty cell to play</p>
    </div>
  );
}

// Slide 3: win line drawing itself
function ClassicWinVisual() {
  const [showLine, setShowLine] = useState(false);
  const cells: ('X' | 'O')[] = ['X', 'O', 'O', null as any, 'X', 'O', null as any, null as any, 'X'];
  const winLine = [0, 4, 8];

  useEffect(() => {
    setShowLine(false);
    const t = setTimeout(() => setShowLine(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 w-full px-6">
      <div className="relative w-44">
        <div className="grid grid-cols-3 gap-2">
          {cells.map((v, i) => (
            <motion.div
              key={i}
              className="aspect-square flex items-center justify-center rounded-lg"
              style={{
                background: winLine.includes(i) && showLine ? 'var(--th-x-bg)' : 'var(--th-bg-2)',
                border: `2px solid ${winLine.includes(i) && showLine ? 'var(--th-x-primary)' : 'var(--th-bg-3)'}`,
              }}
              animate={winLine.includes(i) && showLine ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.4, delay: winLine.indexOf(i) * 0.1 }}
            >
              {v && <Mark v={v} size="lg" />}
            </motion.div>
          ))}
        </div>
        {/* Diagonal line */}
        {showLine && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
            <motion.line
              x1="12%" y1="12%" x2="88%" y2="88%"
              stroke="var(--th-x-primary)" strokeWidth="4" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
        )}
      </div>
      {showLine && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-4 py-1 rounded-full"
          style={{ background: 'var(--th-x-bg)', border: '1px solid var(--th-x-primary)' }}
        >
          <span className="font-black text-sm" style={{ color: 'var(--th-x-primary)' }}>X Wins! 🎉</span>
        </motion.div>
      )}
    </div>
  );
}

// Slide 4: full board → draw
function ClassicDrawVisual() {
  const cells: ('X' | 'O')[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
    let i = 0;
    const tick = () => { i++; setRevealed(i); if (i < 9) setTimeout(tick, 200); };
    const t = setTimeout(tick, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 w-full px-6">
      <div className="grid grid-cols-3 gap-2 w-44">
        {cells.map((v, i) => (
          <motion.div key={i} className="aspect-square flex items-center justify-center rounded-lg"
            style={{ background: 'var(--th-bg-2)', border: '2px solid var(--th-bg-3)' }}>
            {i < revealed && <Mark v={v} size="lg" />}
          </motion.div>
        ))}
      </div>
      {revealed >= 9 && (
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="px-4 py-1 rounded-full font-black text-sm"
          style={{ background: 'var(--th-bg-2)', color: 'var(--th-text-muted)', border: '1px solid var(--th-bg-3)' }}>
          Draw — No Winner
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Super visuals
// ─────────────────────────────────────────────────────────────────────────────

// The board index → label map (position names)
const POS = ['↖', '↑', '↗', '←', '·', '→', '↙', '↓', '↘'];

// Slide 1: 9 boards overview
function SuperOverviewVisual() {
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    setLit(-1);
    let i = 0;
    const tick = () => {
      setLit(i);
      i = (i + 1) % 9;
      setTimeout(tick, 400);
    };
    const t = setTimeout(tick, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4">
      <div className="grid grid-cols-3 gap-1.5 w-52">
        {Array(9).fill(null).map((_, i) => (
          <motion.div
            key={i}
            className="aspect-square rounded-lg flex items-center justify-center"
            style={{
              background: lit === i ? 'var(--th-accent-glow)' : 'var(--th-bg-2)',
              border: `2px solid ${lit === i ? 'var(--th-accent)' : 'var(--th-bg-3)'}`,
            }}
            animate={lit === i ? { scale: 1.08 } : { scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <div className="grid grid-cols-3 gap-0.5 w-8 h-8">
              {Array(9).fill(null).map((_, j) => (
                <div key={j} className="rounded-sm" style={{ background: 'var(--th-bg-3)' }} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color: 'var(--th-text-muted)' }}>9 mini-boards — win 3 in a row</p>
    </div>
  );
}

// Slide 2: THE key mechanic — cell picks the board
function SuperRedirectVisual() {
  // Shows a zoomed mini-board, highlights a cell, then zooms out to show the target macro board
  const [phase, setPhase] = useState(0);
  // phase 0: show board with numbered cells
  // phase 1: highlight top-right cell (index 2)
  // phase 2: show arrow + highlight top-right macro board

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(0), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 w-full px-4">
      {/* Label */}
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--th-text-muted)' }}>
        <span>Cell played</span>
        <span style={{ color: 'var(--th-accent)' }}>→</span>
        <span>Board to play next</span>
      </div>

      <div className="flex items-center gap-4 w-full justify-center">
        {/* Left: active small board */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: 'var(--th-text-muted)' }}>Current board</span>
          <div className="grid grid-cols-3 gap-1 w-24">
            {Array(9).fill(null).map((_, i) => (
              <motion.div
                key={i}
                className="aspect-square rounded flex items-center justify-center text-xs font-bold"
                style={{
                  background: (phase >= 1 && i === 2) ? 'var(--th-x-bg)' : 'var(--th-bg-2)',
                  border: `1.5px solid ${(phase >= 1 && i === 2) ? 'var(--th-x-primary)' : 'var(--th-bg-3)'}`,
                  color: (phase >= 1 && i === 2) ? 'var(--th-x-primary)' : 'var(--th-text-muted)',
                }}
                animate={(phase >= 1 && i === 2) ? { scale: [1, 1.18, 1.1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {phase >= 1 && i === 2 ? <span style={{ color: 'var(--th-x-primary)', fontWeight: 900 }}>X</span> : POS[i]}
              </motion.div>
            ))}
          </div>
          <span className="text-xs" style={{ color: 'var(--th-text-muted)' }}>X plays top-right</span>
        </div>

        {/* Arrow */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="text-3xl"
              style={{ color: 'var(--th-accent)' }}
            >
              →
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: macro board, top-right highlighted */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: 'var(--th-text-muted)' }}>Next board</span>
          <div className="grid grid-cols-3 gap-1 w-24">
            {Array(9).fill(null).map((_, i) => (
              <motion.div
                key={i}
                className="aspect-square rounded flex items-center justify-center"
                style={{
                  background: (phase >= 2 && i === 2) ? 'var(--th-o-bg)' : 'var(--th-bg-2)',
                  border: `1.5px solid ${(phase >= 2 && i === 2) ? 'var(--th-o-primary)' : 'var(--th-bg-3)'}`,
                }}
                animate={(phase >= 2 && i === 2) ? { scale: [1, 1.2, 1.12] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                {phase >= 2 && i === 2 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-sm"
                    style={{ background: 'var(--th-o-primary)', opacity: 0.7 }} />
                )}
              </motion.div>
            ))}
          </div>
          <span className="text-xs" style={{ color: phase >= 2 ? 'var(--th-o-primary)' : 'var(--th-text-muted)' }}>
            {phase >= 2 ? 'O must play here!' : 'Waiting…'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Slide 3: Winning a small board
function SuperWinBoardVisual() {
  const [step, setStep] = useState(0);
  const moves = [
    { cell: 0, v: 'X' }, { cell: 4, v: 'O' }, { cell: 3, v: 'X' },
    { cell: 8, v: 'O' }, { cell: 6, v: 'X' },
  ];

  useEffect(() => {
    setStep(0);
    let i = 1;
    const tick = () => { setStep(i); i++; if (i <= moves.length) setTimeout(tick, 500); };
    const t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cells: ('X' | 'O' | null)[] = Array(9).fill(null);
  moves.slice(0, step).forEach(({ cell, v }) => { cells[cell] = v as any; });
  const won = step >= moves.length;

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4">
      <div className="flex items-center gap-6">
        {/* Small board being won */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: 'var(--th-text-muted)' }}>Mini board</span>
          <div className="relative w-28">
            <div className="grid grid-cols-3 gap-1">
              {cells.map((v, i) => (
                <motion.div key={i}
                  className="aspect-square rounded flex items-center justify-center"
                  style={{
                    background: (won && [0, 3, 6].includes(i)) ? 'var(--th-x-bg)' : 'var(--th-bg-2)',
                    border: `1.5px solid ${(won && [0, 3, 6].includes(i)) ? 'var(--th-x-primary)' : 'var(--th-bg-3)'}`,
                  }}>
                  {v && <Mark v={v} size="md" />}
                </motion.div>
              ))}
            </div>
            {won && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <motion.line x1="17%" y1="17%" x2="17%" y2="83%"
                  stroke="var(--th-x-primary)" strokeWidth="3" strokeLinecap="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4 }} />
              </svg>
            )}
          </div>
        </div>

        {/* Arrow */}
        <AnimatePresence>
          {won && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="text-2xl" style={{ color: 'var(--th-accent)' }}>→</motion.span>
          )}
        </AnimatePresence>

        {/* Macro board with claimed cell */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: 'var(--th-text-muted)' }}>Big board</span>
          <div className="grid grid-cols-3 gap-1 w-28">
            {Array(9).fill(null).map((_, i) => (
              <motion.div key={i}
                className="aspect-square rounded flex items-center justify-center"
                style={{
                  background: (won && i === 0) ? 'var(--th-x-bg)' : 'var(--th-bg-2)',
                  border: `1.5px solid ${(won && i === 0) ? 'var(--th-x-primary)' : 'var(--th-bg-3)'}`,
                }}
                animate={(won && i === 0) ? { scale: [1, 1.2, 1] } : {}}>
                {won && i === 0 && <Mark v="X" size="md" />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      {won && (
        <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold" style={{ color: 'var(--th-x-primary)' }}>
          X claims the top-left board! 🔒
        </motion.p>
      )}
    </div>
  );
}

// Slide 4: Free move when sent to finished board
function SuperFreeMoveVisual() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const owners = ['X', '', '', '', 'X', '', '', '', ''];

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4">
      <div className="grid grid-cols-3 gap-1.5 w-52">
        {Array(9).fill(null).map((_, i) => {
          const isWon = owners[i] === 'X';
          const isTarget = i === 4 && phase === 1;
          const isFreeMove = phase === 2 && !isWon;
          return (
            <motion.div
              key={i}
              className="aspect-square rounded-lg flex items-center justify-center text-base font-black"
              style={{
                background: isWon ? 'var(--th-x-bg)' : isFreeMove ? 'var(--th-o-bg)' : 'var(--th-bg-2)',
                border: `2px solid ${isTarget ? 'rgba(255,0,0,0.5)' : isWon ? 'var(--th-x-primary)' : isFreeMove ? 'var(--th-o-primary)' : 'var(--th-bg-3)'}`,
              }}
              animate={isFreeMove ? { scale: [1, 1.05, 1] } : isTarget ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, repeat: isFreeMove ? Infinity : 0 }}
            >
              {isWon && <span style={{ color: 'var(--th-x-primary)' }}>X</span>}
              {isFreeMove && <span style={{ color: 'var(--th-o-primary)', fontSize: 18 }}>✓</span>}
              {isTarget && !isWon && <span style={{ color: 'rgba(200,50,50,0.8)', fontSize: 14 }}>✕</span>}
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs font-semibold" style={{ color: phase === 2 ? 'var(--th-o-primary)' : 'var(--th-text-muted)' }}>
        {phase === 0 && 'Sent to center board (already won)…'}
        {phase === 1 && '❌ That board is taken!'}
        {phase === 2 && '✓ Free move — play anywhere!'}
      </p>
    </div>
  );
}

// Slide 5: Win 3 boards in a row
function SuperWinGameVisual() {
  const [revealed, setRevealed] = useState(0);
  const winLine = [0, 4, 8];

  useEffect(() => {
    setRevealed(0);
    let i = 1;
    const tick = () => { setRevealed(i); i++; if (i <= 3) setTimeout(tick, 600); };
    const t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, []);

  const owners = ['X', 'O', '', 'O', 'X', '', '', '', 'X'];

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4">
      <div className="relative w-52">
        <div className="grid grid-cols-3 gap-1.5">
          {Array(9).fill(null).map((_, i) => {
            const revealIdx = winLine.indexOf(i);
            const show = revealIdx !== -1 && revealed > revealIdx;
            const isWin = show;
            const o = owners[i];
            return (
              <motion.div
                key={i}
                className="aspect-square rounded-lg flex items-center justify-center text-xl font-black"
                style={{
                  background: isWin ? 'var(--th-x-bg)' : o ? 'var(--th-bg-2)' : 'var(--th-bg-1)',
                  border: `2px solid ${isWin ? 'var(--th-x-primary)' : o === 'O' ? 'var(--th-o-primary)' : 'var(--th-bg-3)'}`,
                  color: o === 'X' ? 'var(--th-x-primary)' : o === 'O' ? 'var(--th-o-primary)' : 'transparent',
                }}
                animate={isWin ? { scale: [1, 1.15, 1.1] } : {}}
                transition={{ duration: 0.3, delay: revealIdx * 0.05 }}
              >
                {o || '·'}
              </motion.div>
            );
          })}
        </div>
        {revealed >= 3 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <motion.line x1="12%" y1="12%" x2="88%" y2="88%"
              stroke="var(--th-x-primary)" strokeWidth="4" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5 }} />
          </svg>
        )}
      </div>
      {revealed >= 3 && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
          className="px-5 py-1.5 rounded-full font-black text-sm"
          style={{ background: 'var(--th-x-bg)', color: 'var(--th-x-primary)', border: '1px solid var(--th-x-primary)' }}>
          X Wins the Game! 🏆
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide definitions
// ─────────────────────────────────────────────────────────────────────────────

interface Slide { title: string; body: string; Visual: React.FC; duration: number; }

const CLASSIC_SLIDES: Slide[] = [
  { title: 'Two players, one board', body: 'X and O take turns. X always goes first.', Visual: ClassicIntroVisual, duration: 4000 },
  { title: 'Tap an empty cell to play', body: 'Once placed, marks stay — plan ahead!', Visual: ClassicClickVisual, duration: 4500 },
  { title: '3 in a row wins', body: 'Horizontal, vertical, or diagonal — any direction counts.', Visual: ClassicWinVisual, duration: 5000 },
  { title: 'Board full? It\'s a draw', body: 'No empty cells and no winner — the game is tied.', Visual: ClassicDrawVisual, duration: 4500 },
];

const SUPER_SLIDES: Slide[] = [
  { title: '9 mini-boards in one', body: 'Win 3 mini-boards in a row to win the whole game.', Visual: SuperOverviewVisual, duration: 4500 },
  { title: 'Where you play = where they play next', body: 'The cell you pick sends your opponent to that same position on the big board.', Visual: SuperRedirectVisual, duration: 6000 },
  { title: 'Win a mini-board to claim it', body: 'Get 3 in a row inside any small board. That board is now yours — locked!', Visual: SuperWinBoardVisual, duration: 5500 },
  { title: 'Sent to a finished board? Free move!', body: "If your target board is already won or full, you can play anywhere.", Visual: SuperFreeMoveVisual, duration: 5500 },
  { title: 'Connect 3 boards to win', body: 'Three claimed boards in a row — horizontal, vertical, or diagonal — wins!', Visual: SuperWinGameVisual, duration: 5500 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────────────────────

export function TutorialModal() {
  const { isModalOpen, modalMode, closeTutorial } = useTutorial();
  const [activeMode, setActiveMode] = useState<'classic' | 'super'>(modalMode);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = activeMode === 'classic' ? CLASSIC_SLIDES : SUPER_SLIDES;
  const current = slides[step];

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (!playing || !isModalOpen) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (step < slides.length - 1) {
      timerRef.current = setTimeout(goNext, current.duration);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step, playing, isModalOpen, slides.length, current.duration, goNext]);

  useEffect(() => {
    setActiveMode(modalMode);
    setStep(0);
    setPlaying(true);
  }, [modalMode, isModalOpen]);

  function switchMode(m: 'classic' | 'super') {
    setActiveMode(m);
    setStep(0);
    setPlaying(true);
  }

  if (!isModalOpen) return null;

  const isLast = step === slides.length - 1;

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={closeTutorial}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

          <motion.div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--th-bg-1)', border: '1px solid var(--th-bg-3)' }}
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Mode tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--th-bg-3)' }}>
              {(['classic', 'super'] as const).map((m) => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`flex-1 py-3 text-sm font-bold capitalize transition-colors`}
                  style={{
                    color: activeMode === m ? 'var(--th-accent)' : 'var(--th-text-muted)',
                    borderBottom: activeMode === m ? '2px solid var(--th-accent)' : '2px solid transparent',
                  }}>
                  {m === 'classic' ? '3×3 Classic' : '9-Board Super'}
                </button>
              ))}
            </div>

            {/* Visual */}
            <div className="flex items-center justify-center py-6"
              style={{ background: 'var(--th-bg-0)', minHeight: 220 }}>
              <AnimatePresence mode="wait">
                <motion.div key={`${activeMode}-${step}`}
                  className="w-full"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <current.Visual />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full" style={{ background: 'var(--th-bg-3)' }}>
              <motion.div className="h-full" style={{ background: 'var(--th-accent)' }}
                key={`bar-${activeMode}-${step}-${playing}`}
                initial={{ width: '0%' }}
                animate={{ width: playing ? '100%' : `${((step + 1) / slides.length) * 100}%` }}
                transition={playing ? { duration: current.duration / 1000, ease: 'linear' } : { duration: 0 }} />
            </div>

            {/* Text */}
            <div className="px-5 pt-4 pb-2">
              <AnimatePresence mode="wait">
                <motion.div key={`text-${activeMode}-${step}`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-base font-bold mb-0.5" style={{ color: 'var(--th-text-primary)' }}>
                    {current.title}
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--th-text-muted)' }}>
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-2 py-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => { setStep(i); setPlaying(false); }}
                  className="rounded-full transition-all duration-200"
                  style={{ height: 6, width: i === step ? 20 : 6,
                    background: i === step ? 'var(--th-accent)' : 'var(--th-bg-3)' }} />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 px-4 pb-5">
              <button onClick={() => { setStep((s) => Math.max(s - 1, 0)); setPlaying(false); }}
                disabled={step === 0}
                className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 transition-colors"
                style={{ background: 'var(--th-bg-2)', color: 'var(--th-text-primary)' }}>
                ← Prev
              </button>
              <button onClick={() => setPlaying((p) => !p)}
                className="flex-1 py-2 rounded-xl text-sm font-bold"
                style={{ background: 'var(--th-bg-2)', color: 'var(--th-accent)' }}>
                {playing ? '⏸ Pause' : '▶ Play'}
              </button>
              {isLast ? (
                <button onClick={closeTutorial}
                  className="px-4 py-2 rounded-xl text-sm font-black text-white"
                  style={{ background: 'var(--th-accent)' }}>
                  Let's Play! 🎮
                </button>
              ) : (
                <button onClick={() => { goNext(); setPlaying(false); }}
                  className="px-3 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--th-bg-2)', color: 'var(--th-text-primary)' }}>
                  Next →
                </button>
              )}
            </div>

            <button onClick={closeTutorial}
              className="absolute top-3 right-4 text-xs transition-colors"
              style={{ color: 'var(--th-text-muted)' }}>
              ✕ Skip
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
