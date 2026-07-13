'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTutorial } from '@/contexts/TutorialContext';

const COMING_SOON_SETTINGS = [
  { label: 'Animation Intensity', detail: 'Control particle effects and board animations' },
  { label: 'Sound Effects',       detail: 'Enable click, hover, and victory sounds' },
  { label: 'Background Music',    detail: 'Ambient music during gameplay' },
  { label: 'Haptic Feedback',     detail: 'Vibration on mobile devices' },
  { label: 'Notifications',       detail: 'Turn reminders and online match alerts' },
  { label: 'Account & Profile',   detail: 'Username, avatar, linked accounts' },
];

export function SettingsScreen() {
  const router = useRouter();
  const { tutorialMode, toggleTutorialMode, openTutorial } = useTutorial();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--th-bg-0)', color: 'var(--th-text-primary)' }}>
      <div className="flex items-center gap-4 px-6 pt-8 pb-4">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-bold px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--th-bg-3)', color: 'var(--th-text-muted)' }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-black">Settings</h1>
      </div>

      <motion.div
        className="flex-1 px-6 pb-10 flex flex-col gap-3 max-w-xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Tutorial section */}
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--th-text-muted)' }}>
          Tutorial
        </p>

        {/* In-game hints toggle */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl border"
          style={{ background: 'var(--th-bg-1)', borderColor: 'var(--th-bg-3)' }}
        >
          <div>
            <div className="font-semibold text-sm">In-game Hints</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--th-text-muted)' }}>
              Show step-by-step tips while you play
            </div>
          </div>
          <button
            onClick={toggleTutorialMode}
            className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
            style={{ background: tutorialMode ? 'var(--th-accent)' : 'var(--th-bg-3)' }}
            aria-checked={tutorialMode}
            role="switch"
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: tutorialMode ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {/* Open tutorial buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openTutorial('classic')}
            className="px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all"
            style={{ background: 'var(--th-bg-1)', borderColor: 'var(--th-bg-3)', color: 'var(--th-text-primary)' }}
          >
            <div className="text-lg mb-0.5">🎓</div>
            Classic Tutorial
          </button>
          <button
            onClick={() => openTutorial('super')}
            className="px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all"
            style={{ background: 'var(--th-bg-1)', borderColor: 'var(--th-bg-3)', color: 'var(--th-text-primary)' }}
          >
            <div className="text-lg mb-0.5">🚀</div>
            Super Tutorial
          </button>
        </div>

        {/* Coming soon */}
        <p className="text-xs font-bold uppercase tracking-widest mt-3 mb-1" style={{ color: 'var(--th-text-muted)' }}>
          Coming Soon
        </p>

        {COMING_SOON_SETTINGS.map(({ label, detail }) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3 rounded-xl border"
            style={{ background: 'var(--th-bg-1)', borderColor: 'var(--th-bg-3)' }}
          >
            <div>
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--th-text-muted)' }}>{detail}</div>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--th-bg-2)', color: 'var(--th-text-muted)' }}
            >
              Soon
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
