'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function ThemesScreen() {
  const router = useRouter();
  const { theme: activeTheme, allThemes, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--th-bg-0)', color: 'var(--th-text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-8 pb-4">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-bold px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--th-bg-3)', color: 'var(--th-text-muted)' }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-black">Themes</h1>
      </div>

      {/* Grid */}
      <motion.div
        className="flex-1 px-6 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {allThemes.map((t) => {
          const isActive = t.id === activeTheme.id;
          return (
            <motion.button
              key={t.id}
              variants={item}
              onClick={() => setTheme(t.id)}
              className="relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200"
              style={{
                background: isActive ? `${t.colors.playerX.background}` : t.colors.background.surface,
                borderColor: isActive ? t.colors.accent : t.colors.board.border,
                boxShadow: isActive ? `0 0 24px ${t.colors.playerX.glow}` : 'none',
              }}
            >
              {/* Preview swatches */}
              <div className="flex gap-1.5">
                {['background.base', 'playerX.primary', 'playerO.primary', 'accent'].map((path) => {
                  const parts = path.split('.');
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const color = parts.reduce((o: any, k) => o?.[k], t.colors) as string;
                  return (
                    <div
                      key={path}
                      className="w-6 h-6 rounded-full border border-white/10"
                      style={{ background: color }}
                    />
                  );
                })}
              </div>

              <div>
                <div className="font-black text-base" style={{ color: t.colors.text.primary }}>{t.displayName}</div>
                <div className="text-xs mt-0.5" style={{ color: t.colors.text.muted }}>{t.description}</div>
              </div>

              {isActive && (
                <div
                  className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: t.colors.accent, color: '#000' }}
                >
                  Active
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
