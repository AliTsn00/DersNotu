import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';

// Service worker kaydı elle yapılır: yeni sürüm indiğinde kullanıcıya haber
// verip yenilemeyi ona bırakabilmek için. Otomatik yenileme, ders sürerken
// sayfayı sıfırlayabileceği için tercih edilmiyor.
const guncellemeyiUygula = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent('yeni-surum', { detail: () => guncellemeyiUygula(true) }),
    );
  },
  onRegisteredSW(_yol, kayit) {
    // Uygulama günlerce açık kalabiliyor; yarım saatte bir yeni sürüm var mı bak.
    if (kayit) setInterval(() => kayit.update().catch(() => {}), 30 * 60 * 1000);
  },
});

createRoot(document.getElementById('kok')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
