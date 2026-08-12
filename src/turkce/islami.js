// İslami ders içeriğinin tanınması: ayet, hadis, dua, Arapça pasaj,
// meal ve mezhep görüşü.
//
// ÖNEMLİ: Bu modül yalnızca SINIFLANDIRIR. Konuşma tanımadan gelen Arapça
// metni asla düzeltmez, tamamlamaz veya ezberden bir metinle değiştirmez;
// duyulan neyse onu işaretleyip "doğrulanmadı" damgasıyla geçirir.

import { trKucuk, trBuyuk, kelimeSadele, kelimelere } from './harf.js';

// --- Arapça yazı ------------------------------------------------------------

const ARAP_HARFI = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/u;
const ARAP_HARFI_HEPSI = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/gu;
const HARF_HEPSI = /\p{L}/gu;

export const arapHarfiVarMi = (metin = '') => ARAP_HARFI.test(metin);

/** Metnin ne kadarı Arap harfi? (0–1) */
export function arapcaOrani(metin = '') {
  const harfler = String(metin).match(HARF_HEPSI)?.length || 0;
  if (!harfler) return 0;
  const arapca = String(metin).match(ARAP_HARFI_HEPSI)?.length || 0;
  return arapca / harfler;
}

export const arapcaMi = (metin = '') => arapcaOrani(metin) > 0.5;

// --- Latin harfli Arapça (çeviri yazı) --------------------------------------

const UZUN_SESLI = /[âāîīûūêôáéí]/u;

/** Arapça ibarelerde sık geçen edat ve kalıp kelimeler. */
const ARAPCA_PARCACIKLAR = new Set([
  'allah', 'allahu', 'allahi', 'allahe', 'allahumme', 'bismillah',
  'rabbi', 'rabbena', 'rabbike', 'rabbuke', 'rahman', 'rahim', 'rahmani',
  'ilahe', 'illa', 'illallah', 'lailahe', 'muhammed', 'muhammeden',
  'resulullah', 'resulu', 'abduhu', 've', 'vel', 'fi', 'min', 'ala', 'ila',
  'inne', 'innellahe', 'lem', 'len', 'kul', 'kale', 'ya', 'ey', 'huve',
  'ellezi', 'ellezine', 'kellezi', 'bima', 'lehu', 'leke', 'leyse', 'kane',
  'elhamdu', 'elhamdulillah', 'subhane', 'subhanallah', 'ekber', 'estagfirullah',
  'aleyhi', 'aleyhim', 'aleykum', 'sellem', 'sallallahu',
  'radiyallahu', 'anh', 'anhu', 'anha', 'teala', 'azze', 'celle',
]);

/**
 * Karşılaştırma anahtarı: şapkalı ünlüleri ve Türkçe'ye özgü harfleri
 * ASCII karşılıklarına indirger. "Sallallahü" ile "sallallahu",
 * "Eyyüb" ile "eyyub" aynı anahtara düşsün diye.
 */
