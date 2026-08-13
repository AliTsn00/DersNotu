// Notta geçen Arapça ibarelerin Kur'ân'da olup olmadığını birebir karşılaştırır.
//
// Buradaki hiçbir şey tahmin değildir: metin Tanzil.net'in denetlenmiş Uthmani
// sürümüdür ve karşılaştırma dizi eşleştirmesidir. Uygulama Kur'ân metnini
// değiştirmez, üretmez, tamamlamaz — yalnızca "bu ibare şu âyettir" ya da
// "bulunamadı" der.
//
// Hadîsler için burada karşılık yok ve olmayacak: kapalı bir külliyat, tek bir
// kanonik metin ve makine tarafından denetlenebilir bir sıhhat ölçütü yok.
// Doğrulama iddia etmek yanlış güven verirdi.

/** Hareke, durak işareti ve uzatma çizgisi. */
const AYIRICI_ISARETLER = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/gu;
const ARAP_HARFI = /[ؠ-يٮ-ە]/u;

/** Konuşma tanımanın ve farklı imlâların ayırdığı harfleri tek biçime indirger. */
const DENKLIKLER = [
  [/[آأإٱ]/gu, 'ا'], // آ أ إ ٱ → ا
  [/ى/gu, 'ي'], // ى → ي
  [/ة/gu, 'ه'], // ة → ه
  [/ؤ/gu, 'و'], // ؤ → و
  [/ئ/gu, 'ي'], // ئ → ي
  [/ء/gu, ''], // bağımsız hemze
];

/**
 * Arapça metni karşılaştırılabilir hâle getirir. Kıyas yalnızca bu biçimler
 * üzerinden yapılır; kullanıcıya her zaman özgün metin gösterilir.
 */
