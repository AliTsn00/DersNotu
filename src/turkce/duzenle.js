// Nota elle müdahale: madde düzenleme, silme, taşıma, tür değiştirme,
// başlık değiştirme ve canlı derste gelen yeni cümleleri katma.
//
// Bütün işlemler notun kopyası üzerinde çalışır ve yeni bir not döner;
// böylece React durumu güvenle güncellenebilir.

import { numaralandir } from './taslak.js';

const kopyala = (deger) =>
  typeof structuredClone === 'function'
    ? structuredClone(deger)
    : JSON.parse(JSON.stringify(deger));

/** Elle düzenlenebilir madde türleri (arayüzdeki seçim kutusu bunu kullanır). */
export const DUZENLENEBILIR_TURLER = [
  { id: 'bilgi', ad: 'Bilgi' },
  { id: 'madde', ad: 'Liste öğesi' },
  { id: 'listeBasi', ad: 'Liste başlığı' },
  { id: 'tanim', ad: 'Tanım' },
  { id: 'onemli', ad: 'Önemli' },
  { id: 'ornek', ad: 'Örnek' },
  { id: 'ayet', ad: 'Âyet' },
  { id: 'hadis', ad: 'Hadîs' },
  { id: 'dua', ad: 'Duâ' },
  { id: 'arapca', ad: 'Arapça ibare' },
  { id: 'gorus', ad: 'Görüş' },
  { id: 'meal', ad: 'Meâl' },
  { id: 'formul', ad: 'Formül' },
];

