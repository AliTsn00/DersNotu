// Tarayıcının konuşma tanıma motoruyla canlı dinleme.
//
// Chrome/Edge (masaüstü) ve Android Chrome bu API'yi destekler. Motor uzun
// sessizliklerde kendini kapattığı için ders boyunca otomatik yeniden başlatılır.

import { trKucuk } from '../turkce/harf.js';
import { sozlukAyristir } from '../turkce/isitme.js';

const TanimaSinifi =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const konusmaTanimaVarMi = () => Boolean(TanimaSinifi);

/**
 * Android Chrome aynı konuşmayı birden çok kez "kesin" diye bildirir ve her
 * bildirimde biraz daha uzatır:
 *
 *   "Selamünaleyküm" → "Selamünaleyküm değerli" → "Selamünaleyküm değerli kardeşlerim"
 *
 * Üçü de ayrı satır yazılırsa not tekrarla dolar. Bu yüzden her kesin sonuç bir
 * öncekiyle karşılaştırılıp ne yapılacağına burada karar verilir.
 *
 * @returns {'ekle'|'degistir'|'yoksay'}
 */
export function kesinKarari(yeni, onceki) {
  const y = String(yeni || '').trim();
  const o = String(onceki || '').trim();
  if (!y) return 'yoksay';
  if (!o) return 'ekle';
  // Motor aynı sözü büyük/küçük harfini değiştirerek yeniden bildirebiliyor
  // ("bugün sizlerle peygamber" → "Bugün sizlerle Peygamber"), bu yüzden
  // karşılaştırma Türkçe kurallarıyla harf duyarsız yapılır.
  const yk = trKucuk(y);
  const ok = trKucuk(o);
  if (yk === ok) return 'yoksay';
  // Yeni metin öncekiyle başlıyorsa aynı cümlenin uzamış hâlidir.
  if (yk.startsWith(ok)) return 'degistir';
  // Tersi de olur: motor bazen kısalmış bir sürüm geri gönderir.
  if (ok.startsWith(yk)) return 'yoksay';
  return 'ekle';
}

/**
 * Kesin sonucu ham metne katar. `degistir` doğruysa son satırın üzerine yazar;
 * bölütleyici satır sonlarını sert cümle sınırı saydığı için yeni satır açmak,
 * uzayan cümleyi ikiye bölmek demektir.
 */
export function kesiniKat(hamMetin, metin, degistir) {
  if (!hamMetin) return metin;
  if (!degistir) return `${hamMetin}\n${metin}`;
  const kirilma = hamMetin.lastIndexOf('\n');
  return kirilma === -1 ? metin : `${hamMetin.slice(0, kirilma + 1)}${metin}`;
}

/**
 * Tarayıcının mikrofon izin durumunu okur. Permissions API'nin 'microphone'
 * adını her tarayıcı desteklemiyor; desteklemeyende 'bilinmiyor' döner.
 * @returns {Promise<'granted'|'denied'|'prompt'|'bilinmiyor'>}
 */
export async function mikrofonIzni() {
  try {
    const durum = await navigator.permissions.query({ name: 'microphone' });
    return durum.state;
  } catch {
    return 'bilinmiyor';
  }
}

/**
 * İzin durumu değiştiğinde haber verir. Kullanıcı izni tarayıcı ayarlarından
 * sonradan açtığında ekranda kalmış eski uyarıyı temizlemek için gerekli.
 * @returns {() => void} izlemeyi bırakan işlev
 */
export function mikrofonIzniniIzle(geriCagri) {
  let birak = () => {};
  navigator.permissions
    ?.query({ name: 'microphone' })
    .then((durum) => {
      const isle = () => geriCagri(durum.state);
      durum.addEventListener('change', isle);
      birak = () => durum.removeEventListener('change', isle);
    })
    .catch(() => {});
  return () => birak();
}

/**
 * Motorun ürettiği adaylar arasından ders sözlüğüne en çok uyanı seçer.
 *
 * Tanıma motoru her söz için birden çok okuma üretebiliyor ve bunları güven
 * sırasına diziyor. En güvendiği okuma çoğu zaman doğrudur — ama alışılmadık
 * özel adlarda değil: "Serahsî" yerine sıradan kelimeler tercih ediliyor.
 * Kullanıcı o terimin derste geçeceğini sözlüğe yazmışsa, onu içeren alt aday
 * daha isabetlidir.
 *
 * Eşitlikte ilk aday korunur: sözlük bir şey söylemiyorsa motorun sıralamasına
 * müdahale etmek için sebep yok.
 */
export function adaySec(adaylar, terimler = []) {
  const gecerli = adaylar.filter(Boolean);
  if (gecerli.length < 2 || !terimler.length) return gecerli[0] || '';

  const puanla = (aday) => {
    const kucuk = trKucuk(aday);
    return terimler.reduce(
      (puan, terim) => (terim && kucuk.includes(trKucuk(terim)) ? puan + 1 : puan),
      0,
    );
  };

  let enIyi = gecerli[0];
  let enIyiPuan = puanla(gecerli[0]);
  for (const aday of gecerli.slice(1)) {
    const puan = puanla(aday);
    if (puan > enIyiPuan) {
      enIyiPuan = puan;
      enIyi = aday;
    }
  }
  return enIyi;
}

