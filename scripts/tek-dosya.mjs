// vite.tekdosya.config.js çıktısındaki CSS ve JS'i index.html içine gömer.
// Sonuç: dist-tek/ders-notu.html — tek başına açılabilen bir dosya.

import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..');
const CIKTI = join(KOK, 'dist-tek');

// Satır içi script'in erken kapanmasını önle.
const kacir = (kod) => kod.replace(/<\/script/gi, '<\\/script');

let html = readFileSync(join(CIKTI, 'index.html'), 'utf8');

html = html.replace(
  /<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (_, yol) => `<style>\n${readFileSync(join(CIKTI, yol.replace(/^\.?\//, '')), 'utf8')}\n</style>`,
);

html = html.replace(
  /<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
  (_, yol) =>
    `<script type="module">\n${kacir(readFileSync(join(CIKTI, yol.replace(/^\.?\//, '')), 'utf8'))}\n</script>`,
);

const hedef = join(CIKTI, 'ders-notu.html');
writeFileSync(hedef, html);

// Gömülen parçalar artık gereksiz.
rmSync(join(CIKTI, 'assets'), { recursive: true, force: true });
rmSync(join(CIKTI, 'index.html'), { force: true });

const boyut = (readFileSync(hedef).length / 1024 / 1024).toFixed(2);
console.log(`dist-tek/ders-notu.html hazır (${boyut} MB)`);
console.log('Kalan dosyalar:', readdirSync(CIKTI).join(', '));
