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

function dosyaAdi(tip = '') {
  const temel = tip.split(';')[0];
  return `ders.${UZANTILAR[temel] || 'webm'}`;
}

/**
 * Ses dosyasını OpenAI uyumlu bir servise gönderip metne çevirir.
 * Anahtar yalnızca kullanıcının tarayıcısında saklanır, sunucumuz yoktur.
 *
 * @param {Blob|File} ses
 * @param {{anahtar: string, model?: string, temelUrl?: string, dil?: string}} ayar
 * @returns {Promise<string>}
 */
export async function sesiYaziyaCevir(ses, ayar) {
  const {
    anahtar,
    model = 'whisper-1',
    temelUrl = 'https://api.openai.com/v1',
    dil = 'tr',
  } = ayar;

  if (!anahtar) throw new Error('Önce Ayarlar bölümünden bir API anahtarı girin.');

  const govde = new FormData();
  govde.append('file', ses, ses.name || dosyaAdi(ses.type));
  govde.append('model', model);
  govde.append('language', dil);
  govde.append('response_format', 'json');
  // Türkçe terimlerin doğru yazılması için bağlam ipucu.
  govde.append(
    'prompt',
    'Bu bir Türkçe ders anlatımıdır. Akademik terimleri ve özel adları doğru yazın.',
  );

  const yanit = await fetch(`${temelUrl.replace(/\/$/, '')}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${anahtar}` },
    body: govde,
  });

  if (!yanit.ok) {
    const hata = await yanit.text().catch(() => '');
    throw new Error(`Yazıya çevirme başarısız (${yanit.status}). ${hata.slice(0, 200)}`);
  }

  const veri = await yanit.json();
  return String(veri.text || '').trim();
}
