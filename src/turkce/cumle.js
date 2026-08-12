// Cümle bölütleme.
//
// Konuşma tanıma çıktısında noktalama çoğu zaman yoktur ya da yanlıştır.
// Bu yüzden iki aşamalı çalışırız:
//   1) Varsa noktalamaya göre böl (kısaltma / ondalık / sıra sayısı korunarak)
//   2) Kalan uzun parçaları "yüklem + cümle başı bağlacı" desenine göre böl

import { kelimeSadele, trKucuk } from './harf.js';
import { arapcaMi } from './islami.js';
import {
  KISALTMALAR,
  CUMLE_BASI_BAGLAC,
  GUCLU_BAGLAC,
  YUKLEM_KELIMELER,
} from './sozluk.js';

const KORUMA = '\u0001'; // cümle sonu sayılmayacak noktaların geçici işareti

/** Yüklem eki taşıyan kelime kalıpları. */
const YUKLEM_EK_KALIPLARI = [
  /(dır|dir|dur|dür|tır|tir|tur|tür)$/,
  /(ıyor|iyor|uyor|üyor)(um|sun|uz|sunuz|lar)?$/,
  /(mış|miş|muş|müş)(tır|tir|tur|tür|tı|ti|tu|tü|ım|im|um|üm|sın|sin|ız|iz|uz|üz|sınız|siniz|lar|ler)?$/,
  /(dı|di|du|dü|tı|ti|tu|tü)(m|n|k|nız|niz|nuz|nüz|lar|ler)?$/,
  /(acak|ecek)(tır|tir|tı|ti|sın|sin|ız|iz|sınız|siniz|lar|ler|ım|im)?$/,
  /(malı|meli)(dır|dir|yız|yiz|sınız|siniz)?$/,
  /(abilir|ebilir)(iz|siniz|ler)?$/,
  /(maz|mez)$/,
  /(dık|dik|duk|dük)$/,
];

// Geniş zaman (-ır/-ir/-ar/-er) eki isimlerle karışır ("şehir", "kültür").
// Bu yüzden ayrı ve daha temkinli bir kural olarak uygulanır.
const GENIS_ZAMAN = /(ır|ir|ur|ür|ar|er)$/;
const GENIS_ZAMAN_ISTISNALARI = new Set([
  'kültür', 'kanser', 'defter', 'hüner', 'çember', 'zincir', 'hamur', 'çamur',
  'kömür', 'demir', 'şehir', 'nehir', 'zafer', 'asker', 'haber', 'sefer',
  'meyver', 'kariyer', 'karakter', 'sekter', 'liter', 'metre', 'santimetre',
]);

/** Yüklem ekiyle biten ama fiil olmayan sık kelimeler. */
const YUKLEM_ISTISNALARI = new Set([
  'şimdi', 'kendi', 'sanki', 'tabii', 'hangi', 'şöyle', 'böyle', 'değildi',
  'gündüz', 'deniz', 'temiz', 'beyaz', 'biraz', 'yalnız', 'sessiz', 'yıldız',
]);

/** Bir kelimenin cümle yüklemi olma ihtimali yüksek mi? */
export function yuklemMi(kelime = '') {
  const sade = kelimeSadele(kelime);
  if (!sade) return false;
  if (YUKLEM_KELIMELER.has(sade)) return true;
  if (sade.length < 4 || YUKLEM_ISTISNALARI.has(sade)) return false;
  if (YUKLEM_EK_KALIPLARI.some((kalip) => kalip.test(sade))) return true;

  if (sade.length >= 6 && !GENIS_ZAMAN_ISTISNALARI.has(sade) && GENIS_ZAMAN.test(sade)) {
    // Çoğul eki (-lar/-ler) geniş zamanla karışmasın.
    return !/(lar|ler)$/.test(sade);
  }
  return false;
}

/** Bölmeyi engelleyen, cümleyi sürdüren bağlaçlar. */
const DEVAM_BAGLAC = new Set([
  've', 'ki', 'çünkü', 'ile', 'veya', 'ise', 'ya', 'de', 'da', 'gibi',
  'için', 'kadar', 'ama', 'göre', 'yani',
]);

/**
 * Yüklemden hemen sonra geldiğinde yeni cümle başlattığı kabul edilen
 * işaret sözcükleri: "...gerçekleşir bu olay..." → iki cümle.
 */
const ISARET_BASLANGICI = new Set([
  'bu', 'şu', 'bunlar', 'şunlar', 'bunun', 'şunun', 'burada', 'böylece',
  'bunlardan', 'şunu', 'bunu',
]);

