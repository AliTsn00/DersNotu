# Aracı kurulumu (5 dakika, ücretsiz)

## Neden gerekli

İki ayrı engel var:

**1. Cloudflare'in API'si tarayıcıdan doğrudan çağrılamıyor.** Tarayıcı, başka
bir siteye istek göndermeden önce "izin var mı?" diye soruyor (ön kontrol /
CORS). Cloudflare bu soruya `405 Method Not Allowed` dönüyor ve izin başlığı
göndermiyor. İstek daha yola çıkmadan tarayıcı tarafından engelleniyor.

**2. Aracı, Cloudflare'in kendi Worker'ında da duramıyor.** `workers.dev` ve
`pages.dev` alt alanlarına Türkiye'den erişilemiyor — TLS bağlantısı el sıkışma
aşamasında sıfırlanıyor. *(Ölçüldü: 13 Ağustos 2026. `api.cloudflare.com` ve
`cloudflare.com` sorunsuz açılıyor; engel yalnızca bu iki ücretsiz alt alanda.)*

Bu yüzden aracı **Vercel**'de çalışıyor: `vercel.app` erişilebilir, Vercel de
`api.cloudflare.com`'a sunucu tarafından bağlanabiliyor.

**Anahtarınız aracıda saklanmaz.** Tarayıcıdan gelen `Authorization` başlığı
olduğu gibi iletilir. Adresi bilen biri kendi anahtarı olmadan hiçbir şey
yapamaz, kotanızı da harcayamaz.

## Adımlar

1. [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub**
   (kredi kartı istemez; Hobby planı ücretsiz)
2. **Add New…** → **Project**
3. Listeden **DersNotu** deposunu bulup **Import**
4. Ayarlara dokunmayın — Vercel Vite'ı kendi tanır. **Deploy**
5. Yayın bitince adresi kopyalayın: `https://<proje-adı>.vercel.app`
6. Uygulamada **Ayarlar** → *Yapay zekâ ile not çıkarma* → **Aracı adresi**
   alanına şunu yazın:

   ```
   https://<proje-adı>.vercel.app/api/zeka
   ```

   Sondaki `/api/zeka` şart.

Bitti. **Not** sekmesinde **Akıllı not çıkar** artık çalışır.

> Vercel her `git push`'ta kendini günceller. Uygulamanın kendisi GitHub
> Pages'te kalır; Vercel yalnızca aracı olarak kullanılır. İsterseniz Vercel
> adresinden de kullanabilirsiniz — o durumda aynı adres olduğu için CORS hiç
> devreye girmez.

## Cloudflare Worker sürümü

[`worker/zeka-araci.js`](worker/zeka-araci.js) aynı işi Cloudflare'de yapar ve
kod olarak daha basittir. Erişim engeli kalkarsa ya da Türkiye dışından
kullanıyorsanız tercih edilebilir: Workers & Pages → Create → Start with Hello
World → kodu yapıştır → Deploy. Aracı adresi o zaman
`https://ders-notu-araci.<hesabınız>.workers.dev` olur (yol eki yok).

## Sorun giderme

| Uygulamadaki hata | Anlamı |
| --- | --- |
| Aracı adrese ulaşılamadı | Adres yanlış ya da `/api/zeka` eki unutulmuş. Adresi tarayıcıda açın — "Yalnızca POST kabul edilir." yazmalı. |
| Geçersiz yol (400) | Hesap kimliği 32 haneli değil. Ayarlardan kontrol edin. |
| Cloudflare anahtarı kabul edilmedi (401/403) | Token yanlış ya da yetkisi eksik. Token'ın **Workers AI – Read** *ve* **Edit** yetkisi olmalı. |
| Hesap kimliği ya da model bulunamadı (404) | Hesap kimliği yanlış. |
| Günlük ücretsiz kota doldu (429) | Kota her gün sıfırlanır. |
