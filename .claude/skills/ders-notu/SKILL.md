---
name: ders-notu
description: Ders ses kaydını veya transkriptini anlamlandırılmış, sınıflandırılmış, numaralı bir ders notuna (.docx + .md) çevirir. Kullanıcı bir ders kaydı/transkripti verdiğinde, "ders notu çıkar", "bu dersi nota çevir", "kaydı yazıya dök ve notlaştır" dediğinde, ya da .m4a/.mp3/.wav/.opus bir ders sesi veya ham transkript dosyası gösterdiğinde kullan. Türkçe dersler, özellikle İslamî ilimler dersleri (âyet, hadîs, duâ, Arapça ibare, mezhep görüşü) için tasarlandı.
---

# Ders Notu Çıkarma

Ders kaydını **anlamlı, sınıflandırılmış, akışı çizilmiş** bir nota çevirir.
Sadece yazıya dökmez: konuyu açar, maddeleri türlerine ayırır, hiyerarşi kurar.

## Boru hattı

```
ses (.m4a/.mp3/…)                          ham transkript (.txt)
        │                                            │
        │  scripts/ses-metin.mjs                     │
        │  ffmpeg → 16 kHz mono                      │
        │  → Groq Whisper large-v3                   │
        ▼                                            ▼
        └──────────────► ham.txt ◄───────────────────┘
                            │
                            │  scripts/on-isle.mjs
                            │  temizle → cümlele → noktala
                            │  → Arapça parçaları ⟦AR:n⟧ ile koru
                            ▼
                     hazirlik.json
                            │
                            │  ◄◄◄ SEN BURADASIN ►►►
                            │  Cümleleri okuyup yapıyı kur
                            ▼
                        not.json
                            │
                            │  scripts/not-yaz.mjs
                            │  doğrula → Arapça'yı geri koy
                            │  → numaralandır → ekleri türet
                            ▼
                   ders-notu.md + ders-notu.docx
```

## Adımlar

### 1. Girdiyi belirle

- **Ses dosyası verilmişse** (`.m4a .mp3 .wav .opus .ogg .webm .mp4`):
  ```bash
  node scripts/ses-metin.mjs <ses> ham.txt
  ```
  `GROQ_API_KEY` tanımlı olmalı. Yoksa kullanıcıya söyle:
  console.groq.com'dan ücretsiz anahtar alınır, ücretsiz katmanda günde 8 saat
  ses işlenebiliyor. Alternatif: Buzz ile PC'de offline çevirip `.txt` vermesi.

- **Transkript verilmişse** doğrudan 2. adıma geç.

### 2. Ön işlem

```bash
node scripts/on-isle.mjs ham.txt hazirlik.json
```

Çıktıdaki sayıları oku — özellikle **yerel motorun bulduğu âyet/hadîs sayısını**.
Senin üreteceğin notta bu sayılardan belirgin düşük kalmamalı.

### 3. Yapılandırma — senin işin

`hazirlik.json` dosyasını oku. İçinde:

- `cumleler[]` — `{ i, metin, ipucu, kunye?, korunacak?, arapcaIcerir? }`
  - `i` → cümlenin sırası. Ürettiğin maddelerde `kaynak` olarak bunu kullan.
  - `ipucu` → kural motorunun tür tahmini. **Bağlayıcı değil**, sık yanılır. Sen karar ver.
  - `kunye` → varsa tespit edilmiş kaynak (`Bakara 153`, `Müslim`).
  - `korunacak: true` → Latin harfli Arapça (çevriyazı). **Harfiyen kopyala.**
  - `arapcaIcerir: true` → içinde ⟦AR:n⟧ yer tutucusu var.
- `arapca{}` — yer tutucu → orijinal Arapça metin. **Sen bunu okumazsın, kullanmazsın.**
- `yerelOlcut{}` — kural motorunun bulguları, karşılaştırma için.

Sonucu `not.json` olarak yaz (şema aşağıda).

### 4. Yaz

```bash
node scripts/not-yaz.mjs not.json hazirlik.json ders-notu
```

Doğrulama başarısız olursa (çıkış kodu 2) hatayı oku, `not.json`'u düzelt, tekrar çalıştır.
En sık sebep: yer tutucu yerine Arapça metin yazılmış olması.

### 5. Bildir

Kullanıcıya üretilen dosyaları, bölüm/madde sayısını ve varsa uyarıları söyle.
Ham dosyaları (`ham.txt`, `hazirlik.json`, `not.json`) silme — düzeltme gerekebilir.

---

## not.json şeması