const SIRA_ADLARI = 'Dünya|Bölüm|Ünite|Sınıf|Madde|Yüzyıl|Derece|Aşama|Kanun|Kişi|Grup|Soru';

function noktalariKoru(metin) {
  let s = metin;
  s = s.replace(/\b(\p{L}\.){2,}/gu, (esles) => esles.replace(/\./g, KORUMA));
  s = s.replace(/(\d)\.(?=\d)/g, `$1${KORUMA}`);
  s = s.replace(
    new RegExp(`(\\d+)\\.(?=\\s+\\p{Ll}|\\s+(?:${SIRA_ADLARI}))`, 'gu'),
    `$1${KORUMA}`,
  );
  s = s.replace(/\b(\p{L}+)\./gu, (esles, kelime) =>
    KISALTMALAR.has(trKucuk(kelime)) ? `${kelime}${KORUMA}` : esles,
  );
  return s;
}

const korumayiAc = (metin) => metin.split(KORUMA).join('.');

/**
 * `i` konumunda cümle başı bağlacı var mı?
 * @returns {'guclu'|'zayif'|null} güçlü bağlaç yüklem aranmadan böler.
 */
function baglacTuru(kelimeler, i) {
  for (const uzunluk of [3, 2, 1]) {
    const oberk = kelimeler
      .slice(i, i + uzunluk)
      .map(kelimeSadele)
      .join(' ');
    if (!oberk) continue;
    if (GUCLU_BAGLAC.has(oberk)) return 'guclu';
    if (CUMLE_BASI_BAGLAC.includes(oberk)) return 'zayif';
  }
  return null;
}

/**
 * Noktalaması olmayan uzun bir parçayı yüklem + bağlaç desenine göre böler.
 */
function baglacaGoreBol(cumle, enAzKelime = 4, uzunlukEsigi = 14) {
  const kelimeler = cumle.split(/\s+/).filter(Boolean);
  if (kelimeler.length < enAzKelime * 2) return [cumle];

  const parcalar = [];
  let bas = 0;

  for (let i = 1; i < kelimeler.length; i += 1) {
    if (i - bas < enAzKelime) continue;
    if (kelimeler.length - i < 3) break;

    const oncekiSade = kelimeSadele(kelimeler[i - 1]);
    if (DEVAM_BAGLAC.has(oncekiSade)) continue;

    const tur = baglacTuru(kelimeler, i);
    const yuklem = yuklemMi(kelimeler[i - 1]);
    const sonrakiSade = kelimeSadele(kelimeler[i]);
    const cokUzadi =
      yuklem && i - bas >= uzunlukEsigi && !DEVAM_BAGLAC.has(sonrakiSade);
    const isaretBaslangici = yuklem && ISARET_BASLANGICI.has(sonrakiSade);

    // Güçlü bağlaç tek başına yeter; zayıf bağlaç için önce yüklem gerekir.
    if (tur !== 'guclu' && !(tur === 'zayif' && yuklem) && !cokUzadi && !isaretBaslangici) {
      continue;
    }

    parcalar.push(kelimeler.slice(bas, i).join(' '));
    bas = i;
  }

  parcalar.push(kelimeler.slice(bas).join(' '));
  return parcalar.filter((p) => p.trim());
}

/**
 * Metni cümlelere ayırır.
 * Satır sonları sert sınır kabul edilir (her ASR sonucu ayrı satırda gelir).
 */
export function cumleleriAyir(metin = '', secenekler = {}) {
  const { enAzKelime = 4, uzunlukEsigi = 14 } = secenekler;
  const cumleler = [];

  for (const satir of String(metin).split('\n')) {
    if (!satir.trim()) continue;
    const korunmus = noktalariKoru(satir);

    for (const ham of korunmus.split(/(?<=[.!?…])[\s]+/)) {
      const parca = korumayiAc(ham).trim();
      if (!parca) continue;
      const noktalamasiz = !/[.!?…]\s*$/.test(parca);
      // Arapça ibare tek parça kalır; Türkçe yüklem/bağlaç sezgisi orada geçersiz.
      const bolunecek =
        !arapcaMi(parca) &&
        (noktalamasiz || parca.split(/\s+/).length > uzunlukEsigi * 1.5);
      const altParcalar = bolunecek
        ? baglacaGoreBol(parca, enAzKelime, uzunlukEsigi)
        : [parca];
      for (const alt of altParcalar) {
        const temiz = alt.trim();
        if (temiz) cumleler.push(temiz);
      }
    }
  }

  return cumleler;
}
