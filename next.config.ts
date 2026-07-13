import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,

  // Security + game-site-friendly headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow embedding on game sites (itch.io, Newgrounds, etc.)
          { key: 'X-Frame-Options',           value: 'ALLOWALL' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.onrender.com wss://*.onrender.com https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors *",
            ].join('; '),
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development'
              ? 'no-cache, no-store, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  poweredByHeader: false,
};

export default nextConfig;
