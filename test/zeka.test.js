import { describe, expect, it } from 'vitest';

import { jsonAyikla, jsonKurtarmaAdaylari } from '../src/core/zeka.js';

describe('jsonAyikla', () => {
  it('düz JSON okur', () => {
    expect(jsonAyikla('{"baslik":"Ders"}')).toEqual({ baslik: 'Ders' });
  });

  it('kod bloğuna sarılmış yanıtı okur', () => {
    const ham = '```json\n{"baslik":"Ders"}\n```';
    expect(jsonAyikla(ham)).toEqual({ baslik: 'Ders' });
  });

  it('baştaki açıklama cümlesini atar', () => {
    const ham = 'İşte ders notunuz:\n{"baslik":"Ders"}';
    expect(jsonAyikla(ham)).toEqual({ baslik: 'Ders' });
  });

  it('dizgi ortasında kesilmiş yanıtı kurtarır', () => {
    // Model yanıt sınırına takıldığında çıktı böyle biter.
    const ham = '{"baslik":"Ders","bolumler":[{"baslik":"Giriş","maddeler":[{"metin":"Yarım cüm';
    const sonuc = jsonAyikla(ham);
    expect(sonuc.baslik).toBe('Ders');
    expect(sonuc.bolumler[0].baslik).toBe('Giriş');
  });

  it('madde arasında kesilmiş yanıtı kurtarır', () => {
    const ham =
      '{"baslik":"Ders","bolumler":[{"baslik":"Giriş","maddeler":[{"metin":"Tam cümle."},';
    const sonuc = jsonAyikla(ham);
    expect(sonuc.bolumler[0].maddeler[0].metin).toBe('Tam cümle.');
  });

  it('kaçışlı tırnak dizgiyi erken kapatmaz', () => {
    const ham = '{"metin":"Hoca \\"dikkat\\" dedi."}';
    expect(jsonAyikla(ham).metin).toBe('Hoca "dikkat" dedi.');
  });

  it('JSON olmayan yanıtta yanıtın başını hataya koyar', () => {
    expect(() => jsonAyikla('Üzgünüm, bu isteği yerine getiremem.')).toThrow(
      /Üzgünüm, bu isteği/,
    );
  });

  it('boş yanıtı ayırt eder', () => {
    expect(() => jsonAyikla('')).toThrow(/boş yanıt/);
  });
});

describe('jsonKurtarmaAdaylari', () => {
  it('açık kalan dizi ve nesneleri kapatır', () => {
    const adaylar = jsonKurtarmaAdaylari('{"a":[{"b":1');
    expect(adaylar).toContain('{"a":[{"b":1}]}');
  });

  it('kesilmiş dizgi için önce dizgiyi kapatan adayı üretir', () => {
    const adaylar = jsonKurtarmaAdaylari('{"a":"yarım');
    expect(adaylar[0]).toBe('{"a":"yarım"}');
  });
});
