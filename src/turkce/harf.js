// Türkçe'ye özgü büyük/küçük harf dönüşümleri.
// JavaScript'in varsayılan toLowerCase/toUpperCase metotları "I/ı" ve "i/İ"
// çiftini yanlış eşler; bütün metin işleme adımları bu yardımcıları kullanır.

const KUCUK_ESLESME = { İ: 'i', I: 'ı', Ş: 'ş', Ğ: 'ğ', Ü: 'ü', Ö: 'ö', Ç: 'ç' };
const BUYUK_ESLESME = { i: 'İ', ı: 'I', ş: 'Ş', ğ: 'Ğ', ü: 'Ü', ö: 'Ö', ç: 'Ç' };

export function trKucuk(metin = '') {
  return String(metin).replace(/[İIŞĞÜÖÇ]/g, (h) => KUCUK_ESLESME[h]).toLowerCase();
}

export function trBuyuk(metin = '') {
  return String(metin).replace(/[iışğüöç]/g, (h) => BUYUK_ESLESME[h]).toUpperCase();
}

/** Cümlenin ilk harfini Türkçe kurallarına göre büyütür. */
export function basHarfiBuyut(metin = '') {
  const s = String(metin);
  if (!s) return s;
  const i = s.search(/\p{L}/u);
  if (i === -1) return s;
  return s.slice(0, i) + trBuyuk(s[i]) + s.slice(i + 1);
}

/** Başlıklar için: her kelimenin ilk harfini büyütür, kısa bağlaçları küçük bırakır. */
const BAGLAC = new Set(['ve', 'ile', 'ya', 'veya', 'de', 'da', 'ki', 'ama', 'için']);
export function baslikBicimle(metin = '') {
  return String(metin)
    .split(/\s+/)
    .filter(Boolean)
    .map((k, i) => (i > 0 && BAGLAC.has(trKucuk(k)) ? trKucuk(k) : basHarfiBuyut(k)))
    .join(' ');
}

/** Noktalama ve boşluklardan arındırılmış, küçük harfli kelime. */
export function kelimeSadele(kelime = '') {
  return trKucuk(kelime).replace(/^[^\p{L}\p{N}%]+|[^\p{L}\p{N}%]+$/gu, '');
}

/** Metni sade kelime dizisine çevirir (boş öğeler atılır). */
export function kelimelere(metin = '') {
  return String(metin).split(/\s+/).map(kelimeSadele).filter(Boolean);
}
