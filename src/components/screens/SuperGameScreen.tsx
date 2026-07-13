'use client';

/**
 * SuperGameScreen — full Super Tic Tac Toe game view.
 *
 * Handles all Super-specific UI states:
 *   - activeBoardIndex constraint → highlighted board
 *   - free move → all boards available
 *   - awaiting-board-choice → ControlDrawOverlay + board pulsing
 *   - portal move → FreeMoveNotice with portal flavor
 *
 * Zero game logic. All state from GameContext.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { useMultiplayer } from '@/contexts/MultiplayerContext';
import { useMatchTimer } from '@/hooks/useMatchTimer';
import { MatchTimer } from '../ui/MatchTimer';
import { InGameTutorial } from '../tutorial/InGameTutorial';
import { useTutorial } from '@/contexts/TutorialContext';
import { MacroBoard } from '../board/MacroBoard';
import { TurnBanner } from '../ui/TurnBanner';
import { GameControls } from '../ui/GameControls';
import { ControlDrawOverlay } from '../ui/ControlDrawOverlay';
import { FreeMoveNotice } from '../ui/FreeMoveNotice';
import { VictoryScreen } from '../ui/VictoryScreen';
import { DrawScreen } from '../ui/DrawScreen';
import type { BoardIndex } from '@/types';

export function SuperGameScreen() {
  const {
    session,
    makeSuperMove,
    chooseControlBoard,
    restartCurrentGame,
    resetGame,
    playableBoardIndices,
    controlChoiceBoards,
  } = useGame();

  const { superState, matchConfig } = session;
  const router = useRouter();
  const timer = useMatchTimer(true);
  const { openTutorial } = useTutorial();
  const mp = useMultiplayer();

  // Apply incoming remote moves to local game state
  useEffect(() => {
    if (mp.status !== 'connected') return;
    mp.onMove((move) => {
      if (move.type === 'super-move') {
        makeSuperMove(move.move);
      } else if (move.type === 'control-board-choice') {
        chooseControlBoard(move.boardIndex);
      }
    });
  }, [mp.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (superState?.phase === 'finished') timer.pause();
  }, [superState?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!superState || !matchConfig) {
      router.replace('/play');
    }
  }, [superState, matchConfig, router]);

  if (!superState || !matchConfig) return null;

  const playerXName = matchConfig.players[0].displayName;
  const playerOName = matchConfig.players[1].displayName;
  const preset = matchConfig.preset;
  const isFinished = superState.phase === 'finished';
  const isAwaitingChoice = superState.phase === 'awaiting-board-choice';
  const isFreeMove = superState.phase === 'active' && superState.activeBoardIndex === null;
  const turnBg = superState.currentPlayer === 'X' ? 'turn-bg-x' : 'turn-bg-o';

  // Derive whether the current free move is because of a portal
  const freeMoveReason = isFreeMove
    ? superState.moveHistory.length === 0
      ? 'initial'
      : preset.drawnBoardBehavior.type
    : preset.drawnBoardBehavior.type;

  // In a connected multiplayer match, each device may only act for its own seat
  // (host = X, guest = O) — this blocks one device from playing both sides.
  const isMultiplayer = mp.status === 'connected';
  const localPlayer = mp.role === 'guest' ? 'O' : 'X';

  function handleCellPlay(boardIndex: BoardIndex, cellIndex: number) {
    if (session.isProcessing || session.isAIThinking) return;
    if (isMultiplayer && superState!.currentPlayer !== localPlayer) return;
    const move = { boardIndex, cellIndex: cellIndex as any };
    makeSuperMove(move);
    if (isMultiplayer) {
      mp.sendMove({ type: 'super-move', move });
    }
  }

  function handleBoardSelect(boardIndex: BoardIndex) {
    if (isMultiplayer && superState!.redirectingPlayer !== localPlayer) return;
    chooseControlBoard(boardIndex);
    if (isMultiplayer) {
      mp.sendMove({ type: 'control-board-choice', boardIndex });
    }
  }

  function handleMainMenu() {
    resetGame();
    router.push('/');
  }

  // Move count display
  const moveCount = superState.moveHistory.length;
  const resolvedBoards = superState.macroGrid.filter((v) => v !== null).length;

  return (
    <div className={`
      min-h-screen flex flex-col items-center justify-between
      py-4 px-2 sm:px-4 gap-4
      transition-all duration-700 ${turnBg}
    `}>
      {/* Header */}
      <motion.div
        className="text-center w-full"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-black text-[var(--color-text-primary)]">
          Super Tic Tac Toe
        </h1>
        <p className="text-[var(--color-text-muted)] text-xs">
          {playerXName} vs {playerOName} · {preset.displayName}
        </p>
      </motion.div>

      {/* Status area */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Turn banner — hidden during control draw (overlay takes over) */}
        <AnimatePresence mode="wait">
          {!isFinished && (
            <TurnBanner
              currentPlayer={superState.currentPlayer}
              playerXName={playerXName}
              playerOName={playerOName}
              isFreeMove={isFreeMove}
              isAwaitingChoice={isAwaitingChoice}
              phase={superState.phase}
            />
          )}
        </AnimatePresence>

        {/* Preset B: control draw overlay */}
        <AnimatePresence>
          {isAwaitingChoice && superState.redirectingPlayer && (
            <ControlDrawOverlay
              redirectingPlayer={superState.redirectingPlayer}
              playerName={
                superState.redirectingPlayer === 'X' ? playerXName : playerOName
              }
              availableBoardCount={controlChoiceBoards.length}
            />
          )}
        </AnimatePresence>

        {/* Free move / portal notice */}
        <AnimatePresence>
          {isFreeMove && !isAwaitingChoice && (
            <FreeMoveNotice
              behavior={freeMoveReason}
              currentPlayer={superState.currentPlayer}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main board */}
      <div className="w-full flex-1 min-h-0">
        <MacroBoard
          state={superState}
          playableBoardIndices={playableBoardIndices}
          controlChoiceBoards={controlChoiceBoards}
          onCellPlay={handleCellPlay}
          onBoardSelect={handleBoardSelect}
        />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--th-text-muted)' }}>
        <span>Move {moveCount}</span>
        <span>·</span>
        <span>{resolvedBoards}/{superState.microBoards.length} boards</span>
        <span>·</span>
        <MatchTimer formatted={timer.formatted} />
        {(session.isProcessing || session.isAIThinking) && (
          <span style={{ color: 'var(--th-accent)' }} className="animate-pulse">
            {session.isAIThinking ? 'AI thinking…' : 'Processing…'}
          </span>
        )}
      </div>

      {/* Controls */}
      <GameControls onRestart={restartCurrentGame} />

      {/* Error feedback */}
      <AnimatePresence>
        {session.error && (
          <motion.div
            className="
              fixed bottom-4 left-1/2 -translate-x-1/2
              px-4 py-2 rounded-xl
              bg-[var(--color-error)]/10 border border-[var(--color-error)]/30
              text-[var(--color-error)] text-sm font-medium
            "
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="alert"
            aria-live="polite"
          >
            Invalid move: {session.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <VictoryScreen
        state={superState}
        playerXName={playerXName}
        playerOName={playerOName}
        presetDisplayName={preset.displayName}
        onPlayAgain={restartCurrentGame}
        onMainMenu={handleMainMenu}
      />
      <DrawScreen
        state={superState}
        presetDisplayName={preset.displayName}
        onPlayAgain={restartCurrentGame}
        onMainMenu={handleMainMenu}
      />

      {/* In-game tutorial hints */}
      <InGameTutorial mode="super" />

      {/* Tutorial help button */}
      <button
        onClick={() => openTutorial('super')}
        className="fixed bottom-6 right-5 z-30 w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-lg transition-all hover:scale-110"
        style={{ background: 'var(--th-bg-2)', border: '1px solid var(--th-bg-3)', color: 'var(--th-text-muted)' }}
        aria-label="Open tutorial"
      >
        ?
      </button>
    </div>
  );
}
