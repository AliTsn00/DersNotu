# Ders Notu — Akıllı Sürüm Yol Haritası

> Son güncelleme: 13 Ağustos 2026
> Karar: **sıfır maliyetli hat.** Kayıt, ses→metin ve zekâ — üç bacak da bedava.

---

## 1. Sonuç önce: kurulacak sistem

```
┌─────────────────────────────────────────────────────────────────┐
│  1. KAYIT — telefonun kendi ses kaydedicisi                     │
│     Ekran kapalı, telefon cepte, 90 dakika. Ölmez.              │
│     Maliyet: 0                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │  ses dosyası PC'ye
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SES → METİN — Groq Whisper large-v3                         │
│     Kalıcı ücretsiz katman: günde 8 saat.                       │
│     Sizin ihtiyacınız: haftada 6 saat.                          │
│     Yedek: Buzz (PC'de, internetsiz, sınırsız)                  │
│     Maliyet: 0                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │  ham transkript
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ZEKÂ — Claude Code + /ders-notu skill'i                     │
│     Aboneliğiniz dahilinde. Opus kalitesi.                      │
│     Sınıflandırma, hiyerarşi, konu açma, Word çıktısı.          │
│     Maliyet: 0 (zaten ödüyorsunuz)                              │
└─────────────────────────────────────────────────────────────────┘
```

**Aylık toplam: 0 dolar.** Üstelik zekâ tarafı, ilk planladığımız aylık 9,80 dolarlık kurgudan **daha kaliteli** — Haiku değil, doğrudan Opus çalışacak.

**Hedef kullanım:** Dersten sonra ses dosyasını PC'ye atıp tek komut:

```
/ders-notu ders.m4a
```

Gerisi otomatik: sıkıştırma → transkript → Arapça koruma → yapılandırma → Word dosyası → arşiv.

---

## 2. Neden bu üç seçim — ve neyi eledik

### 2.1 Kayıt: neden telefonun kendi kaydedicisi

Araştırmanın en acı bulgusu şuydu: **PWA telefonda arka planda ses kaydedemiyor.**

| Platform | Durum |
| --- | --- |
| iPhone | ❌ Ekran kilitlendiği an Safari mikrofonu askıya alıyor. Apple'ın kasıtlı tasarımı. |
| Android Chrome | ⚠️ Teoride mümkün, pratikte piyango. Chromium'un kendi hata kaydında "ekran kapandıktan 2–4 dakika sonra ses kopuyor" diye açık bir sorun var. Telefon üreticilerinin pil tasarrufu katmanları rastgele öldürüyor. |

90 dakikalık, tekrarı olmayan bir ders için alınacak risk değil.

Telefonun **kendi** ses kaydedicisi ise üreticinin kendi uygulaması — pil tasarrufu katmanı onu asla öldürmez. Ekran kapalı, cepte, üç saat. Sorun çıkmaz.

> **Ek bulgu:** Şu an kullandığınız canlı dinleme (`SpeechRecognition`) de bu iş için uygun değil. Oturum 60 saniyede kapanıyor, kod yeniden başlatıyor ama **her seferinde kelime kaybediyor** — 90 dakikada ~90 kesinti. Ayrıca sesi Google'ın sunucularına gönderiyor, yani README'deki "hiçbir sunucuya gitmez" iddiası şu an bile tam doğru değil. Canlı dinleme "hızlı bakış" özelliği olarak kalsın, birincil yol olmasın.

### 2.2 Ses → metin: neden Groq

Kalıcı ücretsiz kotalar taranınca tablo şöyle çıktı:

| Sağlayıcı | Ücretsiz kota | Kalıcı mı? | Yeter mi? |
| --- | --- | --- | --- |
| **Groq** (whisper-large-v3) | **günde 8 saat ses** | ✅ Kalıcı ücretsiz plan | ✅ İhtiyacın **10 katı** |
| Cloudflare Workers AI | günde ~4 saat | ✅ Kalıcı | ✅ Yeter |
| **Speechmatics** | **$100 kredi, kart istemiyor** (~775 saat) | ❌ Tek seferlik ama **~32 ay** yeter | ✅ En güçlü yedek |
| Gladia | ayda 10 saat | ✅ Kalıcı | ⚠️ Yarısı |
| Azure F0 | ayda 5 saat | ✅ Kalıcı | ❌ Ayrıca dosya işleme F0'da yok |
| ElevenLabs | ayda ~30 dakika | ✅ Kalıcı | ❌ Tek ders bile sığmaz |
| Google Cloud STT | ayda 60 dakika | ✅ Kalıcı | ❌ |
| AssemblyAI | $50 kredi (~333 saat) | ❌ **Tek seferlik** | ~12 ay sonra biter |
| Deepgram | $200 kredi (~362 saat) | ❌ **Tek seferlik** | ~15 ay sonra biter |
| Gemini free tier | limit artık yayımlanmıyor | ✅ ama bkz. aşağıda | ⚠️ Gizlilik sorunu |

