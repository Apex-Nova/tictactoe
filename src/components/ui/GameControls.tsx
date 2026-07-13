'use client';

import { useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';

interface Props {
  onRestart: () => void;
}

export function GameControls({ onRestart }: Props) {
  const { resetGame } = useGame();
  const router = useRouter();

  function handleMenu() {
    resetGame();
    router.push('/');
  }

  function handleSetup() {
    resetGame();
    router.push('/play');
  }

  return (
    <div className="flex items-center gap-3 flex-wrap justify-center">
      <button
        onClick={onRestart}
        className="
          px-5 py-2.5 rounded-xl font-semibold text-sm
          bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]
          text-[var(--color-text-primary)]
          border border-[var(--color-surface-3)]
          transition-colors duration-150 active:scale-95
        "
        aria-label="Restart match with same settings"
      >
        Restart
      </button>
      <button
        onClick={handleSetup}
        className="
          px-5 py-2.5 rounded-xl font-semibold text-sm
          bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]
          text-[var(--color-text-secondary)]
          border border-[var(--color-surface-3)]
          transition-colors duration-150 active:scale-95
        "
        aria-label="Go to match setup"
      >
        Change Rules
      </button>
      <button
        onClick={handleMenu}
        className="
          px-5 py-2.5 rounded-xl font-semibold text-sm
          bg-transparent hover:bg-[var(--color-surface-1)]
          text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]
          border border-transparent hover:border-[var(--color-surface-3)]
          transition-all duration-150 active:scale-95
        "
        aria-label="Return to main menu"
      >
        Main Menu
      </button>
    </div>
  );
}
