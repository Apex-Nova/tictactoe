'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { isSupabaseConfigured } from '@/services/signaling/SupabaseSignaling';

export default function MultiplayerPage() {
  const router = useRouter();
  const onlineReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8"
      style={{ background: 'var(--th-bg-0)' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[10%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
          style={{ background: 'var(--color-x-primary)' }} />
        <div className="absolute bottom-[-5%] right-[10%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
          style={{ background: 'var(--color-o-primary)' }} />
      </div>

      <motion.div className="relative w-full max-w-sm flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-1">Multiplayer</div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)]">Play Together</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Choose how you want to connect</p>
        </div>

        {/* LAN card */}
        <ModeCard
          icon="📡"
          title="LAN / Wi-Fi"
          subtitle="Same network · Zero internet"
          description="Both players on the same Wi-Fi or hotspot. Exchange QR codes to connect directly — no servers involved."
          accentVar="var(--color-x-primary)"
          tags={['QR Code', 'No internet', 'Zero latency']}
          onClick={() => router.push('/play/multiplayer/lan')}
        />

        {/* Online card */}
        <ModeCard
          icon="🌐"
          title="Online"
          subtitle="Play from anywhere"
          description="Share a 6-character room code with your friend. Works across any network or country."
          accentVar="var(--color-o-primary)"
          tags={['Room Code', 'Any network', 'Peer-to-peer']}
          badge={!onlineReady ? 'Setup required' : undefined}
          onClick={() => router.push('/play/multiplayer/online')}
        />

        <button onClick={() => router.push('/play')}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-sm text-center transition-colors">
          ← Choose Mode
        </button>
      </motion.div>
    </div>
  );
}

function ModeCard({ icon, title, subtitle, description, accentVar, tags, badge, onClick }:
  { icon: string; title: string; subtitle: string; description: string; accentVar: string; tags: string[]; badge?: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left p-5 rounded-2xl border transition-all group"
      style={{
        background: 'var(--color-surface-1)',
        borderColor: 'var(--color-surface-3)',
      }}
      whileHover={{ borderColor: accentVar, boxShadow: `0 0 24px ${accentVar}22` }}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-lg text-[var(--color-text-primary)]">{title}</span>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${accentVar}22`, color: accentVar }}>
                {badge}
              </span>
            )}
          </div>
          <div className="text-xs font-semibold mb-2" style={{ color: accentVar }}>{subtitle}</div>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map(t => (
              <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{ borderColor: `${accentVar}44`, color: accentVar }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="text-[var(--color-text-muted)] text-xl mt-1 group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </motion.button>
  );
}
