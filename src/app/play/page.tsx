'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
};

export default function PlayPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-6 gap-10" style={{ background: 'var(--th-bg-0)' }}>
      {/* Glow orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[5%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: 'var(--th-x-primary)' }} />
        <div className="absolute bottom-[-5%] right-[5%] w-[350px] h-[350px] rounded-full opacity-12 blur-[90px]" style={{ background: 'var(--th-o-primary)' }} />
      </div>

      <div className="relative flex flex-col items-center gap-8 w-full max-w-md" style={{ zIndex: 1 }}>
        <motion.div className="text-center" custom={0} initial="hidden" animate="visible" variants={fadeUp}>
          <h1 className="font-display text-4xl font-bold text-[var(--color-text-primary)]">Choose Mode</h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-sm">Pick a game type to get started</p>
        </motion.div>

        <div className="flex flex-col gap-4 w-full">
          {/* Classic */}
          <motion.button
            custom={0.08}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            onClick={() => router.push('/play/classic')}
            className="group relative flex flex-col gap-2 p-6 rounded-2xl border text-left transition-all duration-200 bg-[var(--color-surface-1)] border-[var(--color-surface-3)] hover:border-[var(--color-x-primary)] hover:shadow-[0_0_30px_rgba(255,107,107,0.2)] overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{ background: 'var(--th-x-primary)' }} />
            <div className="font-bold text-2xl text-[var(--color-text-primary)] font-display">Classic</div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Traditional Tic Tac Toe. Get N in a row to win. Adjustable board size from 2×2 up to 10×10.
            </p>
          </motion.button>

          {/* Super */}
          <motion.button
            custom={0.14}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            onClick={() => router.push('/play/super')}
            className="group relative flex flex-col gap-2 p-6 rounded-2xl border text-left transition-all duration-200 bg-[var(--color-surface-1)] border-[var(--color-surface-3)] hover:border-[var(--color-o-primary)] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{ background: 'var(--th-o-primary)' }} />
            <div className="font-bold text-2xl text-[var(--color-text-primary)] font-display">Super</div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Ultimate Tic Tac Toe. Each move sends your opponent to a specific sub-board. Win boards to claim the macro grid.
            </p>
          </motion.button>

          {/* Multiplayer */}
          <motion.button
            custom={0.2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            onClick={() => router.push('/play/multiplayer')}
            className="group relative flex flex-col gap-2 p-6 rounded-2xl border text-left transition-all duration-200 bg-[var(--color-surface-1)] border-[var(--color-surface-3)] hover:border-[var(--color-accent)] hover:shadow-[0_0_30px_rgba(129,140,248,0.2)] overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" style={{ background: 'var(--th-accent)' }} />
            <div className="flex items-center gap-2">
              <div className="font-bold text-2xl text-[var(--color-text-primary)] font-display">Multiplayer</div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-accent)22', color: 'var(--color-accent)' }}>
                NEW
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Play with a friend on the same Wi-Fi (zero internet) or online anywhere via a room code.
            </p>
            <div className="flex gap-2 mt-1">
              {['📡 LAN / Wi-Fi', '🌐 Online'].map(tag => (
                <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{ borderColor: 'var(--color-accent)44', color: 'var(--color-accent)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        </div>

        <motion.button
          custom={0.26}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          onClick={() => router.push('/')}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm transition-colors"
        >
          ← Back to Menu
        </motion.button>
      </div>
    </div>
  );
}
