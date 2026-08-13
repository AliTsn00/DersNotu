// Ses kaydı (MediaRecorder) ve dosyadan yazıya çevirme.
//
// iOS Safari canlı konuşma tanımayı desteklemediği için bu yol kullanılır:
// ders kaydedilir, ardından OpenAI uyumlu bir yazıya çevirme servisine gönderilir.

export const kayitVarMi = () =>
  typeof window !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof MediaRecorder !== 'undefined';

/** Tarayıcının desteklediği ilk ses biçimini seçer. */
function bicimSec() {
  const adaylar = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return adaylar.find((tip) => MediaRecorder.isTypeSupported?.(tip)) || '';
}

export class SesKaydedici {
  constructor() {
    this.kaydedici = null;
    this.akis = null;
    this.parcalar = [];
  }

  async baslat() {
    this.akis = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const mimeType = bicimSec();
    this.parcalar = [];
    this.kaydedici = new MediaRecorder(this.akis, mimeType ? { mimeType } : undefined);
    this.kaydedici.ondataavailable = (olay) => {
      if (olay.data?.size) this.parcalar.push(olay.data);
    };
    this.kaydedici.start(1000);
  }

  /** @returns {Promise<Blob|null>} */
  durdur() {
    return new Promise((cozumle) => {
      if (!this.kaydedici || this.kaydedici.state === 'inactive') {
        cozumle(null);
        return;
      }
      this.kaydedici.onstop = () => {
        const tip = this.kaydedici.mimeType || 'audio/webm';
        const ses = new Blob(this.parcalar, { type: tip });
        this.akis?.getTracks().forEach((iz) => iz.stop());
        this.akis = null;
        cozumle(ses);
      };
      this.kaydedici.stop();
    });
  }

  vazgec() {
    try {
      this.kaydedici?.stop();
    } catch {
      // yoksay
    }
    this.akis?.getTracks().forEach((iz) => iz.stop());
    this.akis = null;
    this.parcalar = [];
  }
}

const UZANTILAR = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
};

/**
 * Hazır servis ayarları. Hepsi OpenAI uyumlu `/audio/transcriptions`
 * uç noktasını konuştuğu için tek bir istek koduyla çalışırlar.
 */
export const CEVIRIM_SERVISLERI = {
  groq: {
    ad: 'Groq — ücretsiz',
    url: 'https://api.groq.com/openai/v1',
    model: 'whisper-large-v3',
    enBuyukMB: 25,
    adres: 'console.groq.com',
    aciklama: 'Kalıcı ücretsiz katman: günde 8 saat, saatte 2 saat ses.',
  },
  openai: {
    ad: 'OpenAI — ücretli',
    url: 'https://api.openai.com/v1',
    model: 'whisper-1',
    enBuyukMB: 25,
    adres: 'platform.openai.com',
    aciklama: 'Saati yaklaşık 0,36 dolar.',
  },
};

/**
 * Konuşma tanımaya verilen bağlam örneği. Bu alan bir talimat değil, stil
 * örneğidir: beklenen terimleri içeren kısa bir metin tanımayı iyileştirir.
 * Sınır ~224 token olduğu için liste kısa tutulur; kalan düzeltme not
 * çıkarma adımına bırakılır.
 */
export const CEVIRIM_IPUCU =
  'Bu bir Türkçe ders anlatımıdır. Akademik terimleri ve özel adları doğru yazın. ' +
  'Bakara sûresi 153. âyet, sallallahu aleyhi ve sellem, Buhârî, Müslim, Tirmizî, ' +
  'İmam Gazâlî, tefsir, fıkıh, usûl, hadîs-i şerîf, meâl, mezhep, Hanefî.';

/** Uzun yüklemelerde bile takılı kalmamak için üst sınır. */
const ZAMAN_ASIMI_MS = 10 * 60 * 1000;

function dosyaAdi(tip = '') {
  const temel = tip.split(';')[0];
  return `ders.${UZANTILAR[temel] || 'webm'}`;
}

const MB = 1024 * 1024;

