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

/**
 * Tanılama: mikrofon çalışmadığında nerede takıldığını görmek için.
 * Hiçbir adımda hata fırlatmaz; her satır ya sonucu ya da hatayı gösterir.
 */
export async function tanilamaTopla() {
  const satirlar = {};

  try {
    satirlar.ortam = yerliMi() ? `uygulama (${Capacitor.getPlatform()})` : 'tarayıcı';
  } catch (sorun) {
    satirlar.ortam = `okunamadı: ${sorun.message}`;
  }

  if (!yerliMi()) {
    satirlar.webSpeech =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
        ? 'var'
        : 'yok';
    satirlar.cerceve = cerceveIcindeMi() ? 'evet (mikrofon izni sorulmaz)' : 'hayır';
    return satirlar;
  }

  let eklenti = null;
  try {
    ({ SpeechRecognition: eklenti } = await import('@capacitor-community/speech-recognition'));
    satirlar.eklenti = 'yüklendi';
  } catch (sorun) {
    satirlar.eklenti = `yüklenemedi: ${sorun.message}`;
    return satirlar;
  }

  try {
    const { available } = await eklenti.available();
    satirlar.servis = available ? 'var' : 'YOK (cihazda konuşma tanıma servisi bulunamadı)';
  } catch (sorun) {
    satirlar.servis = `hata: ${sorun.message}`;
  }

  try {
    const izin = await eklenti.checkPermissions();
    satirlar.izin = izin.speechRecognition;
  } catch (sorun) {
    satirlar.izin = `hata: ${sorun.message}`;
  }

  try {
    const { listening } = await eklenti.isListening();
    satirlar.dinliyor = listening ? 'evet' : 'hayır';
  } catch (sorun) {
    satirlar.dinliyor = `hata: ${sorun.message}`;
  }

  return satirlar;
}
