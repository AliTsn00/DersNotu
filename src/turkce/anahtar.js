// Anahtar kavram çıkarımı: hafif bir Türkçe gövdeleyici (stemmer) ile
// çekim eklerini atıp kelime sıklığı hesaplar.

import { trKucuk, kelimeSadele, basHarfiBuyut } from './harf.js';
import { ETKISIZ_KELIMELER, DOLGU_SOZCUKLER } from './sozluk.js';

// Uzundan kısaya sıralı çekim ekleri.
const CEKIM_EKLERI = [
  'larından', 'lerinden', 'larının', 'lerinin', 'larında', 'lerinde',
  'larıyla', 'leriyle', 'lardan', 'lerden', 'ların', 'lerin', 'larda',
  'lerde', 'ları', 'leri', 'lar', 'ler',
  'ından', 'inden', 'undan', 'ünden', 'ında', 'inde', 'unda', 'ünde',
  'daki', 'deki', 'taki', 'teki', 'dan', 'den', 'tan', 'ten',
  'nın', 'nin', 'nun', 'nün', 'yla', 'yle',
  'da', 'de', 'ta', 'te', 'ın', 'in', 'un', 'ün', 'ya', 'ye', 'na', 'ne',
  'sı', 'si', 'su', 'sü', 'yı', 'yi', 'yu', 'yü', 'la', 'le',
  'ı', 'i', 'u', 'ü', 'a', 'e',
];

const EN_AZ_GOVDE = 4;
// Tek harflik ekler ("bitki" → "bitk") aşırı kırpmaya yol açtığı için
// daha uzun bir gövde şartı ararlar.
const TEK_HARF_ICIN_EN_AZ_GOVDE = 5;

/** Kelimeden çekim eklerini kırpar (en fazla iki tur). */
export function govdele(kelime = '') {
  let govde = trKucuk(kelime);
  for (let tur = 0; tur < 2; tur += 1) {
    const ek = CEKIM_EKLERI.find((e) => {
      if (!govde.endsWith(e)) return false;
      const kalan = govde.length - e.length;
      return kalan >= (e.length === 1 ? TEK_HARF_ICIN_EN_AZ_GOVDE : EN_AZ_GOVDE);
    });
    if (!ek) break;
    govde = govde.slice(0, -ek.length);
  }
  return govde;
}

/**
 * Metindeki anahtar kavramları sıklığa göre döner.
 * @param {string[]} cumleler
 * @param {{adet?: number, agirlikli?: string[]}} secenekler
 *   agirlikli: başlık/tanım gibi öne çıkan yerlerden gelen kelimeler
 */
export function anahtarKavramlar(cumleler = [], secenekler = {}) {
  const { adet = 12, agirlikli = [] } = secenekler;
  const sayac = new Map();

  const ekle = (metin, agirlik) => {
    for (const ham of String(metin).split(/\s+/)) {
      const sade = kelimeSadele(ham);
      if (!sade || sade.length < 4) continue;
      if (/^\d+$/.test(sade)) continue;
      if (ETKISIZ_KELIMELER.has(sade) || DOLGU_SOZCUKLER.has(sade)) continue;

      const govde = govdele(sade);
      if (govde.length < EN_AZ_GOVDE) continue;
      if (ETKISIZ_KELIMELER.has(govde)) continue;

      const kayit = sayac.get(govde) || { sayi: 0, bicimler: new Map() };
      kayit.sayi += agirlik;
      kayit.bicimler.set(sade, (kayit.bicimler.get(sade) || 0) + 1);
      sayac.set(govde, kayit);
    }
  };

  for (const cumle of cumleler) ekle(cumle, 1);
  for (const vurgulu of agirlikli) ekle(vurgulu, 3);

  return [...sayac.entries()]
    .map(([govde, kayit]) => {
      const [enSikBicim] = [...kayit.bicimler.entries()].sort((a, b) => b[1] - a[1])[0];
      return { kelime: basHarfiBuyut(enSikBicim), govde, sayi: kayit.sayi };
    })
    .filter((k) => k.sayi > 1)
    .sort((a, b) => b.sayi - a.sayi || a.kelime.localeCompare(b.kelime, 'tr'))
    .slice(0, adet);
}
