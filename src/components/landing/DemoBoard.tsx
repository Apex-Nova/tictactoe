'use client';

/**
 * DemoBoard — animated Super TTT preview on the landing page.
 *
 * Shows a scripted sequence of moves at a fixed interval, then resets.
 * Pure visual — no game engine, no real logic. Just marks appearing.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Mark = 'X' | 'O' | null;

// 9 boards × 9 cells — [boardIndex][cellIndex]
type BoardState = Mark[][];

function emptyBoard(): BoardState {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

// Pre-scripted moves: [boardIndex, cellIndex, player]
const SCRIPT: [number, number, Mark][] = [
  [4, 4, 'X'], [4, 0, 'O'], [0, 6, 'X'], [6, 2, 'O'],
  [2, 3, 'X'], [3, 8, 'O'], [8, 4, 'X'], [4, 2, 'O'],
  [2, 7, 'X'], [7, 1, 'O'], [1, 5, 'X'], [5, 3, 'O'],
  [3, 0, 'X'], [0, 8, 'O'], [8, 6, 'X'], [6, 5, 'O'],
  [5, 4, 'X'], [4, 6, 'O'], [6, 4, 'X'], [4, 8, 'O'],
];

const CELL_COLORS = { X: '#3B82F6', O: '#F97316' };
const GLOW_COLORS = { X: 'rgba(59,130,246,0.55)', O: 'rgba(249,115,22,0.55)' };

// Which board is "active" (last cellIndex of previous move → boardIndex)
function getActiveBoard(moveIndex: number): number | null {
  if (moveIndex === 0) return null;
  const prev = SCRIPT[moveIndex - 1];
  return prev ? prev[1] : null;
}

interface Props {
  scale?: number;
}

export function DemoBoard({ scale = 1 }: Props) {
  const [boards, setBoards] = useState<BoardState>(emptyBoard);
  const [moveIdx, setMoveIdx] = useState(0);
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setMoveIdx((prev) => {
        if (prev >= SCRIPT.length) {
          // Reset
          setBoards(emptyBoard());
          setActiveBoard(null);
          return 0;
        }
        const [bi, ci, player] = SCRIPT[prev];
        setBoards((b) => {
          const next = b.map((row) => [...row]);
          next[bi][ci] = player;
          return next;
        });
        setActiveBoard(getActiveBoard(prev + 1));
        return prev + 1;
      });
    }, 700);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const size = 200 * scale;
  const gap = 4 * scale;
  const boardSize = (size - gap * 2) / 3;
  const cellSize = (boardSize - gap * 2) / 3;

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        width: size, height: size,
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(129,140,248,0.2)',
        boxShadow: '0 0 60px rgba(129,140,248,0.15)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${boardSize}px)`,
          gridTemplateRows:    `repeat(3, ${boardSize}px)`,
          gap, padding: gap,
        }}
      >
        {boards.map((cells, bi) => {
          const isActive = activeBoard === bi;
          return (
            <div
              key={bi}
              style={{
                width: boardSize, height: boardSize,
                background: isActive ? 'rgba(129,140,248,0.08)' : 'rgba(30,41,59,0.6)',
                borderRadius: 6 * scale,
                display: 'grid',
                gridTemplateColumns: `repeat(3, ${cellSize}px)`,
                gridTemplateRows:    `repeat(3, ${cellSize}px)`,
                gap: gap * 0.5,
                padding: gap * 0.5,
                boxShadow: isActive ? '0 0 0 1.5px rgba(129,140,248,0.6)' : 'none',
                transition: 'box-shadow 0.3s, background 0.3s',
              }}
            >
              {cells.map((mark, ci) => (
                <div
                  key={ci}
                  style={{
                    width: cellSize, height: cellSize,
                    background: 'rgba(15,23,42,0.7)',
                    borderRadius: 3 * scale,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <AnimatePresence>
                    {mark && (
                      <motion.span
                        key={`${bi}-${ci}-${mark}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        style={{
                          fontSize: cellSize * 0.52,
                          fontWeight: 900,
                          color: CELL_COLORS[mark],
                          textShadow: `0 0 ${cellSize * 0.4}px ${GLOW_COLORS[mark]}`,
                          lineHeight: 1,
                        }}
                      >
                        {mark}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
