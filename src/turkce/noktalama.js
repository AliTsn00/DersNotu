// Noktalama onarımı: konuşma tanıma çıktısı noktalamasız gelir.
// Soru cümlelerini ayırt eder, cümle sonu işaretini ve baş harfi düzeltir.

import { basHarfiBuyut, kelimeSadele, kelimelere } from './harf.js';
import { SORU_KELIMELERI, SORU_EKI, CUMLE_BASI_BAGLAC } from './sozluk.js';
import { arapcaMi, ozelAdlariBuyut } from './islami.js';

/** Soru kelimesini soru olmaktan çıkaran yapılar (yan cümle belirteçleri). */
const SORUYU_BOZAN = new Set([
  'gibi', 'olduğu', 'olduğunu', 'olduğunda', 'olduğundan', 'olduğumuzu',
  'ettiğini', 'yaptığını', 'bilir', 'biliyoruz', 'gördük', 'anlattık',
  'anlatacağım', 'göreceğiz', 'inceleyeceğiz', 'öğrendik',
]);

/** Cümle soru mu? */
export function soruMu(cumle = '') {
  if (/\?\s*$/.test(cumle)) return true;
  const kelimeler = kelimelere(cumle);
  if (!kelimeler.length) return false;

  const son = kelimeler.slice(-4);
  if (son.some((k) => SORU_EKI.test(k))) return true;

  const soruKelimesiVar = kelimeler.some((k) => SORU_KELIMELERI.has(k));
  if (!soruKelimesiVar) return false;
  if (kelimeler.length > 10) return false;
  if (kelimeler.some((k) => SORUYU_BOZAN.has(k))) return false;
  return true;
}

/** Cümle başındaki geçiş bağlacından sonra virgül koyar. */
function baglacVirgulu(cumle) {
  const kelimeler = cumle.split(/\s+/);
  for (const uzunluk of [3, 2, 1]) {
    const oberk = kelimeler.slice(0, uzunluk).map(kelimeSadele).join(' ');
    if (!CUMLE_BASI_BAGLAC.includes(oberk)) continue;
    if (uzunluk >= kelimeler.length) return cumle;
    if (/[,:]$/.test(kelimeler[uzunluk - 1])) return cumle;
    kelimeler[uzunluk - 1] += ',';
    return kelimeler.join(' ');
  }
  return cumle;
}

/**
 * Tek bir cümleyi biçimlendirir: baş harf, cümle sonu işareti, bağlaç virgülü.
 */
export function cumleyiBicimle(cumle = '') {
  let metin = String(cumle).trim().replace(/[\s,;:]+$/, '');
  if (!metin) return '';
  // Arapça ibareye Türkçe noktalama/baş harf kuralları uygulanmaz.
  if (arapcaMi(metin)) return metin;

  const soru = soruMu(metin);
  metin = metin.replace(/[.!?…]+$/, '');
  metin = baglacVirgulu(metin);
  // Konuşma tanıma "allah", "kuran" gibi özel adları küçük yazar.
  metin = ozelAdlariBuyut(metin);
  metin = basHarfiBuyut(metin);
  return metin + (soru ? '?' : '.');
}
