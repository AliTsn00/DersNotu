// Ham ders metnini yapay zekâ ile anlamlı, sınıflandırılmış nota çevirir.
//
// Cloudflare Workers AI kullanılır: kalıcı ücretsiz katmanı (günde 10.000
// neuron) bu iş için fazlasıyla yeterli ve kredi kartı istemez.
//
// Kural motoru burada yok olmaz; ön işlemci ve güvenlik katmanı olarak kalır:
//   · cümlelere ayırır ve dolgu sözcüklerini atar (modele daha az token gider)
//   · Arapça parçaları metinden çıkarır → model onları göremez, bozamaz
//   · model başarısız olursa çevrimdışı yedek olarak devreye girer

import {
  hazirlikYap,
  notuDenetle,
  notuTamamla,
  caprazDogrula,
  uydurmalariAyikla,
} from '../turkce/llm.js';
import { notCikar } from '../turkce/index.js';

// Cloudflare'in kendi API'si tarayıcıdan çağrılamıyor: ön kontrol (OPTIONS)
// isteğine 405 dönüyor ve CORS başlığı göndermiyor. Bu yüzden istekler
// kullanıcının kendi hesabındaki ücretsiz Worker aracısına gider (worker/).
// Doğrudan adres yalnızca tarayıcı dışı kullanım için yedekte durur.
const DOGRUDAN_UC = 'https://api.cloudflare.com/client/v4';

/** Hazır model seçenekleri. Türkçe başarımına göre sıralı. */
export const ZEKA_MODELLERI = {
  'llama-3.3-70b': {
    ad: 'Llama 3.3 70B — en iyi Türkçe',
    kimlik: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    aciklama: 'Türkçe sınavında (TR-MMLU) açık modeller arasında en yüksek skor.',
  },
  'gpt-oss-120b': {
    ad: 'GPT-OSS 120B — daha ucuz',
    kimlik: '@cf/openai/gpt-oss-120b',
    aciklama: 'Daha az kota harcar; Türkçe başarımı ölçülmedi.',
  },
  'llama-4-scout': {
    ad: 'Llama 4 Scout',
    kimlik: '@cf/meta/llama-4-scout-17b-16e-instruct',
    aciklama: 'Geniş bağlam; Türkçe başarımı ölçülmedi.',
  },
};

// Bir istekte modele verilecek en fazla cümle sayısı. 55 denendi: üretilen JSON
// yanıt sınırına takılıp yarıda kesiliyordu. 30 cümle, dolu bir bölüm çıkarmaya
// yetiyor ve çıktı rahatça sığıyor.
const PARCA_CUMLE = 30;
const ZAMAN_ASIMI_MS = 3 * 60 * 1000;

const YONERGE = `Sen bir Türkçe ders notu editörüsün. Sana bir dersin konuşma çözümü
numaralı cümleler hâlinde verilir. Görevin bunu ANLAMLI BİR DERS NOTUNA çevirmek.

ÇOK ÖNEMLİ — bu bir döküm değil, ders notudur:
- Konuşmayı olduğu gibi aktarma. Yarım kalmış cümle parçalarını BİRLEŞTİR ve
  düzgün, tam Türkçe cümleler kur.
- Konuşma dilini yazı diline çevir ("yani şey böyle oluyor işte" → düzgün cümle).
- Selamlaşma, hâl hatır sorma, "tamam mı arkadaşlar", "zil çaldı", yoklama gibi
  ders içeriği olmayan cümleleri NOTA ALMA.
- Konu değiştikçe yeni bölüm aç. Tek bölümlük not yapma.
- Bir cümle önceki cümleyi açıklıyorsa onu alt madde yap.

ANLAMI DEĞİŞTİRME: bilgi ekleme, uydurma, ders dışı yorum katma. Konuşma
tanımanın açıkça yanlış duyduğu kelimeleri bağlamdan düzeltebilirsin
(ör. "Ada olan aşkları" → "Allah'a olan aşkları"), ama emin değilsen düzeltme.

ARAPÇA KORUMA — İHLAL EDİLEMEZ:
- ⟦AR:0⟧ gibi yer tutucuları AYNEN kopyala. İçeriğini tahmin etme, yazma, değiştirme.
- SANA VERİLMEYEN bir yer tutucuyu ASLA yazma. Yalnızca yukarıdaki cümlelerde
  gördüğün numaraları kullanabilirsin. Bir âyetten ya da hadîsten söz ediliyor
  ama metinde yer tutucu yoksa, o cümleyi normal "madde" türünde yaz.
  Yer tutucu uydurmak, o maddeyi hiç yazmamaktan çok daha kötüdür.
- Çıktında hiçbir yerde Arapça harf bulunmayacak.
- Bir âyet/hadîsin kaynağından emin değilsen kunye alanını boş bırak.
  Yanlış kaynak yazmak, kaynak yazmamaktan çok daha kötüdür.

Yanıtın SADECE geçerli JSON olsun. Açıklama, giriş cümlesi, kod bloğu işareti yazma.

JSON biçimi:
{
  "baslik": "Dersin gerçek konusunu yansıtan kısa başlık",
  "bolumler": [
    {
      "baslik": "Bölüm başlığı",
      "maddeler": [
        {
          "kaynak": 3,
          "tur": "madde",
          "metin": "Düzgün, tam bir Türkçe cümle.",
          "kunye": null,
          "alt": ["Alt madde", "Başka alt madde"]
        }
      ]
    }
  ],
  "ozet": ["Dersin ana fikri", "İkinci ana fikir"],
  "sorular": ["Cevapsız kalan soru"]
}

"kaynak": cümlenin numarası (verilen listedeki i değeri).
"tur" şunlardan biri: baslik, tanim, madde, listeBasi, onemli, ornek, formul,
bilgi, ayet, hadis, dua, arapca, gorus.
- tanim türünde metin şu biçimde olmalı: "**Terim:** Açıklama"
- ayet/hadis/dua/arapca türünü YALNIZCA elinde gerçek bir ⟦AR:n⟧ varsa kullan.
  Bu türlerde metin SADECE o yer tutucudan ibaret olmalı, kunye alanına varsa
  kaynak yazılır ("Bakara 153", "Müslim").
- ornek türünde metin "Örnek: ..." ile başlar.`;

