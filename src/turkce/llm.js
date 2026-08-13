// Yapay zekâ ile not çıkarmanın tarayıcıdan bağımsız ortak katmanı.
//
// Hem masaüstündeki `/ders-notu` skill'i (Node) hem uygulamanın içindeki
// akıllı not düğmesi (tarayıcı) bu modülü kullanır. Böylece Arapça koruma,
// doğrulama ve not tamamlama mantığı tek yerde durur.
//
//   hazirlikYap()   ham metin → modele verilecek cümle listesi + korunan Arapça
//   notuDenetle()   modelin döndürdüğü taslakta Arapça sızıntısı var mı
//   notuTamamla()   taslağı uygulamanın not yapısına dönüştürür

import { metniTemizle } from './temizle.js';
import { cumleleriAyir } from './cumle.js';
import { cumleyiBicimle } from './noktalama.js';
import { cumleyiSiniflandir } from './siniflandir.js';
import { alintilariIsaretle, cevrimyaziMi } from './islami.js';
import { notCikar } from './index.js';
import { numaralandir, ALINTI_TURLERI } from './taslak.js';
import { ekleriTazele } from './duzenle.js';

// Arapça harf blokları: temel, ek, sunum biçimleri ve harekeler.
const ARAPCA_BLOK =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+(?:[\sً-ٰٟ]+[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+)*/gu;
const ARAP_HARFI = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/u;
const YER_TUTUCU = /⟦(AR:\d+)⟧/gu;

/** Metindeki Arapça parçaları yer tutucuyla değiştirir. */
function arapcayiCikar(metin, sayac, kova) {
  return metin.replace(ARAPCA_BLOK, (parca) => {
    const anahtar = `AR:${sayac.deger++}`;
    kova[anahtar] = parca.trim();
    return `⟦${anahtar}⟧`;
  });
}

/**
 * Ham konuşma metnini modele verilecek hâle getirir.
 *
 * Arapça parçalar metinden çıkarılır: model onları hiç görmediği için
 * düzeltemez, tamamlayamaz, ezberden değiştiremez.
 */
export function hazirlikYap(hamMetin, secenekler = {}) {
  const { detay = 'detayli' } = secenekler;

  // Kural motorunun kendi notu: hem çevrimdışı yedek hem çapraz doğrulama ölçütü.
  const yerel = notCikar(hamMetin, { detay });

  const temiz = metniTemizle(hamMetin, { dolgu: true });
  const bicimli = cumleleriAyir(temiz).map(cumleyiBicimle).filter(Boolean);
  const siniflar = alintilariIsaretle(bicimli.map(cumleyiSiniflandir));

  const sayac = { deger: 0 };
  const arapca = {};
  const cumleler = siniflar.map((sinif, i) => {
    const oncesi = sinif.metin;
    const metin = arapcayiCikar(oncesi, sayac, arapca);
    const arapcaIcerir = metin !== oncesi;

    // Latin harfleriyle yazılmış Arapça (çevriyazı) yer tutucuya alınmaz —
    // alınırsa cümle tamamen kaybolur ve bağlam kopar. Bunun yerine harfiyen
    // korunması istenir. Kural motorunun çevriyazı sezgisi eksik olduğu için
    // alıntı sayılan her cümle de korumaya alınır.
    const korunacak = !arapcaIcerir && (cevrimyaziMi(oncesi) || ALINTI_TURLERI.has(sinif.tur));

    return {
      i,
      metin,
      ipucu: sinif.tur,
      ...(sinif.kaynak ? { kunye: sinif.kaynak } : {}),
      ...(korunacak ? { korunacak: true } : {}),
      ...(arapcaIcerir ? { arapcaIcerir: true } : {}),
    };
  });

  return {
    istatistik: {
      cumle: cumleler.length,
      kelime: yerel.istatistik.kelime,
      arapcaParca: Object.keys(arapca).length,
      korunacakCumle: cumleler.filter((c) => c.korunacak).length,
    },
    yerelOlcut: {
      baslik: yerel.baslik,
      bolum: yerel.bolumler.length,
      ayet: yerel.ayetler.length,
      hadis: yerel.hadisler.length,
      dua: yerel.dualar.length,
      gorus: yerel.gorusler.length,
      tanim: yerel.tanimlar.length,
    },
    yerelNot: yerel,
    arapca,
    cumleler,
  };
}

/** Not ağacındaki her maddeyi (alt maddeler dahil) dolaşır. */
function* maddeleriGez(not) {
  for (const bolum of not.bolumler || []) {
    for (const grup of bolum.gruplar || []) {
      for (const madde of grup.maddeler || []) {
        yield madde;
        for (const alt of madde.alt || []) yield alt;
      }
    }
  }
}

/** Notun tüm serbest metin alanlarını toplar. */
function tumMetinler(not) {
  const metinler = [];
  for (const madde of maddeleriGez(not)) {
    if (madde.metin) metinler.push({ yer: `madde ${madde.id || '?'}`, metin: madde.metin });
  }
  for (const bolum of not.bolumler || []) {
    if (bolum.baslik) metinler.push({ yer: 'bölüm başlığı', metin: bolum.baslik });
    for (const grup of bolum.gruplar || []) {
      if (grup.baslik) metinler.push({ yer: 'grup başlığı', metin: grup.baslik });
    }
  }
  for (const alan of ['ozet', 'sorular']) {
    for (const satir of not[alan] || []) metinler.push({ yer: alan, metin: satir });
  }
  if (not.baslik) metinler.push({ yer: 'not başlığı', metin: not.baslik });
  return metinler;
}

/**
 * Modelin Arapça metne dokunmadığını denetler.
 * @returns {{hatalar: string[], dusen: string[]}}
 */
export function notuDenetle(not, arapca = {}) {
  const hatalar = [];
  const tanimli = new Set(Object.keys(arapca));
  const kullanilan = new Set();

  for (const { yer, metin } of tumMetinler(not)) {
    const yerTutucusuz = String(metin).replace(YER_TUTUCU, '');
    if (ARAP_HARFI.test(yerTutucusuz)) {
      hatalar.push(
        `${yer}: yer tutucu yerine ham Arapça metin var — model alıntıya dokunmuş.`,
      );
    }
    for (const esles of String(metin).matchAll(YER_TUTUCU)) {
      kullanilan.add(esles[1]);
      if (!tanimli.has(esles[1])) {
        hatalar.push(`${yer}: tanımsız yer tutucu ⟦${esles[1]}⟧ — model uydurmuş.`);
      }
    }
  }

  return { hatalar, dusen: [...tanimli].filter((a) => !kullanilan.has(a)) };
}

/** Yer tutucuları orijinal Arapça metinlerle değiştirir. */
function arapcayiGeriKoy(not, arapca) {
  const coz = (metin) =>
    String(metin).replace(YER_TUTUCU, (tam, anahtar) => arapca[anahtar] ?? tam);

  for (const madde of maddeleriGez(not)) if (madde.metin) madde.metin = coz(madde.metin);
  for (const bolum of not.bolumler || []) {
    if (bolum.baslik) bolum.baslik = coz(bolum.baslik);
    for (const grup of bolum.gruplar || []) if (grup.baslik) grup.baslik = coz(grup.baslik);
  }
  for (const alan of ['ozet', 'sorular']) {
    if (Array.isArray(not[alan])) not[alan] = not[alan].map(coz);
  }
  if (not.baslik) not.baslik = coz(not.baslik);
  return not;
}

/** Kural motorunun bulduklarıyla karşılaştırıp sessiz kayıpları bildirir. */
export function caprazDogrula(not, olcut = {}) {
  const uyarilar = [];
  const kiyas = [
    ['âyet', not.ayetler.length, olcut.ayet],
    ['hadîs', not.hadisler.length, olcut.hadis],
    ['duâ', not.dualar.length, olcut.dua],
  ];
  for (const [ad, bizim, yerel] of kiyas) {
    if (yerel > 0 && bizim < yerel) {
      uyarilar.push(`${ad}: kural motoru ${yerel} buldu, notta ${bizim} var.`);
    }
  }
  return uyarilar;
}

/**
 * Modelin döndürdüğü taslağı uygulamanın not yapısına dönüştürür:
 * eksik alanları doldurur, Arapça'yı yerine koyar, numaralandırır ve
 * dizinleri (tanımlar, âyetler, hadîsler…) madde ağacından türetir.
 */
export function notuTamamla(taslak, hazirlik, secenekler = {}) {
  const maddeler = [...maddeleriGez(taslak)];

  let not = {
    baslik: taslak.baslik || hazirlik.yerelOlcut.baslik || 'Ders Notu',
    tarih: secenekler.tarih || new Date().toISOString(),
    sure: secenekler.sure || 0,
    // İşlenen son cümlenin sırası. Modelin atladığı cümlelere göre değil,
    // hazırlıktaki cümle sayısına göre belirlenir: aksi hâlde canlı
    // birleştirme (yeniMaddeleriKat) atlanan cümleleri "yeni" sanıp
    // ham hâlleriyle notun sonuna ekler.
    sonKaynak: hazirlik.istatistik.cumle - 1,
    istatistik: {
      cumle: hazirlik.istatistik.cumle,
      kelime: hazirlik.istatistik.kelime,
      madde: maddeler.length,
    },
    bolumler: taslak.bolumler || [],
    tanimlar: [],
    onemliler: [],
    sorular: taslak.sorular || [],
    ozet: taslak.ozet || [],
    ayetler: [],
    hadisler: [],
    dualar: [],
    gorusler: [],
    anahtarlar: taslak.anahtarlar || [],
    atlanan: [],
    elleDuzenlendi: false,
    // Notun nereden geldiği; arayüzde rozet olarak gösterilir.
    uretim: 'yapayZeka',
  };

  not = arapcayiGeriKoy(not, hazirlik.arapca);
  numaralandir(not.bolumler);
  not = ekleriTazele(not);
  not.elleDuzenlendi = false;
  not.uretim = 'yapayZeka';
  return not;
}
