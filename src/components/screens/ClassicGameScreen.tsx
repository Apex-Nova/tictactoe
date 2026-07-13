'use client';

/**
 * ClassicGameScreen — full Classic Tic Tac Toe game view.
 *
 * Connects context state → board + UI components.
 * Zero game logic. Every decision is delegated to the engine via context.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { ClassicBoard } from '../board/ClassicBoard';
import { TurnBanner } from '../ui/TurnBanner';
import { GameControls } from '../ui/GameControls';
import { VictoryScreen } from '../ui/VictoryScreen';
import { DrawScreen } from '../ui/DrawScreen';
import { MatchTimer } from '../ui/MatchTimer';
import { useMatchTimer } from '@/hooks/useMatchTimer';
import { InGameTutorial } from '../tutorial/InGameTutorial';
import { useTutorial } from '@/contexts/TutorialContext';

export function ClassicGameScreen() {
  const { session, makeClassicMove, restartCurrentGame, resetGame } = useGame();
  const { classicState, matchConfig } = session;
  const router = useRouter();
  const timer = useMatchTimer(true);
  const { openTutorial } = useTutorial();

  // Pause timer when finished
  useEffect(() => {
    if (classicState?.phase === 'finished') timer.pause();
  }, [classicState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to setup if no game is active
  useEffect(() => {
    if (!classicState || !matchConfig) {
      router.replace('/play');
    }
  }, [classicState, matchConfig, router]);

  if (!classicState || !matchConfig) return null;

  const playerXName = matchConfig.players[0].displayName;
  const playerOName = matchConfig.players[1].displayName;
  const isFinished = classicState.phase === 'finished';
  const turnBg = classicState.currentPlayer === 'X' ? 'turn-bg-x' : 'turn-bg-o';

  function handleMainMenu() {
    resetGame();
    router.push('/');
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-6 p-4 transition-all duration-700 ${turnBg}`}>

      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-black text-[var(--color-text-primary)]">
          Classic Tic Tac Toe
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm">
          {playerXName} vs {playerOName}
        </p>
      </motion.div>

      {/* Turn banner */}
      <AnimatePresence mode="wait">
        {!isFinished && (
          <TurnBanner
            currentPlayer={classicState.currentPlayer}
            playerXName={playerXName}
            playerOName={playerOName}
            phase={classicState.phase}
          />
        )}
      </AnimatePresence>

      {/* Board */}
      <motion.div
        className="w-full max-w-[360px]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 }}
      >
        <ClassicBoard
          state={classicState}
          onPlay={(cellIndex) => makeClassicMove({ cellIndex: cellIndex as any })}
        />
      </motion.div>

      {/* HUD bar */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--th-text-muted)' }}>
        <span>Move {classicState.moveHistory.length} of 9</span>
        <span>·</span>
        <MatchTimer formatted={timer.formatted} />
        {session.isAIThinking && (
          <span style={{ color: 'var(--th-accent)' }} className="animate-pulse">AI thinking…</span>
        )}
      </div>

      {/* Controls */}
      <GameControls onRestart={restartCurrentGame} />

      {/* Modals */}
      <VictoryScreen
        state={classicState}
        playerXName={playerXName}
        playerOName={playerOName}
        presetDisplayName="Classic"
        onPlayAgain={restartCurrentGame}
        onMainMenu={handleMainMenu}
      />
      <DrawScreen
        state={classicState}
        presetDisplayName="Classic"
        onPlayAgain={restartCurrentGame}
        onMainMenu={handleMainMenu}
      />

      {/* In-game tutorial hints */}
      <InGameTutorial mode="classic" />

      {/* Tutorial help button */}
      <button
        onClick={() => openTutorial('classic')}
        className="fixed bottom-6 right-5 z-30 w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-lg transition-all hover:scale-110"
        style={{ background: 'var(--th-bg-2)', border: '1px solid var(--th-bg-3)', color: 'var(--th-text-muted)' }}
        aria-label="Open tutorial"
      >
        ?
      </button>
    </div>
  );
}
