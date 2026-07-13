'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const SECTIONS = [
  {
    title: 'Classic Tic Tac Toe',
    body: 'The traditional game. Get N marks in a row — horizontally, vertically, or diagonally — to win. Play on boards from 2×2 up to 10×10.',
  },
  {
    title: 'Super Tic Tac Toe',
    body: 'A meta-game where each cell is its own board. Win enough small boards in a row to claim the macro grid.',
  },
  {
    title: 'Board Redirection',
    body: 'Where you play inside a small board determines which board your opponent must play in next. The cell coordinate maps directly to the next board.',
  },
  {
    title: 'Rule Presets',
    body: [
      'Classic Ultimate — if you\'re sent to a won or drawn board, play anywhere.',
      'Control Draw — if sent to a drawn board, the redirecting player picks the next board.',
      'Portal Draw — if sent to a drawn board, the active player picks any valid board.',
    ].join('\n'),
  },
  {
    title: 'AI Difficulty',
    body: 'Easy: random moves. Medium: tactical priority logic. Hard: minimax search. Expert (coming soon): full minimax with heuristics.',
  },
];

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--th-bg-0)', color: 'var(--th-text-primary)' }}>
      <div className="flex items-center gap-4 px-6 pt-8 pb-4">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-bold px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--th-bg-3)', color: 'var(--th-text-muted)' }}
        >
          ← Back
        </button>
        <h1 className="text-2xl font-black">How to Play</h1>
      </div>

      <motion.div
        className="flex-1 px-6 pb-10 flex flex-col gap-6 max-w-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {SECTIONS.map(({ title, body }) => (
          <div
            key={title}
            className="p-5 rounded-2xl border"
            style={{ background: 'var(--th-bg-1)', borderColor: 'var(--th-bg-3)' }}
          >
            <h2 className="font-black text-base mb-2">{title}</h2>
            <p className="text-sm whitespace-pre-line" style={{ color: 'var(--th-text-muted)' }}>{body}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
