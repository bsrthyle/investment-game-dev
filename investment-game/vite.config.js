import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'audio/**/*',
        'video/**/*',
        'icons/**/*',
        'images/**/*',
      ],
      manifest: {
        name: 'CIMMYT Fertilizer Game',
        short_name: 'Fertilizer',
        description: 'CIMMYT fertilizer risk-communication field experiment',
        theme_color: '#4CAF50',
        background_color: '#FFFBF2',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2,mp3,ogg,mp4,webm,json}'],
        maximumFileSizeToCacheInBytes: 80 * 1024 * 1024,
        // Force new Service Worker to take over immediately on deploy instead
        // of waiting for all tabs to close. Combined with `autoUpdate`, this
        // means a single hard refresh shows the new version.
        skipWaiting: true,
        clientsClaim: true,
        // Never cache index.html stale — we want users to always get the latest
        // HTML (which references the current hashed JS/CSS assets).
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