/** Kullanıcıya gösterilecek hata karşılıkları. */
const HATA_METINLERI = {
  'not-allowed': 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verin.',
  'service-not-allowed': 'Tarayıcı konuşma tanıma servisini engelledi.',
  'audio-capture': 'Mikrofon bulunamadı.',
  network: 'Konuşma tanıma sunucusuna ulaşılamadı. İnternet bağlantınızı kontrol edin.',
  aborted: '',
  'no-speech': '',
};

export class Dinleyici {
  /**
   * @param {{dil?: string, onAra?: Function, onKesin?: Function, onDurum?: Function, onHata?: Function}} secenekler
   */
  constructor(secenekler = {}) {
    const { dil = 'tr-TR', sozluk = '', onAra, onKesin, onDurum, onHata } = secenekler;
    this.dil = dil;
    // Sözlükteki terimler aday seçiminde kullanılır; bir kez ayrıştırılır.
    this.terimler = sozlukAyristir(sozluk).terimler;
    this.onAra = onAra || (() => {});
    this.onKesin = onKesin || (() => {});
    this.onDurum = onDurum || (() => {});
    this.onHata = onHata || (() => {});
    this.calisiyor = false;
    this.istendi = false;
    this.yenidenDeneme = 0;
    this.zamanlayici = null;
    this.tanima = null;
    // Son kesin metin; tekrar eden bildirimleri ayıklamak için tutulur.
    this.sonKesin = '';
  }

  #kur() {
    const tanima = new TanimaSinifi();
    tanima.lang = this.dil;
    tanima.continuous = true;
    tanima.interimResults = true;
    // Birden çok okuma iste: sözlükteki terimler alt adaylarda çıkabiliyor.
    tanima.maxAlternatives = this.terimler.length ? 4 : 1;

    tanima.onstart = () => {
      this.calisiyor = true;
      this.yenidenDeneme = 0;
      this.onDurum('dinliyor');
    };

    tanima.onresult = (olay) => {
      let ara = '';
      for (let i = olay.resultIndex; i < olay.results.length; i += 1) {
        const sonuc = olay.results[i];
        // Ara sonuçlar sürekli değişiyor; aday seçimini yalnızca kesinleşmiş
        // sözde yapmak hem daha ucuz hem daha kararlı.
        const metin = sonuc.isFinal
          ? adaySec(
              Array.from({ length: sonuc.length }, (_, sira) => sonuc[sira]?.transcript?.trim()),
              this.terimler,
            )
          : sonuc[0]?.transcript?.trim();
        if (!metin) continue;
        if (sonuc.isFinal) {
          const karar = kesinKarari(metin, this.sonKesin);
          if (karar === 'yoksay') continue;
          this.sonKesin = metin;
          // `degistir` doğruysa bu, önceki satırın uzamış hâlidir; yeni satır
          // açılmaz, sonuncusunun üzerine yazılır.
          this.onKesin(metin, karar === 'degistir');
        } else ara += `${metin} `;
      }
      this.onAra(ara.trim());
    };

    tanima.onerror = (olay) => {
      const mesaj = HATA_METINLERI[olay.error] ?? `Tanıma hatası: ${olay.error}`;
      if (olay.error === 'not-allowed' || olay.error === 'service-not-allowed') {
        this.istendi = false;
        this.onDurum('durdu');
      }
      // Hata kodu da geçilir: çağıran taraf "izin verilmedi" durumunu gerçek
      // izin durumuyla karşılaştırıp daha doğru bir mesaj gösterebilsin.
      if (mesaj) this.onHata(mesaj, olay.error);
    };

    tanima.onend = () => {
      this.calisiyor = false;
      if (!this.istendi) {
        this.onDurum('durdu');
        return;
      }
      // Motor kendiliğinden kapandı: artan gecikmeyle yeniden başlat.
      this.yenidenDeneme += 1;
      const gecikme = Math.min(200 * this.yenidenDeneme, 3000);
      this.onDurum('yeniden-baglanıyor');
      this.zamanlayici = setTimeout(() => this.#basla(), gecikme);
    };

    return tanima;
  }

  #basla() {
    if (!this.istendi || this.calisiyor) return;
    try {
      this.tanima = this.#kur();
      this.tanima.start();
    } catch {
      // start() üst üste çağrıldığında InvalidStateError atar; yoksayılır.
    }
  }

  baslat() {
    if (!TanimaSinifi) {
      this.onHata('Bu tarayıcı canlı konuşma tanımayı desteklemiyor.');
      return false;
    }
    this.istendi = true;
    this.yenidenDeneme = 0;
    // Yeni oturum: önceki dersin son cümlesi tekrar sanılmasın.
    this.sonKesin = '';
    this.#basla();
    return true;
  }

  durdur() {
    this.istendi = false;
    clearTimeout(this.zamanlayici);
    try {
      this.tanima?.stop();
    } catch {
      // zaten durmuş olabilir
    }
    this.calisiyor = false;
    this.onDurum('durdu');
  }
}