/**
 * Cloudflare'in yanıt gövdesinden model çıktısını alır.
 *
 * Alanın adı modele göre değişiyor: kimi `response`, kimi `output_text`, kimi
 * OpenAI biçiminde `choices[].message.content` döndürüyor. `response` bazen
 * metin değil, çözülmüş nesne oluyor — o hâlde olduğu gibi aktarılır, çünkü
 * metne çevirmeye çalışmak "[object Object]" üretir.
 */
export function ciktiyiAl(sonuc) {
  if (sonuc == null) return '';
  if (typeof sonuc === 'string') return sonuc;

  for (const aday of [sonuc.response, sonuc.output_text, sonuc.text, sonuc.content]) {
    if (typeof aday === 'string' && aday.trim()) return aday;
    if (aday && typeof aday === 'object') return aday;
  }

  const ileti = sonuc.choices?.[0]?.message?.content;
  if (typeof ileti === 'string' && ileti.trim()) return ileti;

  // gpt-oss biçimi: output[].content[].text
  if (Array.isArray(sonuc.output)) {
    const metinler = sonuc.output
      .flatMap((oge) => (Array.isArray(oge?.content) ? oge.content : []))
      .map((parca) => parca?.text)
      .filter((metin) => typeof metin === 'string' && metin.trim());
    if (metinler.length) return metinler.join('\n');
  }

  // Tanınmayan yapı: olduğu gibi geçilir, hata mesajı yapıyı gösterebilsin.
  return sonuc;
}

/**
 * Yarıda kesilmiş JSON için kurtarma adayları üretir. Model yanıt sınırına
 * takıldığında çıktı bir dizginin ya da nesnenin ortasında biter; açık kalanlar
 * kapatılırsa notun tamamlanmış kısmı kurtarılabilir.
 */
export function jsonKurtarmaAdaylari(metin) {
  let dizgide = false;
  let kacis = false;
  const yigin = [];
  for (const harf of metin) {
    if (kacis) {
      kacis = false;
      continue;
    }
    if (harf === '\\') {
      kacis = true;
      continue;
    }
    if (harf === '"') {
      dizgide = !dizgide;
      continue;
    }
    if (dizgide) continue;
    if (harf === '{' || harf === '[') yigin.push(harf);
    else if (harf === '}' || harf === ']') yigin.pop();
  }

  const kapat = (govde) => {
    let sonuc = govde;
    for (let i = yigin.length - 1; i >= 0; i -= 1) sonuc += yigin[i] === '{' ? '}' : ']';
    return sonuc;
  };

  const adaylar = [];
  // Kesilme bir dizginin ortasındaysa önce dizgi kapatılır.
  if (dizgide) adaylar.push(kapat(`${metin}"`));
  adaylar.push(kapat(metin));
  // Yarım kalan anahtar/değer çifti varsa son virgülden itibarı atılır.
  const sonVirgul = metin.lastIndexOf(',');
  if (sonVirgul > 0) adaylar.push(kapat(metin.slice(0, sonVirgul)));
  return adaylar;
}