const yeniKimlik = () => `e${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

/** Nottaki tüm maddeleri (alt maddeler dahil) sırayla gezer. */
export function* maddeleriGez(not) {
  for (const bolum of not.bolumler) {
    for (const grup of bolum.gruplar) {
      for (let i = 0; i < grup.maddeler.length; i += 1) {
        const madde = grup.maddeler[i];
        yield { madde, dizi: grup.maddeler, indeks: i, grup, bolum, ustMadde: null };
        for (let j = 0; j < madde.alt.length; j += 1) {
          yield {
            madde: madde.alt[j],
            dizi: madde.alt,
            indeks: j,
            grup,
            bolum,
            ustMadde: madde,
          };
        }
      }
    }
  }
}

function maddeBul(not, id) {
  for (const konum of maddeleriGez(not)) {
    if (konum.madde.id === id) return konum;
  }
  return null;
}

/** "**Terim:** açıklama" biçimindeki tanım maddesini ayrıştırır. */
function tanimAyrıstir(metin = '') {
  const esles = String(metin).match(/^\*\*(.+?):?\*\*\s*(.*)$/su);
  if (!esles) return null;
  return { terim: esles[1].trim(), aciklama: esles[2].trim() };
}

/**
 * Maddelerden türeyen ek bölümleri (tanımlar, âyetler, hadîsler…) yeniden kurar.
 * Özet, sorular ve anahtar kavramlar maddelere bağlı olmadığı için korunur.
 */
export function ekleriTazele(not) {
  const tanimlar = [];
  const onemliler = [];
  const gorusler = [];
  const ayetler = [];
  const hadisler = [];
  const dualar = [];

  for (const { madde, ustMadde } of maddeleriGez(not)) {
    if (ustMadde) continue; // alt maddeler ek bölümlere girmez (meâl hariç, aşağıda)

    switch (madde.tur) {
      case 'tanim': {
        const tanim = tanimAyrıstir(madde.metin);
        if (tanim) tanimlar.push(tanim);
        break;
      }
      case 'onemli':
        onemliler.push(madde.metin);
        break;
      case 'gorus':
        gorusler.push(madde.metin);
        break;
      case 'ayet':
      case 'hadis':
      case 'dua': {
        const meal = madde.alt.find((alt) => alt.tur === 'meal');
        const kayit = {
          id: madde.id,
          metin: madde.metin,
          kunye: madde.kaynakKunyesi || null,
          meal: meal ? meal.metin.replace(/^meâli:\s*/iu, '') : null,
        };
        if (madde.tur === 'ayet') ayetler.push(kayit);
        else if (madde.tur === 'hadis') hadisler.push(kayit);
        else dualar.push(kayit);
        break;
      }
      default:
        break;
    }
  }

  const maddeSayisi = [...maddeleriGez(not)].length;

  return {
    ...not,
    tanimlar,
    onemliler,
    gorusler,
    ayetler,
    hadisler,
    dualar,
    istatistik: { ...not.istatistik, madde: maddeSayisi },
  };
}

/** Düzenleme sonrası ortak toparlama: boş grupları at, numaraları tazele. */
function toparla(not) {
  const kopya = { ...not, elleDuzenlendi: true };
  kopya.bolumler = kopya.bolumler
    .map((bolum) => ({
      ...bolum,
      gruplar: bolum.gruplar.filter((grup) => grup.maddeler.length),
    }))
    .filter((bolum) => bolum.gruplar.length);
  numaralandir(kopya.bolumler);
  return ekleriTazele(kopya);
}

/** Otomatik notu düzenlenebilir hâle getirir. */
export const duzenlemeyeAl = (not) => toparla(kopyala(not));

export function baslikDegistir(not, baslik) {
  return toparla({ ...kopyala(not), baslik });
}

export function bolumBasligiDegistir(not, bolumId, baslik) {
  const kopya = kopyala(not);
  const bolum = kopya.bolumler.find((b) => b.id === bolumId);
  if (bolum) bolum.baslik = baslik;
  return toparla(kopya);
}

export function grupBasligiDegistir(not, grupId, baslik) {
  const kopya = kopyala(not);
  for (const bolum of kopya.bolumler) {
    const grup = bolum.gruplar.find((g) => g.id === grupId);
    if (grup) grup.baslik = baslik.trim() || null;
  }
  return toparla(kopya);
}

export function maddeMetniDegistir(not, id, metin) {
  const kopya = kopyala(not);
  const konum = maddeBul(kopya, id);
  if (konum) konum.madde.metin = metin;
  return toparla(kopya);
}

export function maddeTuruDegistir(not, id, tur) {
  const kopya = kopyala(not);
  const konum = maddeBul(kopya, id);
  if (konum) konum.madde.tur = tur;
  return toparla(kopya);
}

export function maddeSil(not, id) {
  const kopya = kopyala(not);
  const konum = maddeBul(kopya, id);
  if (konum) konum.dizi.splice(konum.indeks, 1);
  return toparla(kopya);
}

/** Maddeyi kendi listesi içinde bir yukarı/aşağı taşır. */
export function maddeTasi(not, id, yon) {
  const kopya = kopyala(not);
  const konum = maddeBul(kopya, id);
  if (!konum) return not;
  const hedef = konum.indeks + (yon === 'yukari' ? -1 : 1);
  if (hedef < 0 || hedef >= konum.dizi.length) return not;
  const [tasinan] = konum.dizi.splice(konum.indeks, 1);
  konum.dizi.splice(hedef, 0, tasinan);
  return toparla(kopya);
}

/** Maddeyi bir üst seviyeye çıkarır ya da öncekinin altına indirir. */
export function maddeSeviyeDegistir(not, id, yon) {
  const kopya = kopyala(not);
  const konum = maddeBul(kopya, id);
  if (!konum) return not;

  if (yon === 'indir' && !konum.ustMadde) {
    const onceki = konum.dizi[konum.indeks - 1];
    if (!onceki) return not;
    const [tasinan] = konum.dizi.splice(konum.indeks, 1);
    onceki.alt.push(...[tasinan], ...tasinan.alt);
    tasinan.alt = [];
    return toparla(kopya);
  }

  if (yon === 'cikar' && konum.ustMadde) {
    const grupDizisi = konum.grup.maddeler;
    const ustIndeks = grupDizisi.indexOf(konum.ustMadde);
    const [tasinan] = konum.dizi.splice(konum.indeks, 1);
    tasinan.alt = tasinan.alt || [];
    grupDizisi.splice(ustIndeks + 1, 0, tasinan);
    return toparla(kopya);
  }

  return not;
}

/** Belirtilen maddenin ardına boş bir madde ekler. */
export function maddeEkle(not, id, tur = 'bilgi') {
  const kopya = kopyala(not);
  const konum = maddeBul(kopya, id);
  const yeni = { id: yeniKimlik(), kaynak: null, metin: '', tur, alt: [] };

  if (konum) konum.dizi.splice(konum.indeks + 1, 0, yeni);
  else {
    const bolum = kopya.bolumler[kopya.bolumler.length - 1];
    if (!bolum) return not;
    bolum.gruplar[bolum.gruplar.length - 1].maddeler.push(yeni);
  }
  return { ...toparla(kopya), sonEklenenId: yeni.id };
}

export function bolumEkle(not, baslik = 'Yeni bölüm') {
  const kopya = kopyala(not);
  const id = yeniKimlik();
  kopya.bolumler.push({
    id,
    baslik,
    gruplar: [
      {
        id: `${id}-g0`,
        baslik: null,
        maddeler: [{ id: yeniKimlik(), kaynak: null, metin: '', tur: 'bilgi', alt: [] }],
      },
    ],
  });
  return toparla(kopya);
}

export function bolumSil(not, bolumId) {
  const kopya = kopyala(not);
  kopya.bolumler = kopya.bolumler.filter((bolum) => bolum.id !== bolumId);
  return toparla(kopya);
}

/** Özet, sorular gibi düz metin listelerini günceller. */
export function listeGuncelle(not, alan, degerler) {
  return toparla({ ...kopyala(not), [alan]: degerler.filter((d) => d.trim()) });
}

/**
 * Ders devam ederken üretilen yeni maddeleri, elle düzenlenmiş nota katar.
 * Kullanıcının düzenlemeleri korunur; yalnızca yeni cümleler eklenir.
 */
export function yeniMaddeleriKat(duzenlenmis, otomatik) {
  const esik = duzenlenmis.sonKaynak ?? -1;
  if ((otomatik.sonKaynak ?? -1) <= esik) return duzenlenmis;

  const kopya = kopyala(duzenlenmis);
  let eklendi = false;

  for (const bolum of otomatik.bolumler) {
    const yeniler = bolum.gruplar
      .flatMap((grup) => grup.maddeler)
      .filter((madde) => typeof madde.kaynak === 'number' && madde.kaynak > esik);
    if (!yeniler.length) continue;

    eklendi = true;
    const mevcut = kopya.bolumler.find((b) => b.id === bolum.id);
    if (mevcut) {
      const grup = mevcut.gruplar[mevcut.gruplar.length - 1];
      grup.maddeler.push(...kopyala(yeniler));
    } else {
      kopya.bolumler.push({
        id: bolum.id,
        baslik: bolum.baslik,
        gruplar: [{ id: `${bolum.id}-g0`, baslik: null, maddeler: kopyala(yeniler) }],
      });
    }
  }

  kopya.sonKaynak = otomatik.sonKaynak;
  kopya.ozet = otomatik.ozet;
  kopya.sorular = otomatik.sorular;
  kopya.anahtarlar = otomatik.anahtarlar;
  return eklendi ? toparla(kopya) : { ...kopya, elleDuzenlendi: true };
}
