import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Super Tic Tac Toe — Think Beyond The Board';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1040 100%)',
          fontFamily: 'system-ui, sans-serif',
          gap: 32,
        }}
      >
        {/* Mini 3×3 macro board preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['X', 'O', 'X'],
            ['O', 'X', 'O'],
            ['X', 'O', 'X'],
          ].map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 6 }}>
              {row.map((mark, ci) => (
                <div
                  key={ci}
                  style={{
                    width: 72,
                    height: 72,
                    background: mark === 'X' ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    fontWeight: 900,
                    color: mark === 'X' ? '#3B82F6' : '#F97316',
                  }}
                >
                  {mark}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: '#F8FAFC', letterSpacing: -2 }}>
            <span style={{ color: '#3B82F6' }}>Super</span>{' '}
            Tic{' '}
            <span style={{ color: '#F97316' }}>Tac</span>{' '}
            Toe
          </div>
          <div style={{ fontSize: 24, color: '#818CF8', fontWeight: 600, letterSpacing: 6, textTransform: 'uppercase' }}>
            Think Beyond The Board
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['Classic', 'Super 9-Board', 'AI Opponent', '6 Themes'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '8px 18px',
                background: 'rgba(129,140,248,0.15)',
                borderRadius: 20,
                color: '#94A3B8',
                fontSize: 16,
                fontWeight: 600,
                border: '1px solid rgba(129,140,248,0.3)',
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