/** Modelin yanıtından JSON gövdesini ayıklar. */
export function jsonAyikla(ham) {
  // JSON kipinde model çıktısı çözülmüş nesne olarak gelebiliyor.
  if (ham && typeof ham === 'object') {
    if (Array.isArray(ham.bolumler)) return ham;
    throw new Error(
      `Model beklenen yapıyı döndürmedi: ${JSON.stringify(ham).slice(0, 200)}`,
    );
  }

  let metin = String(ham || '').trim();
  // Bazı modeller yanıtı kod bloğuna sarar.
  const blok = metin.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blok) metin = blok[1].trim();
  // Baştaki açıklama cümlelerini at.
  const bas = metin.indexOf('{');
  if (bas === -1) {
    throw new Error(
      `Model JSON döndürmedi. Yanıtın başı: ${metin.slice(0, 200) || '(boş yanıt)'}`,
    );
  }

  const govde = metin.slice(bas);
  const son = govde.lastIndexOf('}');
  if (son !== -1) {
    try {
      return JSON.parse(govde.slice(0, son + 1));
    } catch {
      // Yarıda kesilmiş olabilir; aşağıda kurtarma denenir.
    }
  }
  for (const aday of jsonKurtarmaAdaylari(govde)) {
    try {
      return JSON.parse(aday);
    } catch {
      // Sıradaki adaya geç.
    }
  }
  throw new Error(
    `Model geçerli JSON döndürmedi (${metin.length} karakterlik yanıt kurtarılamadı). Başı: ${metin.slice(0, 150)}`,
  );
}

/** Cloudflare Workers AI'ye bir sohbet isteği gönderir. */
async function modeliCagir(ayarlar, mesajlar, isaret) {
  const { hesapKimligi, anahtar, model = 'llama-3.3-70b', araci } = ayarlar;
  if (!hesapKimligi || !anahtar) {
    throw new Error('Önce Ayarlar bölümünden Cloudflare hesap kimliği ve anahtarı girin.');
  }
  const secim = ZEKA_MODELLERI[model] || ZEKA_MODELLERI['llama-3.3-70b'];
  const temel = (araci || DOGRUDAN_UC).replace(/\/+$/, '');

  const durdurucu = new AbortController();
  const sayac = setTimeout(() => durdurucu.abort(), ZAMAN_ASIMI_MS);
  const vazgec = () => durdurucu.abort();
  isaret?.addEventListener('abort', vazgec);

  let yanit;
  try {
    // Aracı, hedefi sorgu parametresiyle alır; doğrudan bağlantıda Cloudflare'in
    // kendi yol biçimi kullanılır.
    const hedef = araci
      ? `${temel}?hesap=${encodeURIComponent(hesapKimligi)}&model=${encodeURIComponent(secim.kimlik)}`
      : `${temel}/accounts/${hesapKimligi}/ai/run/${secim.kimlik}`;

    yanit = await fetch(hedef, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anahtar}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: mesajlar, max_tokens: 4096, temperature: 0.2 }),
      signal: durdurucu.signal,
    });
  } catch (sorun) {
    if (sorun.name === 'AbortError') {
      throw new Error(
        isaret?.aborted ? 'Not çıkarma iptal edildi.' : 'Yapay zekâ servisi zamanında yanıt vermedi.',
      );
    }
    // Aracı girilmemişse istek doğrudan Cloudflare'e gitmiştir ve tarayıcı
    // onu CORS yüzünden engellemiştir; "internetinizi kontrol edin" demek
    // kullanıcıyı yanlış yere yönlendirir.
    throw new Error(
      araci
        ? 'Aracı adrese ulaşılamadı. Adresi ve internet bağlantınızı kontrol edin.'
        : 'Tarayıcı Cloudflare\'e doğrudan bağlanamıyor. Ayarlardan aracı adresini girin (ARACI-KURULUM.md).',
    );
  } finally {
    clearTimeout(sayac);
    isaret?.removeEventListener('abort', vazgec);
  }

  if (!yanit.ok) {
    const govde = await yanit.text().catch(() => '');
    // Cloudflare reddin sebebini gövdede açıklıyor; teşhis için kullanıcıya
    // gösterilir. "Anahtar kabul edilmedi" tek başına hangi yetkinin eksik
    // olduğunu söylemiyor.
    let ayrinti = '';
    try {
      const hata = JSON.parse(govde)?.errors?.[0];
      if (hata) ayrinti = ` — ${hata.code}: ${hata.message}`;
    } catch {
      // Gövde JSON değilse aracıdan gelen düz metindir.
      if (govde) ayrinti = ` — ${govde.slice(0, 120)}`;
    }
    if (yanit.status === 401 || yanit.status === 403) {
      throw new Error(`Cloudflare anahtarı kabul edilmedi${ayrinti}`);
    }
    if (yanit.status === 404) {
      throw new Error(`Hesap kimliği ya da model bulunamadı${ayrinti}`);
    }
    if (yanit.status === 429) {
      throw new Error('Günlük ücretsiz kota doldu. Yarın tekrar deneyin (kota her gün sıfırlanır).');
    }
    throw new Error(`Yapay zekâ isteği başarısız (${yanit.status}). ${govde.slice(0, 200)}`);
  }

  const veri = await yanit.json();
  if (veri.success === false) {
    const ilk = veri.errors?.[0]?.message || 'bilinmeyen hata';
    throw new Error(`Yapay zekâ isteği reddedildi: ${ilk}`);
  }
  return ciktiyiAl(veri.result);
}

