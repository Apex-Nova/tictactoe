'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Theme } from '@/types/theme';
import { ALL_THEMES, DEFAULT_THEME_ID } from '@/themes/presets';

// ── CSS variable mapping ───────────────────────────────────────────────────────

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const { colors } = theme;

  root.setAttribute('data-theme', theme.id);

  // Also update the Tailwind @theme vars via inline style overrides so
  // Tailwind utility classes pick up the new values at runtime.
  root.style.setProperty('--color-x-primary',   colors.playerX.primary);
  root.style.setProperty('--color-x-glow',       colors.playerX.glow);
  root.style.setProperty('--color-x-bg',         colors.playerX.background);
  root.style.setProperty('--color-o-primary',    colors.playerO.primary);
  root.style.setProperty('--color-o-glow',       colors.playerO.glow);
  root.style.setProperty('--color-o-bg',         colors.playerO.background);
  root.style.setProperty('--color-accent',        colors.accent);
  root.style.setProperty('--color-surface-0',    colors.background.base);
  root.style.setProperty('--color-surface-1',    colors.background.surface);
  root.style.setProperty('--color-surface-2',    colors.background.overlay);
  root.style.setProperty('--color-surface-3',    colors.board.border);
  root.style.setProperty('--color-text-primary', colors.text.primary);
  root.style.setProperty('--color-text-muted',   colors.text.muted);
  root.style.setProperty('--color-board-line',   colors.board.border);
  root.style.setProperty('--color-cell-hover',   colors.board.cellHover);

  if (theme.typography.fontFamily !== 'inherit') {
    root.style.setProperty('--font-sans', theme.typography.fontFamily);
  } else {
    root.style.removeProperty('--font-sans');
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  allThemes: readonly Theme[];
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'superttt-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);

  // Load persisted theme on mount
  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && ALL_THEMES.find((t) => t.id === saved)) {
      setThemeId(saved);
    }
  }, []);

  const theme = useMemo(() => ALL_THEMES.find((t) => t.id === themeId) ?? ALL_THEMES[0], [themeId]);

  // Apply CSS vars whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, allThemes: ALL_THEMES, setTheme }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside <ThemeProvider>');
  return ctx;
}