```json
{
  "baslik": "Sabır",
  "bolumler": [
    {
      "id": "b0",
      "baslik": "Sabrın Tanımı",
      "gruplar": [
        {
          "id": "b0-g0",
          "baslik": null,
          "maddeler": [
            {
              "id": "c3",
              "kaynak": 3,
              "tur": "tanim",
              "metin": "**Sabır:** Kişinin musibetlere karşı direnç göstermesidir.",
              "alt": []
            }
          ]
        }
      ]
    }
  ],
  "ozet": ["Sabır üç kısma ayrılır."],
  "sorular": ["Sabır ile tevekkül arasındaki fark nedir?"],
  "anahtarlar": [{ "kelime": "sabır", "sayi": 12 }]
}
```

**Sadece bu alanları üret.** `tanimlar`, `onemliler`, `ayetler`, `hadisler`,
`dualar`, `gorusler`, `istatistik`, `tarih` alanlarını **yazma** — `not-yaz.mjs`
onları madde ağacından otomatik türetir.

### Kimlik kuralı

- Bölüm: `b<ilkMaddeninKaynagi>` → `b0`, `b17`
- Madde ve alt madde: `c<kaynak>` → `c3`, `c42`
- Grup: `<bolumId>-g<sıra>` → `b0-g0`

`kaynak`, cümlenin `i` değeridir. Bir cümleyi iki maddeye bölersen ikincisine
`c42b` gibi bir sonek ver ve `kaynak`ı aynı bırak.

### Madde türleri

| `tur` | Ne zaman | Metin biçimi |
| --- | --- | --- |
| `tanim` | Bir kavram tanımlanıyor | **`**Terim:** Açıklama`** — bu biçim zorunlu, dizin bundan türetiliyor |
| `madde` | Sıradan bilgi cümlesi | düz metin |
| `listeBasi` | "Üç çeşidi vardır" gibi liste açan cümle | düz metin, alt maddeleri `alt[]` içine koy |
| `onemli` | Vurgulanan, sınavda çıkacak bilgi | düz metin |
| `ornek` | Örneklendirme | `Örnek: …` |
| `formul` | Kural, formül, kaide | düz metin |
| `bilgi` | Yan bilgi, bağlam | düz metin |
| `baslik` | Konu başlığı — **madde yapma**, bölüm başlığı olarak kullan | — |
| `ayet` | Kur'an âyeti | aşağıya bak |
| `hadis` | Hadîs | aşağıya bak |
| `dua` | Duâ | aşağıya bak |
| `arapca` | Sınıflandırılamayan Arapça ibare | aşağıya bak |
| `meal` | Bir alıntının meâli | **alt madde** olmalı, metin `Meâli: …` |
| `gorus` | Mezhep görüşü, ihtilaf | düz metin |

`ozet` ve `soru` türünde **madde üretme** — onlar `ozet[]` ve `sorular[]`
dizilerine düz metin olarak gider.

### Alıntı maddeleri (âyet / hadîs / duâ / Arapça)

```json
{
  "id": "c12",
  "kaynak": 12,
  "tur": "ayet",
  "metin": "⟦AR:3⟧",
  "kaynakKunyesi": "Bakara 153",
  "dogrulanmadi": true,
  "giris": "Allah Teâlâ şöyle buyuruyor",
  "alt": [
    { "id": "c13", "kaynak": 13, "tur": "meal",
      "metin": "Meâli: Ey iman edenler, sabır ve namazla yardım isteyin." }
  ]
}
```

- `metin` **yalnızca yer tutucudur.** Başka bir şey yazma.
- `dogrulanmadi: true` her âyet/hadîs/duâ için zorunlu.
- `kaynakKunyesi`: `hazirlik.json`'daki `kunye` varsa onu kullan. **Yoksa `null` bırak.**

---

## 🔴 ARAPÇA KORUMA — İHLAL EDİLEMEZ

Bu projenin en katı kuralı. Kod seviyesinde denetleniyor, ihlal edilirse dosya yazılmaz.

1. **⟦AR:n⟧ yer tutucularını harfiyen aktar.** Ne içeriğini tahmin et, ne değiştir,
   ne birleştir, ne böl.
2. **Arapça metin yazma.** Çıktının hiçbir yerinde Arapça harf bulunmayacak.
   Bir âyeti "biliyor olman" seni yazmaya yetkilendirmez.
3. **`korunacak: true` cümleleri birebir kopyala.** Bunlar Latin harfleriyle
   yazılmış Arapça ibarelerdir. Konuşma tanıma yanlış yazmış olabilir —
   **düzeltme**. Duyulanı olduğu gibi bırak.

   ⚠️ **Bu bayrağa körü körüne güvenme.** Kural motorunun çevriyazı sezgisi
   eksiktir; `es sabru dıyâun`, `elhamdülillâhi rabbil âlemîn` gibi ibareleri
   `bilgi` diye işaretleyip geçebilir. Latin harfleriyle yazılmış ama Türkçe
   olmayan her cümleyi — bayrağı olmasa da — `arapca` türünde madde yap ve
   **harfiyen** aktar. Türkçeleştirme, düzeltme, tamamlama.