/** Cümleleri modele verilecek metne çevirir. */
function cumleleriYaz(cumleler) {
  return cumleler
    .map((c) => {
      const etiket = [c.kunye ? `kaynak: ${c.kunye}` : null, c.korunacak ? 'harfiyen koru' : null]
        .filter(Boolean)
        .join(', ');
      return `[${c.i}]${etiket ? ` (${etiket})` : ''} ${c.metin}`;
    })
    .join('\n');
}

/**
 * Parçada gerçekten bulunan yer tutucuları modele açıkça bildirir.
 *
 * Yönerge tek başına yetmiyor: model, âyetten söz edilen bir cümle görünce
 * elinde yer tutucu olmasa da uydurabiliyor. Kullanılabilir numaraları saymak
 * bu eğilimi kesiyor.
 */
export function yerTutucuNotu(cumleler) {
  const bulunanlar = [
    ...new Set(
      cumleler.flatMap((cumle) =>
        [...String(cumle.metin || '').matchAll(/⟦(AR:\d+)⟧/gu)].map((esles) => esles[1]),
      ),
    ),
  ];
  return bulunanlar.length
    ? `\nBu parçada kullanabileceğin yer tutucular yalnızca şunlar: ${bulunanlar
        .map((anahtar) => `⟦${anahtar}⟧`)
        .join(', ')}. Başka bir yer tutucu yazma.`
    : '\nBu parçada hiç Arapça yer tutucu yok. Çıktında ⟦AR:...⟧ biçiminde hiçbir şey yazma.';
}

/** Modelin sade çıktısını uygulamanın iç yapısına dönüştürür. */
function tamYapiyaCevir(basit) {
  const bolumler = (basit.bolumler || []).map((bolum, bi) => {
    const maddeler = (bolum.maddeler || []).map((madde, mi) => {
      const kaynak = Number.isInteger(madde.kaynak) ? madde.kaynak : null;
      const kimlik = kaynak === null ? `e${bi}-${mi}` : `c${kaynak}`;
      const alintiMi = ['ayet', 'hadis', 'dua', 'arapca'].includes(madde.tur);
      return {
        id: kimlik,
        kaynak,
        tur: madde.tur || 'madde',
        metin: String(madde.metin ?? '').trim(),
        ...(alintiMi
          ? { kaynakKunyesi: madde.kunye || null, dogrulanmadi: true }
          : {}),
        alt: (madde.alt || [])
          .filter(Boolean)
          .map((alt, ai) =>
            typeof alt === 'string'
              ? { id: `${kimlik}-a${ai}`, kaynak, tur: 'madde', metin: alt.trim() }
              : {
                  id: `${kimlik}-a${ai}`,
                  kaynak: Number.isInteger(alt.kaynak) ? alt.kaynak : kaynak,
                  tur: alt.tur || 'madde',
                  metin: String(alt.metin ?? '').trim(),
                },
          )
          .filter((a) => a.metin),
      };
    }).filter((m) => m.metin);

    const ilkKaynak = maddeler.find((m) => m.kaynak !== null)?.kaynak ?? bi;
    return {
      id: `b${ilkKaynak}`,
      baslik: String(bolum.baslik || 'Genel').trim(),
      gruplar: [{ id: `b${ilkKaynak}-g0`, baslik: null, maddeler }],
    };
  }).filter((b) => b.gruplar[0].maddeler.length);

  return {
    baslik: String(basit.baslik || '').trim(),
    bolumler,
    ozet: (basit.ozet || []).map((s) => String(s).trim()).filter(Boolean),
    sorular: (basit.sorular || []).map((s) => String(s).trim()).filter(Boolean),
    anahtarlar: [],
  };
}

