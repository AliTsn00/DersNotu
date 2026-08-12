// Türkçe not çıkarma hattının tek giriş noktası.
//
//   ham konuşma metni
//     → temizle (dolgu, tekrar, boşluk)
//     → cümlelere ayır (kısaltma/ondalık korumalı + bağlaç sezgisi)
//     → noktalama onar (soru/bildirme, baş harf)
//     → sınıflandır (başlık, tanım, örnek, önemli, madde, özet, soru)
//     → maddeli taslak kur
//
// Tamamen çevrimdışı ve kurala dayalıdır; hiçbir yapay zekâ servisi çağırmaz.

import { metniTemizle } from './temizle.js';
import { cumleleriAyir } from './cumle.js';
import { cumleyiBicimle } from './noktalama.js';
import { cumleyiSiniflandir } from './siniflandir.js';
import { taslakKur } from './taslak.js';

/**
 * Ham konuşma metnini yapılandırılmış ders notuna çevirir.
 * @param {string} hamMetin
 * @param {{detay?:'kisa'|'orta'|'detayli', dolguTemizle?:boolean, baslik?:string, sure?:number, tarih?:string}} secenekler
 */
export function notCikar(hamMetin = '', secenekler = {}) {
  const { dolguTemizle = true } = secenekler;

  const temiz = metniTemizle(hamMetin, { dolgu: dolguTemizle });
  const cumleler = cumleleriAyir(temiz);
  const bicimli = cumleler.map(cumleyiBicimle).filter(Boolean);
  const siniflar = bicimli.map(cumleyiSiniflandir);

  return taslakKur(siniflar, secenekler);
}

export { metniTemizle } from './temizle.js';
export { cumleleriAyir, yuklemMi } from './cumle.js';
export { cumleyiBicimle, soruMu } from './noktalama.js';
export { cumleyiSiniflandir, tanimCikar, baslikCikar } from './siniflandir.js';
export { taslakKur } from './taslak.js';
export { anahtarKavramlar, govdele } from './anahtar.js';
export { markdownYaz, duzMetinYaz, tarihYaz, sureYaz } from './bicim.js';
