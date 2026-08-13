// Ders Notu — Cloudflare Workers AI için CORS aracısı.
//
// Neden gerekli: Cloudflare'in REST API'si tarayıcıdan doğrudan çağrılamıyor.
// Ön kontrol (OPTIONS) isteğine 405 dönüyor ve hiçbir CORS başlığı
// göndermiyor, bu yüzden tarayıcı isteği daha yola çıkmadan engelliyor.
// Bu Worker isteği aynen iletir, cevaba CORS başlıklarını ekler.
//
// Kurulumu: worker/KURULUM.md
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

    // Yol olduğu gibi aktarılır: /accounts/<32 haneli kimlik>/ai/run/<model>
    // Kalıp kontrolü, aracının başka Cloudflare uçlarına açılmasını engeller.
    const yol = new URL(istek.url).pathname;
    if (!/^\/accounts\/[0-9a-f]{32}\/ai\/run\/.+$/i.test(yol)) {
      return new Response('Geçersiz yol.', { status: 400, headers: cors });
    }

    const yetki = istek.headers.get('authorization');
    if (!yetki) {
      return new Response('Authorization başlığı yok.', { status: 401, headers: cors });
    }

    const yanit = await fetch(`https://api.cloudflare.com/client/v4${yol}`, {
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