const cevrimyaziSadele = (kelime = '') =>
  kelimeSadele(kelime)
    .replace(/[âā]/gu, 'a')
    .replace(/[îī]/gu, 'i')
    .replace(/[ûūü]/gu, 'u')
    .replace(/ê/gu, 'e')
    .replace(/[ôö]/gu, 'o')
    .replace(/ı/gu, 'i')
    .replace(/ş/gu, 's')
    .replace(/ç/gu, 'c')
    .replace(/ğ/gu, 'g')
    .replace(/[’‘'`´]/gu, '');

/**
 * Türkçe cümle işareti: bu kelimelerden biri geçiyorsa ibare Arapça değildir.
 * (Osmanlıca kökenli şapkalı kelimeler yüzünden yanlış işaretlemeyi önler.)
 */
const TURKCE_ISARETLERI = new Set([
  'bu', 'şu', 'bir', 'için', 'ile', 'gibi', 'çok', 'daha', 'var', 'yok',
  'değil', 'mi', 'mı', 'mu', 'mü', 'ki', 'de', 'da', 'ama', 'ancak', 'çünkü',
  'olarak', 'sonra', 'önce', 'kadar', 'göre', 'her', 'hepsi', 'yani', 'diye',
  'olan', 'eden', 'demek', 'şey', 'zaman', 'kişi', 'insan', 'konu',
]);
const TURKCE_CEKIM = /(dır|dir|dur|dür|tır|tir|tur|tür|yor|mış|miş|muş|müş|acak|ecek|dık|dik|lar|ler|nın|nin)$/u;

function turkceIsaretiVarMi(kelimeler) {
  return kelimeler.some((kelime) => {
    const sade = kelimeSadele(kelime);
    if (TURKCE_ISARETLERI.has(sade)) return true;
    return sade.length >= 5 && TURKCE_CEKIM.test(sade);
  });
}

/**
 * Latin harfleriyle yazılmış Arapça ibare mi?
 * Şapkalı ünlü yoğunluğu ya da Arapça edat yoğunluğu aranır; cümlede
 * belirgin bir Türkçe işaret varsa ibare sayılmaz.
 */
export function cevrimyaziMi(metin = '') {
  const kelimeler = String(metin).split(/\s+/).filter(Boolean);
  if (kelimeler.length < 3) return false;
  if (turkceIsaretiVarMi(kelimeler)) return false;

  let uzunSesli = 0;
  let parcacik = 0;
  for (const kelime of kelimeler) {
    if (UZUN_SESLI.test(kelime)) uzunSesli += 1;
    if (ARAPCA_PARCACIKLAR.has(cevrimyaziSadele(kelime))) parcacik += 1;
  }

  const uzunSesliOrani = uzunSesli / kelimeler.length;
  const parcacikOrani = parcacik / kelimeler.length;
  return (parcacikOrani >= 0.4 && parcacik >= 2) || uzunSesliOrani >= 0.5;
}

/**
 * Tek kelimeyle söylendiği için çeviri yazı sezgisine takılmayan,
 * herkesçe bilinen kalıp ibareler.
 */
const BILINEN_IBARELER = new Set([
  'bismillahirrahmanirrahim', 'bismillah', 'euzubillahimineseytanirracim',
  'elhamdulillah', 'elhamdulillahirabbilalemin', 'subhanallah',
  'lailaheillallah', 'estagfirullah', 'allahuekber', 'allahuekber',
  'sallallahualeyhivesellem', 'amin', 'amentu',
]);

export const bilinenIbareMi = (metin = '') =>
  BILINEN_IBARELER.has(cevrimyaziSadele(String(metin).replace(/\s+/gu, '')));

/** Arap harfli, Latin harfli ya da bilinen kalıp Arapça ibare. */
export const arapcaIbareMi = (metin = '') =>
  arapcaMi(metin) || cevrimyaziMi(metin) || bilinenIbareMi(metin);

// --- Özel adların büyük harfe çevrilmesi ------------------------------------

/** Baştaki harfi mutlaka büyük olması gereken tam kelimeler. */
const OZEL_AD_TOKENLERI = new Set([
  'rab', 'rabb', 'rabbi', 'rabbim', 'rabbimiz', 'rabbin', 'rabbine',
  'rabbinin', 'rabbe', 'rabbena', 'rabbimize', 'rabbimizin',
  'kuran', 'kurani', 'kuranda', 'kurandan', 'kuranin', 'kurana',
  'muhammed', 'muhammede', 'muhammedin', 'muhammedi', 'mustafa',
  'islam', 'islamiyet', 'islamda', 'islamin', 'islama',
  'kabe', 'kabeye', 'kabede', 'mekke', 'medine', 'kudus',
  'ramazan', 'ramazanda', 'ramazanin', 'kadir', 'arafat',
  'cebrail', 'mikail', 'israfil', 'azrail', 'tevrat', 'incil', 'zebur',
  'adem', 'ibrahim', 'musa', 'isa', 'nuh', 'yusuf', 'davud', 'suleyman',
  'meryem', 'hatice', 'aise', 'omer', 'osman', 'ebubekir',
  'eyyub', 'yunus', 'ismail', 'ishak', 'yakub', 'harun', 'zekeriya', 'yahya',
  'idris', 'ilyas', 'salih', 'hud', 'lut', 'suayb', 'zulkifl', 'ali', 'ebubekr',
]);

/** Konuşma tanımanın noktasız yazdığı dinî kısaltmalar. */
const KISALTMA_DUZELTME = new Map([
  ['hz', 'Hz.'],
  ['sav', '(s.a.v.)'],
  ['as', 'Hz.'],
]);

/** Bu önekle başlayan her kelime özel addır ("Allah'ın", "Allahu"). */
const OZEL_AD_ONEKLERI = ['allah', 'resulullah', 'resulullahin', 'peygamberimiz'];

/**
 * Konuşma tanıma her şeyi küçük harfle yazar; dinî özel adları büyütür.
 * Arapça ibarelere ve zaten büyük yazılmış kelimelere dokunmaz.
 */
export function ozelAdlariBuyut(metin = '') {
  if (arapcaMi(metin)) return metin;
  return String(metin).replace(/\p{L}[\p{L}'’]*/gu, (kelime) => {
    const sade = cevrimyaziSadele(kelime);
    // "hz eyyüb" → "Hz. Eyyüb"
    const kisaltma = KISALTMA_DUZELTME.get(sade);
    if (kisaltma === 'Hz.' && sade === 'hz') return kisaltma;

    if (/^\p{Lu}/u.test(kelime)) return kelime;
    const eslesir =
      OZEL_AD_TOKENLERI.has(sade) || OZEL_AD_ONEKLERI.some((onek) => sade.startsWith(onek));
    if (!eslesir) return kelime;
    return trBuyuk(kelime[0]) + kelime.slice(1);
  });
}

// --- Kaynak adları ----------------------------------------------------------

export const SURELER = [
  'Fâtiha', 'Bakara', 'Âl-i İmrân', 'Nisâ', 'Mâide', 'En’âm', 'A’râf',
  'Enfâl', 'Tevbe', 'Yûnus', 'Hûd', 'Yûsuf', 'Ra’d', 'İbrâhim', 'Hicr',
  'Nahl', 'İsrâ', 'Kehf', 'Meryem', 'Tâhâ', 'Enbiyâ', 'Hac', 'Mü’minûn',
  'Nûr', 'Furkân', 'Şuarâ', 'Neml', 'Kasas', 'Ankebût', 'Rûm', 'Lokmân',
  'Secde', 'Ahzâb', 'Sebe', 'Fâtır', 'Yâsîn', 'Sâffât', 'Sâd', 'Zümer',
  'Gâfir', 'Fussilet', 'Şûrâ', 'Zuhruf', 'Duhân', 'Câsiye', 'Ahkâf',
  'Muhammed', 'Fetih', 'Hucurât', 'Kâf', 'Zâriyât', 'Tûr', 'Necm', 'Kamer',
  'Rahmân', 'Vâkıa', 'Hadîd', 'Mücâdele', 'Haşr', 'Mümtehine', 'Saf', 'Cuma',
  'Münâfikûn', 'Teğâbün', 'Talâk', 'Tahrîm', 'Mülk', 'Kalem', 'Hâkka',
  'Meâric', 'Nûh', 'Cin', 'Müzzemmil', 'Müddessir', 'Kıyâme', 'İnsan',
  'Mürselât', 'Nebe', 'Nâziât', 'Abese', 'Tekvîr', 'İnfitâr', 'Mutaffifîn',
  'İnşikâk', 'Bürûc', 'Târık', 'A’lâ', 'Gâşiye', 'Fecr', 'Beled', 'Şems',
  'Leyl', 'Duhâ', 'İnşirâh', 'Tîn', 'Alak', 'Kadir', 'Beyyine', 'Zilzâl',
  'Âdiyât', 'Kâria', 'Tekâsür', 'Asr', 'Hümeze', 'Fîl', 'Kureyş', 'Mâûn',
  'Kevser', 'Kâfirûn', 'Nasr', 'Mesed', 'İhlâs', 'Felak', 'Nâs',
];

// Eş adlar: hocanın kullandığı ikinci isim de aynı sûreye çıksın.
const SURE_ES_ADLARI = {
  'ali imran': 'Âl-i İmrân',
  'al-i imran': 'Âl-i İmrân',
  'mumin': 'Gâfir',
  'tebbet': 'Mesed',
  'insirah': 'İnşirâh',
  'duha': 'Duhâ',
  'yasin': 'Yâsîn',
  'ihlas': 'İhlâs',
};

const sureAnahtari = (ad) => cevrimyaziSadele(ad).replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

const SURE_DIZINI = new Map([
  ...SURELER.map((ad) => [sureAnahtari(ad), ad]),
  ...Object.entries(SURE_ES_ADLARI).map(([anahtar, ad]) => [sureAnahtari(anahtar), ad]),
]);

export const HADIS_KAYNAKLARI = [
  'Buhârî', 'Müslim', 'Tirmizî', 'Ebû Dâvûd', 'Nesâî', 'İbn Mâce',
  'Ahmed b. Hanbel', 'Muvatta', 'Dârimî', 'Beyhakî', 'Hâkim', 'Taberânî',
  'Riyâzü’s-Sâlihîn', 'Kütüb-i Sitte', 'Müsned',
];

const HADIS_DIZINI = new Map(
  HADIS_KAYNAKLARI.map((ad) => [sureAnahtari(ad), ad]),
);

/**
 * Cümledeki sûre adı + ayet numarasını bulur.
 * "Bakara sûresi 255. âyette" → "Bakara 255"
 */
export function ayetKaynagi(metin = '') {
  const kelimeler = String(metin).split(/\s+/).filter(Boolean);
  const sadeler = kelimeler.map(sureAnahtari);

  for (let i = 0; i < sadeler.length; i += 1) {
    for (const uzunluk of [3, 2, 1]) {
      const aday = sadeler.slice(i, i + uzunluk).join(' ').trim();
      const sure = SURE_DIZINI.get(aday);
      if (!sure) continue;
      // Sûre adının çevresinde ayet numarası ara.
      const pencere = kelimeler.slice(Math.max(0, i - 2), i + uzunluk + 4).join(' ');
      const numara = pencere.match(/(\d{1,3})\s*\.?\s*(?:â?yet|ayet)?/u);
      return numara?.[1] ? `${sure} ${numara[1]}` : sure;
    }
  }
  return null;
}

/** Cümledeki hadis kaynağını bulur: "Buhârî, İman, 1". */
export function hadisKaynagi(metin = '') {
  const kelimeler = String(metin).split(/\s+/).filter(Boolean);
  const sadeler = kelimeler.map(sureAnahtari);

  for (let i = 0; i < sadeler.length; i += 1) {
    for (const uzunluk of [3, 2, 1]) {
      const aday = sadeler.slice(i, i + uzunluk).join(' ').trim();
      const kaynak = HADIS_DIZINI.get(aday);
      if (!kaynak) continue;
      const devam = kelimeler
        .slice(i + uzunluk, i + uzunluk + 3)
        .join(' ')
        .match(/^[,;]?\s*([\p{L}\d\s,.'’-]{0,30})/u)?.[1]
        ?.trim()
        .replace(/[.;]+$/, '');
      return devam && /\d/.test(devam) ? `${kaynak}, ${devam}` : kaynak;
    }
  }
  return null;
}

// --- İpucu kalıpları --------------------------------------------------------

const kalipla = (kaliplar) => kaliplar.map((k) => new RegExp(k, 'u'));

/** Ardından gelen sözün ayet olduğunu bildiren kalıplar. */
export const AYET_HABERCISI = kalipla([
  'allah (teâlâ|teala|azze ve celle|c\\.c)',
  'cenâb-ı hak|cenab-ı hak|rabbimiz|yüce allah|yüce rabbimiz',
  'kur’?an-?ı kerîm|kur’?an-?ı kerim|kur’?an’?da|kuran’?da',
  'â?yet-i kerîme|ayet-i kerime|â?yette|ayette|â?yetin|ayetinde',
  '(sûres|sures)(i|inde|inin)',
  'nâzil ol|nazil ol',
  'mealen buyur|meâlen buyur',
]);

/** Ardından gelen sözün hadis olduğunu bildiren kalıplar. */
export const HADIS_HABERCISI = kalipla([
  'peygamber efendimiz|peygamberimiz|resûlullah|resulullah|resûl-i ekrem',
  'hz\\.? muhammed|efendimiz \\(?s\\.?a\\.?v\\.?\\)?',
  'sallallahu aleyhi ve sellem|sallallahü aleyhi ve sellem|\\bs\\.a\\.v\\b|\\bsav\\b',
  'hadîs-i şerîf|hadis-i şerif|hadîste|hadiste|hadîsinde|hadisinde',
  'rivâyet ed|rivayet ed|rivâyette|rivayette',
  'buyurmuşlar|buyurdular',
]);

/** Alıntının hemen geleceğini bildiren "aktarım" kalıpları. */
export const AKTARIM_HABERCISI = kalipla([
  'buyuruyor ki|buyurdu ki|buyurur ki|şöyle buyur|şöyle der|diyor ki',
  'şöyle buyurmuştur|şöyle buyurmaktadır|şu şekilde buyur',
  'meâli şudur|meali şudur|şöyle demiştir',
]);

export const DUA_IPUCLARI = kalipla([
  'allah’?ım|allahım|rabbim bize|rabbenâ|rabbena|allâhümme|allahümme',
  '^duâ|^dua ed|duâsı şudur|duası şudur|âmin$|amin$',
  'nasip eyle|muhafaza eyle|affeyle|bağışla yâ rabbi',
]);

/** Mezhep / âlim görüşü bildiren kalıplar. */
export const GORUS_IPUCLARI = kalipla([
  '(hanefî|hanefi|şâfiî|safii|şafii|mâlikî|maliki|hanbelî|hanbeli) (mezhebine|mezhebi|âlimlerine|alimlerine|fıkhına)',
  'mezhebine göre|mezheplere göre|cumhûra göre|cumhura göre',
  'imâm-ı a’zam|imam-ı azam|imâm şâfiî|imam şafii|imâm mâlik|imam malik|ahmed b\\. hanbel’e göre',
  'âlimlere göre|alimlere göre|müctehid|ictihâd|ictihad|ihtilâf|ihtilaf var',
  'bu konuda (iki|üç|farklı) görüş',
]);

/** Meal / açıklama cümlesi (ayetin Türkçe karşılığı). */
export const MEAL_IPUCLARI = kalipla([
  '^meâli|^meali|^anlamı|^mânâsı|^manası|^türkçesi',
  '^yani (bu|burada|şu)',
  'buyurulmaktadır$|denilmektedir$',
]);

const eslesirMi = (kaliplar, sade) => kaliplar.some((kalip) => kalip.test(sade));

/**
 * Bir cümlenin İslami içerik türünü belirler.
 * @returns {{tur:'ayet'|'hadis'|'dua'|'arapca'|'gorus'|'meal', kaynak?:string, dogrulanmadi?:boolean}|null}
 */
export function islamiTur(cumle = '') {
  const metin = String(cumle).trim();
  if (!metin) return null;
  const sade = trKucuk(metin);

  if (bilinenIbareMi(metin)) return { tur: 'arapca', dogrulanmadi: true };

  const ibare = arapcaIbareMi(metin);
  const ayetHaberi = eslesirMi(AYET_HABERCISI, sade);
  const hadisHaberi = eslesirMi(HADIS_HABERCISI, sade);

  // Arapça ibare + haberci → doğrudan alıntı.
  if (ibare) {
    if (hadisHaberi) return { tur: 'hadis', kaynak: hadisKaynagi(metin), dogrulanmadi: true };
    if (ayetHaberi) return { tur: 'ayet', kaynak: ayetKaynagi(metin), dogrulanmadi: true };
    if (eslesirMi(DUA_IPUCLARI, sade)) return { tur: 'dua', dogrulanmadi: true };
    return { tur: 'arapca', dogrulanmadi: true };
  }

  // Arapça değil ama kaynak künyesi taşıyor → alıntı künyesi/atıf cümlesi.
  const ayetKunyesi = ayetKaynagi(metin);
  if (ayetHaberi && ayetKunyesi) {
    return { tur: 'ayet', kaynak: ayetKunyesi, dogrulanmadi: true };
  }
  const hadisKunyesi = hadisKaynagi(metin);
  if (hadisHaberi && (hadisKunyesi || eslesirMi(AKTARIM_HABERCISI, sade))) {
    return { tur: 'hadis', kaynak: hadisKunyesi, dogrulanmadi: true };
  }

  if (eslesirMi(GORUS_IPUCLARI, sade)) return { tur: 'gorus' };
  if (eslesirMi(DUA_IPUCLARI, sade)) return { tur: 'dua' };
  if (eslesirMi(MEAL_IPUCLARI, sade)) return { tur: 'meal' };

  return null;
}

/** Cümle "şimdi alıntı geliyor" diyor mu? */
export function aktarimHabercisiMi(cumle = '') {
  const sade = trKucuk(cumle);
  return eslesirMi(AKTARIM_HABERCISI, sade);
}

/**
 * Sınıflandırılmış cümleler üzerinde ikinci geçiş:
 * "Allah Teâlâ buyuruyor ki:" gibi bir habercinin ardından gelen cümleyi
 * alıntı (ayet/hadis) olarak işaretler ve künyeyi habercisinden devralır.
 *
 * @param {Array<{tur:string, metin:string}>} siniflar
 */
export function alintilariIsaretle(siniflar = []) {
  const sonuc = siniflar.map((cumle) => ({ ...cumle }));

  for (let i = 0; i < sonuc.length; i += 1) {
    const cumle = sonuc[i];
    const sade = trKucuk(cumle.metin);
    if (!aktarimHabercisiMi(cumle.metin)) continue;

    const ayetHaberi = eslesirMi(AYET_HABERCISI, sade);
    const hadisHaberi = eslesirMi(HADIS_HABERCISI, sade);
    if (!ayetHaberi && !hadisHaberi) continue;

    const tur = hadisHaberi ? 'hadis' : 'ayet';
    const kaynak = hadisHaberi ? hadisKaynagi(cumle.metin) : ayetKaynagi(cumle.metin);

    // Haberci cümlesinin kendisi girişten ibaretse alıntıya dönüştürme;
    // bir sonraki cümleyi alıntı yap.
    const sonraki = sonuc[i + 1];
    if (!sonraki || sonraki.tur === 'gereksiz') continue;
    if (sonraki.tur === 'ayet' || sonraki.tur === 'hadis') {
      sonraki.kaynak = sonraki.kaynak || kaynak;
      continue;
    }

    sonraki.tur = tur;
    sonraki.kaynak = kaynak;
    sonraki.dogrulanmadi = true;
    sonraki.giris = cumle.metin;
    cumle.tur = 'gereksiz';
    cumle.gerekce = 'alıntı girişi';

    // Alıntının hemen ardındaki meal cümlesini de bağla.
    const mealAdayi = sonuc[i + 2];
    if (mealAdayi && !arapcaIbareMi(mealAdayi.metin)) {
      if (eslesirMi(MEAL_IPUCLARI, trKucuk(mealAdayi.metin)) || arapcaIbareMi(sonraki.metin)) {
        mealAdayi.tur = 'meal';
        mealAdayi.aitOlduguIndeks = i + 1;
      }
    }
  }

  // "Bu hadis Müslim'de geçmektedir." → künyeyi önceki alıntıya bağla,
  // cümleyi de nota ayrı madde olarak koyma.
  const KUNYE_CUMLESI = {
    hadis: /\bbu (hadîs|hadis|rivâyet|rivayet)\b/u,
    ayet: /\bbu (â?yet|ayet)\b/u,
  };

  for (let i = 1; i < sonuc.length; i += 1) {
    const cumle = sonuc[i];
    if (cumle.tur === 'gereksiz') continue;
    const sade = trKucuk(cumle.metin);

    for (const [tur, kalip] of Object.entries(KUNYE_CUMLESI)) {
      if (!kalip.test(sade)) continue;
      const kunye = tur === 'hadis' ? hadisKaynagi(cumle.metin) : ayetKaynagi(cumle.metin);
      if (!kunye) continue;

      const hedef = sonuc.slice(0, i).reverse().find((onceki) => onceki.tur === tur);
      if (!hedef) continue;

      hedef.kaynak = hedef.kaynak || kunye;
      cumle.tur = 'gereksiz';
      cumle.gerekce = 'künye, alıntıya bağlandı';
      break;
    }
  }

  return sonuc;
}

/** Notta hiç doğrulanmamış dini alıntı var mı? */
export const dogrulamaUyarisiGerekliMi = (not) =>
  Boolean(not?.ayetler?.length || not?.hadisler?.length || not?.arapcaPasajlar?.length);

export const DOGRULAMA_UYARISI =
  'Ayet, hadis ve Arapça ibareler konuşma tanımadan geldiği gibi yazılmıştır ve ' +
  'doğrulanmamıştır. Paylaşmadan önce mushaftan ve güvenilir hadis kaynağından teyit edin.';

/** Kısa metinlerde işe yarayan yardımcı: cümle kaç kelime? */
export const kelimeSayisi = (metin = '') => kelimelere(metin).length;
