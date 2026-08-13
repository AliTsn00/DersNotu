// Ders Notu — Cloudflare Workers AI için CORS aracısı (Vercel sürümü).
//
// İki ayrı engel var, ikisi de burada çözülüyor:
//
// 1. Cloudflare'in REST API'si tarayıcıdan doğrudan çağrılamıyor: ön kontrol
//    (OPTIONS) isteğine 405 dönüyor ve hiçbir CORS başlığı göndermiyor.
// 2. Aracı Cloudflare'in kendi Worker'ında da duramıyor: workers.dev ve
//    pages.dev alt alanlarına Türkiye'den erişilemiyor — TLS bağlantısı el
//    sıkışma aşamasında sıfırlanıyor (ölçüldü, 13 Ağustos 2026).
//
// api.cloudflare.com erişilebilir olduğu için aracı başka bir yerde çalışıp
// isteği oraya iletebiliyor. Cloudflare'de barınan sürüm worker/ altında duruyor;
// erişim engeli kalkarsa o da kullanılabilir.
//
// Anahtar burada saklanmaz: tarayıcıdan gelen Authorization başlığı olduğu gibi
// aktarılır. Adresi bilen biri kendi anahtarı olmadan kotanızı harcayamaz.

const IZINLI_KAYNAKLAR = ['https://alitsn00.github.io', 'http://localhost:5173'];

/** Uygulamanın kendi adresleri dışındakilere izin verilmez. */
function izinliMi(kaynak) {
  return IZINLI_KAYNAKLAR.includes(kaynak) || /^https:\/\/[\w-]+\.vercel\.app$/.test(kaynak);
}

export default async function handler(istek, yanit) {
  const kaynak = istek.headers.origin || '';
  yanit.setHeader(
    'Access-Control-Allow-Origin',
    izinliMi(kaynak) ? kaynak : IZINLI_KAYNAKLAR[0],
  );
  yanit.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  yanit.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  yanit.setHeader('Access-Control-Max-Age', '86400');
  yanit.setHeader('Vary', 'Origin');

  if (istek.method === 'OPTIONS') {
    yanit.status(204).end();
    return;
  }
  if (istek.method !== 'POST') {
    yanit.status(405).send('Yalnızca POST kabul edilir.');
    return;
  }

  // Yol olduğu gibi aktarılır: /accounts/<32 haneli kimlik>/ai/run/<model>
  // Kalıp kontrolü, aracının başka Cloudflare uçlarına açılmasını engeller.
  const yol = `/${[].concat(istek.query.yol || []).join('/')}`;
  if (!/^\/accounts\/[0-9a-f]{32}\/ai\/run\/.+$/i.test(yol)) {
    yanit.status(400).send('Geçersiz yol.');
    return;
  }

  const yetki = istek.headers.authorization;
  if (!yetki) {
    yanit.status(401).send('Authorization başlığı yok.');
    return;
  }

  const cevap = await fetch(`https://api.cloudflare.com/client/v4${yol}`, {
    method: 'POST',
    headers: { authorization: yetki, 'content-type': 'application/json' },
    // Vercel gövdeyi JSON olarak çözmüş olur; olduğu gibi geri kurulur.
    body: typeof istek.body === 'string' ? istek.body : JSON.stringify(istek.body ?? {}),
  });

  const govde = await cevap.text();
  yanit.setHeader('content-type', 'application/json');
  yanit.status(cevap.status).send(govde);
}
