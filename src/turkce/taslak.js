// Sınıflandırılmış cümlelerden maddeli not taslağı kurar.

import { trKucuk, baslikBicimle, basHarfiBuyut, kelimelere } from './harf.js';
import { benzerlik } from './temizle.js';
import { anahtarKavramlar } from './anahtar.js';

const VARSAYILAN_BOLUM = 'Genel';

/** Ayrıntı seviyesine göre hangi cümle türlerinin nota gireceği. */
const DETAY_KURALLARI = {
  kisa: new Set(['baslik', 'tanim', 'onemli', 'listeBasi', 'madde', 'ozet', 'formul']),
  orta: new Set(['baslik', 'tanim', 'onemli', 'listeBasi', 'madde', 'ozet', 'formul', 'ornek', 'bilgi', 'soru']),
  detayli: new Set(['baslik', 'tanim', 'onemli', 'listeBasi', 'madde', 'ozet', 'formul', 'ornek', 'bilgi', 'soru']),
};

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

/**
 * @param {Array<{tur:string, metin:string, tanim?:object, baslik?:string}>} siniflar
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

  let aktifBolum = null;
  let aktifListe = null;
  let listeBoslugu = 0;
  const sonEklenenler = [];

  const bolumAc = (ad) => {
    aktifBolum = { baslik: ad, maddeler: [] };
    bolumler.push(aktifBolum);
    aktifListe = null;
    return aktifBolum;
  };
  const bolumGetir = () => aktifBolum || bolumAc(VARSAYILAN_BOLUM);

  const tekrarMi = (metin) => {
    for (const onceki of sonEklenenler) {
      if (benzerlik(onceki, metin) > 0.82) return true;
    }
    return false;
  };

  const maddeEkle = (metin, tur) => {
    if (tekrarMi(metin)) return null;
    const bolum = bolumGetir();
    const kelimeSayisi = kelimelere(metin).length;

    // Anlamsız kısa parçaları önceki maddeye yapıştır.
    if (kelimeSayisi < 3 && bolum.maddeler.length) {
      const onceki = bolum.maddeler[bolum.maddeler.length - 1];
      onceki.metin = `${onceki.metin.replace(/[.?!]$/, '')} ${trKucuk(metin[0]) + metin.slice(1)}`;
      return onceki;
    }

    const madde = { metin, tur, alt: [] };
    bolum.maddeler.push(madde);
    sonEklenenler.push(metin);
    if (sonEklenenler.length > 6) sonEklenenler.shift();
    return madde;
  };

  const altEkle = (metin, tur) => {
    const bolum = bolumGetir();
    const hedef = aktifListe || bolum.maddeler[bolum.maddeler.length - 1];
    if (!hedef) return maddeEkle(metin, tur);
    if (tekrarMi(metin)) return null;
    hedef.alt.push({ metin, tur });
    sonEklenenler.push(metin);
    if (sonEklenenler.length > 6) sonEklenenler.shift();
    return hedef;
  };

  for (const cumle of siniflar) {
    const { tur, metin } = cumle;

    if (tur === 'gereksiz') {
      atlanan.push(metin);
      continue;
    }
    if (!izinli.has(tur)) {
      atlanan.push(metin);
      continue;
    }

    // Liste bağlamı: iki ardışık liste dışı cümleden sonra listeyi kapat.
    if (aktifListe && tur !== 'madde' && tur !== 'ornek') {
      listeBoslugu += 1;
      if (listeBoslugu >= 2) aktifListe = null;
    }

    switch (tur) {
      case 'baslik': {
        const ad = baslikBicimle(cumle.baslik || metin);
        basliklar.push(ad);
        bolumAc(ad);
        break;
      }
      case 'tanim': {
        const { terim, aciklama } = cumle.tanim;
        tanimlar.push({ terim, aciklama });
        maddeEkle(`**${terim}:** ${aciklama.replace(/[.?!]$/, '')}.`, 'tanim');
        break;
      }
      case 'onemli': {
        onemliler.push(metin);
        maddeEkle(metin, 'onemli');
        break;
      }
      case 'ornek': {
        altEkle(ornekBicimle(metin), 'ornek');
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
        const madde = maddeEkle(metin, 'listeBasi');
        aktifListe = madde;
        listeBoslugu = 0;
        break;
      }
      case 'madde': {
        const bicimli = maddeBicimle(metin);
        listeBoslugu = 0;
        if (aktifListe) altEkle(bicimli, 'madde');
        else maddeEkle(bicimli, 'madde');
        break;
      }
      case 'formul': {
        maddeEkle(metin, 'formul');
        break;
      }
      default: {
        // Liste içindeyken "Bu evrede..." gibi cümleler yeni madde açmaz,
        // önceki maddeyi tamamlar.
        const sonAlt = aktifListe?.alt[aktifListe.alt.length - 1];
        if (sonAlt && devamCumlesiMi(metin)) {
          sonAlt.metin = `${sonAlt.metin.replace(/[.?!]$/, '')} — ${metin}`;
          break;
        }
        maddeEkle(metin, 'bilgi');
      }
    }
  }

  const tumMetinler = siniflar.filter((c) => c.tur !== 'gereksiz').map((c) => c.metin);
  const anahtarlar = anahtarKavramlar(tumMetinler, {
    agirlikli: [...basliklar, ...tanimlar.map((t) => t.terim)],
  });

  const bolunmus = bolumleriDenkle(bolumler, anahtarlar);
  const notBasligi =
    elleBaslik ||
    basliklar[0] ||
    (anahtarlar[0] ? `${anahtarlar[0].kelime} Dersi` : 'Ders Notu');

  return {
    baslik: notBasligi,
    tarih: tarih || new Date().toISOString(),
    sure,
    istatistik: {
      cumle: tumMetinler.length,
      kelime: tumMetinler.reduce((toplam, m) => toplam + kelimelere(m).length, 0),
      madde: bolunmus.reduce(
        (toplam, b) => toplam + b.maddeler.length + b.maddeler.reduce((a, m) => a + m.alt.length, 0),
        0,
      ),
    },
    bolumler: bolunmus,
    tanimlar,
    onemliler,
    sorular,
    ozet,
    anahtarlar,
    atlanan,
  };
}

/**
 * Hoca hiç başlık cümlesi kurmadıysa tek uzun bölüm oluşur.
 * Bu durumda maddeleri parçalara bölüp her parçayı baskın kavramla adlandırır.
 */
function bolumleriDenkle(bolumler, anahtarlar) {
  const doluBolumler = bolumler.filter((b) => b.maddeler.length);
  if (doluBolumler.length !== 1) return doluBolumler;

  const [tek] = doluBolumler;
  if (tek.baslik !== VARSAYILAN_BOLUM || tek.maddeler.length <= 18) return doluBolumler;

  const parcaBoyu = 10;
  const govdeler = new Map(anahtarlar.map((a) => [a.govde, a.kelime]));
  const yeniler = [];

  for (let i = 0; i < tek.maddeler.length; i += parcaBoyu) {
    const dilim = tek.maddeler.slice(i, i + parcaBoyu);
    const yerel = anahtarKavramlar(
      dilim.flatMap((m) => [m.metin, ...m.alt.map((a) => a.metin)]),
      { adet: 3 },
    );
    const ad = yerel.find((k) => govdeler.has(k.govde)) || yerel[0];
    yeniler.push({
      baslik: ad ? baslikBicimle(ad.kelime) : `${VARSAYILAN_BOLUM} ${yeniler.length + 1}`,
      maddeler: dilim,
    });
  }

  return yeniler;
}