4. **Künye uydurma.** Bir âyetin hangi sûreden, bir hadîsin hangi kaynaktan
   olduğundan emin değilsen `kaynakKunyesi: null` yaz.
   **Yanlış kaynak yazmak, kaynak yazmamaktan çok daha kötüdür.**
5. Sen bir tashih aracı değilsin. Duyulanı yapılandırıyorsun.

---

## Konu açma — "meseleyi aç" isteği

Kullanıcı "konuyu açsın", "detaylandırsın" derse: hocanın anlattığını genişleten
açıklamalar **ayrı ve işaretli** olmalı.

```json
{ "id": "c20b", "kaynak": 20, "tur": "bilgi",
  "metin": "💡 **Açıklama (yapay zekâ):** Sabrın üç kısma ayrılması taksimi, İmam Gazâlî'nin İhyâ'sında da geçer." }
```

Kurallar:
- Her zaman **alt madde** olarak, ilgili maddenin `alt[]` dizisine.
- Her zaman `💡 **Açıklama (yapay zekâ):**` önekiyle.
- **Âyet, hadîs, duâ ve Arapça maddelerine açıklama ekleme.** Hiçbir koşulda.
- İstenmediyse hiç üretme.

Hocanın söyledikleri ile senin eklediğin asla karışmamalı.

---

## Yapılandırma ilkeleri

**Bölümleme.** Konu değiştiğinde yeni bölüm aç. Hoca başlık kurmadan uzun uzun
anlatıyorsa konu kaymasına göre sen böl. 90 dakikalık bir derste 4–10 bölüm normal.
Tek bölümlük not, işi yapmamış olmak demektir.

**Grup kullanımı.** Bir bölümde 8'den fazla madde varsa alt başlıklı gruplara ayır.
Az maddeli bölümde tek grup, `baslik: null`.

**Hiyerarşi.** "Üç çeşidi vardır" → `listeBasi`, çeşitler onun `alt[]`'ında.
Bir cümle önceki cümleyi açıyorsa alt madde yap. Düz bir liste değil, **akış** kur.

**Atlanacaklar.** "Eee", "tamam mı arkadaşlar", "zil çaldı", "defterleri kapatın",
yoklama, sınıf yönetimi — nota girmez. Ön işlem çoğunu temizler, kalanı sen ele.

**Dil.** Konuşma dilini yazı diline çevir ("yani şey, bu böyle oluyor işte" →
"Bu şöyle işler:"). Ama **anlamı değiştirme, bilgi ekleme, eksiltme.**

**Başlık.** Dersin gerçek konusunu yansıtsın. "Ders Notu" gibi genel bir başlık kullanma.

**Özet.** 3–6 madde, dersin ana iddiaları.

**Sorular.** Hocanın cevapsız bıraktığı ya da "buna sonra bakacağız" dediği sorular.

---

## Sorun giderme

| Belirti | Sebep | Çözüm |
| --- | --- | --- |
| `GROQ_API_KEY tanımlı değil` | Anahtar yok | console.groq.com → anahtar → `$env:GROQ_API_KEY = "gsk_..."` |
| `ffmpeg bulunamadı` | ffmpeg kurulu değil | ffmpeg.org/download.html |
| Groq 429 | Saatlik/günlük kota | Saatte 2 saat, günde 8 saat ses sınırı. Bekle. |
| Groq 413 | Dosya 25 MB'ı aşıyor | Kaydı ikiye böl, ayrı ayrı çevir, metinleri birleştir |
| `DOĞRULAMA BAŞARISIZ` | Arapça sızıntısı | `not.json`'da o maddeyi bul, Arapça metni ⟦AR:n⟧ ile değiştir |
| `tanımsız yer tutucu` | Olmayan bir ⟦AR:n⟧ kullanılmış | `hazirlik.json`'daki `arapca` anahtarlarına bak |
| "X âyet düşmüş olabilir" uyarısı | Kural motorunun bulduğu alıntı notta yok | Cümleleri gözden geçir, atlanan alıntıyı ekle |
| Word dosyası açılmıyor | `docx` paketi kurulu değil | `npm install` |

## Denemek için

Gerçek kayıt yoksa örnek ders metinleriyle test et:

```bash
node -e "import('./src/ornek.js').then(m=>console.log(Object.values(m)[0]))" > ham.txt
node scripts/on-isle.mjs ham.txt hazirlik.json
```
