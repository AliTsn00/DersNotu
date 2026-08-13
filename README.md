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

## Ses tanımayı iyileştirenler

Konuşma tanımanın çıktısı ham hâliyle yetmiyor; dört ayrı noktadan destekleniyor:

- **Ders sözlüğü.** Hocanızın terimlerini ve tanımanın yanlış duyduğu sözleri
  *Ayarlar → Ders sözlüğü*'ne yazarsınız. Yalnızca terim yazarsanız ipucu olur,
  `yanlış = doğru` yazarsanız düzeltme kuralı. Aynı sözlük iki yerde çalışır:
  kayda başlamadan tanıma motoruna verilir (kelimeyi baştan doğru duymak,
  sonradan düzeltmekten iyidir) ve metne geçtikten sonra uygulanır.
- **Aday seçimi.** Tanıma motoru her söz için birkaç okuma üretir ve güven
  sırasına dizer. En güvendiği okuma alışılmadık özel adlarda yanılıyor
  ("Serahsî" yerine sıradan kelimeler). Sözlükte terim varsa dört okuma istenir
  ve terimi içeren aday öne alınır.
- **Kesilmeyi kurtarma.** Motor 60 saniyede bir kendini kapatır ve o an
  kesinleşmemiş sözü hiç bildirmez — her dakika bir cümlenin yarısı. Kapanma
  anındaki söz kesin sayılıp nota katılır.
- **Mikrofon testi.** Tanıma kalitesini en çok belirleyen şey yazılım değil,
  mikrofonun hocaya uzaklığı. Kayıt düğmesinin altındaki altı saniyelik ölçüm
  "yaklaştırın" ya da "kırpılıyor" der.

Yerleşik imlâ düzeltmeleri (`kuranı kerim` → `Kur'ân-ı Kerîm`, `buhari` →
`Buhârî`) yalnızca aynı sözün yanlış yazımlarını kapsar; anlamı değiştiren ya da
bağlam gerektiren tek kural yoktur. **Arap harfi taşıyan hiçbir dizi
değiştirilmez.**

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

### Âyet doğrulaması

Kur'ân kapalı ve değişmez bir metin olduğu için âyetler **birebir karşılaştırmayla**
doğrulanabiliyor. Nottaki her Arapça ibare 6.236 âyetle karşılaştırılır:

| Sonuç | Anlamı |
| --- | --- |
| ✓ **Kur'ân — Bakara 153** | İbare o âyette aynen geçiyor. Künye artık tahmin değil. |
| ≈ **Bakara 153 (%86 benzer)** | Konuşma tanıma metni bozmuş olabilir; en yakın âyet bu. |
| **Kur'ân'da bulunamadı** | Âyet olduğu söylenen ibare Kur'ân'da yok. |
| **Latin harfli — karşılaştırılamadı** | Çeviri yazı; Arap harfi olmadan kıyas yapılamaz. |

**Doğrulanan âyet mushaf metniyle düzeltilir.** Konuşma tanıma tilaveti çoğu
zaman bozuk yazar; bozuk bir âyetin notta kalması, onu okuyan için yanlış bilgi
demektir. İbare Kur'ân'da birebir bulunduysa yerine resmî imlâsı konur — bu
tahmin değil, doğrulanmış metni yazmaktır. Üç sınır korunur:

- Yalnızca **kesin** eşleşme kendiliğinden değiştirilir. Yaklaşık eşleşmede
  mushaftaki en yakın âyet gösterilir ve uygulama kararı okuyana bırakılır;
  motor bambaşka bir âyeti en yakın sayabilir.
- İbare âyetin küçük bir parçasıysa (%60'ından azı) metne dokunulmaz, yalnızca
  künyesi yazılır. Parçayı tam âyetle değiştirmek düzeltmek değil, bilgi
  eklemek olurdu.
- Özgün metin saklanır; alıntı kutusundaki bağlantıdan tanımanın ne yazdığı
  görülebilir.

Düzeltme kaydedilen nota değil, notun türetilmiş bir kopyasına uygulanır: ham
metin arşivde olduğu gibi durur, düzeltme her açılışta doğrulamadan yeniden
üretilir.

Metin [Tanzil.net](https://tanzil.net)'in denetlenmiş sürümüdür — gösterim için Uthmani
(resmî imlâ), karşılaştırma için sade imlâ. İkisi ayrı olmak zorunda: Uthmani uzun elifi
üst simgeyle yazıyor (`ٱلصَّٰبِرِينَ`), yaygın yazım elifle (`الصابرين`). Metin
[Tanzil Quran Text License](https://tanzil.net/docs/text_license) ile kullanılır ve
uygulama ona **hiçbir koşulda dokunmaz**. Veriyi yenilemek için:
`node scripts/kuran-hazirla.mjs`

**Hadîsler için böyle bir doğrulama yok ve olmayacak.** Kapalı bir külliyat, tek bir
kanonik metin ve makine tarafından denetlenebilir bir sıhhat ölçütü bulunmuyor; "bu
hadîs sahihtir" diyen bir kod yanlış güven verirdi. Onun yerine her hadîs kutusunda
metni [sunnah.com](https://sunnah.com)'da aratan bir bağlantı var — teyit tek tıkla,
ama insan eliyle.

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