**Groq kazanıyor** çünkü:

1. **Kalıcı.** Deneme kredisi değil, sürekli ücretsiz plan. Aylık üst sınır yok — sadece kayan gün/saat limiti.
2. **Kota fazlasıyla yeterli.** Günde 8 saat izin, haftada 6 saat ihtiyaç.

Doğrulanmış rakamlar ([console.groq.com/docs/rate-limits](https://console.groq.com/docs/rate-limits), 13 Ağustos 2026):

| Limit | Ücretsiz plan | 90 dakikalık ders |
| --- | --- | --- |
| Günlük ses | **28.800 saniye (8 saat)** | 5 ders/gün |
| Saatlik ses | 7.200 saniye (2 saat) | 1 ders/saat |
| Günlük istek | 2.000 | bol bol |
| Dosya boyutu | 25 MB | sıkıştırılmış hâli ~22 MB |

> ⚠️ **Pratik kısıt:** Saatlik limit 2 saat ses. Yani art arda iki dersi aynı saat içinde yükleyemezsiniz — ikincisi için bir saat beklemek gerekir. Günlük 5 ders sorun değil, ama toplu işleme yapacaksanız araya boşluk koyun.
3. **Kod zaten hazır.** `src/core/kayitci.js` içindeki `sesiYaziyaCevir()` fonksiyonu OpenAI-uyumlu endpoint'e istek atıyor. Groq'un adresi (`https://api.groq.com/openai/v1`) birebir aynı formatta. **Ayarlardan URL ve model adını değiştirmek yeterli.**
4. **Hızlı.** Whisper'ı ~200 kat gerçek zamanlı çalıştırıyor — 90 dakikalık ders yarım dakikada biter.

**Gemini'yi neden elediğimiz önemli.** Ücretsiz katmanı ses kabul ediyor ve 9,5 saate kadar dosya alıyor — teknik olarak cazip. Ama Google'ın kullanım şartları net:

> *"Google, Servislere gönderdiğiniz içeriği ürünlerini geliştirmek için kullanır."*
> *"İnsan gözden geçiriciler API girdinizi ve çıktınızı okuyabilir, işaretleyebilir ve işleyebilir."*
> *"Ücretsiz Servislere hassas, gizli veya kişisel bilgi göndermeyin."*

Yani hocanın sesi Google'a eğitim verisi olur ve **bir insan dinleyebilir**. Derslerin kendisi gizli olmasa bile sınıftaki başka kişilerin sesi de kayda giriyor — bu artık üçüncü kişilerin mahremiyeti meselesi. Groq varken buna girmeye gerek yok.

> ⚠️ **Dürüstlük notu:** Groq'un kendi veri politikası bu araştırmada **doğrulanamadı**. Gemini kadar açık bir "eğitimde kullanırız" ifadesi bulunmadı, ama "kullanmıyoruz" ifadesi de doğrulanmadı. Tam gizlilik istiyorsanız aşağıdaki Buzz yolu (tamamen offline) doğru cevap.

### 2.3 Yedek yol: Buzz — PC'de, internetsiz, sınırsız

[Buzz](https://github.com/chidiwilliams/buzz) açık kaynak bir Windows uygulaması (MIT lisans, 20.9k yıldız, aktif geliştiriliyor). Whisper'ı bilgisayarınızda çalıştırıyor.

- **Tamamen offline.** Ses hiçbir yere gitmiyor. Sıfır gizlilik riski.
- **Sınırsız.** Kota yok, limit yok, hesap yok.
- **Hızlı** — ekran kartınız varsa: 90 dakikalık ders **7–8 dakikada** biter (ölçülmüş: ~12 kat gerçek zamanlı).
- Ekran kartı yoksa çok daha yavaş — kabaca 45–90 dakika *(bu tahmin doğrulanmadı)*.
- TXT olarak dışa aktarıyor.

**Bu yolu ikinci olarak kuracağız.** İnternet yokken, Groq'un ücretsiz planı bir gün değişirse, ya da gizlilik hassasiyeti olan bir derste devreye girer.

### 2.3.1 Üçüncü yedek: Speechmatics

Groq bir sebeple çalışmazsa (kredi kartı isterse, ücretsiz planı değişirse) elimizde güçlü bir yedek var:

**Speechmatics, kayıt olurken kredi kartı istemeden $100 kredi veriyor.** Saati ~$0,13'ten hesaplarsak ~775 saat eder — sizin kullanımınızla **yaklaşık 32 ay**. Türkçe birinci sınıf desteklenen dillerden, üstelik yeni çok dilli modeli Türkçe→İngilizce çeviri de yapıyor.

Kalıcı bir ücretsiz katman değil, tükendiğinde biter. Ama iki buçuk yıl sonrasını bugünden çözmeye gerek yok.

> Bu arada elenen bir aday: **ElevenLabs'ın ücretsiz katmanı ayda sadece ~30 dakika.** Türkçe kalitesi en iyisi olmasına rağmen tek bir 90 dakikalık ders bile sığmıyor. Ücretli tarafta ayda $5,28 — bütçe bir gün açılırsa ilk bakılacak yer orası.

### 2.4 Elediğimiz yol: tarayıcı içi Whisper

Cazip görünüyordu — PWA'nın içinde, ücretsiz, offline. Araştırma bunu kesin biçimde öldürdü:

**Transformers.js'te açık bir GPU bellek sızıntısı var** ([issue #1739](https://github.com/huggingface/transformers.js/issues/1739), 3 Ağustos 2026, hâlâ açık). Her 30 saniyelik ses parçası ~650 MB GPU belleği tüketiyor ve **geri bırakmıyor**. 90 dakika = 180 parça = teorik olarak ~117 GB bellek. 12 GB'lık RTX 3060'ta bile uzun dosya çöküyor.

Bilinen çözümü yok. Bu yol kapalı.

> **Yan fayda:** Bu araştırma sırasında endişe ettiğimiz bir konu da çözüldü — WebGPU'nun özel HTTP başlıkları (COOP/COEP) gerektirdiği sanılıyordu, ki bu GitHub Pages barındırmanızı bozardı. **Gerekmiyormuş.** Yani mevcut yayın altyapınıza dokunmuyoruz.

### 2.5 Denenmesi bedava olan bir yol: Pixel Recorder

Telefonunuz **Pixel** ise: Google Recorder ile kaydedip `Daha fazla → Transcribe again → Turkish (Turkey)` diyerek Türkçe transkript alabiliyorsunuz. Sonra `Paylaş → Transcript (.txt)`.

- **Sıfır kod, sıfır kurulum.** 10 dakikada test edilir.
- Ama: **gerçek zamanlı Türkçe listesinde yok**, sadece sonradan işleme var. Ve Google'ın kendi ifadesiyle *"ses dosyalarını Google sunucularında işleyebilir"* — yani cihaz içi değil.
- Uzun ders için doğruluğu Whisper ile karşılaştırılmadı *(doğrulanmadı)*.

Pixel kullanıyorsanız bir kez deneyin. Kalitesi yeterliyse hiçbir API'ye ihtiyacınız kalmaz.

---

## 3. Asıl yenilik: `/ders-notu` skill'i

Buraya dikkat, Sir — planın en değerli kısmı burası.

Claude Code sizin bilgisayarınızda çalışıyor ve **dosya sisteminizi görüyor**. Bu, tarayıcıya API anahtarı gömmenin yapamayacağı şeyleri mümkün kılıyor:

| Tarayıcıdan Claude API çağırsaydık | Claude Code skill'i ile |
| --- | --- |
| Haiku 4.5 (ucuz model) | **Opus** — en iyi model |
| Ayda ~$4,50 | **$0** — aboneliğiniz dahilinde |
| Sadece metin alır, metin verir | Dosya okur, ffmpeg çalıştırır, Word yazar, arşive ekler |
| Tek ders bağlamı | **Önceki derslerinizi okuyabilir** — "bu konu 8. haftada da geçmişti" |
| API anahtarı tarayıcıda açıkta | Anahtar yok |
| 25k token bağlam sınırı zorlanır | Rahat çalışır |

### Skill ne yapacak

`/ders-notu ders.m4a` komutuyla:

1. **Sıkıştırma** — ffmpeg ile 16 kHz mono MP3, 32 kbps. 90 dakikalık ders ~22 MB olur, Groq'un 25 MB sınırına sığar. *(Telefon kaydedicileri genelde 64–128 kbps üretir; 90 dakika 43–86 MB eder, yani bu adım şart.)*
2. **Transkript** — Groq'a gönder, Türkçe ham metin al. İnternet yoksa Buzz'a düş.
3. **Ön işlem** — mevcut `src/turkce` motorunuzu çalıştır:
   - `temizle.js` → "eee", "yani", tekrarlar atılır
   - `cumle.js` → cümlelere ayrılır
   - `islami.js` → **Arapça parçalar çıkarılır, yerlerine kapalı işaret konur**
4. **Yapılandırma** — Claude notu kurar: başlık, tanım, örnek, önemli, âyet, hadis, görüş... hiyerarşik numaralandırma, konu akışı, ve istediğiniz "meseleyi açma" bölümleri.
5. **Doğrulama** — çıktıda Arapça karakter varsa reddet, tekrar dene.
6. **Çıktı** — `word.js` ile `.docx`, ayrıca Markdown. Arşive kaydet.

### Arapça güvenlik kilidi — dört katman

README'nizdeki en katı kural: **Arapça metin asla düzeltilmez, tamamlanmaz, ezberden yazılmaz.** Bu kural talimat yazarak korunmaz; yapısal olarak imkânsız hâle getiriyoruz:

**Katman 1 — Model Arapça'yı hiç görmesin.**
`islami.js` zaten Arapça karakterleri tespit ediyor. O parçalar metinden çıkarılıp yerlerine kapalı işaret konuyor:

```
"Peygamber Efendimiz ⟦AR:7⟧ buyurdu, yani sabır imandan bir cüzdür."
```

İşaret aynen kopyalanmak zorunda; orijinal metin sonradan yerine geri konuyor. **Model Arapça metni bozamaz — çünkü hiç görmedi.**

**Katman 2 — Çıktı şemasında Arapça alanı yok.**
Âyet/hadis maddeleri sadece işaret referansı, kaynak tahmini ve güven seviyesi taşır. Serbest Arapça metin alanı yok.

**Katman 3 — Talimat.**
> Arapça metinleri ASLA düzeltme, tamamlama, harekelendirme veya ezberden yazma. Bir âyet/hadisin kaynağından emin değilsen "bilinmiyor" yaz — tahmin etme. **Kaynak uydurmak, kaynak yazmamaktan çok daha kötüdür.**

**Katman 4 — Denetim.**
Çıktıda Arapça karakter (U+0600–U+06FF) görülürse cevap reddedilir, yeniden denenir.

**Ek kural — "konuyu açma" izole edilecek.**
"Anlatılan meseleyi açsın" isteğiniz doğası gereği modelin kendi bilgisini metne katıyor. Bu bölümler:
- Ayrı alanda tutulacak
- Belgede **farklı renkte**, "yapay zekâ eklemesi" etiketiyle görünecek
- **Âyet ve hadis maddelerinde hiç üretilmeyecek**

Hocanın söyledikleri ile modelin eklediği asla karışmayacak.

### Mevcut Türkçe motor ne olacak?

**Çöpe atmıyoruz.** Rolü değişiyor:

| Modül | Yeni rolü |
| --- | --- |
| `temizle.js` | ✅ Ön işlem — bedava, deterministik, metni %12 küçültür |
| `cumle.js` | ✅ Ön işlem — cümle indeksleri, kimlik kararlılığının temeli |
| `islami.js` | ✅ **Güvenlik kilidi** — Arapça koruması buna dayanıyor |
| `noktalama.js` | ✅ Kalıyor — ucuz, modele sormaya değmez |
| `siniflandir.js` | 🔄 Claude devralıyor — rol sınıflandırması yapay zekânın kurallardan iyi olduğu iş |
| `taslak.js` (hiyerarşi kararı) | 🔄 Claude devralıyor — asıl şikâyetiniz burada |
| `taslak.js` (numaralama/render) | ✅ Kalıyor |
| `bicim.js`, `word.js` | ✅ Kalıyor |
| Motorun tamamı | ✅ **Çevrimdışı yedek** — internet yok / doğrulama reddi → devreye girer |

**Kilit kural:** Claude'un üreteceği yapı, mevcut not veri yapısının **birebir aynısı** olacak. O zaman çıktı tarafı (Markdown, Word, PDF, düzenleyici) hiç değişmeden iki üretici için de çalışır. Tek format, iki motor.

**Bedava bonus — çapraz doğrulama:** İki yolu paralel çalıştırmak sıfır maliyet (kural motoru bedava). Kural motoru 9 âyet bulup Claude 3 tanesini nota koyduysa uyarı verilir. Sessiz bilgi kaybını yakalayan ucuz emniyet ağı.

---

## 4. ADIM ADIM YOL HARİTASI

### Aşama 0 — Hazırlık (30 dakika, kod yok)

- [ ] [console.groq.com](https://console.groq.com) → hesap aç, API anahtarı al
      *(Kredi kartı isteniyor mu doğrulanamadı — istiyorsa Buzz yoluna geçeriz)*
- [ ] Telefonun ses kaydedicisinde **kayıt kalitesini düşür** (varsa "orta/düşük" seçeneği) — dosya küçülür, transkript kalitesi düşmez
- [ ] Bir dersi test amaçlı kaydet, PC'ye at
- [ ] **Pixel kullanıyorsanız:** Recorder → Transcribe again → Türkçe deneyin. İşe yararsa Groq'a bile gerek kalmayabilir.

---

### Aşama 1 — `/ders-notu` skill'i ✅ TAMAMLANDI (13 Ağustos 2026)

- [x] `.claude/skills/ders-notu/SKILL.md` — akış, şema, kurallar, sorun giderme
- [x] `scripts/ses-metin.mjs` — ffmpeg (süreye göre bitrate) + Groq Whisper large-v3
- [x] `scripts/on-isle.mjs` — mevcut `src/turkce` motoruyla ön işlem + Arapça koruma
- [x] `scripts/not-yaz.mjs` — doğrulama + numaralandırma + `.md` / `.docx` çıktısı
- [x] Arapça güvenlik kilidi — ⟦AR:n⟧ yer tutucu, sızıntı denetimi, çapraz doğrulama
- [x] Uçtan uca test — 25 cümlelik örnek ders, 3 bölüm / 17 madde üretildi
- [x] Güvenlik testi — iki ihlal senaryosu da reddedildi, dosya yazılmadı
- [x] Mevcut test paketi bozulmadı (57/57 geçiyor)

**Kullanım:**

```bash
node scripts/ses-metin.mjs ders.m4a ham.txt     # ses varsa
node scripts/on-isle.mjs ham.txt hazirlik.json  # ön işlem
#   → Claude hazirlik.json'u okur, not.json üretir
node scripts/not-yaz.mjs not.json hazirlik.json ders-notu
```

Ya da tek komut: **`/ders-notu ders.m4a`**

**Kalan ufak iş:** Skill henüz gerçek bir ders kaydıyla denenmedi. İlk gerçek
derste Groq'un Türkçe kalitesi ve Arapça ibarelerin çıktısı ölçülecek.

---

### Aşama 2 — PWA'yı Groq'a bağla ✅ TAMAMLANDI (13 Ağustos 2026)

- [x] Servis ön ayarları — Ayarlar'da tek tıkla Groq ↔ OpenAI geçişi
- [x] Varsayılan Groq `whisper-large-v3` oldu
- [x] 10 dakikalık zaman aşımı + `AbortController` + İptal düğmesi
- [x] Dosya boyutu istek gönderilmeden önce denetleniyor (25 MB)
- [x] Duruma göre Türkçe hata mesajları (401 / 404 / 413 / 429 / 5xx)
- [x] İslamî ders terimleri konuşma tanımaya bağlam ipucu olarak gidiyor
- [x] Gizlilik metni gerçeğe uyduruldu
- [x] Testler (57/57) ve üretim derlemesi geçiyor, tarayıcıda görsel doğrulama yapıldı

**Çıktı:** Telefondan da ham transkript alabiliyorsunuz. Kaliteli not için PC'ye geçiyorsunuz.

---

### Aşama 3 — Buzz yedeği (2 saat, çoğu kurulum)

- [ ] Buzz'ı PC'ye kur, `whisper-large-v3` modelini indir
- [ ] Bir dersle test et, süreyi ölç
- [ ] Skill'e "internet yoksa Buzz kullan" dalını ekle

**Çıktı:** İnternetsiz ve tamamen gizli çalışan yedek hat.

---

### Aşama 4 — Cilalama ✅ TAMAMLANDI (13 Ağustos 2026)

- [x] **Otomatik kaydetme.** Ham metin, elle düzenlemeler ve süre `localStorage`'a
      yazılıyor: sayfa kapanırken (`pagehide`) anında, yazarken 1,5 saniye gecikmeli.
      Açılışta kaldığı yerden geri yükleniyor ve kullanıcıya bildiriliyor.
      Kaydet ya da Sıfırla taslağı temizliyor.
      *(IndexedDB değil localStorage: IndexedDB eşzamansızdır, sayfa kapanırken
      yazma sözü tamamlanmaz.)*
- [x] **IndexedDB sürümleme.** Şema sürümü 2'ye çıkarıldı, adım adım yükseltme
      iskeleti kuruldu, kayıtlara şema damgası basılıyor. İlk gerçek göç de
      yazıldı: sürüm 1 kayıtlarına geriye dönük damga.
- [x] **Ölü kod temizlendi.** `SesKaydedici`, `kayitVarMi`, `bicimSec` ve
      `sesKaydet` ayarı kaldırıldı — hiçbiri çağrılmıyordu.
- [x] ~~Ayarlardaki gizlilik metnini güncelle~~ (Aşama 2'de yapıldı)

**Neden tarayıcı içi kayıt canlandırılmadı:** Sekme arka plana alındığında ya da
ekran kapandığında `MediaRecorder` sessizce ölüyor. Çalışıyormuş gibi görünüp
90 dakikalık dersi kaybetmek, özelliği hiç sunmamaktan kötü. Telefonun kendi
kaydedicisi bu işi güvenilir biçimde yapıyor.

---

### Aşama 5 — Kalanlar

- [ ] **Gerçek bir ders kaydıyla uçtan uca deneme** ← en değerlisi
- [ ] Telefondan PC'ye dosya aktarımını kolaylaştır (Web Share Target)
- [ ] Buzz yedeği — PC'de tamamen offline çeviri

---

## 5. Doğrulanamayanlar — bilinçli olarak açık bıraktıklarımız

Araştırmada teyit edilemeyen, ilk gerçek kullanımda test edilecek noktalar:

1. **Groq kredi kartı istiyor mu?** Dokümantasyonda geçmiyor, ama "istemiyor" ifadesi de yok. İstiyorsa sırayla Speechmatics ($100, kartsız) veya Buzz (offline) devreye girer. *(Kota rakamlarının kendisi 13 Ağustos 2026'da doğrudan doğrulandı — orası kesin.)*
2. **Groq'un veri politikası.** Eğitimde kullanıp kullanmadığı doğrulanamadı. Tam gizlilik isterseniz Buzz.
3. **Whisper large-v3'ün Türkçe hata oranı.** OpenAI resmî rakam yayımlamıyor. Bağımsız akademik ölçüm ~%7,5 (FLEURS testi) — ama sizin ders ortamınızda (uzak konuşmacı, amfi akustiği) daha yüksek olacaktır. Gerçek ölçüm ilk derste yapılacak.
4. **Buzz'ın ekran kartsız süresi.** 45–90 dakika tahmini, ölçülmedi.
5. **Samsung ses kaydedicisinin Türkçe transkripti.** Kaynak sayfalar erişilemedi. Galaxy AI özelliklerinin bir kısmı ücretli olabilir — "bedava" varsayılmamalı.
6. **Pixel Recorder'ın Türkçe kalitesi.** Whisper ile karşılaştırılmadı.

---

## 6. Bilinmesi gereken tuzaklar

1. **Groq ücretsiz katmanda dosya sınırı 25 MB.** 90 dakika 16 kHz mono MP3 @32 kbps ≈ 22 MB — sığar. Ama telefonun ham kaydı 43–86 MB olur. **Sıkıştırma adımı atlanamaz.**
2. **Kalite kaybı endişesi yersiz.** Whisper sesi zaten 16 kHz'e düşürüyor. Ölçümler 6 kbps'te bile hata oranının sadece 1 puan arttığını gösteriyor. 32 kbps fazlasıyla güvenli.
3. **Tarayıcı içi Whisper'a geri dönmeyin.** Bellek sızıntısı issue'su kapanana kadar o yol ölü.
4. **Web Speech API sesi Google'a gönderiyor.** README'deki gizlilik iddiası şu an bile tam doğru değil, güncellenmeli.
5. **Transformers.js kullanılacaksa 3.8.1'e sabitlenmeli** — v4'te zaman damgaları bozuk ([#1684](https://github.com/huggingface/transformers.js/issues/1684)). Ama zaten o yolu kullanmıyoruz.
6. **AssemblyAI ve Deepgram'ın "ücretsiz"i deneme kredisi.** 12–15 ay sonra biter. Kalıcı sananlar yanılıyor.
7. **Groq'un iki ayrı kotası var, karıştırmayın.** Ses çevirme (Whisper) kotası **günde 8 saat ses** — bizim kullandığımız bu, fazlasıyla yeterli. Ama metin modellerinin kotası **dakikada 8–12 bin token** ve 20 bin kelimelik bir transkript tek istekte bunu aşar. Yani ileride PWA'nın içinden bir yapay zekâ çağırmak isterseniz Groq o iş için uygun değil.

---

## 6.1 İleride gerekirse: PWA içinden ücretsiz yapay zekâ

Şu anki plan zekâ adımını Claude Code'a veriyor (PC'de, aboneliğiniz dahilinde, en yüksek kalite). Ama bir gün "telefonda da otomatik olsun" isterseniz, kalıcı ücretsiz seçenekler tarandı:

| Sağlayıcı | Kota | Kalıcı? | Türkçe |
| --- | --- | --- | --- |
| **Cloudflare Workers AI** | günde ~10–23 çağrı (bizim boyutumuzda) | ✅ Kalıcı, kredi kartsız | Llama 3.3 70B — Türkçe testinde %79,4 |
| Google Gemini Flash | limitler artık yayımlanmıyor | ✅ Kalıcı | En iyi kalite, ama veriniz eğitimde kullanılıyor |
| Z.ai GLM-4.7-Flash | belgelenmemiş | ✅ "Tamamen ücretsiz" | Ölçüm yok |
| ~~GitHub Models~~ | — | ❌ **30 Temmuz 2026'da kapandı** | — |
| ~~Cerebras~~ | $5 kredi | ❌ 30 günde biter | — |
| ~~OpenRouter ücretsiz modeller~~ | 50 istek/gün | ⚠️ Katalog çökmüş, küçük modeller kalmış | Riskli |

Gerekirse birincil aday **Cloudflare Workers AI**. Ama şunu bilin: Türkçe ölçümlerinde Claude ve GPT-4o sınıfı modeller %84 civarında, Llama 3.3 %79'da. Yani PC'de Claude Code kullanmak kalite açısından her hâlükârda üstün kalıyor.

> İlginç bir bulgu: Türkçe'ye özel eğitilmiş küçük modeller (Trendyol-LLM %34) genel amaçlı büyük modellerin **çok altında** kalıyor. Türkçe için "Türkçe modeli" değil, güçlü genel model seçmek gerekiyor.

### 6.1 Uygulamada çözülen engel: tarayıcı Cloudflare'e doğrudan bağlanamıyor

Telefondaki otomatik not çıkarma ilk denemede çalışmadı. Sebep anahtar değildi:
Cloudflare'in API'si tarayıcının ön kontrol (OPTIONS) isteğine `405` dönüyor ve
hiçbir CORS başlığı göndermiyor — **ölçüldü, 13 Ağustos 2026**. Tarayıcı bu
yüzden isteği daha yola çıkmadan engelliyor.

Çözüm: kullanıcının kendi hesabında çalışan 60 satırlık bir aracı Worker
([`worker/zeka-araci.js`](worker/zeka-araci.js), kurulumu
[`worker/KURULUM.md`](worker/KURULUM.md)). İsteği aynen iletir, cevaba izin
başlıklarını ekler. Worker'ların ücretsiz katmanı günde 100.000 istek; bu iş
için fazlasıyla yeterli. Anahtar Worker'da saklanmaz — `Authorization` başlığı
olduğu gibi aktarılır, dolayısıyla adresi bilen biri kendi anahtarı olmadan
kotayı harcayamaz.

---

## 7. Sırada ne var

Onayınızla **Aşama 1**'e başlıyorum: `/ders-notu` skill'inin yazımı.

Başlamadan önce elinizde **bir test kaydı** olması işi hızlandırır — 10–15 dakikalık gerçek bir ders parçası yeter. Onunla hem Groq'un Türkçe kalitesini ölçeriz, hem Arapça ibarelerin nasıl çıktığını görürüz, hem de not yapısını gerçek veriyle ayarlarız.
