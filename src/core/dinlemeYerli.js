// Android uygulamasında (APK) canlı dinleme.
//
// Android WebView, tarayıcıdaki SpeechRecognition API'sini içermez; bu yüzden
// uygulama sürümünde cihazın kendi konuşma tanıma servisi kullanılır.
// Arayüz `Dinleyici` ile birebir aynıdır, böylece uygulama tarafı değişmez.

// Doğrudan içe aktarılır: tıklama anında ayrı bir parça indirmek zorunda
// kalmamak için. Bu dosyanın kendisi zaten yalnızca uygulamada yükleniyor.
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

const HATA_METINLERI = {
  denied: 'Mikrofon izni verilmedi. Uygulama ayarlarından izin verin.',
  unavailable: 'Bu cihazda konuşma tanıma servisi bulunamadı.',
};

export class YerliDinleyici {
  constructor(secenekler = {}) {
    const { dil = 'tr-TR', onAra, onKesin, onDurum, onHata } = secenekler;
    this.dil = dil;
    this.onAra = onAra || (() => {});
    this.onKesin = onKesin || (() => {});
    this.onDurum = onDurum || (() => {});
    this.onHata = onHata || (() => {});

    this.istendi = false;
    this.calisiyor = false;
    this.sonAra = '';
    this.dinleyiciler = [];
    this.zamanlayici = null;
    this.eklenti = null;
  }

  async #eklentiGetir() {
    if (!SpeechRecognition) throw new Error('SpeechRecognition eklentisi bulunamadı');
    this.eklenti = SpeechRecognition;
    return this.eklenti;
  }

  /** Son ara sonucu kesin sonuç olarak yaz — Android sessizlikte oturumu kapatır. */
  #arayiKesinlestir() {
    const metin = this.sonAra.trim();
    this.sonAra = '';
    this.onAra('');
    if (metin) this.onKesin(metin);
  }

  async #oturumBaslat() {
    if (!this.istendi || this.calisiyor) return;
    const eklenti = await this.#eklentiGetir();
    this.calisiyor = true;
    try {
      await eklenti.start({
        language: this.dil,
        maxResults: 1,
        partialResults: true,
        popup: false,
      });
      this.onDurum('dinliyor');
    } catch (sorun) {
      this.calisiyor = false;
      if (!this.istendi) return;
      // Servis meşgulse kısa bir bekleyişten sonra yeniden dener.
      this.onDurum('yeniden-baglanıyor');
      this.zamanlayici = setTimeout(() => this.#oturumBaslat(), 400);
      if (sorun?.message && !/busy|client/i.test(sorun.message)) {
        this.onHata(sorun.message);
      }
    }
  }

  async baslat() {
    let eklenti;
    try {
      eklenti = await this.#eklentiGetir();
    } catch (sorun) {
      this.onHata(`Konuşma tanıma eklentisi yüklenemedi: ${sorun.message}`);
      return false;
    }

    try {
      const { available } = await eklenti.available();
      if (!available) {
        this.onHata(HATA_METINLERI.unavailable);
        return false;
      }
    } catch (sorun) {
      this.onHata(`Konuşma tanıma servisi sorgulanamadı: ${sorun.message}`);
      return false;
    }

    try {
      let izin = await eklenti.checkPermissions();
      if (izin.speechRecognition !== 'granted') {
        izin = await eklenti.requestPermissions();
      }
      if (izin.speechRecognition !== 'granted') {
        this.onHata(`${HATA_METINLERI.denied} (durum: ${izin.speechRecognition})`);
        return false;
      }
    } catch (sorun) {
      this.onHata(`Mikrofon izni istenemedi: ${sorun.message}`);
      return false;
    }

    this.istendi = true;

    const araDinleyici = await eklenti.addListener('partialResults', (olay) => {
      const metin = olay?.matches?.[0];
      if (!metin) return;
      this.sonAra = metin;
      this.onAra(metin);
    });

    const durumDinleyici = await eklenti.addListener('listeningState', (olay) => {
      if (olay?.status === 'stopped') {
        this.calisiyor = false;
        this.#arayiKesinlestir();
        if (!this.istendi) {
          this.onDurum('durdu');
          return;
        }
        // Android sessizlikte oturumu kapatır; ders sürdüğü için yeniden aç.
        this.onDurum('yeniden-baglanıyor');
        this.zamanlayici = setTimeout(() => this.#oturumBaslat(), 250);
      }
    });

    this.dinleyiciler = [araDinleyici, durumDinleyici];
    await this.#oturumBaslat();
    // İlk oturum açılamadıysa çağıran taraf kaydı başlatmış saymasın.
    return this.calisiyor || Boolean(this.zamanlayici);
  }

  async durdur() {
    this.istendi = false;
    clearTimeout(this.zamanlayici);
    try {
      const eklenti = await this.#eklentiGetir();
      await eklenti.stop();
    } catch {
      // zaten durmuş olabilir
    }
    this.#arayiKesinlestir();
    for (const dinleyici of this.dinleyiciler) {
      try {
        await dinleyici.remove();
      } catch {
        // yoksay
      }
    }
    this.dinleyiciler = [];
    this.calisiyor = false;
    this.onDurum('durdu');
  }
}