/** Cümle listesini modele sığacak parçalara böler. */
function parcalaraBol(cumleler) {
  const parcalar = [];
  for (let i = 0; i < cumleler.length; i += PARCA_CUMLE) {
    parcalar.push(cumleler.slice(i, i + PARCA_CUMLE));
  }
  return parcalar;
}

/**
 * Ham ders metninden yapay zekâ destekli not çıkarır.
 *
 * @param {string} hamMetin
 * @param {{hesapKimligi:string, anahtar:string, model?:string, detay?:string,
 *          sure?:number, tarih?:string, isaret?:AbortSignal,
 *          ilerleme?:(durum:{adim:number,toplam:number})=>void}} ayarlar
 * @returns {Promise<{not:object, uyarilar:string[]}>}
 */
export async function akilliNotCikar(hamMetin, ayarlar = {}) {
  const { isaret, ilerleme } = ayarlar;
  const hazirlik = hazirlikYap(hamMetin, { detay: ayarlar.detay });
  if (!hazirlik.cumleler.length) throw new Error('Notu çıkarılacak metin bulunamadı.');

  const parcalar = parcalaraBol(hazirlik.cumleler);
  const bolumler = [];
  const ozet = [];
  const sorular = [];
  let baslik = '';

  for (let i = 0; i < parcalar.length; i += 1) {
    ilerleme?.({ adim: i + 1, toplam: parcalar.length });

    const oncekiBasliklar = bolumler.map((b) => b.baslik).filter(Boolean);
    const baglam = oncekiBasliklar.length
      ? `\n\nDersin buraya kadarki bölümleri: ${oncekiBasliklar.join(' · ')}. ` +
        `Aynı başlıkları tekrar açma; konu devam ediyorsa yeni bölüm açmadan sürdür.`
      : '';

    const ham = await modeliCagir(
      ayarlar,
      [
        { role: 'system', content: YONERGE },
        {
          role: 'user',
          content:
            `Aşağıdaki ders çözümünü ders notuna çevir.${baglam}\n\n` +
            `${cumleleriYaz(parcalar[i])}\n${yerTutucuNotu(parcalar[i])}`,
        },
      ],
      isaret,
    );

    const basit = jsonAyikla(ham);
    const parca = tamYapiyaCevir(basit);
    if (!baslik && parca.baslik) baslik = parca.baslik;
    bolumler.push(...parca.bolumler);
    ozet.push(...parca.ozet);
    sorular.push(...parca.sorular);
  }

  const taslak = { baslik, bolumler, ozet, sorular, anahtarlar: [] };

  // Karşılığı olmayan yer tutucular önce ayıklanır. Bunlar boş göndermedir:
  // uydurulmuş bir metin taşımadıkları için notun tamamını feda etmeyi
  // gerektirmiyorlar, maddeyi düşürmek yetiyor.
  const uydurma = uydurmalariAyikla(taslak, hazirlik.arapca);

  const { hatalar, dusen } = notuDenetle(taslak, hazirlik.arapca);
  if (hatalar.length) {
    // Notta ham Arapça metin var: model alıntının kendisine dokunmuş. Bu
    // gerçek ihlaldir, not kullanılmaz.
    throw new Error(
      `Yapay zekâ Arapça alıntılara dokundu, not kullanılmadı:\n${hatalar.slice(0, 3).join('\n')}`,
    );
  }

  const not = notuTamamla(taslak, hazirlik, { sure: ayarlar.sure, tarih: ayarlar.tarih });
  const uyarilar = caprazDogrula(not, hazirlik.yerelOlcut);
  if (uydurma) {
    uyarilar.push(
      `${uydurma} madde, karşılığı olmayan bir âyet/hadîs göndermesi taşıdığı için çıkarıldı.`,
    );
  }
  if (dusen.length) {
    uyarilar.push(`${dusen.length} Arapça alıntı nota girmemiş olabilir.`);
  }

  return { not, uyarilar };
}

/** Yapay zekâ kullanılamadığında kural motoruna düşer. */
export function yerelNotCikar(hamMetin, secenekler) {
  return notCikar(hamMetin, secenekler);
}
