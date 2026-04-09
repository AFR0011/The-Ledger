import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['icons/the-ledger-192.svg', 'icons/the-ledger-512.svg'],
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}']
      },
      manifest: {
        name: 'The Ledger',
        short_name: 'Ledger',
        description: 'A private, offline-first operating ledger for guided reflection.',
        theme_color: '#08090a',
        background_color: '#08090a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/the-ledger-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/the-ledger-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
