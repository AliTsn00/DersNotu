import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages alt yolda yayınlanır (örn. /DersNotu/). Yayın iş akışı
// PAGES_BASE değişkenini geçirir; yerel geliştirmede kök kullanılır.
const temelYol = process.env.PAGES_BASE || '/';

export default defineConfig({
  base: temelYol,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'Ders Notu',
        short_name: 'Ders Notu',
        description:
          'Derste hocanın sesini dinleyip Türkçe cümle yapısına göre maddeli ders notu çıkarır.',
        lang: 'tr',
        dir: 'ltr',
        start_url: temelYol,
        scope: temelYol,
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#fafafa',
        theme_color: '#4f46e5',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