/** Sunucu yanıtındaki hata durumunu okunur bir Türkçe mesaja çevirir. */
function hataMesaji(durum, govde, temelUrl) {
  const kisa = govde.slice(0, 200);
  switch (durum) {
    case 401:
    case 403:
      return 'API anahtarı kabul edilmedi. Ayarlar bölümünden anahtarı kontrol edin.';
    case 404:
      return `Servis adresi bulunamadı (${temelUrl}). Adresin sonunda /v1 olmalı.`;
    case 413:
      return 'Ses dosyası servis için fazla büyük. Kaydı ikiye bölüp ayrı ayrı yükleyin.';
    case 429:
      return (
        'Kota sınırına ulaşıldı. Groq ücretsiz katmanında saatte 2 saat, ' +
        'günde 8 saat ses işlenebiliyor — bir süre sonra tekrar deneyin.'
      );
    case 500:
    case 502:
    case 503:
      return 'Servis şu anda yanıt vermiyor. Birkaç dakika sonra tekrar deneyin.';
    default:
      return `Yazıya çevirme başarısız (${durum}). ${kisa}`;
  }
}

/**
 * Ses dosyasını OpenAI uyumlu bir servise gönderip metne çevirir.
 * Anahtar yalnızca kullanıcının tarayıcısında saklanır, sunucumuz yoktur.
 *
 * @param {Blob|File} ses
 * @param {{anahtar: string, model?: string, temelUrl?: string, dil?: string,
 *          enBuyukMB?: number, isaret?: AbortSignal}} ayar
 * @returns {Promise<string>}
 */
export async function sesiYaziyaCevir(ses, ayar) {
  const {
    anahtar,
    model = CEVIRIM_SERVISLERI.groq.model,
    temelUrl = CEVIRIM_SERVISLERI.groq.url,
    dil = 'tr',
    enBuyukMB = 25,
    isaret,
  } = ayar;

  if (!anahtar) throw new Error('Önce Ayarlar bölümünden bir API anahtarı girin.');

  // Boyutu önden denetle: 25 MB'lık bir yüklemenin sonunda 413 yemek,
  // özellikle telefon bağlantısında, dakikalarca beklemek demektir.
  if (ses.size > enBuyukMB * MB) {
    throw new Error(
      `Ses dosyası ${(ses.size / MB).toFixed(1)} MB — servis sınırı ${enBuyukMB} MB. ` +
        'Kaydı bölün ya da bilgisayarda küçültüp yükleyin.',
    );
  }

  const govde = new FormData();
  govde.append('file', ses, ses.name || dosyaAdi(ses.type));
  govde.append('model', model);
  govde.append('language', dil);
  govde.append('response_format', 'json');
  govde.append('prompt', CEVIRIM_IPUCU);

  // Kendi zaman aşımımız; dışarıdan gelen iptal işaretiyle birlikte çalışır.
  const durdurucu = new AbortController();
  const sayac = setTimeout(() => durdurucu.abort(), ZAMAN_ASIMI_MS);
  const vazgec = () => durdurucu.abort();
  isaret?.addEventListener('abort', vazgec);

  let yanit;
  try {
    yanit = await fetch(`${temelUrl.replace(/\/$/, '')}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${anahtar}` },
      body: govde,
      signal: durdurucu.signal,
    });
  } catch (sorun) {
    if (sorun.name === 'AbortError') {
      throw new Error(
        isaret?.aborted
          ? 'Yazıya çevirme iptal edildi.'
          : 'Servis 10 dakika içinde yanıt vermedi. Bağlantınızı kontrol edip tekrar deneyin.',
      );
    }
    throw new Error('Servise ulaşılamadı. İnternet bağlantınızı kontrol edin.');
  } finally {
    clearTimeout(sayac);
    isaret?.removeEventListener('abort', vazgec);
  }

  if (!yanit.ok) {
    const hata = await yanit.text().catch(() => '');
    throw new Error(hataMesaji(yanit.status, hata, temelUrl));
  }

  const veri = await yanit.json();
  return String(veri.text || '').trim();
}
