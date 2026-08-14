# Ders Notu

Derste hocanın sesini dinleyip **Türkçe cümle yapısına göre düzenlenmiş, maddeli
ders notu** çıkaran uygulama. Telefonda ve bilgisayarda aynı kod tabanıyla çalışır
(kurulabilir PWA).

```
konuşma  →  ham metin  →  temizle  →  cümlelere ayır  →  noktalama onar
         →  cümleyi sınıflandır  →  numaralı ve gruplu not  →  elle düzenle
         →  Word / Markdown / PDF / arşiv
```

## Ne yapar

- **Canlı dinleme.** Ders anlatılırken mikrofondan yazıya çevirir (`tr-TR`).
  Tanıma motoru kendini kapattığında otomatik yeniden bağlanır, ekranın kapanmasını
  engeller.
- **Türkçe'ye göre cümle kurar.** Konuşma tanıma çıktısı noktalamasız gelir; uygulama
  kısaltmaları (`Prof.`, `vb.`, `M.Ö.`), ondalık sayıları (`3.14`) ve sıra sayılarını
  (`1. Dünya Savaşı`) koruyarak böler, yüklem eklerinden ve bağlaçlardan cümle sınırı
  çıkarır, soru cümlelerini (`mı/mi/mu/mü`, `nedir`, `nasıl`) ayırt eder.
- **Notu sınıflar, gruplar, numaralar.** Her cümle rolüne göre yerleşir: başlık,
  tanım, örnek, liste öğesi, önemli uyarı, özet, soru. Bölümler `1.`, maddeler `1.2`,
  alt maddeler `1.2.1` diye numaralanır; hoca başlık kurmadan uzun uzun anlattığında
  maddeler konu değişimine göre alt başlıklara ayrılır ve içindekiler çıkarılır.
- **İslami dersleri tanır.** Âyet, hadîs, duâ, Arapça ibare, meâl ve mezhep görüşü
  ayrı türlerdir → aşağıya bakın.
- **Elle düzenlenir.** Metin düzeltme, tür değiştirme, sıralama, seviye değiştirme,
  madde/bölüm ekleme-silme, başlık değiştirme. Ders sürerken düzenleme yapılırsa yeni
  cümleler notun sonuna eklenir, yapılan düzeltmeler bozulmaz.
- **Gereksizi atar.** "eee", "yani", "arkadaşlar", "tamam mı", "zil çaldı" gibi dolgu
  ve sınıf yönetimi cümleleri nota girmez (istenirse listelenir).
- **Dışa aktarır.** **Word (.docx)**, Markdown, düz metin, PDF (yazdır) ve panoya
  kopyalama.
- **Cihazda saklar.** Dersler IndexedDB'de tutulur; not çıkarma tamamen çevrimdışı ve
  kural tabanlıdır, metin hiçbir sunucuya gönderilmez.

## İslami dersler

Ders anlatımındaki dinî içerik ayrı türlerde işlenir:

| Tür | Nasıl tanınır | Nota nasıl girer |
| --- | --- | --- |
| Âyet | "Allah Teâlâ buyuruyor ki", sûre adı + âyet numarası, Arapça ibare | Künyeli alıntı kutusu + *Geçen Âyetler* dizini |
| Hadîs | "Peygamber Efendimiz buyurdu ki", `sallallahu aleyhi ve sellem`, Buhârî/Müslim/Tirmizî… | Künyeli alıntı kutusu + *Geçen Hadîsler* dizini |
| Meâl | Alıntının hemen ardından gelen "meâli / anlamı" cümlesi | Âyetin altına bağlanır |
| Duâ | "Allah'ım", "Rabbenâ", "âmin" | Alıntı kutusu + *Duâlar* dizini |
| Arapça ibare | Arap harfi ya da Latin harfli çeviri yazı (`innallâhe maas sâbirîn`) | Sağdan sola, büyük punto |
| Görüş | "Hanefî mezhebine göre", "cumhûra göre", "ihtilaf var" | *Görüşler ve İhtilaflar* bölümü |

Ayrıca 114 sûre adı ve başlıca hadis kaynakları tanınır ("Bakara sûresi 153. âyet" →
`Bakara 153`), "bu hadis Müslim'de geçer" gibi künye cümleleri ayrı madde açmak yerine
ilgili alıntıya bağlanır, ve konuşma tanımanın küçük yazdığı özel adlar düzeltilir
(`allah` → `Allah`, `hz eyyüb` → `Hz. Eyyüb`).

