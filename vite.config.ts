import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Served from the custom domain root (sudoku.nathanlopez.com).
export default defineConfig({
  base: '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Daily Sudoku',
        short_name: 'Sudoku',
        description: 'A new Sudoku every day — Easy, Medium and Hard.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f3ede1',
        theme_color: '#d8432b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/puzzles/') && url.pathname.endsWith('.json'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'puzzles', expiration: { maxEntries: 40 } },
          },
        ],
      },
    }),
  ],
});
