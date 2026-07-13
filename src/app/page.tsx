'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ParticleBackground } from '@/components/landing/ParticleBackground';
import { DemoBoard } from '@/components/landing/DemoBoard';
import { useTutorial } from '@/contexts/TutorialContext';
import {
  IconPlay, IconStats, IconThemes, IconSettings, IconHelp,
  IconOnline, IconTrophy, IconUsers, IconMedal, IconReplay,
} from '@/components/ui/NavIcon';

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

// ── Navigation items ──────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Play',       Icon: IconPlay,     href: '/play' },
  { label: 'Statistics', Icon: IconStats,    href: '/stats' },
  { label: 'Themes',     Icon: IconThemes,   href: '/themes' },
  { label: 'Settings',   Icon: IconSettings, href: '/settings' },
  { label: 'Help',       Icon: IconHelp,     href: '/help' },
] as const;

const COMING_SOON = [
  { label: 'Online Multiplayer', Icon: IconOnline },
  { label: 'Ranked Mode',        Icon: IconTrophy },
  { label: 'Friends System',     Icon: IconUsers  },
  { label: 'Tournaments',        Icon: IconMedal  },
  { label: 'Replays',            Icon: IconReplay },
  { label: 'Achievements',       Icon: IconMedal  },
];

export default function HomePage() {
  const router = useRouter();
  const [showFuture, setShowFuture] = useState(false);
  const { openTutorial } = useTutorial();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--th-bg-0)' }}>
      <ParticleBackground />

      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'var(--th-x-primary)' }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'var(--th-o-primary)' }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] -translate-x-1/2"
          style={{ background: 'var(--th-accent)' }} />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center flex-1 px-4 py-12 gap-10" style={{ zIndex: 2 }}>

        {/* Demo board */}
        <motion.div
          className="animate-float"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <DemoBoard scale={1} />
        </motion.div>

        {/* Hero title */}
        <motion.div
          className="text-center flex flex-col gap-3"
          custom={0.12}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none">
            <span className="mark-x">Super</span>{' '}
            <span style={{ color: 'var(--th-text-primary)' }}>Tic</span>{' '}
            <span className="mark-o">Tac</span>{' '}
            <span style={{ color: 'var(--th-text-primary)' }}>Toe</span>
          </h1>
          <p className="text-base sm:text-lg font-medium tracking-widest uppercase" style={{ color: 'var(--th-text-muted)' }}>
            Think Beyond The Board
          </p>
        </motion.div>

        {/* CTA row: Play Now + How to Play side by side */}
        <motion.div
          className="flex gap-3 items-stretch"
          custom={0.24}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <motion.button
            onClick={() => router.push('/play')}
            className="relative overflow-hidden flex-1 px-10 py-4 rounded-2xl font-black text-xl text-white"
            style={{
              background: `linear-gradient(135deg, var(--th-x-primary), var(--th-accent))`,
              boxShadow: `0 0 40px var(--th-accent-glow)`,
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="relative z-10">Play Now</span>
            <motion.div className="absolute inset-0 opacity-0" style={{ background: 'rgba(255,255,255,0.15)' }} whileHover={{ opacity: 1 }} />
          </motion.button>

          <motion.button
            onClick={() => openTutorial('classic')}
            className="flex items-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm border-2 transition-all duration-200"
            style={{ borderColor: 'var(--th-accent)', color: 'var(--th-accent)', background: 'transparent' }}
            whileHover={{ scale: 1.04, background: 'rgba(129,140,248,0.08)' }}
            whileTap={{ scale: 0.97 }}
            title="How to Play"
          >
            <IconHelp size={20} />
            <span>How to Play</span>
          </motion.button>
        </motion.div>

        {/* Quick start row */}
        <motion.div
          className="flex gap-3"
          custom={0.32}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          {(['Classic', 'Super'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => router.push(`/play/${mode.toLowerCase()}`)}
              className="px-5 py-2 rounded-xl text-sm font-bold border transition-all duration-200"
              style={{ background: 'var(--th-bg-2)', borderColor: 'var(--th-bg-3)', color: 'var(--th-text-primary)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--th-accent)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--th-bg-3)'; }}
            >
              {mode}
            </button>
          ))}
        </motion.div>

        {/* Navigation grid */}
        <motion.nav
          className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full max-w-lg"
          custom={0.4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(({ label, Icon, href }) => (
            <motion.button
              key={label}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all duration-200"
              style={{
                background: 'var(--th-bg-1)',
                borderColor: 'var(--th-bg-3)',
                color: 'var(--th-text-primary)',
              }}
              whileHover={{ y: -2, borderColor: 'var(--th-accent)' } as any}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={22} />
              <span className="text-xs font-semibold" style={{ color: 'var(--th-text-muted)' }}>{label}</span>
            </motion.button>
          ))}
        </motion.nav>

        {/* Coming Soon strip */}
        <motion.div
          className="flex flex-col items-center gap-4 w-full max-w-lg"
          custom={0.5}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <button
            onClick={() => setShowFuture((v) => !v)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: 'var(--th-text-muted)' }}
          >
            <span>Coming Soon</span>
            <motion.span animate={{ rotate: showFuture ? 180 : 0 }} transition={{ duration: 0.2 }}>▾</motion.span>
          </button>

          <AnimatePresence>
            {showFuture && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full overflow-hidden"
              >
                {COMING_SOON.map(({ label, Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium"
                    style={{
                      background: 'var(--th-bg-1)',
                      borderColor: 'var(--th-bg-3)',
                      color: 'var(--th-text-muted)',
                    }}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Footer */}
      <motion.footer
        className="relative text-center pb-4 text-xs"
        style={{ zIndex: 2, color: 'var(--th-text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Super Tic Tac Toe · Classic · Super · Multiple Rule Presets
      </motion.footer>
    </div>
  );
}
