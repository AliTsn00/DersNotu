// Cümle rolü sınıflandırma: her cümlenin nota nasıl gireceğini belirler.

import { trKucuk, kelimelere, kelimeSadele, basHarfiBuyut, baslikBicimle } from './harf.js';
import {
  IPUCU_KALIPLARI,
  TANIM_BELIRTECLERI,
  GEREKSIZ_KALIPLAR,
  CUMLE_BASI_BAGLAC,
  BASLIK_GURULTUSU,
  KONU_ADLARI,
  SIRA_SIFATLARI,
} from './sozluk.js';
import { soruMu } from './noktalama.js';

const derlenmis = Object.fromEntries(
  Object.entries(IPUCU_KALIPLARI).map(([tur, kaliplar]) => [
    tur,
    kaliplar.map((k) => new RegExp(k, 'u')),
  ]),
);

const eslesir = (tur, sade) => derlenmis[tur].some((kalip) => kalip.test(sade));

// Fiilimsi (isim-fiil / sıfat-fiil) ekleri. "üretmesine" gibi bir kelime
// terim olamaz; böyle bir durumda terim cümlenin başındadır.
const FIILIMSI = /(ması|mesi|masına|mesine|masını|mesini|maya|meye|mak|mek|makla|mekle|dığı|diği|duğu|düğü|dığına|diğine|dığını|diğini|ması|iş|uş)$/;
const fiilimsiMi = (kelime = '') => {
  const sade = kelimeSadele(kelime);
  return sade.length >= 5 && FIILIMSI.test(sade);
};

// "...besin üretmesine denir" açıklaması tek başına kaldığında yönelme eki
// havada kalır; bildirme kipine çevirip "...besin üretmesidir" yaparız.
const YONELME_DUZELTME = [
  [/mesine$/u, 'mesidir'], [/masına$/u, 'masıdır'],
  [/sine$/u, 'sidir'], [/sına$/u, 'sıdır'],
  [/ine$/u, 'idir'], [/ına$/u, 'ıdır'],
  [/una$/u, 'udur'], [/üne$/u, 'üdür'],
];

function yonelmeyiBildirmeYap(aciklama = '') {
  const kelimeler = aciklama.split(/\s+/);
  const son = kelimeler[kelimeler.length - 1];
  if (!son || son.length < 5) return aciklama;
  for (const [kalip, yerine] of YONELME_DUZELTME) {
    if (kalip.test(son)) {
      kelimeler[kelimeler.length - 1] = son.replace(kalip, yerine);
      return kelimeler.join(' ');
    }
  }
  return aciklama;
}

/**
 * Başlık cümlesinden gerçek konu adını çıkarır.
 * "Günaydın, bugün fotosentez konusunu işleyeceğiz." → "Fotosentez"
 */
