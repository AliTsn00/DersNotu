// Konuşma tanımanın yanlış duyduğu ya da yanlış yazdığı sözleri düzeltir.
//
// İki ayrı sorun var, ikisi de burada ele alınıyor:
//
//   1. İmlâ. Tanıma motoru "kuranı kerim" yazar; doğrusu "Kur'ân-ı Kerîm"dir.
//      Aynı sözün yanlış yazımıdır — düzeltmek bilgi eklemek değildir, bu yüzden
//      yerleşik listeyle güvenle yapılır.
//
//   2. İşitme. Motor bambaşka bir kelime duyar: "Ada olan" ← "Allah'a olan".
//      Bunlar öngörülemez ve dersten derse değişir; uydurma bir liste yarardan
//      çok zarar getirir. Bu yüzden kullanıcının kendi sözlüğüne bırakılır.
//
// Sözlük iki yerde birden işe yarar: tanıma öncesi Whisper'a ipucu olarak
// gider (kelimeyi baştan doğru duymasını sağlar), tanıma sonrası da metne
// uygulanır. Düzeltilen her şey sayılır ve kullanıcıya bildirilir — sessizce
// metin değiştiren bir katman güvenilmez olurdu.
//
// ⚠️ Arapça metne dokunulmaz. Buradaki hiçbir kural Arap harfi içeren bir
// diziyi değiştirmez; âyet ve hadîs metinleri konuşma tanımadan geldiği gibi
// kalır.

const ARAP_HARFI = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/u;

/**
 * Yerleşik imlâ düzeltmeleri. Yalnızca aynı sözün yanlış yazımları; anlamı
 * değiştiren, kelime ekleyen ya da bağlam gerektiren hiçbir kural yok.
 */
