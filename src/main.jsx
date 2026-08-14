import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Yakalanmamış hatalar sessizce kaybolmasın: uygulamada tarayıcı konsolu yok.
if (typeof window !== 'undefined') {
  const bildir = (mesaj) => {
    window.__sonHata = String(mesaj);
    document.dispatchEvent(new CustomEvent('uygulama-hatasi', { detail: String(mesaj) }));
  };
  window.addEventListener('unhandledrejection', (olay) =>
    bildir(olay.reason?.message || olay.reason),
  );
  window.addEventListener('error', (olay) => bildir(olay.message));
}

createRoot(document.getElementById('kok')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
