'use client';

/**
 * MatchSetupScreen — pre-game configuration.
 *
 * Collects:
 *   - Game mode (Classic / Super)
 *   - Opponent type (Human / AI) and AI difficulty
 *   - Player names
 *   - Rule preset (Super only)
 *
 * On submit: calls context.startGame(config) then navigates to the game route.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame, type MatchConfig } from '@/contexts/GameContext';
import { ALL_PRESETS } from '@/game-engine/rules/presets';
import type { AIDifficulty, GameMode, PlayerControlType, RulePreset } from '@/types';

const DIFFICULTIES: { value: AIDifficulty; label: string; desc: string }[] = [
  { value: 'easy',   label: 'Easy',   desc: 'Random moves' },
  { value: 'medium', label: 'Medium', desc: 'Tactical awareness' },
  { value: 'hard',   label: 'Hard',   desc: 'Minimax search' },
  { value: 'expert', label: 'Expert', desc: 'Deep analysis' },
];

export function MatchSetupScreen() {
  const { startGame } = useGame();
  const router = useRouter();

  const [mode, setMode] = useState<GameMode>('super');

  // Read mode from sessionStorage or URL param — runs after every mount
  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get('mode');
    const stored   = sessionStorage.getItem('setup-mode');
    if (stored) sessionStorage.removeItem('setup-mode');
    const target = stored ?? urlParam;
    if (target === 'classic') setMode('classic');
  }, []);
  const [opponentType, setOpponentType] = useState<PlayerControlType>('human');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [playerXName, setPlayerXName] = useState('Player X');
  const [playerOName, setPlayerOName] = useState('Player O');
  const [selectedPreset, setSelectedPreset] = useState<RulePreset>(ALL_PRESETS[0]);

  const isVsAI = opponentType === 'ai';

  function handleStart() {
    const config: MatchConfig = {
      mode,
      preset: selectedPreset,
      players: [
        { player: 'X', displayName: playerXName.trim() || 'Player X', controlType: 'human' },
        {
          player: 'O',
          displayName: isVsAI ? `AI (${difficulty})` : (playerOName.trim() || 'Player O'),
          controlType: isVsAI ? 'ai' : 'human',
          ...(isVsAI ? { difficulty } : {}),
        },
      ],
    };
    startGame(config);
    router.push(mode === 'classic' ? '/game/classic' : '/game/super');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-surface-0)]">
      <motion.div
        className="w-full max-w-md flex flex-col gap-7"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-black text-[var(--color-text-primary)]">Match Setup</h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">Configure your game</p>
        </div>

        {/* Game mode */}
        <Section title="Game Mode">
          <div className="grid grid-cols-2 gap-3">
            {(['classic', 'super'] as GameMode[]).map((m) => (
              <ModeButton key={m} value={m} selected={mode === m} onSelect={setMode} />
            ))}
          </div>
        </Section>

        {/* Opponent type */}
        <Section title="Opponent">
          <div className="grid grid-cols-2 gap-3">
            <OpponentButton
              label="Human"
              desc="Pass & play"
              selected={opponentType === 'human'}
              onSelect={() => setOpponentType('human')}
            />
            <OpponentButton
              label="AI"
              desc="Play vs computer"
              selected={opponentType === 'ai'}
              onSelect={() => setOpponentType('ai')}
            />
          </div>
        </Section>

        {/* AI Difficulty */}
        <AnimatePresence>
          {isVsAI && (
            <motion.div
              key="difficulty"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Section title="AI Difficulty">
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      aria-pressed={difficulty === d.value}
                      className={`
                        flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all duration-150
                        ${difficulty === d.value
                          ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]'
                          : 'bg-[var(--color-surface-1)] border-[var(--color-surface-3)] hover:border-[var(--color-text-muted)]'
                        }
                      `}
                    >
                      <span className={`font-semibold text-sm ${difficulty === d.value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                        {d.label}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player names */}
        <Section title="Players">
          <div className="flex flex-col gap-3">
            <PlayerInput
              label="Player X"
              value={playerXName}
              onChange={setPlayerXName}
              colorClass="text-[var(--color-x-primary)]"
            />
            {!isVsAI && (
              <PlayerInput
                label="Player O"
                value={playerOName}
                onChange={setPlayerOName}
                colorClass="text-[var(--color-o-primary)]"
              />
            )}
            {isVsAI && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]">
                <span className="text-lg font-black w-8 text-center text-[var(--color-o-primary)]">O</span>
                <span className="text-sm text-[var(--color-text-muted)]">AI ({difficulty})</span>
              </div>
            )}
          </div>
        </Section>

        {/* Rule preset — Super mode only */}
        <AnimatePresence>
          {mode === 'super' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Section title="Rule Preset">
                <div className="flex flex-col gap-2">
                  {ALL_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
                    <PresetOption
                      key={preset.id}
                      preset={preset}
                      selected={selectedPreset.id === preset.id}
                      onSelect={setSelectedPreset}
                    />
                  ))}
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start button */}
        <motion.button
          onClick={handleStart}
          className="
            w-full py-4 rounded-xl font-black text-lg
            bg-[var(--color-accent)] hover:bg-indigo-400
            text-white transition-colors duration-150
            shadow-[0_0_24px_rgba(129,140,248,0.35)]
          "
          whileTap={{ scale: 0.97 }}
          aria-label="Start the match"
        >
          Start Match
        </motion.button>

        <button
          onClick={() => router.push('/')}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm text-center transition-colors"
        >
          ← Back to Menu
        </button>
      </motion.div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ModeButton({
  value,
  selected,
  onSelect,
}: {
  value: GameMode;
  selected: boolean;
  onSelect: (m: GameMode) => void;
}) {
  const label = value === 'classic' ? 'Classic' : 'Super';
  const desc = value === 'classic' ? '3×3 board' : '9 boards · 81 cells';

  return (
    <button
      onClick={() => onSelect(value)}
      className={`
        flex flex-col items-center gap-1 p-4 rounded-xl border transition-all duration-150
        ${selected
          ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]'
          : 'bg-[var(--color-surface-1)] border-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'
        }
      `}
      aria-pressed={selected}
    >
      <span className="font-bold text-base">{label}</span>
      <span className="text-xs opacity-70">{desc}</span>
    </button>
  );
}

function OpponentButton({
  label,
  desc,
  selected,
  onSelect,
}: {
  label: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`
        flex flex-col items-center gap-1 p-4 rounded-xl border transition-all duration-150
        ${selected
          ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)]'
          : 'bg-[var(--color-surface-1)] border-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'
        }
      `}
    >
      <span className="font-bold text-base">{label}</span>
      <span className="text-xs opacity-70">{desc}</span>
    </button>
  );
}

function PlayerInput({
  label,
  value,
  onChange,
  colorClass,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-lg font-black w-8 text-center ${colorClass}`}>
        {label.split(' ')[1]}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={20}
        aria-label={`Name for ${label}`}
        className="
          flex-1 px-3 py-2 rounded-lg text-sm font-medium
          bg-[var(--color-surface-2)] border border-[var(--color-surface-3)]
          text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]
          focus:outline-none focus:border-[var(--color-accent)]
          transition-colors duration-150
        "
      />
    </div>
  );
}

function PresetOption({
  preset,
  selected,
  onSelect,
}: {
  preset: RulePreset;
  selected: boolean;
  onSelect: (p: RulePreset) => void;
}) {
  return (
    <button
      onClick={() => onSelect(preset)}
      className={`
        flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all duration-150
        ${selected
          ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]'
          : 'bg-[var(--color-surface-1)] border-[var(--color-surface-3)] hover:border-[var(--color-text-muted)]'
        }
      `}
      aria-pressed={selected}
    >
      <span className={`font-semibold text-sm ${selected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
        {preset.displayName}
      </span>
      <span className="text-xs text-[var(--color-text-muted)]">{preset.description}</span>
    </button>
  );
}
