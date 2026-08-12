// Tek dosyalık sürüm: bütün JavaScript ve CSS tek bir HTML'e gömülür.
// Sunucu gerektirmez — dosyayı paylaşıp doğrudan tarayıcıda açabilirsiniz.
//
//   npm run build:tek   →  dist-tek/ders-notu.html
//
// Not: servis çalışanı ve PWA kurulumu bu sürümde yoktur; mikrofon erişimi
// için dosyanın https üzerinden sunulması gerekir (yerel dosyada çalışmaz).

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist-tek',
    emptyOutDir: true,
    cssCodeSplit: false,
    // Word dışa aktarımı normalde ayrı parça olarak yüklenir; tek dosyada
    // hepsi gömülü olmalı.
    assetsInlineLimit: 100_000_000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
