// Mikrofona gelen ses düzeyini ölçer.
//
// Tanıma kalitesinin en büyük belirleyicisi yazılım değil, fizik: mikrofonun
// hocaya uzaklığı ve ortam gürültüsü. Kullanıcının bunu anlamasının tek yolu
// dersten sonra notu okumaktı — çok geç. Kayıt başlamadan birkaç saniyelik
// ölçüm, kaydı kurtarır.
//
// Ölçüm bilinçli olarak yalnızca kayıt öncesinde yapılır: dinleme sürerken
// ikinci bir mikrofon akışı açmak, bazı Android sürümlerinde tanıma motorunun
// mikrofona erişimiyle çakışıyor. Bir göstergeyi kazanıp kaydı kaybetmek kötü
// bir takas olurdu.

const OLCUM_ARALIGI_MS = 100;

/** Ölçülen düzeye göre kullanıcıya söylenecek söz. */
export function seviyeYorumu(tepe) {
  if (tepe < 0.015) {
    return { durum: 'yok', mesaj: 'Ses gelmiyor. Mikrofon izni ya da cihaz seçimi sorunlu olabilir.' };
  }
  if (tepe < 0.05) {
    return { durum: 'zayif', mesaj: 'Ses çok zayıf. Telefonu hocaya yaklaştırın ya da önündeki engeli kaldırın.' };
  }
  if (tepe > 0.85) {
    return { durum: 'yuksek', mesaj: 'Ses çok yüksek, kırpılıyor olabilir. Mikrofonu biraz uzaklaştırın.' };
  }
  return { durum: 'iyi', mesaj: 'Ses düzeyi iyi. Kayda başlayabilirsiniz.' };
}

/**
 * Mikrofonu açıp ses düzeyini ölçmeye başlar.
 *
 * @param {(deger: number) => void} geriCagri 0–1 arası anlık düzey
 * @returns {Promise<() => void>} ölçümü durduran işlev
 */
export async function seviyeOlcerBaslat(geriCagri) {
  const bos = () => {};
  const SesBaglami = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!navigator.mediaDevices?.getUserMedia || !SesBaglami) return bos;

  let akis = null;
  let baglam = null;
  let zamanlayici = null;

  const durdur = () => {
    clearInterval(zamanlayici);
    akis?.getTracks().forEach((parca) => parca.stop());
    baglam?.close().catch(() => {});
  };

  try {
    akis = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    baglam = new SesBaglami();
    const cozumleyici = baglam.createAnalyser();
    cozumleyici.fftSize = 512;
    baglam.createMediaStreamSource(akis).connect(cozumleyici);

    const tampon = new Uint8Array(cozumleyici.fftSize);
    zamanlayici = setInterval(() => {
      cozumleyici.getByteTimeDomainData(tampon);
      // Dalga biçiminin ortalama karekök genliği: kulağın duyduğu gürlüğe
      // tepe değerinden daha yakın.
      let toplam = 0;
      for (const deger of tampon) {
        const sapma = (deger - 128) / 128;
        toplam += sapma * sapma;
      }
      geriCagri(Math.min(1, Math.sqrt(toplam / tampon.length) * 3));
    }, OLCUM_ARALIGI_MS);
  } catch {
    // İzin verilmediyse ya da cihaz yoksa gösterge yok; kayıt yine çalışır.
    durdur();
    return bos;
  }

  return durdur;
}
