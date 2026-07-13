'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, type MatchConfig } from '@/contexts/GameContext';
import { CLASSIC_ULTIMATE_PRESET } from '@/game-engine/rules/presets';
import type { AIDifficulty, PlayerControlType } from '@/types';

const MIN_SIZE = 2;
const MAX_SIZE = 10;

// Difficulty as a 0-3 scale
const DIFF_LEVELS: { value: AIDifficulty; label: string; desc: string }[] = [
  { value: 'easy',   label: 'Easy',   desc: 'Random moves' },
  { value: 'medium', label: 'Medium', desc: 'Tactical play' },
  { value: 'hard',   label: 'Hard',   desc: 'Minimax search' },
  { value: 'expert', label: 'Expert', desc: 'Deep analysis' },
];

const CLASSIC_RULES = [
  { title: 'Goal', body: 'Get N marks in a row — horizontal, vertical, or diagonal.' },
  { title: 'Turns', body: 'Players alternate. X always goes first.' },
  { title: 'Win', body: 'The first player to complete a full row wins.' },
  { title: 'Draw', body: 'If the board fills up with no winner, the game is a draw.' },
  { title: 'Board size', body: 'Larger boards require longer lines to win. A 5×5 board needs 5 in a row.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: d, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

export default function ClassicSetupPage() {
  const { startGame } = useGame();
  const router = useRouter();

  const [boardSize, setBoardSize] = useState(3);
  const [opponentType, setOpponentType] = useState<PlayerControlType>('human');
  const [diffIndex, setDiffIndex] = useState(1); // 0=easy … 3=expert
  const [playerXName, setPlayerXName] = useState('Player X');
  const [playerOName, setPlayerOName] = useState('Player O');
  const [showRules, setShowRules] = useState(false);

  const isVsAI = opponentType === 'ai';
  const difficulty = DIFF_LEVELS[diffIndex].value;

  function handleStart() {
    const config: MatchConfig = {
      mode: 'classic',
      preset: CLASSIC_ULTIMATE_PRESET,
      boardSize,
      players: [
        { player: 'X', displayName: playerXName.trim() || 'Player X', controlType: 'human' },
        {
          player: 'O',
          displayName: isVsAI ? `AI · ${DIFF_LEVELS[diffIndex].label}` : (playerOName.trim() || 'Player O'),
          controlType: isVsAI ? 'ai' : 'human',
          ...(isVsAI ? { difficulty } : {}),
        },
      ],
    };
    startGame(config);
    router.push('/game/classic');
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 py-12" style={{ background: 'var(--th-bg-0)' }}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[5%] w-[350px] h-[350px] rounded-full opacity-12 blur-[90px]" style={{ background: 'var(--th-x-primary)' }} />
      </div>

      <motion.div
        className="relative w-full max-w-md flex flex-col gap-7"
        style={{ zIndex: 1 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header */}
        <motion.div className="text-center" custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <div className="font-display text-[var(--color-x-primary)] font-bold text-sm uppercase tracking-widest mb-1">Classic Mode</div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">Match Setup</h1>
        </motion.div>

        {/* Opponent */}
        <motion.div custom={0.06} variants={fadeUp} initial="hidden" animate="visible">
          <Section title="Opponent">
            <div className="grid grid-cols-2 gap-3">
              <OpponentBtn label="Human" desc="Pass & play" selected={opponentType === 'human'} onSelect={() => setOpponentType('human')} />
              <OpponentBtn label="AI" desc="vs Computer" selected={opponentType === 'ai'} onSelect={() => setOpponentType('ai')} />
            </div>
          </Section>
        </motion.div>

        {/* AI Difficulty meter */}
        <AnimatePresence>
          {isVsAI && (
            <motion.div key="diff" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <Section title="AI Difficulty">
                <DifficultyMeter index={diffIndex} onChange={setDiffIndex} />
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players */}
        <motion.div custom={0.1} variants={fadeUp} initial="hidden" animate="visible">
          <Section title="Players">
            <div className="flex flex-col gap-3">
              <PlayerInput label="Player X" value={playerXName} onChange={setPlayerXName} colorClass="text-[var(--color-x-primary)]" />
              {!isVsAI ? (
                <PlayerInput label="Player O" value={playerOName} onChange={setPlayerOName} colorClass="text-[var(--color-o-primary)]" />
              ) : (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]">
                  <span className="text-lg font-black w-8 text-center text-[var(--color-o-primary)]">O</span>
                  <span className="text-sm text-[var(--color-text-muted)]">AI · {DIFF_LEVELS[diffIndex].label}</span>
                </div>
              )}
            </div>
          </Section>
        </motion.div>

        {/* Rules toggle */}
        <motion.div custom={0.13} variants={fadeUp} initial="hidden" animate="visible">
          <button
            onClick={() => setShowRules((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 bg-[var(--color-surface-1)] border-[var(--color-surface-3)] hover:border-[var(--color-text-muted)]"
          >
            <span className="font-semibold text-sm text-[var(--color-text-primary)]">How to Play — Classic Rules</span>
            <span className="text-[var(--color-text-muted)] text-lg">{showRules ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {showRules && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex flex-col gap-2 p-4 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-surface-3)]">
                  {CLASSIC_RULES.map((r) => (
                    <div key={r.title} className="flex gap-2 text-sm">
                      <span className="font-bold text-[var(--color-text-primary)] min-w-[56px]">{r.title}</span>
                      <span className="text-[var(--color-text-muted)]">{r.body}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Board size — advanced */}
        <motion.div custom={0.16} variants={fadeUp} initial="hidden" animate="visible">
          <Section title="Board Size (Advanced)">
            <BoardSizeStepper size={boardSize} setSize={setBoardSize} accentVar="var(--color-x-primary)" />
          </Section>
        </motion.div>

        {/* Start */}
        <motion.button
          custom={0.19}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-black text-lg text-white transition-all duration-150 shadow-[0_0_24px_rgba(255,107,107,0.4)]"
          style={{ background: 'var(--color-x-primary)' }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ filter: 'brightness(1.1)' }}
        >
          Start Classic Match
        </motion.button>

        <button onClick={() => router.push('/play')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm text-center transition-colors">
          ← Choose Mode
        </button>
      </motion.div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{title}</h2>
      {children}
    </div>
  );
}

function OpponentBtn({ label, desc, selected, onSelect }: { label: string; desc: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-1 p-4 rounded-xl border transition-all duration-150 ${
        selected
          ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]'
          : 'bg-[var(--color-surface-1)] border-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'
      }`}
    >
      <span className="font-bold text-base">{label}</span>
      <span className="text-xs opacity-70">{desc}</span>
    </button>
  );
}

function DifficultyMeter({ index, onChange }: { index: number; onChange: (i: number) => void }) {
  const level = DIFF_LEVELS[index];
  const colors = ['#4ade80', '#facc15', '#fb923c', '#f87171'];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-base" style={{ color: colors[index] }}>{level.label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{level.desc}</span>
      </div>
      {/* Track with 4 pip segments */}
      <div className="flex gap-1.5">
        {DIFF_LEVELS.map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className="flex-1 h-3 rounded-full transition-all duration-200"
            style={{
              background: i <= index ? colors[index] : 'var(--color-surface-3)',
              opacity: i <= index ? 1 : 0.4,
            }}
            aria-label={DIFF_LEVELS[i].label}
          />
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={3}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full cursor-pointer opacity-0 absolute"
        aria-label="Difficulty slider"
        style={{ marginTop: '-20px' }}
      />
    </div>
  );
}

function PlayerInput({ label, value, onChange, colorClass }: { label: string; value: string; onChange: (v: string) => void; colorClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-lg font-black w-8 text-center ${colorClass}`}>{label.split(' ')[1]}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={20}
        aria-label={`Name for ${label}`}
        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-150"
      />
    </div>
  );
}

function BoardSizeStepper({ size, setSize, accentVar }: { size: number; setSize: (n: number) => void; accentVar: string }) {
  const desc = size === 2 ? 'First move wins! (experimental)' : `${size} in a row to win`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSize(Math.max(MIN_SIZE, size - 1))}
          disabled={size <= MIN_SIZE}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xl font-bold bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] hover:border-[var(--color-text-muted)] disabled:opacity-30 transition-all"
          aria-label="Decrease board size"
        >−</button>
        <div className="flex-1 text-center">
          <span className="font-display font-bold text-2xl" style={{ color: accentVar }}>{size}×{size}</span>
        </div>
        <button
          onClick={() => setSize(Math.min(MAX_SIZE, size + 1))}
          disabled={size >= MAX_SIZE}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xl font-bold bg-[var(--color-surface-2)] border border-[var(--color-surface-3)] hover:border-[var(--color-text-muted)] disabled:opacity-30 transition-all"
          aria-label="Increase board size"
        >+</button>
      </div>
      <input
        type="range"
        min={MIN_SIZE}
        max={MAX_SIZE}
        value={size}
        onChange={(e) => setSize(Number(e.target.value))}
        className="w-full h-2 rounded-full cursor-pointer"
        style={{ accentColor: accentVar } as React.CSSProperties}
        aria-label="Board size slider"
      />
      <p className="text-xs text-[var(--color-text-muted)] text-center">{desc}</p>
    </div>
  );
}
