import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png', 'app-logo.jpg'],
      manifest: {
        name: 'Menu 246',
        short_name: 'Menu 246',
        description: 'Planification des repas pour les camps scouts',
        theme_color: '#007AFF',
        background_color: '#F2F2F7',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Only precache the small essential files — exclude large lazy-loaded chunks
        globPatterns: ['**/*.{css,html,ico,png,svg}', 'assets/index-*.js'],
        // Exclude the large dynamic chunks (Firebase 437KB, xlsx 429KB) from precache
        globIgnores: ['**/index.esm-*.js', '**/xlsx-*.js'],
        runtimeCaching: [
          {
            // Cache Firebase + xlsx chunks lazily on first use
            urlPattern: /assets\/(index\.esm|xlsx)-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lazy-chunks',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.xlsx$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'excel-files',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
