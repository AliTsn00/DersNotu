# Ders Notu

Derste hocanın sesini dinleyip **Türkçe cümle yapısına göre düzenlenmiş, maddeli
ders notu** çıkaran uygulama. Telefonda ve bilgisayarda aynı kod tabanıyla çalışır
(kurulabilir PWA).

```
konuşma  →  ham metin  →  temizle  →  cümlelere ayır  →  noktalama onar
         →  cümleyi sınıflandır  →  maddeli not  →  Markdown / PDF / arşiv
```

## Ne yapar

- **Canlı dinleme.** Ders anlatılırken mikrofondan yazıya çevirir (`tr-TR`).
  Tanıma motoru kendini kapattığında otomatik yeniden bağlanır, ekranın kapanmasını
  engeller.
- **Türkçe'ye göre cümle kurar.** Konuşma tanıma çıktısı noktalamasız gelir; uygulama
  kısaltmaları (`Prof.`, `vb.`, `M.Ö.`), ondalık sayıları (`3.14`) ve sıra sayılarını
  (`1. Dünya Savaşı`) koruyarak böler, yüklem eklerinden ve bağlaçlardan cümle sınırı
  çıkarır, soru cümlelerini (`mı/mi/mu/mü`, `nedir`, `nasıl`) ayırt eder.
- **Notu maddeler.** Her cümleyi rolüne göre yerleştirir: başlık, tanım, örnek,
  liste öğesi, önemli uyarı, özet, soru.
- **Gereksizi atar.** "eee", "yani", "arkadaşlar", "tamam mı", "zil çaldı" gibi dolgu
  ve sınıf yönetimi cümleleri nota girmez (istenirse listelenir).
- **Dışa aktarır.** Markdown, düz metin, PDF (yazdır) ve panoya kopyalama.
- **Cihazda saklar.** Dersler IndexedDB'de tutulur; not çıkarma tamamen çevrimdışı ve
  kural tabanlıdır, metin hiçbir sunucuya gönderilmez.

## Örnek

Girdi (gerçek konuşma tanıma çıktısı gibi, noktalamasız):

```
evet arkadaşlar günaydın bugün fotosentez konusunu işleyeceğiz
fotosentez bitkilerin güneş ışığını kullanarak besin üretmesine denir
fotosentezin iki temel aşaması vardır
birincisi ışık evresidir burada su parçalanır ve oksijen açığa çıkar
ikincisi karanlık evredir bu evrede karbondioksit tutulur
dikkat edin bu ayrım çok önemli sınavda kesinlikle çıkar
tamam mı arkadaşlar zil çaldı defterleri kapatın
```

Çıktı:

```markdown
# Fotosentez

## 1. Fotosentez

- **Fotosentez:** Bitkilerin güneş ışığını kullanarak besin üretmesidir.
- Fotosentezin iki temel aşaması vardır.
  1. Işık evresidir burada su parçalanır ve oksijen açığa çıkar.
  2. Karanlık evredir bu evrede karbondioksit tutulur.
- ⚠️ **Önemli:** Dikkat edin, bu ayrım çok önemli sınavda kesinlikle çıkar.

## Tanımlar

- **Fotosentez** — Bitkilerin güneş ışığını kullanarak besin üretmesidir.
```

## Kurulum

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Türkçe motorunun testleri
npm run build    # dist/ altında dağıtıma hazır PWA
```

Mikrofon erişimi için sayfanın `https` üzerinden (veya `localhost`'ta) açılması
gerekir.

## Nerede çalışır

| Ortam | Canlı dinleme | Ses dosyası yükleme |
| --- | --- | --- |
| Chrome / Edge (Windows, macOS, Linux) | ✅ | ✅ |
| Android Chrome | ✅ | ✅ |
| iPhone / iPad Safari | ❌ (tarayıcı desteklemiyor) | ✅ |
| Firefox | ❌ | ✅ |

Canlı dinleme tarayıcının `SpeechRecognition` API'sini kullanır ve ek bir servis
gerektirmez. Desteklenmeyen tarayıcılarda ders sesi kaydedilip **Ses dosyası**
sekmesinden yüklenir; bu yol için Ayarlar'dan OpenAI uyumlu bir yazıya çevirme
servisinin anahtarı girilir. Anahtar yalnızca tarayıcıda saklanır, ses dosyası
doğrudan tarayıcıdan servise gider.

Mikrofonsuz denemek için **Kayıt → Metin → Örnek ders metnini dene**.

## Telefona kurma

Uygulama PWA'dır; ayrı bir mağaza sürümü gerekmez.

- **Android:** Chrome'da sayfayı açın → menü → *Uygulamayı yükle*.
- **iPhone:** Safari'de açın → Paylaş → *Ana Ekrana Ekle*.
- **Masaüstü:** Adres çubuğundaki yükleme simgesi.

## Proje yapısı

```
src/
  turkce/            Türkçe not çıkarma motoru (tarayıcıdan bağımsız, saf JS)
    harf.js          Türkçe büyük/küçük harf (I/ı, İ/i) dönüşümleri
    sozluk.js        kısaltmalar, dolgu sözcükleri, bağlaçlar, ipucu kalıpları
    temizle.js       dolgu/tekrar temizliği, benzerlik ölçümü
    cumle.js         cümle bölütleme, yüklem sezgisi
    noktalama.js     soru tespiti, cümle sonu ve baş harf onarımı
    siniflandir.js   cümle rolü, tanım ve başlık çıkarımı
    anahtar.js       Türkçe gövdeleyici ve anahtar kavramlar
    taslak.js        maddeli not taslağını kurar
    bicim.js         Markdown / düz metin çıktısı
  core/              tarayıcı yetenekleri (dinleme, kayıt, depolama, dışa aktarım)
  ui/                React arayüzü
test/                motorun birim ve uçtan uca testleri
```

Motoru başka bir projede kullanmak için tek giriş noktası:

```js
import { notCikar, markdownYaz } from './src/turkce/index.js';

const not = notCikar(hamMetin, { detay: 'orta', dolguTemizle: true });
console.log(markdownYaz(not));
```

## Motoru geliştirmek

Not kalitesi büyük ölçüde `src/turkce/sozluk.js` içindeki listelere bağlıdır.
Kendi dersinizde yanlış sınıflanan bir kalıp görürseniz ilgili listeye ekleyin ve
`test/turkce.test.js` içine bir örnek bırakın — testler saniyeler içinde çalışır.
