// Tarayıcının konuşma tanıma motoruyla canlı dinleme.
//
// Chrome/Edge (masaüstü) ve Android Chrome bu API'yi destekler. Motor uzun
// sessizliklerde kendini kapattığı için ders boyunca otomatik yeniden başlatılır.

const TanimaSinifi =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export const konusmaTanimaVarMi = () => Boolean(TanimaSinifi);

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
    const { dil = 'tr-TR', onAra, onKesin, onDurum, onHata } = secenekler;
    this.dil = dil;
    this.onAra = onAra || (() => {});
    this.onKesin = onKesin || (() => {});
    this.onDurum = onDurum || (() => {});
    this.onHata = onHata || (() => {});
    this.calisiyor = false;
    this.istendi = false;
    this.yenidenDeneme = 0;
    this.zamanlayici = null;
    this.tanima = null;
  }

  #kur() {
    const tanima = new TanimaSinifi();
    tanima.lang = this.dil;
    tanima.continuous = true;
    tanima.interimResults = true;
    tanima.maxAlternatives = 1;

    tanima.onstart = () => {
      this.calisiyor = true;
      this.yenidenDeneme = 0;
      this.onDurum('dinliyor');
    };

    tanima.onresult = (olay) => {
      let ara = '';
      for (let i = olay.resultIndex; i < olay.results.length; i += 1) {
        const sonuc = olay.results[i];
        const metin = sonuc[0]?.transcript?.trim();
        if (!metin) continue;
        if (sonuc.isFinal) this.onKesin(metin);
        else ara += `${metin} `;
      }
      this.onAra(ara.trim());
    };

    tanima.onerror = (olay) => {
      const mesaj = HATA_METINLERI[olay.error] ?? `Tanıma hatası: ${olay.error}`;
      if (olay.error === 'not-allowed' || olay.error === 'service-not-allowed') {
        this.istendi = false;
        this.onDurum('durdu');
      }
      if (mesaj) this.onHata(mesaj);
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
