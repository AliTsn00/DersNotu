import { describe, it, expect } from 'vitest';
import {
  arapcaMi,
  cevrimyaziMi,
  bilinenIbareMi,
  ozelAdlariBuyut,
  ayetKaynagi,
  hadisKaynagi,
  islamiTur,
} from '../src/turkce/islami.js';
import { notCikar } from '../src/turkce/index.js';
import { markdownYaz } from '../src/turkce/bicim.js';

const tumMaddeler = (not) =>
  not.bolumler.flatMap((bolum) => bolum.gruplar.flatMap((grup) => grup.maddeler));

describe('Arapça tespiti', () => {
  it('Arap harfli metni tanır', () => {
    expect(arapcaMi('إِنَّ اللَّهَ مَعَ الصَّابِرِينَ')).toBe(true);
    expect(arapcaMi('Sabır çok önemlidir')).toBe(false);
  });

  it('Latin harfli Arapça ibareyi tanır', () => {
    expect(cevrimyaziMi('innallâhe maas sâbirîn')).toBe(true);
    expect(cevrimyaziMi('lâ ilâhe illallah muhammedün resûlullah')).toBe(true);
  });

  it('sıradan Türkçe cümleyi Arapça saymaz', () => {
    expect(cevrimyaziMi('Bu konuyu hâlâ anlamayan var mı')).toBe(false);
    expect(cevrimyaziMi('Kâğıt üzerinde âlim geçinmek kolaydır')).toBe(false);
  });

  it('tek kelimelik bilinen ibareleri tanır', () => {
    expect(bilinenIbareMi('Bismillahirrahmanirrahim')).toBe(true);
    expect(bilinenIbareMi('Elhamdülillah')).toBe(true);
    expect(bilinenIbareMi('Fotosentez')).toBe(false);
  });
});

describe('Özel adlar', () => {
  it('dini özel adları büyütür', () => {
    expect(ozelAdlariBuyut('şüphesiz allah sabredenlerle beraberdir')).toBe(
      'şüphesiz Allah sabredenlerle beraberdir',
    );
    expect(ozelAdlariBuyut('kuranda geçer')).toBe('Kuranda geçer');
  });

  it('sıradan kelimelere dokunmaz', () => {
    expect(ozelAdlariBuyut('sabır çok önemlidir')).toBe('sabır çok önemlidir');
  });
});

describe('Kaynak künyesi', () => {
  it('sûre ve âyet numarasını çıkarır', () => {
    expect(ayetKaynagi('Bakara suresi 153. ayette şöyle buyuruyor')).toBe('Bakara 153');
    expect(ayetKaynagi('Yasin suresinde geçer')).toBe('Yâsîn');
    expect(ayetKaynagi('Al-i İmran suresi 190. ayet')).toBe('Âl-i İmrân 190');
  });

  it('hadis kaynağını çıkarır', () => {
    expect(hadisKaynagi('Bu hadis Müslim de geçmektedir')).toBe('Müslim');
    expect(hadisKaynagi('Fotosentez bitkilerde görülür')).toBe(null);
  });
});

describe('İslami cümle türleri', () => {
  it('mezhep görüşünü ayırır', () => {
    expect(islamiTur('Hanefî mezhebine göre bu böyledir')?.tur).toBe('gorus');
  });

  it('Arapça ibareyi hadis habercisiyle birlikte hadis sayar', () => {
    const sonuc = islamiTur('Resûlullah buyurdu: es sabru dıyâun ve lâ ilâhe illallah');
    expect(sonuc?.tur).toBe('hadis');
  });

  it('dini olmayan cümleye karışmaz', () => {
    expect(islamiTur('Fotosentez bitkilerde görülür')).toBe(null);
  });
});

describe('İslami ders — uçtan uca', () => {
  const ders = [
    'bismillahirrahmanirrahim',
    'bugün sabır konusunu işleyeceğiz',
    'sabır musibetlere karşı direnç göstermesine denir',
    'allah teâlâ bakara suresi 153. ayette şöyle buyuruyor',
    'innallâhe maas sâbirîn',
    'meali şüphesiz allah sabredenlerle beraberdir',
    'peygamber efendimiz sallallahu aleyhi ve sellem buyurdu ki',
    'es sabru dıyâun',
    'bu hadis müslim de geçmektedir',
    'hanefî mezhebine göre sabır imanın bir cüzüdür',
    'sonuç olarak sabır imanın yarısıdır',
  ].join('\n');

  const not = notCikar(ders, { detay: 'orta', sure: 1800 });

  it('âyeti künyesiyle toplar', () => {
    expect(not.ayetler).toHaveLength(1);
    expect(not.ayetler[0].kunye).toBe('Bakara 153');
    expect(not.ayetler[0].metin).toMatch(/sâbirîn/i);
  });

  it('âyetin mealini bağlar', () => {
    expect(not.ayetler[0].meal).toMatch(/sabredenlerle/i);
  });

  it('hadisi ve künyesini toplar', () => {
    expect(not.hadisler).toHaveLength(1);
    expect(not.hadisler[0].kunye).toBe('Müslim');
  });

  it('künye cümlesini ayrı madde olarak nota koymaz', () => {
    const metinler = tumMaddeler(not).map((m) => m.metin);
    expect(metinler.some((m) => /bu hadis müslim/i.test(m))).toBe(false);
  });

  it('mezhep görüşünü ayrı bölümde toplar', () => {
    expect(not.gorusler).toHaveLength(1);
  });

  it('alıntıları doğrulanmadı diye işaretler', () => {
    const alinti = tumMaddeler(not).find((m) => m.tur === 'ayet');
    expect(alinti.dogrulanmadi).toBe(true);
  });

  it('Markdown çıktısına doğrulama uyarısı koyar', () => {
    const md = markdownYaz(not);
    expect(md).toMatch(/doğrulanmamıştır/);
    expect(md).toMatch(/## Geçen Âyetler/);
    expect(md).toMatch(/## Geçen Hadîsler/);
  });
});
