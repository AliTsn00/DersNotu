// Sınıflandırılmış cümlelerden numaralı, gruplanmış not taslağı kurar.
//
// Yapı:  not → bölüm (1.) → grup (alt başlık) → madde (1.2) → alt madde (1.2.1)
// Her maddenin `kaynak` alanı, geldiği cümlenin sırasıdır; kimlikler buna
// dayandığı için canlı ders sürerken eski maddelerin kimliği değişmez.

import { trKucuk, baslikBicimle, basHarfiBuyut, kelimelere } from './harf.js';
import { benzerlik } from './temizle.js';
import { anahtarKavramlar, govdele } from './anahtar.js';
import { ETKISIZ_KELIMELER } from './sozluk.js';
import { arapcaMi } from './islami.js';

const VARSAYILAN_BOLUM = 'Genel';

/** Ayrıntı seviyesine göre hangi cümle türlerinin nota gireceği. */
const ORTAK_TURLER = [
  'baslik', 'tanim', 'onemli', 'listeBasi', 'madde', 'ozet', 'formul',
  'ayet', 'hadis', 'gorus', 'meal',
];
const DETAY_KURALLARI = {
  kisa: new Set(ORTAK_TURLER),
  orta: new Set([...ORTAK_TURLER, 'ornek', 'bilgi', 'soru', 'dua', 'arapca']),
  detayli: new Set([...ORTAK_TURLER, 'ornek', 'bilgi', 'soru', 'dua', 'arapca']),
};

/** Alıntı türleri: kendi bloklarında, künyeleriyle gösterilir. */
export const ALINTI_TURLERI = new Set(['ayet', 'hadis', 'dua', 'arapca']);

const ORNEK_ONEKI = /^(örneğin|örnek olarak|mesela|diyelim ki|farz edelim|örnek verecek olursak)[,:]?\s*/u;
const MADDE_ONEKI = /^(birincisi|ikincisi|üçüncüsü|dördüncüsü|beşincisi|altıncısı|yedincisi|sonuncusu|ilk olarak|ikinci olarak|üçüncü olarak|son olarak|bir diğeri|bir başkası|bunlardan biri|öncelikle)[,:]?\s*/u;
const NUMARA_ONEKI = /^\d+[).\-]\s*/;

/** Ön eki büyük/küçük harften bağımsız (Türkçe kurallarıyla) kırpar. */
function onekAt(metin, kalip) {
  const esles = trKucuk(metin).match(kalip);
  if (!esles || esles.index !== 0) return metin;
  return metin.slice(esles[0].length);
}

function ornekBicimle(metin) {
  const govde = basHarfiBuyut(onekAt(metin, ORNEK_ONEKI).trim());
  return `Örnek: ${govde || metin}`;
}

function maddeBicimle(metin) {
  const govde = onekAt(onekAt(metin, NUMARA_ONEKI), MADDE_ONEKI).trim();
  return basHarfiBuyut(govde || metin);
}

/** "Bu evrede su parçalanır." gibi, önceki maddeyi sürdüren cümleler. */
const DEVAM_BASLANGICLARI = new Set([
  'bu', 'şu', 'bunlar', 'şunlar', 'bunun', 'şunun', 'burada', 'böylece',
  'bunu', 'şunu', 'bunlardan', 'yani',
]);

function devamCumlesiMi(metin = '') {
  const [ilk] = kelimelere(metin);
  return Boolean(ilk && DEVAM_BASLANGICLARI.has(ilk));
}

/** Bir metnin anlam taşıyan gövdeleri — konu değişimi sezgisi için. */
function govdeKumesi(metin = '') {
  const kume = new Set();
  for (const kelime of kelimelere(metin)) {
    if (kelime.length < 4 || ETKISIZ_KELIMELER.has(kelime)) continue;
    const govde = govdele(kelime);
    if (govde.length >= 4 && !ETKISIZ_KELIMELER.has(govde)) kume.add(govde);
  }
  return kume;
}