export function arapcayiNormalle(metin) {
  let sonuc = String(metin || '').replace(AYIRICI_ISARETLER, '');
  for (const [kalip, yerine] of DENKLIKLER) sonuc = sonuc.replace(kalip, yerine);
  return sonuc
    .replace(/[^ؠ-ە\s]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * Birebir karşılaştırma biçimi: boşluklar ve elifler atılır.
 *
 * İkisi de imlâdan imlâya değişiyor. Uthmani "يَٰٓأَيُّهَا" yazarken sade metin
 * "يا أيها" diyor — kelime sınırı bile aynı değil. Elif kimi yerde harf, kimi
 * yerde üst simge: "ٱلصَّٰبِرِينَ" ile "الصابرين" aynı kelime. Bu iki değişkeni
 * yok saymak, âyeti hangi imlâyla gelirse gelsin bulmayı sağlıyor.
 */
export function karsilastirmaBicimi(metin) {
  return arapcayiNormalle(metin).replace(/[\sا]/gu, '');
}

/** Metinde Arap harfi var mı? Latin harfli çevriyazı doğrulanamaz. */
export function arapHarfiVarMi(metin) {
  return ARAP_HARFI.test(String(metin || ''));
}

/** Sıradaki âyetin hangi sûrenin kaçıncı âyeti olduğunu bulur. */
function konumBul(sira, sureBasi) {
  let alt = 0;
  let ust = sureBasi.length - 1;
  while (alt < ust) {
    const orta = Math.ceil((alt + ust) / 2);
    if (sureBasi[orta] <= sira) alt = orta;
    else ust = orta - 1;
  }
  return { sure: alt + 1, ayet: sira - sureBasi[alt] + 1 };
}

/**
 * Kur'ân verisinden aranabilir bir dizin kurar.
 *
 * Normalleştirilmiş metinler ve kelime dizini burada bir kez hesaplanır;
 * her doğrulamada yeniden üretmek 6.236 âyet için israf olurdu.
 */
export function dizinKur(veri) {
  const metinler = veri.metinler || [];
  const aramaMetinleri = veri.aramaMetinleri || metinler;

  // Her iki imlâda da aranır. İkisi arasında normalleştirmeyle kapatılamayan
  // farklar var — Uthmani "ٱلصَّلَوٰةِ" derken sade metin "الصلاة" diyor, vav
  // eliften geliyor. Zorlama bir kural yerine her iki biçimi de dizine koymak
  // hem daha güvenli hem daha basit.
  const sikisik = [aramaMetinleri, metinler].map((liste) => liste.map(karsilastirmaBicimi));

  // Kelime → âyet sıraları. Yalnızca yaklaşık eşleştirmede kullanılır.
  const kelimeDizini = new Map();
  for (const liste of [aramaMetinleri, metinler]) {
    liste.forEach((ham, sira) => {
      for (const kelime of new Set(arapcayiNormalle(ham).split(' '))) {
        if (kelime.length < 2) continue;
        const kayit = kelimeDizini.get(kelime);
        if (kayit) kayit.add(sira);
        else kelimeDizini.set(kelime, new Set([sira]));
      }
    });
  }

  const kunyeKur = (sira) => {
    const { sure, ayet } = konumBul(sira, veri.sureBasi);
    const ad = veri.surelerinAdlari?.[sure - 1] || `${sure}. sûre`;
    return { sure, ayet, kunye: `${ad} ${ayet}`, metin: metinler[sira] };
  };

  /**
   * @param {string} sorgu notta geçen Arapça ibare
   * @returns {{durum:'kesin'|'olasi'|'yok'|'okunamadi', kunye?:string,
   *            sure?:number, ayet?:number, metin?:string, benzerlik?:number}}
   */
  function ayetiBul(sorgu) {
    if (!arapHarfiVarMi(sorgu)) return { durum: 'okunamadi' };

    const aranan = arapcayiNormalle(sorgu);
    const kelimeler = aranan.split(' ').filter((kelime) => kelime.length >= 2);
    // Tek kelimelik eşleşmeler ("Allah") her âyette bulunur; bilgi taşımaz.
    if (kelimeler.length < 2) return { durum: 'yok' };

    // 1) Birebir geçiş: ibare bir âyetin içinde aynen duruyor mu?
    const arananSikisik = karsilastirmaBicimi(sorgu);
    if (arananSikisik.length >= 8) {
      for (const dizin of sikisik) {
        for (let sira = 0; sira < dizin.length; sira += 1) {
          if (dizin[sira].includes(arananSikisik)) return { durum: 'kesin', ...kunyeKur(sira) };
        }
      }
    }

    // 2) Konuşma tanıma metni bozmuş olabilir: kelime örtüşmesine bak.
    const puanlar = new Map();
    for (const kelime of new Set(kelimeler)) {
      for (const sira of kelimeDizini.get(kelime) || []) {
        puanlar.set(sira, (puanlar.get(sira) || 0) + 1);
      }
    }

    let enIyi = -1;
    let enIyiPuan = 0;
    for (const [sira, puan] of puanlar) {
      if (puan > enIyiPuan) {
        enIyiPuan = puan;
        enIyi = sira;
      }
    }

    const benzerlik = enIyiPuan / new Set(kelimeler).size;
    // Dört kelime ve %75 örtüşme: bunun altında yanlış eşleşme, doğru
    // eşleşmeden daha olası. Yanlış künye yazmak, künye yazmamaktan kötüdür.
    if (enIyi >= 0 && kelimeler.length >= 4 && benzerlik >= 0.75) {
      return { durum: 'olasi', benzerlik, ...kunyeKur(enIyi) };
    }
    return { durum: 'yok' };
  }

  return { ayetiBul, ayetSayisi: metinler.length, kaynak: veri.kaynak };
}

/**
 * Nottaki bütün Arapça alıntıları Kur'ân'la karşılaştırır.
 *
 * Hadîs ve duâ kayıtları da taranır: kural motorunun ya da modelin "hadîs"
 * saydığı bir ibare aslında âyet olabiliyor. Tersi bir iddiada bulunulmaz —
 * bir metnin Kur'ân'da bulunmaması onu uydurma yapmaz, yalnızca âyet olmadığını
 * gösterir.
 *
 * @returns {Promise<Map<string, object>>} madde kimliği → sonuç
 */
export async function alintilariDogrula(not, temelYol = '/') {
  const kayitlar = [
    ...(not?.ayetler || []),
    ...(not?.hadisler || []),
    ...(not?.dualar || []),
  ].filter((kayit) => kayit?.id && kayit?.metin);

  if (!kayitlar.length) return new Map();

  const kuran = await kuraniYukle(temelYol);
  const sonuclar = new Map();
  for (const kayit of kayitlar) sonuclar.set(kayit.id, kuran.ayetiBul(kayit.metin));
  return sonuclar;
}

let bekleyen = null;

/**
 * Kur'ân metnini indirip dizini kurar. Aynı oturumda bir kez yüklenir.
 * Dosya 700 KB olduğu için uygulama açılışında değil, ilk doğrulamada çekilir.
 */
export function kuraniYukle(temelYol = '/') {
  if (!bekleyen) {
    bekleyen = fetch(`${temelYol}kuran.json`)
      .then((yanit) => {
        if (!yanit.ok) throw new Error(`Kur'ân metni yüklenemedi (${yanit.status}).`);
        return yanit.json();
      })
      .then(dizinKur)
      .catch((sorun) => {
        bekleyen = null; // sonraki denemede yeniden çekilebilsin
        throw sorun;
      });
  }
  return bekleyen;
}
