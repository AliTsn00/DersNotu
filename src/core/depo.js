// Dersleri tarayıcıda saklama (IndexedDB) ve ayarlar (localStorage).
// Tüm veri cihazda kalır; hiçbir sunucuya gönderilmez.

const VERITABANI = 'ders-notu';
const SURUM = 2;
const DEPO = 'dersler';

/**
 * Yeni kayıtlara basılan şema damgası. İleride bir alanın anlamı değişirse,
 * hangi kaydın hangi şemadan geldiği bu alandan bilinir ve dönüşüm yalnızca
 * eski kayıtlara uygulanır.
 */
export const KAYIT_SURUMU = 1;

let baglantiSozu = null;

/**
 * Şema yükseltmeleri. Her adım kendi koşuluyla çalışır ve atlanabilir olmalı:
 * kullanıcı sürüm 1'den de gelebilir, hiç veritabanı olmayan durumdan da.
 */
function surumYukselt(veritabani, hareket, eskiSurum) {
  if (eskiSurum < 1) {
    const depo = veritabani.createObjectStore(DEPO, { keyPath: 'id' });
    depo.createIndex('tarih', 'tarih');
  }
  if (eskiSurum < 2) {
    // Sürüm 1 kayıtlarında damga yok; geriye dönük olarak basılır.
    const depo = hareket.objectStore(DEPO);
    depo.openCursor().onsuccess = (olay) => {
      const imlec = olay.target.result;
      if (!imlec) return;
      if (imlec.value?.surum == null) imlec.update({ ...imlec.value, surum: 1 });
      imlec.continue();
    };
  }
}

function baglan() {
  if (baglantiSozu) return baglantiSozu;
  baglantiSozu = new Promise((cozumle, reddet) => {
    const istek = indexedDB.open(VERITABANI, SURUM);
    istek.onupgradeneeded = (olay) => {
      surumYukselt(istek.result, istek.transaction, olay.oldVersion);
    };
    istek.onsuccess = () => cozumle(istek.result);
    istek.onerror = () => reddet(istek.error);
  });
  return baglantiSozu;
}

function islem(kip, calistir) {
  return baglan().then(
    (veritabani) =>
      new Promise((cozumle, reddet) => {
        const hareket = veritabani.transaction(DEPO, kip);
        const istek = calistir(hareket.objectStore(DEPO));
        hareket.onerror = () => reddet(hareket.error);
        hareket.oncomplete = () => cozumle(istek?.result);
      }),
  );
}

export const dersKaydet = (ders) =>
  islem('readwrite', (depo) => depo.put({ surum: KAYIT_SURUMU, ...ders }));
export const dersSil = (id) => islem('readwrite', (depo) => depo.delete(id));
export const dersGetir = (id) => islem('readonly', (depo) => depo.get(id));

export async function dersleriGetir() {
  const hepsi = await islem('readonly', (depo) => depo.getAll());
  return (hepsi || []).sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
}

export function yeniKimlik() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `ders-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// --- Ayarlar ---------------------------------------------------------------

const AYAR_ANAHTARI = 'ders-notu:ayarlar';

export const VARSAYILAN_AYARLAR = {
  dil: 'tr-TR',
  detay: 'orta',
  dolguTemizle: true,
  ekraniAcikTut: true,
  // Groq varsayılan: kalıcı ücretsiz katmanı bu iş için fazlasıyla yeterli
  // (günde 8 saat ses) ve uç noktası OpenAI ile birebir uyumlu.
  cevirimModel: 'whisper-large-v3',
  cevirimUrl: 'https://api.groq.com/openai/v1',
  cevirimAnahtari: '',
  // Yapay zekâ ile not çıkarma (Cloudflare Workers AI, ücretsiz katman).
  zekaHesap: '',
  zekaAnahtari: '',
  zekaModel: 'llama-3.3-70b',
};

export function ayarlariOku() {
  try {
    const ham = localStorage.getItem(AYAR_ANAHTARI);
    return ham ? { ...VARSAYILAN_AYARLAR, ...JSON.parse(ham) } : { ...VARSAYILAN_AYARLAR };
  } catch {
    return { ...VARSAYILAN_AYARLAR };
  }
}

export function ayarlariYaz(ayarlar) {
  try {
    localStorage.setItem(AYAR_ANAHTARI, JSON.stringify(ayarlar));
  } catch {
    // depolama kapalıysa sessizce geç
  }
}

// --- Kaydedilmemiş taslak ----------------------------------------------------
//
// Ders sürerken sekme kapanırsa, tarayıcı sekmeyi bellekten atarsa ya da telefon
// uygulamayı öldürürse ham metin kaybolurdu. Taslak bu yüzden localStorage'da
// tutulur: IndexedDB eşzamansızdır ve sayfa kapanırken yazma sözü tamamlanmaz,
// localStorage ise eşzamanlı olduğu için `pagehide` anında güvenle yazar.

const TASLAK_ANAHTARI = 'ders-notu:taslak';

export function taslakYaz(taslak) {
  try {
    if (!taslak?.hamMetin?.trim()) {
      localStorage.removeItem(TASLAK_ANAHTARI);
      return;
    }
    localStorage.setItem(TASLAK_ANAHTARI, JSON.stringify({ ...taslak, zaman: Date.now() }));
  } catch {
    // kota dolabilir; taslak kaybı uygulamayı durduracak kadar önemli değil
  }
}

export function taslakOku() {
  try {
    const ham = localStorage.getItem(TASLAK_ANAHTARI);
    if (!ham) return null;
    const taslak = JSON.parse(ham);
    return taslak?.hamMetin ? taslak : null;
  } catch {
    return null;
  }
}

export function taslakSil() {
  try {
    localStorage.removeItem(TASLAK_ANAHTARI);
  } catch {
    // yoksay
  }
}