export function baslikCikar(cumle = '') {
  const kelimeler = String(cumle).replace(/[.!?…]+$/, '').split(/\s+/).filter(Boolean);
  const kalan = [];

  for (let i = 0; i < kelimeler.length; i += 1) {
    const sade = kelimeSadele(kelimeler[i]);
    if (!sade) continue;
    if (BASLIK_GURULTUSU.has(sade)) continue;
    // "Birinci konu" gibi kalıplarda sıra sıfatını da at; "1. Dünya Savaşı"nda tut.
    if (SIRA_SIFATLARI.has(sade) && KONU_ADLARI.has(kelimeSadele(kelimeler[i + 1] || ''))) {
      continue;
    }
    kalan.push(kelimeler[i].replace(/^[,;:"']+|[,;:"']+$/g, ''));
  }

  if (!kalan.length || kalan.length > 6) return null;
  return baslikBicimle(kalan.join(' '));
}

/**
 * Tanım cümlesinden { terim, aciklama } çıkarır; tanım değilse null.
 */
export function tanimCikar(cumle = '') {
  const sade = trKucuk(cumle).replace(/[.!?…]+$/, '');

  for (const { kalip, terimSonda } of TANIM_BELIRTECLERI) {
    const yer = sade.indexOf(kalip);
    if (yer === -1) continue;

    const oncesiHam = cumle.slice(0, yer).trim().replace(/[,;:]+$/, '');
    const oncesi = oncesiHam.split(/\s+/).filter(Boolean);
    if (!oncesi.length) continue;

    let terim;
    let aciklama;

    if (terimSonda && !fiilimsiMi(oncesi[oncesi.length - 1])) {
      // "... besin üretmesine fotosentez denir" → terim belirtecin hemen öncesi.
      // Özel ad tamlaması ("Newton yasası denir") için iki kelime alınır.
      const oncekiKelime = oncesi[oncesi.length - 2];
      const ozelAdVar = oncesi.length > 2 && /^\p{Lu}/u.test(oncekiKelime || '');
      const terimUzunlugu = ozelAdVar ? 2 : 1;
      terim = oncesi.slice(-terimUzunlugu).join(' ');
      aciklama = oncesi.slice(0, -terimUzunlugu).join(' ');
    } else {
      // "Fotosentez, bitkilerin ... demektir" → terim virgüle kadar
      const virgul = oncesiHam.indexOf(',');
      if (virgul > 0) {
        terim = oncesiHam.slice(0, virgul).trim();
        aciklama = oncesiHam.slice(virgul + 1).trim();
      } else {
        // Virgül yoksa terim tek kelimedir; ikinci kelime de özel adsa
        // ("Newton Yasası bir denklemdir") iki kelime alınır.
        const ikinci = oncesi[1] || '';
        const terimUzunlugu = oncesi.length > 2 && /^\p{Lu}/u.test(ikinci) ? 2 : 1;
        terim = oncesi.slice(0, terimUzunlugu).join(' ');
        aciklama = oncesi.slice(terimUzunlugu).join(' ');
      }
    }

    terim = terim.replace(/^[\s,;:"'-]+|[\s,;:"'-]+$/g, '');
    aciklama = aciklama
      .replace(/^[\s,;:"'-]+|[\s,;:"'-]+$/g, '')
      // "Kloroplast demek ... demektir" → baştaki "demek" artığını at
      .replace(/^(demek|dediğimiz|denilen|denen|yani)\s+/iu, '');

    // Terim, cümle başı bağlacından ibaretse tanım sayma.
    if (!terim || CUMLE_BASI_BAGLAC.includes(trKucuk(terim))) continue;
    if (terim.split(/\s+/).length > 4) continue;
    if (!aciklama || aciklama.split(/\s+/).length < 2) continue;
    if (terimSonda) aciklama = yonelmeyiBildirmeYap(aciklama);

    return { terim: basHarfiBuyut(terim), aciklama: basHarfiBuyut(aciklama) };
  }

  return null;
}

/** Sınıf yönetimi / ders dışı konuşma mı? */
export function gereksizMi(cumle = '') {
  const sade = trKucuk(cumle);
  const kelimeSayisi = kelimelere(cumle).length;
  if (kelimeSayisi === 0) return true;
  if (GEREKSIZ_KALIPLAR.some((kalip) => sade.includes(kalip))) return true;
  // İçerik taşımayan çok kısa artıklar
  if (kelimeSayisi <= 2 && !/[=%\d]/.test(cumle)) return true;
  return false;
}

/**
 * Bir cümleyi sınıflandırır.
 * @returns {{tur: string, metin: string, tanim?: {terim,aciklama}, baslik?: string}}
 */
export function cumleyiSiniflandir(cumle = '') {
  const metin = String(cumle).trim();
  const sade = trKucuk(metin).replace(/[.!?…]+$/, '');
  if (!kelimelere(metin).length) return { tur: 'gereksiz', metin };

  // Önce güçlü içerik ipuçları: "Günaydın, bugün fotosentezi işleyeceğiz."
  // cümlesi selamlama içerse de bir başlıktır.
  const tanim = tanimCikar(metin);
  if (tanim) return { tur: 'tanim', metin, tanim };

  if (eslesir('baslik', sade)) {
    const baslik = baslikCikar(metin);
    if (baslik) return { tur: 'baslik', metin, baslik };
  }

  if (eslesir('onemli', sade)) return { tur: 'onemli', metin };
  if (eslesir('ornek', sade)) return { tur: 'ornek', metin };
  if (eslesir('ozet', sade)) return { tur: 'ozet', metin };
  if (eslesir('madde', sade)) return { tur: 'madde', metin };
  if (eslesir('listeBasi', sade)) return { tur: 'listeBasi', metin };
  if (/[=]|\bformül\b|\bdenklem\b/.test(sade)) return { tur: 'formul', metin };

  if (gereksizMi(metin)) return { tur: 'gereksiz', metin };
  if (soruMu(metin)) return { tur: 'soru', metin };

  return { tur: 'bilgi', metin };
}
