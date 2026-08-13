import { describe, expect, it } from 'vitest';

import { ayetiElleUygula, ayetleriDuzelt, duzeltilebilirMi } from '../src/kuran/duzelt.js';

const MUSHAF = 'إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ';
const BOZUK = 'ان الله مع الصبرين';

const notKur = () => ({
  baslik: 'Sabır',
  bolumler: [
    {
      id: 'b0',
      baslik: 'Giriş',
      gruplar: [
        {
          id: 'b0-g0',
          maddeler: [
            { id: 'c1', tur: 'madde', metin: 'Sabır güzeldir.', alt: [] },
            { id: 'c2', tur: 'ayet', metin: BOZUK, dogrulanmadi: true, alt: [] },
          ],
        },
      ],
    },
  ],
  ayetler: [{ id: 'c2', metin: BOZUK, kunye: null, meal: null }],
  hadisler: [],
  dualar: [],
});

const kesin = (kapsama = 0.9) => ({
  durum: 'kesin',
  kunye: 'Bakara 153',
  metin: MUSHAF,
  kapsama,
});

describe('duzeltilebilirMi', () => {
  it('kesin ve kapsayıcı eşleşmeyi kabul eder', () => {
    expect(duzeltilebilirMi(kesin())).toBe(true);
  });

  it('yaklaşık eşleşmeyi kendiliğinden uygulamaz', () => {
    expect(duzeltilebilirMi({ ...kesin(), durum: 'olasi' })).toBe(false);
  });

  it('âyetin küçük bir parçasına dokunmaz', () => {
    // Parçayı tam âyetle değiştirmek düzeltmek değil, bilgi eklemek olurdu.
    expect(duzeltilebilirMi(kesin(0.2))).toBe(false);
  });

  it('sonuç yoksa false döner', () => {
    expect(duzeltilebilirMi(null)).toBe(false);
  });
});

describe('ayetleriDuzelt', () => {
  it('doğrulanmış âyeti mushaf metniyle değiştirir', () => {
    const { not, duzeltilen } = ayetleriDuzelt(notKur(), new Map([['c2', kesin()]]));
    const madde = not.bolumler[0].gruplar[0].maddeler[1];
    expect(duzeltilen).toBe(1);
    expect(madde.metin).toBe(MUSHAF);
    expect(madde.kaynakKunyesi).toBe('Bakara 153');
    expect(madde.dogrulanmadi).toBe(false);
  });

  it('özgün metni saklar', () => {
    const { not } = ayetleriDuzelt(notKur(), new Map([['c2', kesin()]]));
    expect(not.bolumler[0].gruplar[0].maddeler[1].ozgunMetin).toBe(BOZUK);
  });

  it('alıntı dizinini de günceller', () => {
    // Yoksa notun sonundaki "Geçen Âyetler" listesi bozuk metni sürdürürdü.
    const { not } = ayetleriDuzelt(notKur(), new Map([['c2', kesin()]]));
    expect(not.ayetler[0].metin).toBe(MUSHAF);
    expect(not.ayetler[0].kunye).toBe('Bakara 153');
  });

  it('özgün notu değiştirmez', () => {
    const kaynak = notKur();
    ayetleriDuzelt(kaynak, new Map([['c2', kesin()]]));
    expect(kaynak.bolumler[0].gruplar[0].maddeler[1].metin).toBe(BOZUK);
  });

  it('düzeltme yoksa aynı nesneyi döndürür', () => {
    const kaynak = notKur();
    const { not, duzeltilen } = ayetleriDuzelt(kaynak, new Map([['c2', { durum: 'yok' }]]));
    expect(not).toBe(kaynak);
    expect(duzeltilen).toBe(0);
  });

  it('sonuç yoksa nota dokunmaz', () => {
    const kaynak = notKur();
    expect(ayetleriDuzelt(kaynak, new Map()).not).toBe(kaynak);
  });
});

describe('ayetiElleUygula', () => {
  it('yaklaşık eşleşmeyi kullanıcı isteğiyle uygular', () => {
    const sonuc = { durum: 'olasi', kunye: 'Bakara 153', metin: MUSHAF, benzerlik: 0.8 };
    const not = ayetiElleUygula(notKur(), 'c2', sonuc);
    const madde = not.bolumler[0].gruplar[0].maddeler[1];
    expect(madde.metin).toBe(MUSHAF);
    expect(madde.mushaftanDuzeltildi).toBe(true);
    expect(madde.ozgunMetin).toBe(BOZUK);
    expect(not.ayetler[0].metin).toBe(MUSHAF);
  });

  it('bilinmeyen kimlikte notu olduğu gibi bırakır', () => {
    const kaynak = notKur();
    expect(ayetiElleUygula(kaynak, 'yok-boyle', kesin())).toBe(kaynak);
  });
});
