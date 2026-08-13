// Ders Notu — Cloudflare Workers AI için CORS aracısı.
//
// Neden gerekli: Cloudflare'in REST API'si tarayıcıdan doğrudan çağrılamıyor.
// Ön kontrol (OPTIONS) isteğine 405 dönüyor ve hiçbir CORS başlığı
// göndermiyor, bu yüzden tarayıcı isteği daha yola çıkmadan engelliyor.
// Bu Worker isteği aynen iletir, cevaba CORS başlıklarını ekler.
//
// Kurulumu: ARACI-KURULUM.md
//
// ⚠️ Türkiye'den workers.dev alt alanına erişilemiyor (TLS bağlantısı
// sıfırlanıyor, ölçüldü 13 Ağustos 2026). Bu yüzden kullanımdaki aracı Vercel
// sürümü: api/zeka/[...yol].js. Bu dosya, engel kalkarsa ya da yurt dışından
// kullanılırsa diye duruyor.
//
// Güvenlik notu: anahtar burada saklanmaz. Tarayıcıdan gelen Authorization
// başlığı olduğu gibi iletilir; adresi bilen biri kendi anahtarı olmadan
// hiçbir şey yapamaz, kotanızı da harcayamaz.

const IZINLI_KAYNAKLAR = ['https://alitsn00.github.io', 'http://localhost:5173'];

function corsBasliklari(kaynak) {
  return {
    'Access-Control-Allow-Origin': IZINLI_KAYNAKLAR.includes(kaynak)
      ? kaynak
      : IZINLI_KAYNAKLAR[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export default {
  async fetch(istek) {
    const cors = corsBasliklari(istek.headers.get('origin') || '');

    if (istek.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (istek.method !== 'POST') {
      return new Response('Yalnızca POST kabul edilir.', { status: 405, headers: cors });
    }

    // Hedef sorgu parametresiyle gelir: ?hesap=<32 haneli>&model=@cf/...
    // Kalıp kontrolü, aracının başka Cloudflare uçlarına açılmasını engeller.
    const sorgu = new URL(istek.url).searchParams;
    const hesap = sorgu.get('hesap') || '';
    const model = sorgu.get('model') || '';
    if (!/^[0-9a-f]{32}$/i.test(hesap)) {
      return new Response('Hesap kimliği 32 haneli olmalı.', { status: 400, headers: cors });
    }
    if (!/^@[\w./-]+$/.test(model)) {
      return new Response('Model kimliği geçersiz.', { status: 400, headers: cors });
    }

    const yetki = istek.headers.get('authorization');
    if (!yetki) {
      return new Response('Authorization başlığı yok.', { status: 401, headers: cors });
    }

    const yanit = await fetch(`https://api.cloudflare.com/client/v4/accounts/${hesap}/ai/run/${model}`, {
      method: 'POST',
      headers: { authorization: yetki, 'content-type': 'application/json' },
      body: await istek.text(),
    });

    return new Response(await yanit.text(), {
      status: yanit.status,
      headers: { ...cors, 'content-type': 'application/json' },
    });
  },
};
