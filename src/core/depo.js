// Dersleri tarayıcıda saklama (IndexedDB) ve ayarlar (localStorage).
// Tüm veri cihazda kalır; hiçbir sunucuya gönderilmez.

const VERITABANI = 'ders-notu';
const SURUM = 1;
const DEPO = 'dersler';

let baglantiSozu = null;

function baglan() {
  if (baglantiSozu) return baglantiSozu;
  baglantiSozu = new Promise((cozumle, reddet) => {
    const istek = indexedDB.open(VERITABANI, SURUM);
    istek.onupgradeneeded = () => {
      const veritabani = istek.result;
      if (!veritabani.objectStoreNames.contains(DEPO)) {
        const depo = veritabani.createObjectStore(DEPO, { keyPath: 'id' });
        depo.createIndex('tarih', 'tarih');
      }
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

export const dersKaydet = (ders) => islem('readwrite', (depo) => depo.put(ders));
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
  sesKaydet: false,
  cevirimModel: 'whisper-1',
  cevirimUrl: 'https://api.openai.com/v1',
  cevirimAnahtari: '',
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
