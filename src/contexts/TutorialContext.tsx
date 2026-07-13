'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface TutorialContextValue {
  tutorialMode: boolean;           // in-game step hints on/off
  isModalOpen: boolean;            // animated tutorial modal open
  modalMode: 'classic' | 'super';  // which tutorial to show
  hasSeenTutorial: boolean;
  openTutorial: (mode?: 'classic' | 'super') => void;
  closeTutorial: () => void;
  toggleTutorialMode: () => void;
  markSeen: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

const SEEN_KEY   = 'stt-tutorial-seen';
const MODE_KEY   = 'stt-tutorial-mode';

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true); // default true to avoid flash
  const [tutorialMode, setTutorialMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'classic' | 'super'>('classic');

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY) === '1';
    const mode = (localStorage.getItem(MODE_KEY) ?? 'false') === 'true';
    setHasSeenTutorial(seen);
    setTutorialMode(mode);
    if (!seen) {
      // slight delay so landing page renders first
      setTimeout(() => setIsModalOpen(true), 900);
    }
  }, []);

  const openTutorial = useCallback((mode: 'classic' | 'super' = 'classic') => {
    setModalMode(mode);
    setIsModalOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsModalOpen(false);
    markSeen();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markSeen = useCallback(() => {
    localStorage.setItem(SEEN_KEY, '1');
    setHasSeenTutorial(true);
  }, []);

  const toggleTutorialMode = useCallback(() => {
    setTutorialMode((v) => {
      localStorage.setItem(MODE_KEY, String(!v));
      return !v;
    });
  }, []);

  return (
    <TutorialContext.Provider value={{
      tutorialMode, isModalOpen, modalMode, hasSeenTutorial,
      openTutorial, closeTutorial, toggleTutorialMode, markSeen,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider');
  return ctx;
}
