// Ham konuşma metnini (ASR çıktısı) temizler: dolgu sözcükleri, kekemelik
// tekrarları, hitaplar ve bozuk boşluklar.

import { trKucuk, kelimeSadele } from './harf.js';
import { DOLGU_SOZCUKLER, HITAP_KALIPLARI } from './sozluk.js';

/** Boşlukları ve noktalama etrafındaki hataları düzeltir. */
export function bosluklariDuzelt(metin = '') {
  return String(metin)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n *\n+ */g, '\n')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;:])(?=\S)/g, '$1 ')
    .replace(/([.!?])(?=\p{L})/gu, '$1 ')
    .trim();
}

/** "bu bu kitap" → "bu kitap"; ASR'nin ürettiği ardışık kelime tekrarlarını siler. */
export function tekrarlariSil(metin = '') {
  const kelimeler = String(metin).split(/(\s+)/);
  const cikti = [];
  let oncekiSade = null;
  for (const parca of kelimeler) {
    if (/^\s+$/.test(parca)) {
      if (cikti.length) cikti.push(parca);
      continue;
    }
    const sade = kelimeSadele(parca);
    if (sade && sade === oncekiSade && sade.length > 1) {
      if (cikti.length && /^\s+$/.test(cikti[cikti.length - 1])) cikti.pop();
      continue;
    }
    oncekiSade = sade;
    cikti.push(parca);
  }
  return cikti.join('').trim();
}

/** Dolgu sözcüklerini ve hitap kalıplarını temizler. */
export function dolgulariSil(metin = '') {
  // Önce tek kelimelik dolgular atılır; böylece hitaplar cümle başına gelir.
  let sonuc = String(metin)
    .split(/\s+/)
    .filter((kelime) => {
      const sade = kelimeSadele(kelime);
      if (!sade) return Boolean(kelime.trim());
      return !DOLGU_SOZCUKLER.has(sade);
    })
    .join(' ')
    .trim();

  for (const kalip of HITAP_KALIPLARI) {
    const kacis = kalip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Yalnızca cümle sınırına bitişik hitapları at; cümle ortasındakine dokunma.
    sonuc = sonuc.replace(new RegExp(`(^|[.!?,])\\s*${kacis}\\b[,\\s]*`, 'gi'), '$1 ');
    sonuc = sonuc.replace(new RegExp(`[,\\s]*\\b${kacis}\\s*(?=[.!?]|$)`, 'gi'), '');
  }

  return bosluklariDuzelt(sonuc);
}

/**
 * Tam temizlik hattı.
 * @param {string} metin ham konuşma metni
 * @param {{dolgu?: boolean}} secenekler dolgu=false ise dolgu temizliği atlanır
 */
export function metniTemizle(metin = '', secenekler = {}) {
  const { dolgu = true } = secenekler;
  // Satır sonları cümle sınırı taşır (her konuşma tanıma sonucu ayrı satır),
  // bu yüzden temizlik satır satır yapılır.
  return String(metin)
    .split('\n')
    .map((satir) => {
      let sonuc = bosluklariDuzelt(satir);
      sonuc = tekrarlariSil(sonuc);
      if (dolgu) sonuc = dolgulariSil(sonuc);
      return bosluklariDuzelt(sonuc);
    })
    .filter(Boolean)
    .join('\n');
}

/** İki cümlenin ne kadar benzediğini (Jaccard) döner — tekrar eleme için. */
export function benzerlik(a = '', b = '') {
  const kumeA = new Set(trKucuk(a).split(/\s+/).map(kelimeSadele).filter(Boolean));
  const kumeB = new Set(trKucuk(b).split(/\s+/).map(kelimeSadele).filter(Boolean));
  if (!kumeA.size || !kumeB.size) return 0;
  let kesisim = 0;
  for (const kelime of kumeA) if (kumeB.has(kelime)) kesisim += 1;
  return kesisim / (kumeA.size + kumeB.size - kesisim);
}
