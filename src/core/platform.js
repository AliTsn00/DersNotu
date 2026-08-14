// Uygulama nerede çalışıyor? Tarayıcıda mı, Android uygulamasında mı?

import { Capacitor } from '@capacitor/core';

/** Android/iOS uygulaması olarak mı çalışıyor (APK), yoksa tarayıcıda mı? */
export const yerliMi = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Sayfa bir çerçeve (iframe) içinde mi? Tarayıcı orada mikrofon izni sormaz. */
export const cerceveIcindeMi = () => {
  if (yerliMi()) return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/**
 * Ortama uygun dinleyiciyi kurar.
 * Uygulamada cihazın konuşma tanıma servisi, tarayıcıda Web Speech API.
 */
export async function dinleyiciOlustur(secenekler) {
  if (yerliMi()) {
    const { YerliDinleyici } = await import('./dinlemeYerli.js');
    return new YerliDinleyici(secenekler);
  }
  const { Dinleyici } = await import('./dinleme.js');
  return new Dinleyici(secenekler);
}

/** Bu ortamda canlı dinleme mümkün mü? */
export async function canliDinlemeVarMi() {
  if (yerliMi()) return true;
  const { konusmaTanimaVarMi } = await import('./dinleme.js');
  return konusmaTanimaVarMi();
}