> **Doğruluk uyarısı.** Uygulama Arapça metni **düzeltmez, tamamlamaz ve ezberden bir
> metinle değiştirmez** — konuşma tanıma ne duyduysa onu yazar. Tilavet çoğu zaman
> yanlış yazılır. Bu yüzden her âyet/hadîs bloğu "doğrulanmadı" damgası taşır ve notun
> başına teyit uyarısı konur. Notu paylaşmadan önce mushaftan ve güvenilir bir hadis
> kaynağından kontrol edin.

## Örnek

Girdi (gerçek konuşma tanıma çıktısı gibi, noktalamasız):

```
bismillahirrahmanirrahim
evet arkadaşlar bugün sabır konusunu işleyeceğiz
sabır kişinin başına gelen musibetlere karşı direnç göstermesine denir
allah teâlâ bakara suresi 153. ayette şöyle buyuruyor
yâ eyyühellezîne âmenüsteînû bis sabri ves salâh
meali ey iman edenler sabır ve namazla yardım isteyin
peygamber efendimiz sallallahu aleyhi ve sellem buyurdu ki
es sabru dıyâun
bu hadis müslim de geçmektedir
sabrın üç çeşidi vardır
birincisi ibadetlere devam etmekteki sabırdır
ikincisi günahlardan kaçınmadaki sabırdır
tamam mı arkadaşlar zil çaldı defterleri kapatın
```

Çıktı:

```markdown
# Sabır

> ⚠️ Âyet, hadis ve Arapça ibareler konuşma tanımadan geldiği gibi yazılmıştır…

## 1. Giriş

- **1.1** ✒️ **Arapça ibare:** «Bismillahirrahmanirrahim.»

## 2. Sabır

- **2.1** **Sabır:** Kişinin başına gelen musibetlere karşı direnç göstermesidir.
- **2.2** 📖 **Âyet · Bakara 153:** «Yâ eyyühellezîne âmenüsteînû bis sabri ves salâh.»
  - **2.2.1** Meâli: Ey iman edenler sabır ve namazla yardım isteyin.
- **2.3** 🕌 **Hadîs · Müslim:** «Es sabru dıyâun.»
- **2.4** Sabrın üç çeşidi vardır.
  - **2.4.1** İbadetlere devam etmekteki sabırdır.
  - **2.4.2** Günahlardan kaçınmadaki sabırdır.
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

## Android uygulaması (APK)

Tarayıcı sürümü mikrofonu yalnızca kendi adresinde açıldığında kullanabilir;
gömülü bir çerçevede ya da `file://` üzerinden çalışmaz. Telefonda bu dertlerle
uğraşmamak için Capacitor ile paketlenmiş bir Android uygulaması vardır.

Uygulama sürümünde canlı dinleme **cihazın kendi konuşma tanıma servisini**
kullanır (`@capacitor-community/speech-recognition`) — Android WebView tarayıcının
`SpeechRecognition` API'sini içermez. Mikrofon iznini Android'in kendisi sorar.

APK, GitHub Actions'ta derlenir (çalıştırıcılarda Android SDK hazır gelir) ve
sabit bir adrese yüklenir:

```
https://github.com/<kullanıcı>/<repo>/releases/download/apk/ders-notu.apk
```

Derlemeyi başlatmak için: **Actions → APK → Run workflow**.
Telefonda bu adresi açıp indirin; Android "bilinmeyen kaynaktan kurulum" izni
isteyecektir. APK hata ayıklama anahtarıyla imzalıdır — elden kurulum için
yeterli, Play Store'a yüklenemez.

Yerelde derlemek için Android SDK gerekir:

```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
```

### Bilinen sınır: arka planda çalışma

Ekran kapandığında ya da uygulama arka plana atıldığında Android konuşma tanımayı
durdurur. Ders boyunca kesintisiz kayıt için uygulamanın bildirim çubuğunda duran
bir ön plan servisiyle sesi kendisinin kaydetmesi, tanımayı da ona göre yürütmesi
gerekir; bu henüz yapılmadı. Şimdilik ekran açık kalmalıdır (Ayarlar → "Ekranı
açık tut" varsayılan olarak açıktır).

## Telefona kurma (tarayıcıdan, PWA olarak)

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
    islami.js        âyet/hadîs/duâ/Arapça/görüş tanıma, sûre ve kaynak künyeleri
    anahtar.js       Türkçe gövdeleyici ve anahtar kavramlar
    taslak.js        numaralı, gruplu not taslağını kurar
    duzenle.js       elle düzenleme işlemleri ve canlı derste birleştirme
    bicim.js         Markdown / düz metin çıktısı
  core/              tarayıcı yetenekleri (dinleme, kayıt, depolama, dışa aktarım)
    word.js          .docx üretimi (docx paketi yalnızca istendiğinde yüklenir)
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