const IMLA = [
  [/\bkur'?an[ıi]\s+kerim\b/giu, "Kur'ân-ı Kerîm"],
  [/\bkur'?an\b/giu, "Kur'ân"],
  [/\bayet[ıi]\s+kerime\b/giu, 'âyet-i kerîme'],
  [/\bhadis[ıi]\s+şerif\b/giu, 'hadîs-i şerîf'],
  [/\bsallallahu\s+aleyhi\s+ve\s*sellem\b/giu, 'sallallâhu aleyhi ve sellem'],
  [/\bradıyallahu\s+anh(a|um)?\b/giu, (t, ek) => `radıyallâhu anh${ek || ''}`],
  [/\baleyhis\s*selam\b/giu, 'aleyhisselâm'],
  [/\bsubhanallah\b/giu, 'sübhânallah'],
  [/\belhamdulillah\b/giu, 'elhamdülillâh'],
  [/\bin\s*şallah\b/giu, 'inşâallah'],
  [/\bmaşallah\b/giu, 'mâşâallah'],
  [/\bestağfurullah\b/giu, 'estağfurullah'],
  [/\bbuhari\b/giu, 'Buhârî'],
  [/\bmuslim\b/giu, 'Müslim'],
  [/\btirmizi\b/giu, 'Tirmizî'],
  [/\bnesai\b/giu, 'Nesâî'],
  [/\bibn[ıi]\s+mace\b/giu, 'İbn Mâce'],
  [/\bebu\s+davud\b/giu, 'Ebû Dâvûd'],
  [/\bgazali\b/giu, 'Gazâlî'],
  [/\bhanefi\b/giu, 'Hanefî'],
  [/\bşafii\b/giu, 'Şâfiî'],
  [/\bmaliki\b/giu, 'Mâlikî'],
  [/\bhanbeli\b/giu, 'Hanbelî'],
];

/**
 * Kullanıcı sözlüğünü ayrıştırır.
 *
 * Her satır iki biçimden biridir:
 *   Tirmizî                 → yalnızca ipucu; tanıma motoruna terim olarak gider
 *   ada olan = Allah'a olan → hem ipucu hem düzeltme kuralı
 *
 * @returns {{terimler: string[], kurallar: Array<{yanlis:string, dogru:string}>}}
 */
export function sozlukAyristir(ham) {
  const terimler = [];
  const kurallar = [];

  for (const satir of String(ham || '').split(/\r?\n/)) {
    const temiz = satir.trim();
    if (!temiz || temiz.startsWith('#')) continue;

    const ayrac = temiz.indexOf('=');
    if (ayrac === -1) {
      terimler.push(temiz);
      continue;
    }

    const yanlis = temiz.slice(0, ayrac).trim();
    const dogru = temiz.slice(ayrac + 1).trim();
    // Tek yanı boş bir kural metni sessizce silerdi.
    if (!yanlis || !dogru) continue;
    kurallar.push({ yanlis, dogru });
    terimler.push(dogru);
  }

  return { terimler, kurallar };
}

/** Düzenli ifade özel karakterlerini etkisizleştirir. */
function kacir(metin) {
  return metin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whisper'a verilecek ipucu metnini kurar.
 *
 * Bu alan bir talimat değil, stil örneğidir: beklenen terimleri içeren kısa bir
 * metin tanımayı iyileştirir. Sınır ~224 token olduğu için uzunluk kırpılır —
 * aşılırsa servis ipucunun tamamını yok sayabiliyor.
 */
export function ipucuMetni(temelIpucu, sozlukHam, enFazlaKarakter = 850) {
  const { terimler } = sozlukAyristir(sozlukHam);
  if (!terimler.length) return temelIpucu;

  let sonuc = temelIpucu;
  for (const terim of terimler) {
    const aday = `${sonuc} ${terim},`;
    if (aday.length > enFazlaKarakter) break;
    sonuc = aday;
  }
  return sonuc.replace(/,$/, '.');
}

/**
 * Metindeki bilinen yazım ve işitme hatalarını düzeltir.
 *
 * @param {string} metin
 * @param {string} [sozlukHam] kullanıcının kendi sözlüğü
 * @returns {{metin: string, duzeltmeler: Array<{yanlis:string, dogru:string, adet:number}>}}
 */
export function isitmeyiDuzelt(metin, sozlukHam = '') {
  const duzeltmeler = [];
  let sonuc = String(metin || '');
  if (!sonuc) return { metin: sonuc, duzeltmeler };

  const uygula = (kalip, yerine, etiket) => {
    let adet = 0;
    const yeni = sonuc.replace(kalip, (...bagimsizlar) => {
      const tam = bagimsizlar[0];
      // Arap harfi taşıyan hiçbir dizi değiştirilmez.
      if (ARAP_HARFI.test(tam)) return tam;
      adet += 1;
      return typeof yerine === 'function' ? yerine(...bagimsizlar) : yerine;
    });
    if (adet) {
      sonuc = yeni;
      duzeltmeler.push({ yanlis: etiket, dogru: typeof yerine === 'function' ? '—' : yerine, adet });
    }
  };

  // Kullanıcı kuralları önce: kendi dersinin terimleri yerleşik listeyi ezsin.
  const { kurallar } = sozlukAyristir(sozlukHam);
  for (const { yanlis, dogru } of kurallar) {
    uygula(new RegExp(`(?<![\\p{L}])${kacir(yanlis)}(?![\\p{L}])`, 'giu'), dogru, yanlis);
  }

  for (const [kalip, yerine] of IMLA) {
    uygula(kalip, yerine, kalip.source);
  }

  return { metin: sonuc, duzeltmeler };
}

/** Düzeltmeleri tek satırlık okunur bir özete çevirir. */
export function duzeltmeOzeti(duzeltmeler) {
  const toplam = duzeltmeler.reduce((say, kayit) => say + kayit.adet, 0);
  if (!toplam) return '';
  const ornekler = duzeltmeler
    .filter((kayit) => kayit.dogru !== '—')
    .slice(0, 3)
    .map((kayit) => kayit.dogru);
  return ornekler.length
    ? `${toplam} yazım düzeltildi (${ornekler.join(', ')}…).`
    : `${toplam} yazım düzeltildi.`;
}
