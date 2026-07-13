import type { Metadata, Viewport } from 'next';
import { Nunito, Fredoka } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StatsProvider } from '@/contexts/StatsContext';
import { GameProvider } from '@/contexts/GameContext';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { TutorialModal } from '@/components/tutorial/TutorialModal';
import { MultiplayerProvider } from '@/contexts/MultiplayerContext';

const nunito = Nunito({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});
const fredoka = Fredoka({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://superticktacktoe.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Super Tic Tac Toe — Think Beyond The Board',
    template: '%s | Super Tic Tac Toe',
  },
  description:
    'Play Classic and Super (Ultimate) Tic Tac Toe with AI opponents, local multiplayer, 4 rule presets, and 6 stunning themes. Free, no download, works on any device.',
  keywords: [
    'tic tac toe',
    'super tic tac toe',
    'ultimate tic tac toe',
    'online game',
    'strategy game',
    'browser game',
    'ai opponent',
    'free game',
    'multiplayer',
  ],
  authors: [{ name: 'Super Tic Tac Toe' }],
  creator: 'Super Tic Tac Toe',
  publisher: 'Super Tic Tac Toe',
  category: 'game',

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Super Tic Tac Toe',
    title: 'Super Tic Tac Toe — Think Beyond The Board',
    description:
      'Classic & Ultimate Tic Tac Toe with AI, multiple rule presets, and 6 themes. Free browser game.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Super Tic Tac Toe — Think Beyond The Board',
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: 'summary_large_image',
    title: 'Super Tic Tac Toe — Think Beyond The Board',
    description: 'Classic & Ultimate Tic Tac Toe with AI, multiple rule presets, and 6 themes.',
    images: ['/opengraph-image'],
  },

  // PWA / icons
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg',        type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png' }],
  },

  // Indexing
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },

  // Canonical
  alternates: { canonical: BASE_URL },
};

export const viewport: Viewport = {
  themeColor: '#818CF8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <StatsProvider>
            <GameProvider>
              <MultiplayerProvider>
                <TutorialProvider>
                  {children}
                  <TutorialModal />
                </TutorialProvider>
              </MultiplayerProvider>
            </GameProvider>
          </StatsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