/**
 * Bölüm içindeki maddeleri konu değişimine göre gruplar.
 * Ard arda gelen maddeler ortak kavram paylaşmıyorsa yeni grup açılır.
 */
function konuyaGoreBol(maddeler, bolumSirasi) {
  const tekGrup = () => [{ id: `g${bolumSirasi}-0`, baslik: null, maddeler }];
  if (maddeler.length <= 8) return tekGrup();

  const gruplar = [];
  let acikGrup = null;
  let acikGovdeler = new Set();

  for (const madde of maddeler) {
    const govdeler = govdeKumesi(madde.metin);
    // Arapça alıntının Türkçe gövdesi yoktur; konu değişimi sayılmaz.
    const alintiMi = ALINTI_TURLERI.has(madde.tur) || arapcaMi(madde.metin);
    const ortak = [...govdeler].some((govde) => acikGovdeler.has(govde));

    if (!acikGrup || (!ortak && !alintiMi && acikGrup.maddeler.length >= 3 && govdeler.size)) {
      acikGrup = { id: `g${bolumSirasi}-${gruplar.length}`, baslik: null, maddeler: [] };
      gruplar.push(acikGrup);
      acikGovdeler = new Set();
    }

    acikGrup.maddeler.push(madde);
    for (const govde of govdeler) acikGovdeler.add(govde);
  }

  // Cılız grupları öncekine yedir; grup ancak kendi başına duracaksa kalır.
  const derli = [];
  for (const grup of gruplar) {
    if (derli.length && grup.maddeler.length < 3) {
      derli[derli.length - 1].maddeler.push(...grup.maddeler);
      continue;
    }
    derli.push(grup);
  }

  if (derli.length <= 1) return tekGrup();

  for (const grup of derli) {
    const [enSik] = anahtarKavramlar(
      grup.maddeler.flatMap((m) => [m.metin, ...m.alt.map((a) => a.metin)]),
      { adet: 2 },
    );
    grup.baslik = enSik ? baslikBicimle(enSik.kelime) : null;
  }

  return derli;
}

/** Bölüm/grup/madde numaralarını yazar. */
export function numaralandir(bolumler) {
  bolumler.forEach((bolum, bolumSirasi) => {
    bolum.numara = String(bolumSirasi + 1);
    let maddeSirasi = 0;
    for (const grup of bolum.gruplar) {
      for (const madde of grup.maddeler) {
        maddeSirasi += 1;
        madde.numara = `${bolum.numara}.${maddeSirasi}`;
        madde.alt.forEach((alt, altSirasi) => {
          alt.numara = `${madde.numara}.${altSirasi + 1}`;
        });
      }
    }
  });
  return bolumler;
}

/**
 * @param {Array<{tur:string, metin:string, tanim?:object, baslik?:string, kaynak?:string}>} siniflar
 * @param {{detay?:'kisa'|'orta'|'detayli', baslik?:string, sure?:number, tarih?:string}} secenekler
 */
