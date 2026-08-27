import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Project page on GitHub Pages: https://gkpo.github.io/coding-bootcamp/
export default defineConfig({
  base: '/coding-bootcamp/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // No includeAssets: globPatterns below already sweeps public/, and listing
      // them twice precaches each file twice.
      manifest: {
        name: 'Interview Reps',
        short_name: 'Reps',
        description:
          'Five-minute daily reps on the patterns, vocabulary and reflexes coding interviews actually test.',
        // Both are relative to the base, which Vite injects.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F4F5F6',
        theme_color: '#F4F5F6',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
        ],
      },
      workbox: {
        // The whole app is JS, CSS, fonts and icons, so precache all of it:
        // a cold launch in airplane mode has to work (docs/07 M6).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The plugin already precaches the manifest icons; without this they
        // are listed twice and fetched twice on install.
        globIgnores: ['**/pwa-*.png'],
        // Hash routing means every route is index.html; without this a launch
        // from the home screen offline would 404.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Three chunks so the two budgets in docs/05 are readable straight off
        // a build, and so a content-only release does not invalidate the
        // framework chunk the browser has already precached.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          content: ['./src/content/index.ts'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Vitest stubs CSS imports to empty strings by default, which silently
    // turns tokens.test.ts into a suite that asserts nothing. It reads
    // tokens.css through `?raw` to check the palette's contrast ratios.
    css: true,
  },
});
