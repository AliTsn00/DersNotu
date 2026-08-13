# Aracı kurulumu (5 dakika, ücretsiz)

## Neden gerekli

Cloudflare'in API'si tarayıcıdan doğrudan çağrılamıyor. Tarayıcı, başka bir
siteye istek göndermeden önce "izin var mı?" diye soruyor (ön kontrol / CORS).
Cloudflare bu soruya cevap vermiyor — `405 Method Not Allowed` dönüyor ve izin
başlığı göndermiyor. Sonuç: istek daha yola çıkmadan tarayıcı tarafından
engelleniyor. Anahtarınızda ya da hesabınızda bir sorun yok.

Çözüm, aradaki izni verecek küçük bir aracı: kendi Cloudflare hesabınızda
çalışan bir Worker. İsteği alır, aynen Cloudflare'e iletir, cevaba izin
başlıklarını ekleyip geri verir. Ücretsiz katman günde 100.000 istek — bu iş
için fazlasıyla yeterli.

**Anahtarınız Worker'da saklanmaz.** Tarayıcıdan gelen `Authorization` başlığı
olduğu gibi iletilir. Adresi bilen biri kendi anahtarı olmadan hiçbir şey
yapamaz, kotanızı da harcayamaz.

## Adımlar

1. [dash.cloudflare.com](https://dash.cloudflare.com) → sol menüden
   **Compute (Workers)** → **Workers & Pages**
2. **Create** → **Workers** → **Create Worker**
3. Ad: `ders-notu-araci` → **Deploy** (şimdilik örnek kod yayınlanır, sorun değil)
4. **Edit code** (ya da **Continue to project** → **Edit code**)
5. Düzenleyicideki bütün kodu silin. Bu depodaki
   [`worker/zeka-araci.js`](zeka-araci.js) dosyasının içeriğini yapıştırın.
6. Sağ üstten **Deploy** → **Save and deploy**
7. Worker'ın adresini kopyalayın. Şu biçimdedir:
   `https://ders-notu-araci.<hesap-adınız>.workers.dev`
8. Uygulamada **Ayarlar** → *Yapay zekâ ile not çıkarma* → **Aracı adresi**
   alanına yapıştırın.

Bitti. **Not** sekmesinde **Akıllı not çıkar** artık çalışır.

## Kendi adresinizden yayınlıyorsanız

`zeka-araci.js` içindeki `IZINLI_KAYNAKLAR` listesi hangi sitelerin bu aracıyı
kullanabileceğini belirler. Uygulamayı başka bir adrese taşırsanız o adresi
listeye ekleyin, yoksa tarayıcı yine engeller.

## Sorun giderme

| Uygulamadaki hata | Anlamı |
| --- | --- |
| Aracı adrese ulaşılamadı | Adres yanlış yazılmış ya da Worker yayınlanmamış. Adresi tarayıcıda açın — "Yalnızca POST kabul edilir." yazmalı. |
| Geçersiz yol (400) | Hesap kimliği 32 haneli değil. Ayarlardan kontrol edin. |
| Cloudflare anahtarı kabul edilmedi (401/403) | Token yanlış ya da yetkisi eksik. Token'ın **Workers AI – Read** *ve* **Edit** yetkisi olmalı. |
| Hesap kimliği ya da model bulunamadı (404) | Hesap kimliği yanlış. |
| Günlük ücretsiz kota doldu (429) | Kota her gün sıfırlanır. |