export function taslakKur(siniflar = [], secenekler = {}) {
  const { detay = 'orta', baslik: elleBaslik, sure = 0, tarih } = secenekler;
  const izinli = DETAY_KURALLARI[detay] || DETAY_KURALLARI.orta;

  const bolumler = [];
  const tanimlar = [];
  const onemliler = [];
  const sorular = [];
  const ozet = [];
  const atlanan = [];
  const basliklar = [];
  const ayetler = [];
  const hadisler = [];
  const dualar = [];
  const gorusler = [];

  let aktifBolum = null;
  let aktifListe = null;
  let sonAlinti = null;
  let listeBoslugu = 0;
  const sonEklenenler = [];

  const bolumAc = (ad, kaynak) => {
    aktifBolum = { id: `b${kaynak}`, baslik: ad, maddeler: [] };
    bolumler.push(aktifBolum);
    aktifListe = null;
    return aktifBolum;
  };
  const bolumGetir = (kaynak) => aktifBolum || bolumAc(VARSAYILAN_BOLUM, kaynak);

  const tekrarMi = (metin) => sonEklenenler.some((onceki) => benzerlik(onceki, metin) > 0.82);

  const izleyeEkle = (metin) => {
    sonEklenenler.push(metin);
    if (sonEklenenler.length > 6) sonEklenenler.shift();
  };

  const maddeEkle = (metin, tur, kaynak, ekstra = {}) => {
    if (tekrarMi(metin)) return null;
    const bolum = bolumGetir(kaynak);

    // Anlamsız kısa parçaları önceki maddeye yapıştır (alıntılar hariç).
    if (kelimelere(metin).length < 3 && bolum.maddeler.length && !ALINTI_TURLERI.has(tur)) {
      const onceki = bolum.maddeler[bolum.maddeler.length - 1];
      onceki.metin = `${onceki.metin.replace(/[.?!]$/, '')} ${trKucuk(metin[0]) + metin.slice(1)}`;
      return onceki;
    }

    const madde = { id: `c${kaynak}`, kaynak, metin, tur, alt: [], ...ekstra };
    bolum.maddeler.push(madde);
    izleyeEkle(metin);
    return madde;
  };

  const altEkle = (metin, tur, kaynak, hedefMadde = null) => {
    const bolum = bolumGetir(kaynak);
    const hedef = hedefMadde || aktifListe || bolum.maddeler[bolum.maddeler.length - 1];
    if (!hedef) return maddeEkle(metin, tur, kaynak);
    if (tekrarMi(metin)) return null;
    hedef.alt.push({ id: `c${kaynak}`, kaynak, metin, tur });
    izleyeEkle(metin);
    return hedef;
  };

  siniflar.forEach((cumle, kaynak) => {
    const { tur, metin } = cumle;

    if (tur === 'gereksiz' || !izinli.has(tur)) {
      atlanan.push(metin);
      return;
    }

    // Liste bağlamı: iki ardışık liste dışı cümleden sonra listeyi kapat.
    if (aktifListe && tur !== 'madde' && tur !== 'ornek') {
      listeBoslugu += 1;
      if (listeBoslugu >= 2) aktifListe = null;
    }
    if (!ALINTI_TURLERI.has(tur) && tur !== 'meal') sonAlinti = null;

    switch (tur) {
      case 'baslik': {
        const ad = baslikBicimle(cumle.baslik || metin);
        basliklar.push(ad);
        bolumAc(ad, kaynak);
        break;
      }
      case 'tanim': {
        const { terim, aciklama } = cumle.tanim;
        tanimlar.push({ terim, aciklama });
        maddeEkle(`**${terim}:** ${aciklama.replace(/[.?!]$/, '')}.`, 'tanim', kaynak);
        break;
      }
      case 'ayet':
      case 'hadis':
      case 'dua':
      case 'arapca': {
        const madde = maddeEkle(metin, tur, kaynak, {
          kaynakKunyesi: cumle.kaynak || null,
          dogrulanmadi: Boolean(cumle.dogrulanmadi),
          giris: cumle.giris || null,
        });
        if (madde) {
          sonAlinti = madde;
          const kayit = { metin, kunye: cumle.kaynak || null, meal: null, id: madde.id };
          if (tur === 'ayet') ayetler.push(kayit);
          else if (tur === 'hadis') hadisler.push(kayit);
          else if (tur === 'dua') dualar.push(kayit);
        }
        break;
      }
      case 'meal': {
        const govde = basHarfiBuyut(
          metin.replace(/^(meâli|meali|anlamı|mânâsı|manası|türkçesi)\s*[:,]?\s*/iu, ''),
        );
        const metinYazi = `Meâli: ${govde}`;
        if (sonAlinti) {
          altEkle(metinYazi, 'meal', kaynak, sonAlinti);
          const dizin = [...ayetler, ...hadisler, ...dualar].find((k) => k.id === sonAlinti.id);
          if (dizin) dizin.meal = govde;
        } else {
          maddeEkle(metin, 'bilgi', kaynak);
        }
        break;
      }
      case 'gorus': {
        gorusler.push(metin);
        maddeEkle(metin, 'gorus', kaynak);
        break;
      }
      case 'onemli': {
        onemliler.push(metin);
        maddeEkle(metin, 'onemli', kaynak);
        break;
      }
      case 'ornek': {
        altEkle(ornekBicimle(metin), 'ornek', kaynak);
        break;
      }
      case 'ozet': {
        ozet.push(metin);
        break;
      }
      case 'soru': {
        sorular.push(metin);
        break;
      }
      case 'listeBasi': {
        aktifListe = maddeEkle(metin, 'listeBasi', kaynak);
        listeBoslugu = 0;
        break;
      }
      case 'madde': {
        const bicimli = maddeBicimle(metin);
        listeBoslugu = 0;
        if (aktifListe) altEkle(bicimli, 'madde', kaynak);
        else maddeEkle(bicimli, 'madde', kaynak);
        break;
      }
      case 'formul': {
        maddeEkle(metin, 'formul', kaynak);
        break;
      }
      default: {
        const sonAlt = aktifListe?.alt[aktifListe.alt.length - 1];
        if (sonAlt && devamCumlesiMi(metin)) {
          sonAlt.metin = `${sonAlt.metin.replace(/[.?!]$/, '')} — ${metin}`;
          break;
        }
        maddeEkle(metin, 'bilgi', kaynak);
      }
    }
  });

  const tumMetinler = siniflar.filter((c) => c.tur !== 'gereksiz').map((c) => c.metin);
  const anahtarlar = anahtarKavramlar(
    tumMetinler.filter((m) => !arapcaMi(m)),
    { agirlikli: [...basliklar, ...tanimlar.map((t) => t.terim)] },
  );

  const doluBolumler = bolumler.filter((b) => b.maddeler.length);
  const yapili = numaralandir(
    doluBolumler.map((bolum, sira) => ({
      id: bolum.id,
      baslik: bolum.baslik,
      gruplar: konuyaGoreBol(bolum.maddeler, sira),
    })),
  );

  // Hiç başlık cümlesi yoksa tek bölüme baskın kavramın adını ver;
  // başlıktan önce söylenenler ise "Giriş" bölümüdür.
  if (yapili.length === 1 && yapili[0].baslik === VARSAYILAN_BOLUM && anahtarlar[0]) {
    yapili[0].baslik = baslikBicimle(anahtarlar[0].kelime);
  } else if (yapili.length > 1 && yapili[0].baslik === VARSAYILAN_BOLUM) {
    yapili[0].baslik = 'Giriş';
  }

  const maddeSayisi = yapili.reduce(
    (toplam, bolum) =>
      toplam +
      bolum.gruplar.reduce(
        (ara, grup) =>
          ara + grup.maddeler.length + grup.maddeler.reduce((a, m) => a + m.alt.length, 0),
        0,
      ),
    0,
  );

  return {
    baslik:
      elleBaslik ||
      basliklar[0] ||
      (anahtarlar[0] ? `${anahtarlar[0].kelime} Dersi` : 'Ders Notu'),
    tarih: tarih || new Date().toISOString(),
    sure,
    // Nereye kadar cümle işlendi — elle düzenlenmiş nota yeni cümle katarken
    // hangilerinin yeni olduğunu bundan anlıyoruz.
    sonKaynak: siniflar.length - 1,
    istatistik: {
      cumle: tumMetinler.length,
      kelime: tumMetinler.reduce((toplam, m) => toplam + kelimelere(m).length, 0),
      madde: maddeSayisi,
    },
    bolumler: yapili,
    tanimlar,
    onemliler,
    sorular,
    ozet,
    ayetler,
    hadisler,
    dualar,
    gorusler,
    anahtarlar,
    atlanan,
    elleDuzenlendi: false,
  };
}
